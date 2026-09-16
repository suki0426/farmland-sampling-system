<template>
  <div class="jp-common-layout ultra-theme ultra-table-page dfile-template-page">
    <div class="jp-common-layout-left dfile-template-sidebar">
      <div class="jp-common-title">
        <el-input
          v-model="filterText"
          placeholder="搜索模板"
          size="small"
          prefix-icon="el-icon-search">
        </el-input>
      </div>
      <div class="jp-common-el-tree-scrollbar el-scrollbar">
        <div class="el-scrollbar__wrap">
          <div class="el-scrollbar__view">
            <el-tree
              ref="dFileTemplateTree"
              class="filter-tree template-library-tree"
              :data="templateTreeData"
              :props="treeProps"
              default-expand-all
              highlight-current
              node-key="id"
              :filter-node-method="filterNode"
              :expand-on-click-node="false"
              @node-click="handleNodeClick">
              <span class="custom-tree-node template-tree-node" slot-scope="{ node, data }">
                <span class="template-tree-label">
                  <i :class="getTreeNodeIcon(data)"></i>
                  <span>{{ node.label }}</span>
                </span>
                <el-tag
                  v-if="data.nodeType === 'template'"
                  size="mini"
                  :type="getStatusType(data.status)"
                  effect="plain">
                  {{ getStatusLabel(data.status) }}
                </el-tag>
              </span>
            </el-tree>
          </div>
        </div>
      </div>
    </div>

    <div class="jp-common-layout-center jp-flex-main">
      <el-form
        ref="searchForm"
        size="small"
        :inline="true"
        class="ultra-query-form template-query-form"
        :model="searchForm"
        @keyup.enter.native="applyTemplateSearch()"
        @submit.native.prevent>
        <el-form-item prop="templateName">
          <el-input
            v-model="searchForm.templateName"
            clearable
            placeholder="模板名称"
            prefix-icon="el-icon-search">
          </el-input>
        </el-form-item>
        <el-form-item prop="status">
          <el-select
            v-model="searchForm.status"
            clearable
            placeholder="模板状态"
            @change="applyTemplateSearch">
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="applyTemplateSearch()" size="small" icon="el-icon-search">查询</el-button>
          <el-button @click="resetSearch()" size="small" icon="el-icon-refresh-right">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="ultra-table-panel template-library-panel">
        <div class="template-action-bar">
          <el-button type="primary" size="small" icon="el-icon-plus" @click="openTemplateImport()">
            创建模板
          </el-button>
        </div>

        <div class="template-summary-card" v-if="selectedTemplate">
          <div class="template-summary-main">
            <div class="template-summary-title">
              <span>{{ selectedTemplateName }}</span>
              <el-tag size="small" :type="getStatusType(selectedTemplate.status)">
                {{ getStatusLabel(selectedTemplate.status) }}
              </el-tag>
            </div>
            <div class="template-summary-meta">
              <span>文档分类：{{ getDocTypeLabel(selectedTemplate.docType) }}</span>
              <span>版本号：{{ selectedTemplate.versionNo || '-' }}</span>
              <span>结构：{{ structureStats.level1 }} 个一级节点 / {{ structureStats.level2 }} 个子节点</span>
            </div>
          </div>
          <div class="template-summary-actions">
            <el-button
              class="template-summary-action is-secondary"
              size="mini"
              icon="el-icon-view"
              @click="previewTemplate()">
              预览
            </el-button>
            <el-button
              class="template-summary-action is-primary"
              size="mini"
              :loading="publishing"
              :disabled="!canPublishSelectedTemplate"
              @click="publishTemplate">
              发布模板
            </el-button>
          </div>
        </div>

        <div class="template-summary-card template-summary-empty" v-else>
          <div>
            <div class="template-summary-title">
              <span>{{ selectedCategoryName || '全部模板' }}</span>
            </div>
            <div class="template-summary-meta">
              <span>请在左侧树中选择模板，右侧仅展示模板基本信息。结构内容请通过“预览”查看。</span>
            </div>
          </div>
        </div>

        <TemplateImportDialog
          :visible.sync="templateImportVisible"
          @close="closePageDialogs"
          @created="handleTemplateCreated"
          @edit="openTemplateDesigner">
        </TemplateImportDialog>
      </div>
    </div>
  </div>
</template>

