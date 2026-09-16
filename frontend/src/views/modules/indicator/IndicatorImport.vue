<template>
  <div class="indicator-redirect">
    正在进入指标管理...
  </div>
</template>

<script>
export default {
  name: 'IndicatorImport',
  created () {
    this.$router.replace({ name: 'indicator-mind-map', query: this.$route.query })
  }
}
</script>

<style scoped>
.indicator-redirect {
  padding: 24px;
  color: #64748b;
  font-size: 14px;
}
</style>
