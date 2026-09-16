<template>
  <div class="report-box">


    <!-- 上报的图片列表数据 -->
    <div v-for="(itemList, reportIndex) in reportList"
          :key="reportIndex">
        <!-- 某类型的图片数据 start-->
        <dv-border-box-13>
        <div class="cards">
          <div class="screen-capture-title">{{ itemList.typeName }}</div>
          <vue-seamless-scroll
            :data="cards"
            :class-option="classOption"
            class="warp"
          >
          <div
              class="card-item"
              v-for="(card, index) in itemList.cards"
              :key="index"
            >
            <div @click="showImg(card)">
                <div class="card-header">
                <div class="card-header-left">{{ card.typeName }}</div>
                <div class="card-header-right">{{ '0' + (index + 1) }}</div>
              </div>
              <div class="card-img">
                <img :src="card.image" alt="">
              </div>
              <div class="card-footer">
                <div class="card-footer-item">
                  <div class="footer-detail">
                    {{ card.createDate }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          </vue-seamless-scroll>
        </div>
      </dv-border-box-13>
        <!-- 某类型的图片数据 end-->

    </div>


    <!-- cards1 start -->
    <!-- <div class="cards">
      <div class="screen-capture-title">上报类型1记录</div>
      <vue-seamless-scroll
        :data="cards"
        :class-option="classOption"
        class="warp"
      >
      <div
          class="card-item"
          v-for="(card, i) in cards"
          :key="card.title"
        >
        <div @click="showImg(card)">
            <div class="card-header">
            <div class="card-header-left">{{ card.title }}</div>
            <div class="card-header-right">{{ '0' + (i + 1) }}</div>
          </div>
          <div class="card-img">
            <img src="https://dummyimage.com/120x80" alt="">
          </div>
          <div class="card-footer">
            <div class="card-footer-item">
              <div class="footer-detail">
                2023-10-19 15:26:36
              </div>
            </div>
          </div>
        </div>
  
      </div>
      </vue-seamless-scroll>
        
    </div> -->
    <!-- cards1 end -->
  

  </div>
</template>

<script>
import dataScreenService from '@/api/datav/dataScreenService'
import vueSeamlessScroll from 'vue-seamless-scroll'
export default {
  name: 'Cards',
  data () {
    return {
      reportList: [], // 所有图片数据列表
      cards: [],
      classOption: {
        step: 10, // 数值越大速度滚动越快
        limitMoveNum: 1, // 开始无缝滚动的数据量
        direction: 2, // 0向下 1向上 2向左 3向右
        // singleHeight: 0, // 单步运动停止的高度(默认值0是无缝不停止的滚动) direction => 0/1
        singleWidth: 182, // 单步运动停止的宽度(默认值0是无缝不停止的滚动) direction => 2/3
        waitTime: 3000, // 单步运动停止的时间(默认值1000ms)
      //   hoverStop: false, // 是否开启鼠标悬停stop
        hoverStop: true // 是否启用鼠标 hover 控制。
      }
    }
  },
  components: {
    vueSeamlessScroll
  },
  methods: {
    // 获取数据列表
    refreshList () {
      this.loading = true
      dataScreenService.list({
        'pageNo': 1,
        'pageSize': -1
      }).then(({data}) => {
        console.log('获取数据列表', data)
        let dataList = data.records

      // 生成报告类型和卡片
        for (let i = 1; i <= 2; i++) {
          const reportType = {
            typeName: '上报类型' + i + '记录', // 生成报告类型的名称
            cards: [] // 初始化卡片数组
          }
          reportType.cards = dataList
          this.reportList.push(reportType)
        }
      })
    },
    // 格式化日期为 'YYYY-MM-DD HH:mm:ss' 格式
    formatDate (date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    },
    // 获取列表数据
    getListData () {
      this.cards = new Array(5).fill(0).map((foo, i) => ({
        title: '测试路段' + (i + i),
        image: '/static/img/1-120x80.png', // 'https://dummyimage.com/120x80',
        date: new Date()
      }))
      this.cards.push()
    },
    // 生成报告列表
    // generateReportList(reportTypeCount, cardCount) {
    //   // 清空报告列表
    //   this.reportList = [];

    //   // 生成报告类型和卡片
    //   for (let i = 1; i <= reportTypeCount; i++) {
    //     const reportType = {
    //       typeName: '上报类型' + i + '记录',
    //       cards: [],
    //     };

    //     // 生成每个报告类型的卡片
    //     for (let j = 1; j <= cardCount; j++) {
    //       reportType.cards.push({
    //         title: '测试路段' + j,
    //         image: 'https://dummyimage.com/120x80',
    //         date: new Date().getTime(),
    //       });
    //     }

    //     // 将生成的报告类型添加到报告列表
    //     this.reportList.push(reportType);
    //   }
    // },
    generateReportList (reportTypeCount, cardCount) {
      this.reportList = []

      // 生成报告类型和卡片
      for (let i = 1; i <= reportTypeCount; i++) {
        const reportType = {
          typeName: '上报类型' + i + '记录', // 生成报告类型的名称
          cards: [] // 初始化卡片数组
        }

        for (let j = 1; j <= cardCount; j++) {
          // 生成带有详细参数的卡片数据
          const title = `测试路段${j}` // 设置卡片标题
          const image = '/static/img/120x80.png' // 'https://dummyimage.com/120x80' // 设置卡片图片
          const date = this.formatDate(new Date()) // 格式化当前日期

          reportType.cards.push({
            title: title,
            image: image,
            date: date
          })
        }

        // 将生成的报告类型添加到报告列表
        this.reportList.push(reportType)
      }
    },
    // 单击事件
    showImg (e) {
      console.log('图片列表页单击事件', e)
      this.$emit('showImg', e.image ? e.image : '')
    }
  },
  mounted () {
    const { getListData } = this
    // 获取列表数据
    getListData()
    // 每三秒获取一次列表数据
    setTimeout(() => {
        // 生成报告列表
        // this.generateReportList(2, 5); // 生成2个报告类型，每个报告类型包含5个卡片
      this.refreshList()
    }, 3000)
  }
}
</script>

<style lang="less">
.report-box {width: 100%; height: 100%;

display: grid;
grid-template-columns: repeat(2, 50%);
      }
.cards {
  padding: 15px 20px;
  height: 100%;
  background-color: rgba(6, 30, 93, 0.5);
//   border-top: 2px solid rgba(1, 153, 209, .5);
  box-sizing: border-box;
  flex: 1;
  margin-top: 10px;

  .screen-capture-title {
    font-weight: bold;
    height: 50px;
    display: flex;
    align-items: center;
    font-size: 20px;
    text-indent: 20px;
  }

  .card-item {
    background-color: rgba(6, 30, 93, 0.5);
    border-top: 2px solid rgba(1, 153, 209, .5);
    width: 182px;
    display: inline-table;
    flex-direction: column;
    height: 278px;
    margin-top: 0;
    
    .card-img {
      text-align: center;
    }
    .card-img img {
       width: 160px;
       height: 120px;
       object-fit:cover;
       overflow: hidden;
    }
  }

  .card-header {
    display: flex;
    height: 45px; //20%;
    align-items: center;
    justify-content: space-between;

    .card-header-left {
      font-size: 18px;
      font-weight: bold;
      padding-left: 20px;

      width: 95px;
      height: 20px;
      display: -webkit-box;
      /*设置为弹性盒子*/
      -webkit-line-clamp: 1;
      /*最多显示3行*/
      overflow: hidden;
      /*超出隐藏*/
      text-overflow: ellipsis;
      /*超出显示为省略号*/
      -webkit-box-orient: vertical;
      word-break: break-all;
      /*强制英文单词自动换行*/
    }

    .card-header-right {
      padding-right: 20px;
      font-size: 40px;
      color: #03d3ec;
    }
  }

  .ring-charts {
    height: 55%;
  }

  .card-footer {
    height: 25%;
    display: flex;
    align-items: center;
    justify-content: space-around;
    text-align: center;
  }

  .card-footer-item {
    padding: 5px 10px 0px 10px;
    box-sizing: border-box;
    width: 100%;
    background-color: rgba(6, 30, 93, 0.7);
    border-radius: 3px;

    .footer-title {
      font-size: 15px;
      margin-bottom: 5px;
    }

    .footer-detail {
      font-size: 20px;
      color: #1294fb;
      display: flex;
      font-size: 18px;
      align-items: center;

      .dv-digital-flop {
        margin-right: 5px;
      }
    }
  }
}



.warp {
    width: 182px * 5;
    height: 230px;
    margin: 0 auto;
    overflow: hidden;
  }
</style>
