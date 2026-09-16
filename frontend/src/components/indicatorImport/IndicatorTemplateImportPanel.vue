<template>
  <div class="indicator-template-import-panel">
    <input
      ref="fileInput"
      class="indicator-template-import-panel__input"
      type="file"
      :accept="acceptText"
      @change="handleFileChange"
    >

    <ImportStepGuide :active-index="activeStepIndex" />

    <div class="indicator-template-import-panel__workspace">
      <div class="indicator-template-import-panel__primary">
        <TemplateDropzone
          :selected="selectedTemplate"
          :disabled="disabled"
          :importing="importing"
          @choose="chooseFile"
          @select="selectFile"
          @import="startImport"
        />

        <div v-if="selectedTemplate" class="indicator-template-import-panel__progress">
          <div class="indicator-template-import-panel__progress-head">
            <span>{{ selectedTemplate.name }}</span>
            <strong>{{ selectedTemplate.progress }}%</strong>
          </div>
          <el-progress :percentage="selectedTemplate.progress" :show-text="false" />
        </div>
      </div>

      <aside class="indicator-template-import-panel__aside">
        <ImportChecklist @show-rules="ruleDialogVisible = true" />

        <section class="indicator-template-import-panel__section">
          <div class="indicator-template-import-panel__section-title">导入反馈</div>
          <ImportResultSummary
            :status="status"
            :result="result"
            @view-tree="$emit('view-tree', result)"
          />
        </section>
      </aside>
    </div>

    <section class="indicator-template-import-panel__errors">
      <div class="indicator-template-import-panel__section-head">
        <div>
          <div class="indicator-template-import-panel__section-title">错误明细</div>
          <div class="indicator-template-import-panel__section-desc">
            失败行会保留行号、指标编码和错误原因，方便修正文件后再次导入。
          </div>
        </div>
        <el-button size="mini" :disabled="!selectedTemplate || importing" @click="clearSelected">
          重置
        </el-button>
      </div>
      <ImportErrorTable :errors="errorRows" />
    </section>

    <el-dialog
      title="完整字段规则"
      width="560px"
      :visible.sync="ruleDialogVisible"
      append-to-body
    >
      <div class="indicator-template-import-panel__dialog-desc">
        字段保持稳定后，导入结果会直接覆盖当前演示数据。
      </div>
      <TemplateRuleList />
    </el-dialog>
  </div>
</template>

<script>
import indicatorService from '@/api/indicator'
import ImportStepGuide from './ImportStepGuide'
import ImportChecklist from './ImportChecklist'
import TemplateDropzone from './TemplateDropzone'
import TemplateRuleList from './TemplateRuleList'
import ImportResultSummary from './ImportResultSummary'
import ImportErrorTable from './ImportErrorTable'
import { IMPORT_STATUS, INDICATOR_TEMPLATE_EXTENSIONS } from './constants'
import { normalizeIndicatorImportResult } from '@/utils/indicatorAdapter'
import { resolveErrorMessage } from '@/utils/errorMessage'
import {
  createSelectedTemplate,
  resolveImportStatus,
  validateTemplateFile
} from './utils'

