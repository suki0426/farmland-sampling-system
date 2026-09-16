<template>
  <div id="bottomRight">
    <div class="bg-color-black">
      <div class="d-flex">
        <!-- <span>
          <icon name="chart-area" class="text-icon"></icon>
        </span> -->
        <!-- <div class="d-flex">
          <span class="fs-xl text mx-2">上报类型2</span>
          <div class="decoration2">
            <dv-decoration-2 :reverse="true" style="width:5px;height:6rem;" />
          </div>
        </div> -->
            <!-- 上报的图片列表数据 -->
    <div v-for="(itemList, reportIndex) in reportList"
          :key="reportIndex">
        <!-- 某类型的图片数据 start-->

        <div class="cards">
          <div class="screen-capture-title">{{ itemList.typeName }} <span style="cursor: pointer;" class="text-secondary" @click="showModal('staticBackdrop', 'show')">选择类型 >></span></div>
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
                    {{ card.date }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          </vue-seamless-scroll>
        </div>

        <!-- 某类型的图片数据 end-->

    </div>


      </div>
      <div>
        
      </div>
    </div>
  </div>
</template>

<script>
import vueSeamlessScroll from 'vue-seamless-scroll'
export default {
  data () {
    return {
      reportList: [], // 所有图片数据列表
      cards: [],
      classOption: {
        step: 10, // 数值越大速度滚动越快
        limitMoveNum: 1, // 开始无缝滚动的数据量
        direction: 2, // 0向下 1向上 2向左 3向右
        // singleHeight: 0, // 单步运动停止的高度(默认值0是无缝不停止的滚动) direction => 0/1
        singleWidth: 180, // 单步运动停止的宽度(默认值0是无缝不停止的滚动) direction => 2/3
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
    // refreshList () {
    //   this.loading = true
    //   dataScreenService.list({
    //     'pageNo': 1,
    //     'pageSize': -1
    //   }).then(({data}) => {
    //     console.log('获取数据列表', data)
    //     let dataList = data.records

    //   // 生成报告类型和卡片
    //     for (let i = 1; i <= 2; i++) {
    //       const reportType = {
    //         typeName: '上报类型' + i + '记录', // 生成报告类型的名称
    //         cards: [] // 初始化卡片数组
    //       }
    //       reportType.cards = dataList
    //       this.reportList.push(reportType)
    //     }
    //   })
    // },
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
        image: 'https://dummyimage.com/140x80', // '/static/img/1-120x80.png', // 'https://dummyimage.com/120x80',
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
          const image = 'https://dummyimage.com/140x80' // '/static/img/120x80.png' // 'https://dummyimage.com/120x80' // 设置卡片图片
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
    },
    showModal (modalId, action) {
      console.log('showModal----', modalId, action)
      // if (action === 'show') {
      //   // 创建一个新的 div 元素
      //   const modalBackdrop = document.createElement('div');
      //   modalBackdrop.className = 'modal-backdrop fade show';
      //   modalBackdrop.style.zIndex = '1010';
      //   // 判断是否存在相同的元素，并且 left 属性相同
      //   const existingBackdrop = document.querySelector('.modal-backdrop.fade.show');
      //   if (!existingBackdrop || existingBackdrop) {
      //     // 插入到 body 元素的末尾
      //     document.body.appendChild(modalBackdrop);
      //   }
      // }

      // if (action === 'hide') {
      //   // 获取所有具有指定类名的元素
      //   const elementsToRemove = document.querySelectorAll('.modal-backdrop.fade.show');
      //   // 遍历并移除每个元素
      //   elementsToRemove.forEach(element => {
      //     element.parentNode.removeChild(element);
      //   });
      // }

      const modal = document.getElementById(modalId)
      if (modal) {
        // 移除 show 和 hide 类
        modal.classList.remove('show', 'hide')

        // 根据 action 参数设置类和显示属性
        if (action === 'show') {
          modal.classList.add('show')
          modal.style.display = 'block'
        } else if (action === 'hide') {
          modal.classList.add('hide')
          modal.style.display = 'none'
        }
      }
    }
  },
  mounted () {
    const { getListData } = this
    // 获取列表数据
    getListData()
    // 每三秒获取一次列表数据
    setTimeout(() => {
        // 生成报告列表
      this.generateReportList(1, 5) // 生成2个报告类型，每个报告类型包含5个卡片
      // this.refreshList()
    }, 3000)
  }
}
</script>

<style lang="scss" class>
$box-height: 325px;
$box-width: 100%;
#bottomRight {
  padding: 20px 0px;
  height: $box-height;
  width: $box-width;
  border-radius: 5px;
  .bg-color-black {
    height: $box-height - 30px;
    border-radius: 10px;
  }
  .text {
    color: #c3cbde;
    font-size: 1.5rem;
    padding-bottom: 10px;
    font-weight: bold;
  }
  //下滑线动态
  .decoration2 {
    position: absolute;
    right: 0.125rem;
  }
  .chart-box {
    margin-top: 16px;
    width: 170px;
    height: 170px;
    .active-ring-name {
      padding-top: 10px;
    }
  }
}
</style>