<script>
import dFileTemplateSectionService from '@/api/dfiletemplate/dFileTemplateSectionService'
import dFileTemplateService from '@/api/dfiletemplate/dFileTemplateService'
import TemplateImportDialog from '@/components/fileTemplate/TemplateImportDialog'
import {
  TEMPLATE_DOC_TYPES,
  TEMPLATE_STATUS,
  TEMPLATE_STATUS_META,
  getTemplateDocTypeLabel
} from '@/components/fileTemplate/constants'

export default {
  data () {
    return {
      searchForm: {
        templateName: '',
        status: '',
        docType: '',
        template: {
          id: ''
        }
      },
      treeProps: {
        value: 'id',
        label: 'name',
        children: 'children'
      },
      filterText: '',
      templateList: [],
      selectedNode: null,
      templateSections: [],
      sectionLoading: false,
      publishing: false,
      templateImportVisible: false
    }
  },
  components: {
    TemplateImportDialog
  },
  activated () {
    this.refreshTree()
  },
  deactivated () {
    this.closePageDialogs()
  },
  beforeRouteLeave (to, from, next) {
    this.closePageDialogs()
    next()
  },
  computed: {
    statusOptions () {
      return Object.keys(TEMPLATE_STATUS_META).map(value => ({
        value,
        label: TEMPLATE_STATUS_META[value].label
      }))
    },
    templateTreeData () {
      const root = {
        id: 'all',
        name: '全部模板',
        nodeType: 'all',
        children: []
      }
      const categoryNodes = TEMPLATE_DOC_TYPES.map(item => ({
        id: `docType-${item.value}`,
        name: item.label,
        docType: item.value,
        nodeType: 'category',
        children: []
      }))
      const categoryMap = categoryNodes.reduce((map, node) => {
        map[node.docType] = node
        return map
      }, {})

      this.filteredTemplateList.forEach(template => {
        const docType = template.docType || '未分类'
        if (!categoryMap[docType]) {
          categoryMap[docType] = {
            id: `docType-${docType}`,
            name: docType,
            docType,
            nodeType: 'category',
            children: []
          }
          categoryNodes.push(categoryMap[docType])
        }
        categoryMap[docType].children.push({
          ...template,
          id: template.id,
          name: template.templateName || template.name,
          nodeType: 'template'
        })
      })

      root.children = categoryNodes
      return [root]
    },
    selectedTemplate () {
      if (!this.searchForm.template.id) return null
      return this.templateList.find(item => item.id === this.searchForm.template.id) || null
    },
    filteredTemplateList () {
      return this.templateList.filter(template => {
        if (this.searchForm.templateName && String(template.templateName || template.name || '').indexOf(this.searchForm.templateName) === -1) return false
        if (this.searchForm.status && template.status !== this.searchForm.status) return false
        return true
      })
    },
    selectedTemplateName () {
      if (!this.selectedTemplate) return '-'
      return this.selectedTemplate.templateName || this.selectedTemplate.name || '-'
    },
    selectedCategoryName () {
      if (this.selectedNode && this.selectedNode.nodeType === 'category') return this.selectedNode.name
      return ''
    },
    templateStructure () {
      const firstLevel = this.templateSections
        .filter(item => String(item.sectionLevel) === '1')
        .sort((a, b) => Number(a.sortNo || 0) - Number(b.sortNo || 0))

      return firstLevel.map(section => ({
        ...section,
        children: this.templateSections
          .filter(item => String(item.sectionLevel) === '2' && this.isChildOfSection(item, section))
          .sort((a, b) => Number(a.sortNo || 0) - Number(b.sortNo || 0))
      }))
    },
    structureStats () {
      return {
        level1: this.templateStructure.length,
        level2: this.templateStructure.reduce((total, section) => total + (section.children ? section.children.length : 0), 0)
      }
    },
    canPublishSelectedTemplate () {
      return Boolean(
        this.selectedTemplate &&
        this.selectedTemplate.status === TEMPLATE_STATUS.DRAFT &&
        this.structureStats.level1 > 0 &&
        !this.sectionLoading &&
        !this.publishing
      )
    }
  },
  watch: {
    filterText (val) {
      this.$refs.dFileTemplateTree && this.$refs.dFileTemplateTree.filter(val)
    },
    '$route.name' (name) {
      if (name !== 'dfiletemplate-section-list') {
        this.closePageDialogs()
      }
    }
  },
  methods: {
    closePageDialogs () {
      this.templateImportVisible = false
    },
    getDocTypeLabel (docType) {
      if (this.$dictUtils && this.$dictUtils.getDictLabel) {
        return this.$dictUtils.getDictLabel('teaching_doc_type', docType, getTemplateDocTypeLabel(docType) || '-')
      }
      return getTemplateDocTypeLabel(docType) || '-'
    },
    filterNode (value, data) {
      if (!value) return true
      return String(data.name || '').indexOf(value) !== -1
    },
    refreshTree () {
      return dFileTemplateService.treeData().then(({ data }) => {
        this.templateList = this.normalizeTemplateList(data)
        if (!this.selectedTemplate && this.templateList.length) {
          this.selectTemplateNode(this.templateList[0])
        } else {
          this.refreshSelectedTemplateSections()
        }
      }).catch(() => {
        this.templateList = []
      })
    },
    normalizeTemplateList (items = []) {
      return items.reduce((list, item) => {
        if (item.nodeType === 'template' || !item.children || !item.children.length) {
          if (item.id && item.id !== 'all' && !String(item.id).startsWith('docType-')) {
            list.push({
              ...item,
              templateName: item.templateName || item.name
            })
          }
          return list
        }
        return list.concat(this.normalizeTemplateList(item.children || []))
      }, [])
    },
    handleNodeClick (data) {
      this.selectedNode = data
      if (data.nodeType === 'all') {
        this.searchForm.docType = ''
        this.searchForm.template.id = ''
        this.templateSections = []
      } else if (data.nodeType === 'category') {
        this.searchForm.docType = data.docType
        this.searchForm.template.id = ''
        this.templateSections = []
      } else {
        this.selectTemplateNode(data)
      }
    },
    selectTemplateNode (data) {
      this.selectedNode = data
      this.searchForm.docType = data.docType || ''
      this.searchForm.template.id = data.id
      this.refreshSelectedTemplateSections()
      this.$nextTick(() => {
        this.$refs.dFileTemplateTree && this.$refs.dFileTemplateTree.setCurrentKey(data.id)
      })
    },
    refreshSelectedTemplateSections () {
      if (!this.searchForm.template.id) {
        this.templateSections = []
        return
      }
      this.sectionLoading = true
      dFileTemplateSectionService.listByTemplate(this.searchForm.template.id).then(({ data }) => {
        this.templateSections = data || []
        this.sectionLoading = false
      }).catch(() => {
        this.templateSections = []
        this.sectionLoading = false
      })
    },
    openTemplateImport () {
      this.templateImportVisible = true
    },
    handleTemplateCreated (payload) {
      const template = payload && payload.template ? payload.template : payload
      this.refreshTree()
      if (template && template.id) {
        this.$nextTick(() => this.selectTemplateNode(template))
      }
    },
    openTemplateDesigner (row) {
      const templateId = row && row.template ? row.template.id : (row && row.id) || (this.selectedTemplate && this.selectedTemplate.id)
      if (!templateId) {
        this.$message.warning('请先选择需要编辑的模板')
        return
      }
      this.closePageDialogs()
      this.deferRoutePush({
        name: 'dfiletemplate-template-designer',
        query: { id: templateId }
      })
    },
    deferRoutePush (route) {
      window.setTimeout(() => {
        this.$router.push(route)
      }, 900)
    },
    previewTemplate () {
      if (!this.selectedTemplate) {
        this.$message.warning('请先选择需要预览的模板')
        return
      }
      this.$router.push({
        name: 'dfiletemplate-template-designer',
        query: {
          id: this.selectedTemplate.id,
          mode: 'preview'
        }
      })
    },
    async publishTemplate () {
      if (!this.selectedTemplate) {
        this.$message.warning('请先选择需要发布的模板')
        return
      }
      if (this.selectedTemplate.status !== TEMPLATE_STATUS.DRAFT) {
        this.$message.warning('只有草稿模板可以发布')
        return
      }
      this.publishing = true
      try {
        const detailResponse = await dFileTemplateService.queryDetail(this.selectedTemplate.id)
        const detail = detailResponse.data || detailResponse
        const validateResponse = await dFileTemplateService.validate(detail)
        const validateResult = validateResponse.data || validateResponse
        if (!validateResult.valid) {
          this.$message.warning(validateResult.errors[0].message)
          return
        }
        this.publishing = false
        try {
          await this.$confirm(`确认发布“${this.selectedTemplateName}”吗？发布后可用于教学文档填写。`, '发布模板', {
            confirmButtonText: '确认发布',
            cancelButtonText: '取消',
            type: 'warning'
          })
        } catch (error) {
          return
        }
        this.publishing = true
        const { data } = await dFileTemplateService.publish(detail)
        this.$message.success(data.message || '模板已发布')
        await this.refreshTree()
      } catch (error) {
        this.$message.error(this.resolveErrorMessage(error))
      } finally {
        this.publishing = false
      }
    },
    applyTemplateSearch () {
      if (this.selectedTemplate && this.filteredTemplateList.every(item => item.id !== this.selectedTemplate.id)) {
        this.searchForm.template.id = ''
        this.templateSections = []
      }
    },
    resetSearch () {
      this.$refs.searchForm.resetFields()
      this.searchForm.docType = ''
      this.searchForm.template.id = ''
      this.filterText = ''
      this.selectedNode = null
      this.templateSections = []
      this.$refs.dFileTemplateTree && this.$refs.dFileTemplateTree.setCurrentKey(null)
    },
    getTreeNodeIcon (data) {
      if (data.nodeType === 'all') return 'el-icon-folder-opened'
      if (data.nodeType === 'category') return 'el-icon-folder'
      return 'el-icon-document'
    },
    getStatusLabel (status) {
      return (TEMPLATE_STATUS_META[status] && TEMPLATE_STATUS_META[status].label) || status || '-'
    },
    getStatusType (status) {
      return (TEMPLATE_STATUS_META[status] && TEMPLATE_STATUS_META[status].type) || 'info'
    },
    getSourceModeLabel (value) {
      if (value === 'manual' || value === 'word') return '手动录入'
      if (value === 'copy') return '复制生成'
      return value || '-'
    },
    resolveErrorMessage (error) {
      if (typeof error === 'string') return error
      if (error && error.message) return error.message
      if (error && error.response && error.response.data) return error.response.data
      return '模板操作失败'
    },
    isChildOfSection (child, section) {
      if (child.parentClientId && section.clientId) return child.parentClientId === section.clientId
      if (child.parentSectionId && section.id) return child.parentSectionId === section.id || child.parentSectionId === section.sectionTitle
      return false
    }
  }
}
</script>

