<template>
  <div id="data-view">
   <div class="bg">
      <dv-loading v-if="loading">加载中...</dv-loading>
      <div v-else>
         <!-- 头信息 -->
         <top-header />
         <div class="main-content">
         <div class="block-left-right-content">
            <div class="block-top-bottom-content">
               <div class="block-top-content">
               <!-- 左侧大图 -->
               <report-img  ref="reportImg"/>
               <!-- 右侧滚动列表 -->
               <report-list @showImg = "showImg"/>
               </div>
               <!-- 底部滚动图片列表 -->
               <cards ref="cards"  @showImg = "showImg"/>
            </div>
         </div>
         </div>
      </div>
   </div>
  </div>
</template>

<script>
import topHeader from './topHeader'
import reportImg from './reportImg'
import reportList from './reportList'
import cards from './cards'

export default {
  name: 'DataView',
  components: {
    topHeader,
    reportImg,
    reportList,
    cards
  },
  data () {
    return {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      loading: true
    }
  },
  mounted () {
    // 添加窗口大小改变事件监听器
    window.addEventListener('resize', this.handleResize)
    // 切换全屏显示 需要手动操作才可以，默认打开浏览器会阻止
    // this.openFullscreen()
    this.cancelLoading()
  },
  beforeDestroy () {
    // 在组件销毁前移除事件监听器，以避免内存泄漏
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    handleResize () {
      // 视口大小改变时执行的方法
      this.viewportWidth = window.innerWidth
      this.viewportHeight = window.innerHeight
      console.log('viewportWidth', this.viewportWidth, this.viewportHeight)
    },
    // 切换全屏显示
    openFullscreen () {
      const element = document.documentElement // 获取整个页面的元素
      if (document.fullscreenElement) {
        // 如果已经在全屏模式下，退出全屏
        document.exitFullscreen()
      } else {
        // 否则，进入全屏模式
        element.requestFullscreen()
          .then(() => {
            console.log('进入全屏模式')
          })
          .catch(err => {
            console.error('无法进入全屏模式:', err)
          })
      }
    },
    // 把值赋给图片组件
    showImg (imgUrl) {
      console.log('把值赋给图片组件', imgUrl)
      this.$refs.reportImg.showImg(imgUrl)
    },
    cancelLoading () {
      setTimeout(() => {
        this.loading = false
      }, 500)
    }
  }
}
</script>

<style lang="less">

//  全局样式
* {
  margin: 0;
  padding: 0;
  list-style-type: none;
  outline: none;
  box-sizing: border-box;
}

html {
  margin: 0;
  padding: 0;
}

body {
  font-family: Arial, Helvetica, sans-serif;
  line-height: 1.2em;
  background-color: #f1f1f1;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

#data-view {
//   width: 100%;
//   height: 100%;
//   background-color: #030409;
//   color: #fff;
//   width: 100%;
//   height: 1080px;

color: #d3d6dd;
  width: 100%;
  height: 1080px;
  position: absolute;
  top: 57%;
  left: 50%;
  transform: translate(-50%, -50%);
  transform-origin: left top;
  overflow: hidden;


  .bg {
    width: 100%;
    height: 100%;
    padding: 16px 16px 0 16px;
    background-image: url('/static/img/aivideo-home-bg.png');
    background-size: cover;
    background-position: center center;
  }

//   #dv-full-screen-container {
//     background-image: url('/static/img/aivideo-home-bg.png');
//     background-size: 100% 100%;
//     box-shadow: 0 0 3px blue;
//    //  display: flex;
//    //  flex-direction: column;
//     width: 100%;
//     height: 100%;
//     padding: 16px 16px 0 16px;
//   }

  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: transparent; // #061236;
  }

  .block-left-right-content {
    flex: 1;
    display: flex;
    margin-top: 20px;
  }

  .block-top-bottom-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
   //  padding-left: 20px;
  }

  .block-top-content {
   //  height: 55%;
   //  display: flex;
   //  flex-grow: 0;
   //  box-sizing: border-box;
   //  padding-bottom: 20px;

    display: grid;
   grid-template-columns: repeat(2, 50%);
  }
}
</style>
