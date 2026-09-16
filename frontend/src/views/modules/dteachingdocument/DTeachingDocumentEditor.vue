<template>
  <div class="dteaching-document-editor">
    <StructureWorkspaceLayout
      v-model="activeStepIndex"
      :loading="loading"
      :title="form.title || '填写教学文档'"
      :tags="headerTags"
      :sections="sections"
      back-text="返回"
      navigator-title="模板节点"
      navigator-mode="document-fill"
      canvas-mode="document-fill"
      @back="goBack"
    >
      <template #actions>
        <el-button size="small" type="primary" :loading="saving" @click="saveDocument">保存</el-button>
      </template>

      <template #base>
        <el-form :model="form" size="small" label-width="86px">
          <el-row :gutter="14">
            <el-col :span="8">
              <el-form-item label="文档标题">
                <el-input v-model="form.title" placeholder="请输入文档标题"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="课程名称">
                <el-input v-model="form.courseName" placeholder="请输入课程名称"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="课程编码">
                <el-input v-model="form.courseCode" placeholder="请输入课程编码"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </template>
    </StructureWorkspaceLayout>

  </div>
</template>

<script>
import dFileTemplateService from '@/api/dfiletemplate/dFileTemplateService'
import dTeachingDocumentBusinessService from '@/api/dteachingdocument/dTeachingDocumentBusinessService'
import { normalizeTemplateDetail } from '@/utils/fileTemplateAdapter'
import StructureWorkspaceLayout from '@/components/documentStructure/StructureWorkspaceLayout'
import { getTemplateDocTypeLabel } from '@/components/fileTemplate/constants'

