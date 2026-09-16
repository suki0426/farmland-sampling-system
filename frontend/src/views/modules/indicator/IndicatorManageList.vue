<template>
  <div class="page indicator-redirect-page" v-loading="true">
    正在进入指标管理...
  </div>
</template>

<script>
export default {
  name: 'IndicatorManageList',
  created () {
    this.redirectToMindMap()
  },
  activated () {
    this.redirectToMindMap()
  },
  methods: {
    redirectToMindMap () {
      if (this.$route.name === 'indicator-mind-map') return
      this.$router.replace({ name: 'indicator-mind-map' })
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
