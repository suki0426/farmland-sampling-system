<template>
  <div class="upload-queue">
    <div v-if="!items.length" class="upload-queue__empty">
      等待选择文件，支持 Word 批量导入。
    </div>

    <div
      v-for="item in items"
      :key="item.uid"
      class="upload-queue__row"
    >
      <div class="upload-queue__main">
        <div class="upload-queue__name">{{ item.name }}</div>
        <div class="upload-queue__meta">
          <span>{{ item.sizeText }}</span>
          <span>{{ getDocTypeLabel(item.docType) }}</span>
          <el-tag size="mini" :type="getStatusType(item.status)">
            {{ getStatusLabel(item.status) }}
          </el-tag>
        </div>
      </div>

      <div class="upload-queue__progress">
        <el-progress :percentage="item.progress || 0" :show-text="false" />
      </div>

      <el-button
        type="text"
        size="mini"
        :disabled="item.status === 'uploading' || item.status === 'parsing'"
        @click="$emit('remove', item.uid)"
      >
        移除
      </el-button>
    </div>
  </div>
</template>

<script>
import { STATUS_META } from './constants'
import { getTemplateDocTypeLabel } from '@/components/fileTemplate/constants'

export default {
  name: 'UploadQueueList',
  props: {
    items: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    getStatusLabel (status) {
      return (STATUS_META[status] && STATUS_META[status].label) || status || '-'
    },
    getStatusType (status) {
      return (STATUS_META[status] && STATUS_META[status].type) || 'info'
    },
    getDocTypeLabel (docType) {
      if (this.$dictUtils && this.$dictUtils.getDictLabel) {
        return this.$dictUtils.getDictLabel('teaching_doc_type', docType, getTemplateDocTypeLabel(docType) || '-')
      }
      return getTemplateDocTypeLabel(docType) || '-'
    }
  }
}
</script>

<style scoped>
.upload-queue {
  display: grid;
  gap: 10px;
}

.upload-queue__empty {
  padding: 18px;
  border: 1px dashed var(--ul-line-strong);
  border-radius: 8px;
  color: var(--ul-muted);
  text-align: center;
}

.upload-queue__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px 48px;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid var(--ul-line);
  border-radius: 8px;
  background: var(--ul-panel);
}

.upload-queue__name {
  color: var(--ul-text);
  font-weight: 700;
}

.upload-queue__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  color: var(--ul-muted);
  font-size: 12px;
}

@media (max-width: 900px) {
  .upload-queue__row {
    grid-template-columns: 1fr;
  }

  .upload-queue__progress {
    width: 100%;
  }
}
</style>
