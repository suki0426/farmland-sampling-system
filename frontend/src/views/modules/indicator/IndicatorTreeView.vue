<template>
  <div class="page indicator-redirect-page" v-loading="true">
    正在进入指标管理...
  </div>
</template>

<script>
export default {
  name: 'IndicatorTreeView',
  created () {
    this.redirectToMindMap()
  },
  activated () {
    this.redirectToMindMap()
  },
  methods: {
    redirectToMindMap () {
      this.$router.replace({
        name: 'indicator-mind-map',
        query: this.$route.query || {}
      })
    }
  }
}
</script>

<style scoped>
.indicator-redirect-page {
  display: grid;
  min-height: 320px;
  place-items: center;
  color: #64748b;
  font-size: 14px;
}
</style>