export default {
  name: 'DTeachingDocumentEditor',
  components: {
    StructureWorkspaceLayout
  },
  data () {
    return {
      loading: false,
      saving: false,
      routeKey: '',
      activeStepIndex: 0,
      template: {},
      sections: [],
      form: {
        id: this.$route.query.id || '',
        title: '',
        docType: this.$route.query.docType || '',
        courseName: '',
        courseCode: '',
        academicterm: '',
        teacherName: '',
        inputMethod: 'manual',
        status: 'draft',
        templateId: this.$route.query.templateId || '',
        templateVersion: this.$route.query.templateVersion || ''
      }
    }
  },
  computed: {
    docTypeLabel () {
      if (this.$dictUtils && this.$dictUtils.getDictLabel) {
        return this.$dictUtils.getDictLabel('teaching_doc_type', this.form.docType, getTemplateDocTypeLabel(this.form.docType) || '-')
      }
      return getTemplateDocTypeLabel(this.form.docType) || '-'
    },
    headerTags () {
      return [
        { label: this.docTypeLabel },
        { label: this.template.templateName || this.template.name || '未选择模板' },
        { label: this.template.versionNo || this.template.version || 'V1.0' }
      ]
    }
  },
  created () {
    this.initFromRoute()
  },
  activated () {
    if (this.routeKey !== this.resolveRouteKey()) {
      this.initFromRoute()
    }
  },
  methods: {
    resolveRouteKey () {
      const query = this.$route.query
      return [
        query.id || '',
        query.docType || '',
        query.templateId || '',
        query.templateVersion || ''
      ].join('|')
    },
    initFromRoute () {
      const query = this.$route.query
      this.routeKey = this.resolveRouteKey()
      this.activeStepIndex = 0
      this.template = {}
      this.sections = []
      this.form = {
        id: query.id || '',
        title: '',
        docType: query.docType || '',
        courseName: '',
        courseCode: '',
        academicterm: '',
        teacherName: '',
        inputMethod: 'manual',
        status: 'draft',
        templateId: query.templateId || '',
        templateVersion: query.templateVersion || ''
      }
      if (this.form.id) {
        this.loadDocument()
        return
      }
      this.loadTemplate()
    },
    async loadDocument () {
      this.loading = true
      try {
        const { data } = await dTeachingDocumentBusinessService.queryDetail(this.form.id)
        if (!data) {
          this.$message.warning('未找到教学文档')
          this.goBack()
          return
        }
        this.hydrateDocument(data)
        if (this.form.templateId) {
          const template = await this.queryTemplate(this.form.templateId)
          this.template = template
          if (!this.sections.length) {
            this.sections = this.createDocumentSections(template.sections || [])
          }
        }
      } catch (error) {
        this.$message.error(this.resolveErrorMessage(error))
      } finally {
        this.loading = false
      }
    },
    async loadTemplate () {
      if (!this.form.templateId) {
        this.$message.warning('请先选择文档分类和模板')
        this.goBack()
        return
      }
      this.loading = true
      try {
        this.template = await this.queryTemplate(this.form.templateId)
        this.form.docType = this.form.docType || this.template.docType
        this.form.templateVersion = this.form.templateVersion || this.template.versionNo || 'V1.0'
        this.sections = this.createDocumentSections(this.template.sections || [])
      } catch (error) {
        this.$message.error(this.resolveErrorMessage(error))
      } finally {
        this.loading = false
      }
    },
    async queryTemplate (templateId) {
      const response = await dFileTemplateService.queryDetail(templateId)
      return normalizeTemplateDetail(response)
    },
    hydrateDocument (detail) {
      const contentSections = detail.content && detail.content.length
        ? detail.content
        : (((detail.template && detail.template.sections) || []))
      this.form = {
        ...this.form,
        id: detail.id || this.form.id,
        title: detail.title || '',
        docType: detail.docType || '',
        courseName: detail.courseName || '',
        courseCode: detail.courseCode || '',
        academicterm: detail.academicterm || '',
        teacherName: detail.teacherName || '',
        inputMethod: detail.inputMethod || 'manual',
        status: detail.status || 'draft',
        templateId: detail.templateId || '',
        templateVersion: detail.templateVersion || ''
      }
      this.template = detail.template ? normalizeTemplateDetail(detail.template) : {
        templateName: detail.templateName || '',
        versionNo: detail.templateVersion || ''
      }
      this.sections = this.createDocumentSections(contentSections)
    },
    createDocumentSections (sections) {
      return JSON.parse(JSON.stringify(sections || [])).map(section => ({
        ...section,
        children: (section.children || section.sections || []).map(block => ({
          ...block,
          componentType: 'richtext',
          value: block.value || block.defaultvalue || ''
        }))
      }))
    },
    async saveDocument () {
      if (!this.form.title) {
        this.$message.warning('请填写文档标题')
        return
      }
      this.saving = true
      try {
        const { data } = await dTeachingDocumentBusinessService.saveDocument({
          ...this.form,
          template: this.template,
          content: this.sections
        })
        this.$message.success(data.message || '教学文档已保存')
        this.$router.push({
          name: 'dteachingdocument-detail',
          query: { id: data.id }
        })
      } catch (error) {
        this.$message.error(this.resolveErrorMessage(error))
      } finally {
        this.saving = false
      }
    },
    resolveErrorMessage (error) {
      if (error && error.message) return error.message
      if (error && error.response && error.response.data) return error.response.data
      return '教学文档保存失败'
    },
    goBack () {
      if (this.form.id) {
        if (this.$route.query && this.$route.query.from === 'list') {
          this.$router.push({ name: 'dteachingdocument-list' })
          return
        }
        this.$router.push({
          name: 'dteachingdocument-detail',
          query: { id: this.form.id }
        })
        return
      }
      this.$router.push({
        name: 'dteachingdocument-list',
        query: {
          openCreate: '1',
          docType: this.form.docType,
          templateId: this.form.templateId,
          preferredMethod: 'manual'
        }
      })
    }
  }
}
</script>

<style scoped>
.dteaching-document-editor {
  height: 100%;
}
</style>
