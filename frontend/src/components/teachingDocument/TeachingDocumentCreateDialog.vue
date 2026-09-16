<template>
  <el-dialog
    class="teaching-document-create-dialog"
    title="新建教学文档"
    width="1180px"
    :close-on-click-modal="false"
    :visible.sync="dialogVisible"
    @close="handleClose"
  >
    <div class="teaching-document-create-dialog__header">
      <StructureWizardSteps
        v-model="activeStep"
        :steps="steps"
        :max-step="maxStep"
      />
    </div>

    <section v-if="activeStep === 'category'" class="teaching-document-create-dialog__panel">
      <div class="teaching-document-create-dialog__section-head">
        <h3>选择文档分类</h3>
        <p>先确定教学文档所属类型。Word 导入只关联文档分类，手动录入会根据该分类查询模板管理中已发布的模板。</p>
      </div>
      <DocumentCategorySelector
        :value="form.docType"
        @input="handleDocTypeChange"
      />
    </section>

    <section v-if="activeStep === 'method'" class="teaching-document-create-dialog__panel">
      <div class="teaching-document-create-dialog__section-head">
        <h3>选择创建方式</h3>
        <p>Word 导入独立创建教学文档；手动录入会根据第一步选择的文档分类，到模板管理中查询对应的已发布模板。</p>
      </div>
      <CreateMethodSelector
        v-model="form.createMethod"
        :options="methodOptions"
      />
      <div v-if="form.createMethod === 'manual'" v-loading="templateLoading" class="teaching-document-create-dialog__template-card">
        <span>手动录入模板</span>
        <strong>{{ selectedTemplateName }}</strong>
        <small>{{ manualTemplateTip }}</small>
      </div>
      <el-alert
        v-if="form.createMethod === 'manual' && form.docType && !templateLoading && !selectedTemplate"
        class="teaching-document-create-dialog__template-alert"
        type="warning"
        :closable="false"
        show-icon
        title="当前分类未找到已发布模板"
        description="系统已根据第一步选择的文档分类，在“文档模板管理”中查询对应模板，但没有找到已发布模板。若要继续手动录入，请先到“文档模板管理”创建并发布该分类模板。">
      </el-alert>
    </section>

    <section v-if="activeStep === 'confirm'" class="teaching-document-create-dialog__panel">
      <div class="teaching-document-create-dialog__section-head">
        <h3>确认创建</h3>
        <p>确认后进入对应操作页。Word 导入只记录文档分类，手动录入会锁定已发布模板结构。</p>
      </div>
      <dl class="teaching-document-create-dialog__summary">
        <div>
          <dt>文档分类</dt>
          <dd>{{ docTypeLabel }}</dd>
        </div>
        <div v-if="form.createMethod === 'manual'">
          <dt>使用模板</dt>
          <dd>{{ selectedTemplateName }}</dd>
        </div>
        <div v-if="form.createMethod === 'manual'">
          <dt>模板版本</dt>
          <dd>{{ selectedTemplateVersion }}</dd>
        </div>
        <div>
          <dt>创建方式</dt>
          <dd>{{ createMethodLabel }}</dd>
        </div>
      </dl>
    </section>

    <span slot="footer" class="dialog-footer">
      <el-button size="small" @click="handleClose">取消</el-button>
      <el-button size="small" :disabled="activeStep === 'category'" @click="previousStep">上一步</el-button>
      <el-button size="small" type="primary" :disabled="!canContinue" @click="continueNext">
        {{ finalActionText }}
      </el-button>
    </span>
  </el-dialog>
</template>

<script>
import CreateMethodSelector from '@/components/documentStructure/CreateMethodSelector'
import DocumentCategorySelector from '@/components/documentStructure/DocumentCategorySelector'
import StructureWizardSteps from '@/components/documentStructure/StructureWizardSteps'
import { getTemplateDocTypeLabel } from '@/components/fileTemplate/constants'
import dFileTemplateService from '@/api/dfiletemplate/dFileTemplateService'

const CREATE_STEPS = [
  { key: 'category', label: '选择分类' },
  { key: 'method', label: '选择方式' },
  { key: 'confirm', label: '确认创建' }
]

const METHOD_OPTIONS = [
  {
    label: 'Word 导入',
    value: 'file_import',
    desc: '上传 Word 文件，导入结果归属到所选文档分类。'
  },
  {
    label: '手动录入',
    value: 'manual',
    desc: '根据所选分类到模板管理中查询已发布模板，按模板结构填写内容。'
  }
]

