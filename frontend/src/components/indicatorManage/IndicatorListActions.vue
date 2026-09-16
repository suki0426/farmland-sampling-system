<template>
  <span class="indicator-list-actions ul-action-group">
    <el-button
      type="success"
      size="small"
      icon="el-icon-upload2"
      plain
      @click="$emit('import')"
    >
      导入
    </el-button>
    <el-button
      type="primary"
      size="small"
      icon="el-icon-connection"
      plain
      @click="$emit('mind-map')"
    >
      导图浏览
    </el-button>
  </span>
</template>

<script>
export default {
  name: 'IndicatorListActions'
}
</script>

<style scoped>
.indicator-list-actions {
  vertical-align: middle;
}
</style>
