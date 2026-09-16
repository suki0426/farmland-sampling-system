<template>
  <div class="template-editor-workspace">
    <StructureWorkspaceLayout
      v-model="activeStepIndex"
      :active-block-id="activeBlockId"
      :loading="loading"
      :title="template.templateName || '教学文档模板'"
      :tags="headerTags"
      :sections="template.sections"
      back-text="返回列表"
      navigator-title="模板结构"
      :navigator-mode="workspaceMode"
      :canvas-mode="workspaceMode"
      :side-visible="!isStructureReadonly"
      @back="goBackToList"
      @add-step="addStep"
      @move-step="moveStep"
      @remove-step="removeStep"
      @select-block="activeBlockId = $event"
      @add-block="addBlock"
      @move-block="moveBlock"
      @copy-block="copyBlock"
      @remove-block="removeBlock"
    >
      <template #actions>
        <template v-if="isStructureReadonly">
          <el-button size="small" type="primary" icon="el-icon-s-operation" @click="goEditMode">编辑结构</el-button>
        </template>
        <template v-else>
          <el-button size="small" :loading="saving" @click="saveDraft">保存草稿</el-button>
          <el-button size="small" type="primary" :loading="publishing" :disabled="!canPublishTemplate" @click="publishTemplate">发布模板</el-button>
        </template>
      </template>

      <template v-if="!isStructureReadonly" #side>
        <TemplateBlockInspector
          :template="template"
          :block="activeBlock"
        />
      </template>
    </StructureWorkspaceLayout>
  </div>
</template>

<script>
import dFileTemplateService from '@/api/dfiletemplate/dFileTemplateService'
import { normalizeTemplateDetail } from '@/utils/fileTemplateAdapter'
import StructureWorkspaceLayout from '@/components/documentStructure/StructureWorkspaceLayout'
import { createTemplateDraft, createTemplateSection, ensureUniqueSectionCodes, validateTemplateDraft } from '../utils'
import { TEMPLATE_STATUS, TEMPLATE_STATUS_META, getTemplateDocTypeLabel } from '../constants'
import TemplateBlockInspector from './TemplateBlockInspector'

