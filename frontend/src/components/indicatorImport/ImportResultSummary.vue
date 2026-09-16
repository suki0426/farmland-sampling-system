<template>
  <div class="indicator-import-summary">
    <div class="indicator-import-summary__status">
      <el-tag :type="statusMeta.type">{{ statusMeta.label }}</el-tag>
      <span v-if="result && result.batchNo">批次：{{ result.batchNo }}</span>
      <span v-else>等待导入结果</span>
    </div>

    <div class="indicator-import-summary__numbers">
      <div
        v-for="item in cards"
        :key="item.key"
        class="indicator-import-summary__number"
      >
        <strong>{{ item.value }}</strong>
        <span>{{ item.label }}</span>
      </div>
    </div>

    <div v-if="showTreeAction" class="indicator-import-summary__actions ul-action-group">
      <el-button type="primary" round size="small" @click="$emit('view-tree')">
        查看指标管理
      </el-button>
      <span>导入完成后可回到导图中核对层级和详情。</span>
    </div>
  </div>
</template>

<script>
import { IMPORT_STATUS_META } from './constants'

export default {
  name: 'ImportResultSummary',
  props: {
    status: { type: String, default: 'idle' },
    result: { type: Object, default: null }
  },
  computed: {
    statusMeta () {
      return IMPORT_STATUS_META[this.status] || IMPORT_STATUS_META.idle
    },
    cards () {
      const result = this.result || {}
      return [
        { key: 'total', label: '总行数', value: result.totalCount || 0 },
        { key: 'success', label: '成功', value: result.successCount || 0 },
        { key: 'failed', label: '失败', value: result.failCount || 0 },
        { key: 'skipped', label: '跳过', value: result.skippedCount || 0 }
      ]
    },
    showTreeAction () {
      return this.result && ['success', 'partial'].indexOf(this.status) > -1
    }
  }
}
</script>

<style scoped>
.indicator-import-summary {
  display: grid;
  gap: 14px;
}

.indicator-import-summary__status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  color: var(--ul-muted);
  font-size: 13px;
}

.indicator-import-summary__numbers {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.indicator-import-summary__number {
  display: flex;
  min-height: 92px;
  flex-direction: column;
  justify-content: center;
  padding: 14px 16px;
  border: 1px solid var(--ul-line);
  border-radius: 16px;
  background: var(--ul-panel-soft);
}

.indicator-import-summary__number strong {
  display: block;
  color: var(--ul-text);
  font-size: 28px;
  line-height: 1;
}

.indicator-import-summary__number span {
  display: block;
  margin-top: 8px;
  color: var(--ul-muted);
  font-size: 12px;
}

.indicator-import-summary__actions {
  padding-top: 2px;
  color: var(--ul-muted);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.6;
}
</style>