export default {
  name: 'TeachingDocumentCreateDialog',
  components: {
    CreateMethodSelector,
    DocumentCategorySelector,
    StructureWizardSteps
  },
  props: {
    visible: { type: Boolean, default: false },
    defaultMethod: { type: String, default: 'manual' },
    defaultDocType: { type: String, default: '' },
    defaultTemplateId: { type: String, default: '' }
  },
  data () {
    return {
      activeStep: 'category',
      steps: CREATE_STEPS,
      methodOptions: METHOD_OPTIONS,
      selectedTemplate: null,
      templateLoading: false,
      dialogVisible: false,
      form: {
        docType: '',
        templateId: '',
        createMethod: 'manual'
      }
    }
  },
  computed: {
    isOwnerRoute () {
      return this.$route.name === 'dteachingdocument-list'
    },
    maxStep () {
      if (!this.form.docType) return 'category'
      if (!this.form.createMethod) return 'method'
      if (this.form.createMethod === 'manual' && !this.selectedTemplate) return 'method'
      return 'confirm'
    },
    canContinue () {
      if (this.activeStep === 'category') return Boolean(this.form.docType)
      if (this.activeStep === 'method') {
        if (!this.form.createMethod || this.templateLoading) return false
        if (this.form.createMethod === 'manual') return Boolean(this.selectedTemplate)
        return true
      }
      if (this.form.createMethod === 'file_import') return Boolean(this.form.docType)
      return Boolean(this.form.docType && this.selectedTemplate && this.form.createMethod)
    },
    finalActionText () {
      if (this.activeStep === 'confirm') return this.form.createMethod === 'file_import' ? '去上传文件' : '开始填写'
      return '下一步'
    },
    selectedTemplateName () {
      if (!this.selectedTemplate) return '-'
      return this.selectedTemplate.templateName || this.selectedTemplate.name || '-'
    },
    selectedTemplateVersion () {
      if (!this.selectedTemplate) return '-'
      return this.selectedTemplate.versionNo || this.selectedTemplate.version || 'V1.0'
    },
    docTypeLabel () {
      if (this.$dictUtils && this.$dictUtils.getDictLabel) {
        return this.$dictUtils.getDictLabel('teaching_doc_type', this.form.docType, getTemplateDocTypeLabel(this.form.docType) || '-')
      }
      return getTemplateDocTypeLabel(this.form.docType) || '-'
    },
    createMethodLabel () {
      const hit = this.methodOptions.find(item => item.value === this.form.createMethod)
      return hit ? hit.label : '-'
    },
    manualTemplateTip () {
      if (this.templateLoading) return '正在根据所选文档分类查询模板管理中的已发布模板'
      if (!this.form.docType) return '请先选择文档分类'
      if (!this.selectedTemplate) return '当前分类未查询到已发布模板，暂不能手动录入'
      return `${this.selectedTemplateVersion}，创建后只能填写内容`
    }
  },
  watch: {
    visible: {
      handler (value) {
        this.dialogVisible = value && this.isOwnerRoute
        if (value) {
          this.resetDialog()
        }
      },
      immediate: true
    },
    '$route.name' (name) {
      if (this.dialogVisible && name !== 'dteachingdocument-list') {
        this.handleClose()
      }
    },
    maxStep () {
      if (this.steps.findIndex(item => item.key === this.activeStep) > this.steps.findIndex(item => item.key === this.maxStep)) {
        this.activeStep = this.maxStep
      }
    }
  },
  mounted () {
    window.addEventListener('hashchange', this.handleRouteHashChange)
  },
  beforeDestroy () {
    window.removeEventListener('hashchange', this.handleRouteHashChange)
  },
  methods: {
    resetDialog () {
      this.activeStep = 'category'
      this.selectedTemplate = null
      this.templateLoading = false
      this.form = {
        docType: this.defaultDocType || '',
        templateId: this.defaultTemplateId || '',
        createMethod: this.defaultMethod || 'manual'
      }
      this.loadPublishedTemplate()
    },
    previousStep () {
      if (this.activeStep === 'confirm') {
        this.activeStep = 'method'
        return
      }
      if (this.activeStep === 'method') {
        this.activeStep = 'category'
      }
    },
    continueNext () {
      if (!this.canContinue) return
      if (this.activeStep === 'category') {
        this.activeStep = 'method'
        return
      }
      if (this.activeStep === 'method') {
        if (this.form.createMethod === 'manual' && !this.selectedTemplate) {
          this.$message.warning('当前分类未查询到已发布模板，不能手动录入')
          return
        }
        this.activeStep = 'confirm'
        return
      }
      this.confirmCreate()
    },
    handleDocTypeChange (value) {
      this.form.docType = value
      this.form.templateId = ''
      this.selectedTemplate = null
      this.loadPublishedTemplate()
    },
    async loadPublishedTemplate () {
      if (!this.form.docType) {
        this.form.templateId = ''
        this.selectedTemplate = null
        return
      }
      this.templateLoading = true
      try {
        const { data } = await dFileTemplateService.usableTemplates({
          docType: this.form.docType,
          status: 'published'
        })
        const templates = data || []
        this.selectedTemplate = templates[0] || null
        this.form.templateId = this.selectedTemplate ? this.selectedTemplate.id : ''
      } catch (error) {
        this.selectedTemplate = null
        this.form.templateId = ''
        this.$message.error(this.resolveErrorMessage(error))
      } finally {
        this.templateLoading = false
      }
    },
    confirmCreate () {
      const payload = {
        docType: this.form.docType,
        createMethod: this.form.createMethod
      }
      if (this.form.createMethod === 'manual') {
        payload.templateId = this.form.templateId
        payload.templateVersion = this.selectedTemplateVersion
        payload.templateName = this.selectedTemplateName
        payload.template = this.selectedTemplate
      }
      this.handleClose()
      this.$emit('create', payload)
    },
    resolveErrorMessage (error) {
      if (error && error.message) return error.message
      if (error && error.response && error.response.data) return error.response.data
      return '已发布模板加载失败'
    },
    handleRouteHashChange () {
      if (this.dialogVisible && window.location.hash.indexOf('/dteachingdocument/DTeachingDocumentList') === -1) {
        this.handleClose()
      }
    },
    handleClose () {
      this.dialogVisible = false
      this.$emit('update:visible', false)
      this.$emit('close')
    }
  }
}
</script>

