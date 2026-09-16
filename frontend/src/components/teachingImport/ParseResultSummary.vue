<template>
  <div class="parse-summary">
    <div
      v-for="item in cards"
      :key="item.key"
      class="parse-summary__item"
    >
      <div class="parse-summary__value">{{ item.value }}</div>
      <div class="parse-summary__label">{{ item.label }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ParseResultSummary',
  props: {
    summary: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    cards () {
      return [
        { key: 'total', label: '文件总数', value: this.summary.total || 0 },
        { key: 'uploading', label: '上传中', value: this.summary.uploading || 0 },
        { key: 'parsing', label: '解析中', value: this.summary.parsing || 0 },
        { key: 'success', label: '成功', value: this.summary.success || 0 },
        { key: 'failed', label: '失败', value: this.summary.failed || 0 }
      ]
    }
  }
}
</script>

<style scoped>
.parse-summary {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.parse-summary__item {
  padding: 16px;
  border: 1px solid var(--ul-line);
  border-radius: 8px;
  background: var(--ul-panel);
}

.parse-summary__value {
  color: var(--ul-text);
  font-size: 26px;
  font-weight: 800;
  line-height: 1;
}

.parse-summary__label {
  margin-top: 8px;
  color: var(--ul-muted);
  font-size: 13px;
}

@media (max-width: 1100px) {
  .parse-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
