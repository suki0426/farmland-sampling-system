<template>
  <el-table
    class="indicator-import-error-table"
    :data="errors"
    border
    size="small"
    empty-text="暂无错误明细"
  >
    <el-table-column prop="rowNo" label="行号" width="80" />
    <el-table-column prop="indicatorCode" label="指标编码" min-width="130" show-overflow-tooltip />
    <el-table-column prop="indicatorName" label="指标名称" min-width="150" show-overflow-tooltip />
    <el-table-column prop="errorType" label="错误类型" width="120" />
    <el-table-column prop="errorReason" label="错误原因" min-width="220" show-overflow-tooltip />
  </el-table>
</template>

<script>
export default {
  name: 'ImportErrorTable',
  props: {
    errors: {
      type: Array,
      default: () => []
    }
  }
}
</script>

<style scoped>
.indicator-import-error-table {
  width: 100%;
}
</style>