<style scoped>
.teaching-document-create-dialog >>> .el-dialog {
  border-radius: 22px;
}

.teaching-document-create-dialog >>> .el-dialog__header {
  padding: 28px 32px 8px;
}

.teaching-document-create-dialog >>> .el-dialog__body {
  padding: 10px 32px 24px;
}

.teaching-document-create-dialog__header {
  display: flex;
  justify-content: center;
  margin-bottom: 22px;
}

.teaching-document-create-dialog__panel {
  min-height: 430px;
}

.teaching-document-create-dialog__section-head {
  margin-bottom: 18px;
}

.teaching-document-create-dialog__section-head h3 {
  margin: 0 0 8px;
  color: #0f172a;
  font-size: 22px;
}

.teaching-document-create-dialog__section-head p {
  margin: 0;
  color: #64748b;
  line-height: 1.6;
}

.teaching-document-create-dialog__summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}

.teaching-document-create-dialog__summary div {
  padding: 14px;
  border: 1px solid #edf2f7;
  border-radius: 8px;
  background: #fbfdff;
}

.teaching-document-create-dialog__summary dt {
  color: #64748b;
  font-size: 13px;
}

.teaching-document-create-dialog__summary dd {
  margin: 8px 0 0;
  color: #0f172a;
  font-weight: 700;
}

.teaching-document-create-dialog__template-card {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid #d8e3f1;
  border-radius: 8px;
  background: #fbfdff;
}

.teaching-document-create-dialog__template-card span,
.teaching-document-create-dialog__template-card strong,
.teaching-document-create-dialog__template-card small {
  display: block;
}

.teaching-document-create-dialog__template-card span,
.teaching-document-create-dialog__template-card small {
  color: #64748b;
}

.teaching-document-create-dialog__template-card strong {
  margin: 8px 0 6px;
  color: #0f172a;
}

.teaching-document-create-dialog__template-alert {
  margin-top: 16px;
}

.teaching-document-create-dialog >>> .el-dialog__footer .el-button {
  min-width: 108px;
  height: 42px;
  border-radius: 12px;
  font-weight: 600;
  transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.teaching-document-create-dialog >>> .el-dialog__footer .el-button--default {
  border-color: #d8e3f1;
  color: #0f172a;
  background: #ffffff;
}

.teaching-document-create-dialog >>> .el-dialog__footer .el-button--default:hover,
.teaching-document-create-dialog >>> .el-dialog__footer .el-button--default:focus {
  border-color: var(--defaultTheme, #0f172a);
  color: var(--defaultTheme, #0f172a);
  background: rgba(15, 23, 42, 0.04);
}

.teaching-document-create-dialog >>> .el-dialog__footer .el-button--default.is-disabled,
.teaching-document-create-dialog >>> .el-dialog__footer .el-button--default.is-disabled:hover,
.teaching-document-create-dialog >>> .el-dialog__footer .el-button--default.is-disabled:focus {
  border-color: #e5e7eb;
  color: #c0c4cc;
  background: #ffffff;
}

.teaching-document-create-dialog >>> .el-dialog__footer .el-button--primary {
  border-color: var(--defaultTheme, #0f172a);
  background: var(--defaultTheme, #0f172a);
}

.teaching-document-create-dialog >>> .el-dialog__footer .el-button--primary:hover,
.teaching-document-create-dialog >>> .el-dialog__footer .el-button--primary:focus {
  border-color: var(--ul-button-hover, #253047);
  background: var(--ul-button-hover, #253047);
}

.teaching-document-create-dialog >>> .el-dialog__footer .el-button--primary.is-disabled,
.teaching-document-create-dialog >>> .el-dialog__footer .el-button--primary.is-disabled:hover,
.teaching-document-create-dialog >>> .el-dialog__footer .el-button--primary.is-disabled:focus {
  border-color: #e5e7eb;
  background: #e5e7eb;
  color: #94a3b8;
}

@media (max-width: 760px) {
  .teaching-document-create-dialog__summary {
    grid-template-columns: 1fr;
  }
}
</style>
