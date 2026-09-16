<template>
   
  <div id="rose-chart">
   <dv-border-box-12>
      <div class="rose-chart-title">最新图片</div>
      <div class="report-content">
         <img :src="imgUrl" alt="" width="890" height="430">
      </div>
   </dv-border-box-12>
  </div>
</template>
<script>
export default {
  name: 'RoseChart',
  data () {
    return {
      option: {},
      imgUrl: '/static/img/890x430.png' // 'https://dummyimage.com/890x430'
    }
  },
  methods: {
    createData () {

    },
    showImg (e) {
      console.log('eee', e)
      this.imgUrl = e
    }
  },
  mounted () {
    const { createData } = this
    createData()
    setInterval(createData, 30000)
  }
}
</script>

<style lang="less">
#rose-chart {
//   width: 100%;
//   height: 100%;
//   background-color: rgba(6, 30, 93, 0.5);
//   border-top: 2px solid rgba(1, 153, 209, .5);
//   box-sizing: border-box;

  .rose-chart-title {
    height: 50px;
    font-weight: bold;
    text-indent: 20px;
    font-size: 20px;
    display: flex;
    align-items: center;
  }

  .report-content {
    padding: 20px 0 0 0;
    text-align: center;
  }

  .report-content img{
    // width: 890px;
    // height: 430px;
    // object-fit:cover;
  }
  .dv-charts-container {
    height: calc(~"100% - 50px");
  }
}
</style>
