<template>
  <el-dialog
    class="template-import-dialog"
    title="创建教学文档模板"
    width="1180px"
    :close-on-click-modal="false"
    :visible.sync="dialogVisible"
    @close="handleClose"
  >
    <div class="template-import-dialog__header">
      <TemplateWizardSteps
        v-model="activeStep"
        :max-step="maxStep"
      />
    </div>

    <section v-if="activeStep === 'category'" class="template-import-dialog__panel">
      <h3>选择文档分类</h3>
      <p>文档分类会决定后续教学文档填写时使用的模板范围。</p>
      <TemplateCategorySelector v-model="form.docType" />
    </section>

    <section v-if="activeStep === 'config'" class="template-import-dialog__panel">
      <TemplateManualBuildStep
        :form="form"
        @back="activeStep = 'category'"
        @confirm="createTemplate"
      />
    </section>

    <section v-if="activeStep === 'result'" class="template-import-dialog__panel">
      <TemplateImportResult
        v-if="createdTemplate"
        :template="createdTemplate"
        @close="handleClose"
        @again="resetDialog"
        @edit="handleEdit"
      />
    </section>

    <span v-if="activeStep === 'category'" slot="footer" class="dialog-footer">
      <el-button size="small" @click="handleClose">取消</el-button>
      <el-button size="small" type="primary" :disabled="nextDisabled" @click="nextStep">下一步</el-button>
    </span>
  </el-dialog>
</template>

<script>
import dFileTemplateImportService from '@/api/dfiletemplate/dFileTemplateImportService'
import TemplateCategorySelector from './TemplateCategorySelector'
import TemplateImportResult from './TemplateImportResult'
import TemplateManualBuildStep from './TemplateManualBuildStep'
import TemplateWizardSteps from './TemplateWizardSteps'

export default {
  name: 'TemplateImportDialog',
  components: {
    TemplateCategorySelector,
    TemplateImportResult,
    TemplateManualBuildStep,
    TemplateWizardSteps
  },
  props: {
    visible: { type: Boolean, default: false }
  },
  data () {
    return {
      activeStep: 'category',
      maxStep: 'category',
      form: {
        docType: '',
        method: 'manual',
        templateName: '',
        versionNo: 'V1.0'
      },
      createdTemplate: null,
      dialogVisible: false,
      creating: false
    }
  },
  computed: {
    isOwnerRoute () {
      return this.$route.name === 'dfiletemplate-section-list'
    },
    nextDisabled () {
      if (this.activeStep === 'category') return !this.form.docType
      return false
    }
  },
  watch: {
    visible (value) {
      this.dialogVisible = value && this.isOwnerRoute
      if (value) {
        this.resetDialog()
      }
    },
    '$route.name' (name) {
      if (this.dialogVisible && name !== 'dfiletemplate-section-list') {
        this.handleClose()
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
      this.maxStep = 'category'
      this.form = {
        docType: '',
        method: 'manual',
        templateName: '',
        versionNo: 'V1.0'
      }
      this.createdTemplate = null
    },
    nextStep () {
      if (this.activeStep === 'category') {
        if (!this.form.docType) {
          this.$message.warning('请先选择文档分类')
          return
        }
        this.activeStep = 'config'
        this.maxStep = 'config'
      }
    },
    async createTemplate (payload) {
      if (this.creating) return
      this.creating = true
      try {
        const { data } = await dFileTemplateImportService.createManual(payload)
        this.createdTemplate = data.template || payload
        this.createdTemplate.id = data.id || this.createdTemplate.id
        this.activeStep = 'result'
        this.maxStep = 'result'
        this.$emit('created', this.createdTemplate)
        this.$message.success(data.message || '模板草稿已生成')
      } catch (error) {
        this.$message.error(this.resolveErrorMessage(error))
      } finally {
        this.creating = false
      }
    },
    handleEdit (template) {
      this.handleClose()
      this.$emit('edit', template)
    },
    handleClose () {
      this.dialogVisible = false
      this.$emit('update:visible', false)
      this.$emit('close')
    },
    handleRouteHashChange () {
      if (this.dialogVisible && window.location.hash.indexOf('/dfiletemplate/DFileTemplateSectionList') === -1) {
        this.handleClose()
      }
    },
    resolveErrorMessage (error) {
      if (error && error.message) return error.message
      if (error && error.response && error.response.data) return error.response.data
      return '模板草稿生成失败'
    }
  }
}
</script>

<style scoped>
.template-import-dialog >>> .el-dialog {
  border-radius: 22px;
}

.template-import-dialog >>> .el-dialog__header {
  padding: 28px 32px 8px;
}

.template-import-dialog >>> .el-dialog__body {
  padding: 10px 32px 24px;
}

.template-import-dialog__header {
  display: flex;
  justify-content: center;
  margin-bottom: 22px;
}

.template-import-dialog__panel {
  min-height: 430px;
}

.template-import-dialog__panel > h3 {
  margin: 0 0 8px;
  color: #0f172a;
  font-size: 22px;
}

.template-import-dialog__panel > p {
  margin: 0 0 22px;
  color: #64748b;
}
</style>
