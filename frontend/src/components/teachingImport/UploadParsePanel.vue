<template>
  <div class="upload-parse-panel">
    <input
      ref="fileInput"
      class="upload-parse-panel__input"
      type="file"
      multiple
      :accept="acceptText"
      @change="handleFileChange"
    >

    <UploadDropzone
      :selected-count="items.length"
      :loading="running"
      :disabled="panelDisabled"
      @choose="chooseFiles"
      @drop="appendFiles"
      @start="startImport"
    />

    <ParseResultSummary class="upload-parse-panel__summary" :summary="summary" />

    <div class="upload-parse-panel__grid">
      <section class="upload-parse-panel__section">
        <div class="upload-parse-panel__section-head">
          <div>
            <div class="upload-parse-panel__section-title">上传队列</div>
            <div class="upload-parse-panel__section-desc">每个文件独立上传、解析和反馈，便于后续批量导入定位问题。</div>
          </div>
          <el-button size="mini" :disabled="running || !items.length" @click="clearItems">清空</el-button>
        </div>
        <UploadQueueList :items="items" @remove="removeItem" />
      </section>

      <section class="upload-parse-panel__section">
        <div class="upload-parse-panel__section-head">
          <div>
            <div class="upload-parse-panel__section-title">解析结果</div>
            <div class="upload-parse-panel__section-desc">后续接入真实接口后，这里展示后端识别类型、生成记录和失败原因。</div>
          </div>
        </div>
        <ParseResultTable :items="items" @view-record="$emit('view-record', $event)" />
      </section>
    </div>
  </div>
</template>

<script>
import teachingFileService from '@/api/teachingFile'
import { TEACHING_PROJECT_MOCK } from '@/config/teachingProject'
import UploadDropzone from './UploadDropzone'
import UploadQueueList from './UploadQueueList'
import ParseResultSummary from './ParseResultSummary'
import ParseResultTable from './ParseResultTable'
import { ACCEPT_EXTENSIONS, PARSE_STATUS } from './constants'
import {
  normalizeTeachingParseStatus,
  normalizeTeachingUploadResult
} from '@/utils/teachingFileAdapter'
import {
  createImportItem,
  summarizeImportItems,
  validateImportFile
} from './utils'