<style scoped>
.dfile-template-page {
  --template-primary: var(--ul-primary, var(--defaultTheme, #0f172a));
  --template-primary-hover: var(--ul-button-hover, #253047);
  height: 100% !important;
  min-height: 0;
}

.dfile-template-page .jp-common-layout-center {
  height: 100% !important;
  min-height: 0;
  overflow: hidden;
}

.dfile-template-sidebar .jp-common-title {
  padding-right: 8px;
}

.template-tree-node {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.template-tree-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-query-form {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  min-height: auto !important;
  margin-bottom: 2px !important;
  padding: 10px 20px !important;
}

.template-query-form .el-form-item {
  margin-right: 0;
  margin-bottom: 0;
}

.template-query-form .el-input,
.template-query-form .el-select {
  width: 220px;
}

.template-library-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.template-action-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px 6px;
}

.template-summary-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 0 12px 12px;
  padding: 14px 16px;
  border: 1px solid #e6ebf2;
  border-radius: 6px;
  background: #fff;
}

.template-summary-empty {
  align-items: flex-start;
}

.template-summary-main {
  min-width: 0;
}

.template-summary-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1f2d3d;
  font-size: 15px;
  font-weight: 600;
}

.template-summary-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin-top: 8px;
  color: #6b778c;
  font-size: 12px;
  line-height: 1.5;
}

.template-summary-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.template-summary-action {
  min-width: 76px;
  border-radius: 8px;
  font-weight: 700;
  transition: border-color .16s ease, background .16s ease, color .16s ease, box-shadow .16s ease;
}

.template-summary-action.is-secondary {
  border-color: #cbd5e1;
  background: #fff;
  color: #0f172a;
}

.template-summary-action.is-secondary:hover,
.template-summary-action.is-secondary:focus {
  border-color: var(--template-primary);
  background: #f8fafc;
  color: var(--template-primary);
}

.template-summary-action.is-primary {
  border-color: var(--template-primary);
  background: var(--template-primary);
  color: #fff;
}

.template-summary-action.is-primary:hover,
.template-summary-action.is-primary:focus {
  border-color: var(--template-primary-hover);
  background: var(--template-primary-hover);
  color: #fff;
}

.template-summary-action.is-primary.is-disabled,
.template-summary-action.is-primary.is-disabled:hover,
.template-summary-action.is-primary.is-disabled:focus {
  border-color: #d8e3f1;
  background: #eef2f7;
  color: #94a3b8;
}

@media (max-width: 1200px) {
  .template-summary-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .template-summary-actions {
    flex-wrap: wrap;
  }
}
</style>