export default {
  name: 'TemplateEditorWorkspace',
  components: {
    StructureWorkspaceLayout,
    TemplateBlockInspector
  },
  props: {
    templateId: { type: String, default: '' },
    readonly: { type: Boolean, default: false }
  },
  data () {
    return {
      loading: false,
      saving: false,
      publishing: false,
      savedSnapshot: '',
      activeStepIndex: 0,
      activeBlockId: '',
      template: createTemplateDraft({
        templateName: '教学文档模板',
        docType: 'syllabus',
        sections: []
      })
    }
  },
  computed: {
    activeSection () {
      return this.template.sections[this.activeStepIndex]
    },
    activeBlock () {
      if (!this.activeSection) return null
      return (this.activeSection.children || []).find(item => item.clientId === this.activeBlockId) || (this.activeSection.children || [])[0] || null
    },
    statusLabel () {
      const meta = TEMPLATE_STATUS_META[this.template.status]
      return meta ? meta.label : '草稿'
    },
    statusType () {
      const meta = TEMPLATE_STATUS_META[this.template.status]
      return meta ? meta.type : 'warning'
    },
    docTypeLabel () {
      if (this.$dictUtils && this.$dictUtils.getDictLabel) {
        return this.$dictUtils.getDictLabel('teaching_doc_type', this.template.docType, getTemplateDocTypeLabel(this.template.docType) || '-')
      }
      return getTemplateDocTypeLabel(this.template.docType) || '-'
    },
    headerTags () {
      return [
        { label: this.statusLabel, type: this.statusType },
        { label: this.docTypeLabel },
        { label: this.template.versionNo || 'V1.0' }
      ]
    },
    isStructureReadonly () {
      return this.readonly || this.template.status === TEMPLATE_STATUS.PUBLISHED
    },
    workspaceMode () {
      return this.isStructureReadonly ? 'readonly' : 'template-edit'
    },
    canPublishTemplate () {
      return !this.loading && !this.saving && !this.publishing && this.template.status === TEMPLATE_STATUS.DRAFT
    }
  },
  watch: {
    templateId: {
      handler () {
        this.loadTemplate()
      },
      immediate: true
    },
    activeSection () {
      this.syncActiveBlock()
    }
  },
  methods: {
    async loadTemplate () {
      if (!this.templateId) return
      this.loading = true
      try {
        const response = await dFileTemplateService.queryDetail(this.templateId)
        this.template = normalizeTemplateDetail(response)
        this.normalizeTemplateSections()
        this.updateSavedSnapshot()
        this.syncActiveBlock()
      } catch (error) {
        this.$message.error(this.resolveErrorMessage(error))
      } finally {
        this.loading = false
      }
    },
    syncActiveBlock () {
      if (!this.activeSection) {
        this.activeBlockId = ''
        return
      }
      const children = this.activeSection.children || []
      if (!children.some(item => item.clientId === this.activeBlockId)) {
        this.activeBlockId = children[0] ? children[0].clientId : ''
      }
    },
    addStep () {
      if (this.isStructureReadonly) return
      this.template.sections.push(createTemplateSection({
        sectionTitle: `新增步骤${this.template.sections.length + 1}`,
        children: [{ sectionTitle: '新增内容块', componentType: 'richtext' }]
      }, {
        sortNo: this.template.sections.length + 1,
        sectionLevel: 1
      }))
      this.activeStepIndex = this.template.sections.length - 1
      this.updateSectionSortNos()
      this.syncActiveBlock()
    },
    moveStep (index, direction) {
      if (this.isStructureReadonly) return
      const targetIndex = index + direction
      const sections = this.template.sections
      if (targetIndex < 0 || targetIndex >= sections.length) return
      const moved = sections.splice(index, 1)[0]
      sections.splice(targetIndex, 0, moved)
      if (this.activeStepIndex === index) {
        this.activeStepIndex = targetIndex
      } else if (this.activeStepIndex === targetIndex) {
        this.activeStepIndex = index
      }
      this.updateSectionSortNos()
      this.syncActiveBlock()
    },
    removeStep (index) {
      if (this.isStructureReadonly || this.template.sections.length <= 1) return
      const section = this.template.sections[index]
      const title = section && section.sectionTitle ? section.sectionTitle : '当前一级标题'
      this.$confirm(`确定删除一级标题“${title}”吗？其下所有二级标题也会一起删除。`, '提示', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.template.sections.splice(index, 1)
        if (this.activeStepIndex >= this.template.sections.length) {
          this.activeStepIndex = this.template.sections.length - 1
        } else if (this.activeStepIndex > index) {
          this.activeStepIndex -= 1
        }
        this.updateSectionSortNos()
        this.syncActiveBlock()
      }).catch(() => {})
    },
    addBlock () {
      if (this.isStructureReadonly || !this.activeSection) return
      const block = createTemplateSection({
        sectionTitle: `新增内容块${(this.activeSection.children || []).length + 1}`,
        componentType: 'richtext'
      }, {
        sortNo: (this.activeSection.children || []).length + 1,
        sectionLevel: 2,
        parentClientId: this.activeSection.clientId
      })
      this.activeSection.children.push(block)
      this.updateBlockSortNos(this.activeSection)
      this.activeBlockId = block.clientId
    },
    moveBlock (index, direction) {
      if (this.isStructureReadonly || !this.activeSection) return
      const children = this.activeSection.children || []
      const targetIndex = index + direction
      if (targetIndex < 0 || targetIndex >= children.length) return
      const moved = children.splice(index, 1)[0]
      children.splice(targetIndex, 0, moved)
      this.updateBlockSortNos(this.activeSection)
      this.activeBlockId = moved.clientId
    },
    copyBlock (block) {
      if (this.isStructureReadonly || !this.activeSection) return
      const copied = createTemplateSection({
        ...block,
        id: '',
        clientId: '',
        sectionTitle: `${block.sectionTitle}副本`,
        sectionCode: '',
        componentType: 'richtext'
      }, {
        sortNo: this.activeSection.children.length + 1,
        sectionLevel: 2,
        parentClientId: this.activeSection.clientId
      })
      this.activeSection.children.push(copied)
      this.updateBlockSortNos(this.activeSection)
      this.activeBlockId = copied.clientId
    },
    removeBlock (block) {
      if (this.isStructureReadonly || !this.activeSection) return
      this.activeSection.children = this.activeSection.children.filter(item => item.clientId !== block.clientId)
      this.updateBlockSortNos(this.activeSection)
      this.syncActiveBlock()
    },
    async saveDraft () {
      this.normalizeTemplateSections()
      ensureUniqueSectionCodes(this.template)
      const result = validateTemplateDraft(this.template)
      if (!result.valid) {
        this.$message.warning(result.errors[0].message)
        return
      }
      this.saving = true
      try {
        const { data } = await dFileTemplateService.saveDraft(this.template)
        this.template = normalizeTemplateDetail(data.template || this.template)
        this.normalizeTemplateSections()
        this.updateSavedSnapshot()
        this.$message.success(data.message || '模板草稿已保存')
        this.$router.push({
          name: 'dfiletemplate-template-designer',
          query: {
            id: this.template.id,
            mode: 'preview'
          }
        })
      } catch (error) {
        this.$message.error(this.resolveErrorMessage(error))
      } finally {
        this.saving = false
      }
    },
    async publishTemplate () {
      this.normalizeTemplateSections()
      ensureUniqueSectionCodes(this.template)
      const result = validateTemplateDraft(this.template)
      if (!result.valid) {
        this.$message.warning(result.errors[0].message)
        return
      }
      try {
        await this.$confirm('发布后模板将进入可用状态，后续教学文档可按该模板填写。确认发布吗？', '发布模板', {
          confirmButtonText: '确认发布',
          cancelButtonText: '取消',
          type: 'warning'
        })
      } catch (error) {
        return
      }
      this.publishing = true
      try {
        const { data } = await dFileTemplateService.publish(this.template)
        this.template = normalizeTemplateDetail(data.template || this.template)
        this.normalizeTemplateSections()
        this.updateSavedSnapshot()
        this.$message.success(data.message || '模板已发布')
        this.$router.push({
          name: 'dfiletemplate-template-designer',
          query: {
            id: this.template.id,
            mode: 'preview'
          }
        })
      } catch (error) {
        this.$message.error(this.resolveErrorMessage(error))
      } finally {
        this.publishing = false
      }
    },
    resolveErrorMessage (error) {
      if (typeof error === 'string') return error
      if (error && error.message) return error.message
      if (error && error.response && error.response.data) return error.response.data
      return '模板操作失败'
    },
    updateSectionSortNos () {
      this.template.sections.forEach((section, index) => {
        section.sortNo = index + 1
        this.updateBlockSortNos(section)
      })
    },
    updateBlockSortNos (section) {
      ;(section.children || []).forEach((block, index) => {
        block.sortNo = index + 1
        block.parentClientId = section.clientId
        block.componentType = 'richtext'
        block.requiredFlag = '1'
        block.visibleFlag = '1'
      })
    },
    normalizeTemplateSections () {
      ;(this.template.sections || []).forEach(section => {
        ;(section.children || []).forEach(block => {
          block.componentType = 'richtext'
          block.requiredFlag = '1'
          block.visibleFlag = '1'
        })
      })
      ensureUniqueSectionCodes(this.template)
    },
    updateSavedSnapshot () {
      this.savedSnapshot = JSON.stringify(this.template)
    },
    hasUnsavedChanges () {
      if (this.isStructureReadonly) return false
      return this.savedSnapshot && JSON.stringify(this.template) !== this.savedSnapshot
    },
    goEditMode () {
      if (this.template.status === TEMPLATE_STATUS.PUBLISHED) return
      this.$router.push({
        name: 'dfiletemplate-template-designer',
        query: { id: this.templateId }
      })
    },
    goBackToList () {
      const backToList = () => {
        this.$router.push({ name: 'dfiletemplate-section-list' })
      }
      if (!this.hasUnsavedChanges()) {
        backToList()
        return
      }
      this.$confirm('当前模板存在未保存修改，返回后将丢失本次编辑，是否继续？', '提示', {
        confirmButtonText: '继续返回',
        cancelButtonText: '留在当前页',
        type: 'warning'
      }).then(backToList).catch(() => {})
    }
  }
}
</script>

<style scoped>
.template-editor-workspace {
  height: 100%;
}
</style>
