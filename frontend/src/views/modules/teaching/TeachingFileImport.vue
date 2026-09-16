<template>
  <div class="teaching-import-page ultra-theme">
    <section class="teaching-import-page__shell">
      <header class="teaching-import-page__header">
        <div>
          <div class="teaching-import-page__eyebrow">Teaching File Import</div>
          <h1 class="teaching-import-page__title">教学文件上传解析</h1>
          <p class="teaching-import-page__desc">
            按所选文档分类导入 Word 文件，解析成功后生成教学文档记录。
          </p>
        </div>
        <div class="teaching-import-page__actions">
          <el-button icon="el-icon-back" @click="goCreate">重新选择</el-button>
          <el-button type="primary" icon="el-icon-upload2" :disabled="!hasImportContext" @click="chooseFiles">选择文件</el-button>
        </div>
      </header>

      <section class="teaching-import-page__context">
        <div>
          <span>文档分类</span>
          <strong>{{ docTypeLabel }}</strong>
        </div>
        <el-button v-if="!hasImportContext" type="text" @click="goCreate">去选择文档分类</el-button>
      </section>

      <UploadParsePanel
        ref="uploadPanel"
        :doc-type="importContext.docType"
        :require-context="true"
        @refresh-list="handleRefreshList"
        @view-record="handleViewRecord"
        @upload-success="handleUploadSuccess"
        @parse-failed="handleParseFailed"
      />

      <section class="teaching-import-page__rule">
        <div class="teaching-import-page__rule-title">自动识别规则说明</div>
        <div class="teaching-import-page__rule-text">
          当前导入记录归属到已选择的文档分类；真实解析内容以后端 Word 导入接口返回为准。
        </div>
      </section>
    </section>
  </div>
</template>

<script>
import UploadParsePanel from '@/components/teachingImport/UploadParsePanel'
import { getTemplateDocTypeLabel } from '@/components/fileTemplate/constants'

export default {
  name: 'TeachingFileImport',
  components: {
    UploadParsePanel
  },
  data () {
    return {
      lastSuccessRecordId: '',
      importContext: {
        docType: this.$route.query.docType || ''
      }
    }
  },
  computed: {
    hasImportContext () {
      return Boolean(this.importContext.docType)
    },
    docTypeLabel () {
      if (this.$dictUtils && this.$dictUtils.getDictLabel) {
        return this.$dictUtils.getDictLabel('teaching_doc_type', this.importContext.docType, getTemplateDocTypeLabel(this.importContext.docType) || '-')
      }
      return getTemplateDocTypeLabel(this.importContext.docType) || '-'
    }
  },
  methods: {
    chooseFiles () {
      if (this.$refs.uploadPanel) {
        this.$refs.uploadPanel.chooseFiles()
      }
    },
    handleRefreshList () {
      this.$router.push({
        name: 'dteachingdocument-list',
        query: this.lastSuccessRecordId ? { highlightId: this.lastSuccessRecordId } : {}
      })
    },
    handleViewRecord (row) {
      this.$router.push({
        name: 'dteachingdocument-detail',
        query: { id: row.recordId }
      })
    },
    handleUploadSuccess (row) {
      this.lastSuccessRecordId = row.recordId || this.lastSuccessRecordId
      this.$notify.success({
        title: '解析成功',
        message: `${row.name} 已生成教学文件记录`
      })
    },
    handleParseFailed (row) {
      this.$notify.error({
        title: '解析失败',
        message: `${row.name} 解析失败`
      })
    },
    goCreate () {
      this.$router.push({
        name: 'dteachingdocument-list',
        query: {
          openCreate: '1',
          preferredMethod: 'file_import',
          docType: this.importContext.docType
        }
      })
    }
  }
}
</script>

<style scoped>
.teaching-import-page {
  min-height: 100%;
  padding: 20px;
  background: #f6f8fb;
  color: var(--ul-text);
  overflow: auto;
}

.teaching-import-page__shell {
  max-width: 1280px;
  margin: 0 auto;
  padding: 30px;
  border: 1px solid var(--ul-line);
  border-radius: 8px;
  background: rgba(255, 255, 255, .92);
  box-shadow: var(--ul-shadow-md);
}

.teaching-import-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}

.teaching-import-page__context {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
  padding: 14px 16px;
  border: 1px solid var(--ul-line);
  border-radius: 8px;
  background: #fff;
}

.teaching-import-page__context div {
  min-width: 0;
}

.teaching-import-page__context span,
.teaching-import-page__context strong {
  display: block;
}

.teaching-import-page__context span {
  color: var(--ul-muted);
  font-size: 12px;
}

.teaching-import-page__context strong {
  margin-top: 5px;
  color: var(--ul-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.teaching-import-page__eyebrow {
  color: var(--ul-muted);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.teaching-import-page__title {
  margin: 8px 0 0;
  color: var(--ul-text);
  font-size: 34px;
  font-weight: 900;
  line-height: 1.2;
}

.teaching-import-page__desc {
  max-width: 820px;
  margin: 12px 0 0;
  color: var(--ul-muted);
  font-size: 17px;
  font-weight: 600;
  line-height: 1.8;
}

.teaching-import-page__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.teaching-import-page__actions >>> .el-button {
  border-radius: 8px;
}

.teaching-import-page__rule {
  margin-top: 18px;
  padding: 18px 20px;
  border: 1px solid var(--ul-line);
  border-radius: 8px;
  background: var(--ul-panel-soft);
}

.teaching-import-page__rule-title {
  color: var(--ul-text);
  font-size: 16px;
  font-weight: 800;
}

.teaching-import-page__rule-text {
  margin-top: 8px;
  color: var(--ul-muted);
  font-size: 14px;
  line-height: 1.8;
}

@media (max-width: 900px) {
  .teaching-import-page {
    padding: 12px;
  }

  .teaching-import-page__shell {
    padding: 20px;
    border-radius: 8px;
  }

  .teaching-import-page__header {
    flex-direction: column;
  }

  .teaching-import-page__actions {
    justify-content: flex-start;
  }

  .teaching-import-page__context {
    grid-template-columns: 1fr;
  }

  .teaching-import-page__title {
    font-size: 28px;
  }
}
</style>