export default {
  name: 'UploadParsePanel',
  components: {
    UploadDropzone,
    UploadQueueList,
    ParseResultSummary,
    ParseResultTable
  },
  props: {
    disabled: { type: Boolean, default: false },
    docType: { type: String, default: '' },
    requireContext: { type: Boolean, default: false },
    mock: { type: Boolean, default: TEACHING_PROJECT_MOCK },
    maxSize: { type: Number, default: 20 },
    extensions: {
      type: Array,
      default: () => ACCEPT_EXTENSIONS
    },
    service: {
      type: Object,
      default: () => teachingFileService
    }
  },
  data () {
    return {
      items: [],
      running: false
    }
  },
  computed: {
    acceptText () {
      return this.extensions.map(item => `.${item}`).join(',')
    },
    summary () {
      return summarizeImportItems(this.items)
    },
    contextReady () {
      return !this.requireContext || Boolean(this.docType)
    },
    panelDisabled () {
      return this.disabled || !this.contextReady
    }
  },
  methods: {
    chooseFiles () {
      if (this.panelDisabled || this.running) return
      this.$refs.fileInput.click()
    },
    handleFileChange (event) {
      this.appendFiles(Array.from(event.target.files || []))
      event.target.value = ''
    },
    appendFiles (files) {
      if (this.panelDisabled || this.running || !files.length) return

      const validItems = []
      files.forEach(file => {
        const result = validateImportFile(file, {
          extensions: this.extensions,
          maxSize: this.maxSize
        })
        if (!result.valid) {
          this.$message.warning(`${file.name}：${result.message}`)
          return
        }
        const item = createImportItem(file)
        validItems.push({
          ...item,
          docType: this.docType || item.docType
        })
      })

      this.items = this.items.concat(validItems)
      if (validItems.length) {
        this.$emit('change', this.items)
      }
    },
    removeItem (uid) {
      if (this.running) return
      this.items = this.items.filter(item => item.uid !== uid)
      this.$emit('change', this.items)
    },
    clearItems () {
      if (this.running) return
      this.items = []
      this.$emit('change', this.items)
    },
    async startImport () {
      if (!this.contextReady) {
        this.$message.warning('请先选择文档分类')
        return
      }
      const pendingItems = this.items.filter(item => item.status === PARSE_STATUS.WAITING || item.status === PARSE_STATUS.FAILED)
      if (!pendingItems.length) {
        this.$message.warning('请先选择待导入文件')
        return
      }

      this.running = true
      this.$emit('start', pendingItems)
      for (const item of pendingItems) {
        await this.processItem(item)
      }
      this.running = false
      this.$emit('finish', this.items)

      if (this.items.some(item => item.status === PARSE_STATUS.SUCCESS)) {
        this.$emit('refresh-list')
      }
    },
    async processItem (item) {
      this.patchItem(item.uid, {
        status: PARSE_STATUS.UPLOADING,
        progress: 5,
        errorMessage: ''
      })

      try {
        const formData = new FormData()
        formData.append('file', item.file)
        formData.append('docType', this.docType || item.docType)

        const uploadResponse = await this.service.uploadTeachingFile(formData, {
          mock: this.mock,
          onUploadProgress: event => {
            const percent = event.total ? Math.round((event.loaded / event.total) * 70) : 40
            this.patchItem(item.uid, { progress: Math.max(5, percent) })
          }
        })

        const uploadResult = normalizeTeachingUploadResult(uploadResponse, item)
        this.patchItem(item.uid, {
          taskId: uploadResult.taskId,
          docType: uploadResult.docType || this.docType,
          status: PARSE_STATUS.PARSING,
          progress: 78
        })

        await this.resolveParseResult(item.uid, uploadResult.taskId)
      } catch (error) {
        this.patchItem(item.uid, {
          status: PARSE_STATUS.FAILED,
          progress: 100,
          errorMessage: this.resolveErrorMessage(error)
        })
        this.$emit('parse-failed', item)
      }
    },
    async resolveParseResult (uid, taskId) {
      const response = await this.service.getParseStatus(taskId, { mock: this.mock })
      const currentItem = this.findItem(uid)
      const parseResult = normalizeTeachingParseStatus(response, currentItem)

      if (parseResult.status === PARSE_STATUS.FAILED || parseResult.status === 'failed') {
        this.patchItem(uid, {
          status: PARSE_STATUS.FAILED,
          progress: 100,
          errorMessage: parseResult.errorMessage || '解析失败'
        })
        return
      }

      this.patchItem(uid, {
        status: PARSE_STATUS.SUCCESS,
        progress: 100,
        recordId: parseResult.recordId,
        docType: parseResult.docType || this.docType,
        errorMessage: ''
      })
      this.$emit('upload-success', this.findItem(uid))
    },
    patchItem (uid, patch) {
      this.items = this.items.map(item => {
        if (item.uid !== uid) return item
        return { ...item, ...patch }
      })
      this.$emit('change', this.items)
    },
    findItem (uid) {
      return this.items.find(item => item.uid === uid) || {}
    },
    resolveErrorMessage (error) {
      if (!error) return '导入失败'
      if (error.message) return error.message
      if (error.response && error.response.data) return error.response.data
      return String(error)
    }
  }
}
</script>

<style scoped>
.upload-parse-panel {
  display: grid;
  gap: 18px;
}

.upload-parse-panel__input {
  display: none;
}

.upload-parse-panel__summary {
  margin-top: 2px;
}

.upload-parse-panel__grid {
  display: grid;
  grid-template-columns: minmax(320px, .9fr) minmax(0, 1.1fr);
  gap: 16px;
}

.upload-parse-panel__section {
  min-width: 0;
  padding: 18px;
  border: 1px solid var(--ul-line);
  border-radius: 8px;
  background: var(--ul-panel);
  box-shadow: var(--ul-shadow-sm);
}

.upload-parse-panel__section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.upload-parse-panel__section-title {
  color: var(--ul-text);
  font-size: 18px;
  font-weight: 800;
}

.upload-parse-panel__section-desc {
  margin-top: 4px;
  color: var(--ul-muted);
  font-size: 13px;
  line-height: 1.6;
}

@media (max-width: 1200px) {
  .upload-parse-panel__grid {
    grid-template-columns: 1fr;
  }
}
</style>