export default {
  name: 'IndicatorTemplateImportPanel',
  components: {
    ImportStepGuide,
    ImportChecklist,
    TemplateDropzone,
    TemplateRuleList,
    ImportResultSummary,
    ImportErrorTable
  },
  props: {
    disabled: { type: Boolean, default: false },
    mock: { type: Boolean, default: true },
    maxSize: { type: Number, default: 10 },
    extensions: {
      type: Array,
      default: () => INDICATOR_TEMPLATE_EXTENSIONS
    },
    service: {
      type: Object,
      default: () => indicatorService
    }
  },
  data () {
    return {
      selectedTemplate: null,
      importing: false,
      status: IMPORT_STATUS.IDLE,
      result: null,
      ruleDialogVisible: false
    }
  },
  computed: {
    acceptText () {
      return this.extensions.map(item => `.${item}`).join(',')
    },
    errorRows () {
      return this.result && this.result.errors ? this.result.errors : []
    },
    activeStepIndex () {
      if (this.result) return 3
      if (this.importing) return 2
      if (this.selectedTemplate) return 2
      return 0
    }
  },
  methods: {
    chooseFile () {
      if (this.disabled || this.importing) return
      this.$refs.fileInput.click()
    },
    handleFileChange (event) {
      const file = event.target.files && event.target.files[0]
      this.selectFile(file)
      event.target.value = ''
    },
    selectFile (file) {
      if (!file || this.disabled || this.importing) return

      const validResult = validateTemplateFile(file, {
        extensions: this.extensions,
        maxSize: this.maxSize
      })
      if (!validResult.valid) {
        this.$message.warning(validResult.message)
        return
      }

      this.selectedTemplate = createSelectedTemplate(file)
      this.status = IMPORT_STATUS.READY
      this.result = null
      this.$emit('select', this.selectedTemplate)
    },
    async startImport () {
      if (!this.selectedTemplate) {
        this.$message.warning('请先选择导入文件')
        return
      }

      this.importing = true
      this.status = IMPORT_STATUS.UPLOADING
      this.patchSelected({ progress: 8 })
      this.$emit('start', this.selectedTemplate)

      try {
        const formData = new FormData()
        formData.append('file', this.selectedTemplate.file)

        const response = await this.service.importIndicatorTemplate(formData, {
          mock: this.mock,
          onUploadProgress: event => {
            const percent = event.total ? Math.round((event.loaded / event.total) * 80) : 48
            this.patchSelected({ progress: Math.max(8, percent) })
          }
        })

        const result = normalizeIndicatorImportResult(response)
        this.result = result
        this.status = resolveImportStatus(result)
        this.patchSelected({ progress: 100, status: this.status })
        this.$emit('finish', result)

        if (this.status === IMPORT_STATUS.SUCCESS) {
          this.$message.success('指标导入成功，已覆盖当前数据')
          this.$emit('refresh-tree', result)
        } else {
          this.$message.warning(result.message || '导入完成，存在错误明细')
        }
      } catch (error) {
        this.status = IMPORT_STATUS.FAILED
        this.patchSelected({ progress: 100, status: IMPORT_STATUS.FAILED })
        this.$message.error(this.resolveErrorMessage(error, '指标导入失败'))
        this.$emit('failed', error)
      } finally {
        this.importing = false
      }
    },
    clearSelected () {
      this.selectedTemplate = null
      this.status = IMPORT_STATUS.IDLE
      this.result = null
      this.$emit('reset')
    },
    patchSelected (patch) {
      if (!this.selectedTemplate) return
      this.selectedTemplate = {
        ...this.selectedTemplate,
        ...patch
      }
    },
    resolveErrorMessage
  }
}
</script>

<style scoped>
.indicator-template-import-panel {
  display: grid;
  gap: 18px;
}

.indicator-template-import-panel__input {
  display: none;
}

.indicator-template-import-panel__workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 18px;
  align-items: start;
}

.indicator-template-import-panel__primary {
  min-width: 0;
}

.indicator-template-import-panel__aside {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.indicator-template-import-panel__section,
.indicator-template-import-panel__errors {
  padding: 18px;
  border: 1px solid var(--ul-line);
  border-radius: 24px;
  background: var(--ul-panel);
  box-shadow: var(--ul-shadow-sm);
}

.indicator-template-import-panel__section {
  display: flex;
  flex-direction: column;
}

.indicator-template-import-panel__section >>> .indicator-import-summary {
  flex: 1 1 auto;
}

.indicator-template-import-panel__section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.indicator-template-import-panel__section-title {
  color: var(--ul-text);
  font-size: 18px;
  font-weight: 900;
}

.indicator-template-import-panel__section-desc {
  margin-top: 6px;
  color: var(--ul-muted);
  font-size: 13px;
  line-height: 1.7;
}

.indicator-template-import-panel__progress {
  margin-top: 14px;
  padding: 16px;
  border: 1px solid var(--ul-line);
  border-radius: 20px;
  background: var(--ul-panel);
}

.indicator-template-import-panel__progress-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  color: var(--ul-text);
  font-size: 13px;
  font-weight: 800;
}

.indicator-template-import-panel__dialog-desc {
  margin-bottom: 12px;
  color: var(--ul-muted);
  font-size: 13px;
  line-height: 1.7;
}

@media (max-width: 1180px) {
  .indicator-template-import-panel__workspace {
    grid-template-columns: 1fr;
  }
}
</style>
