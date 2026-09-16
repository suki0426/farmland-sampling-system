<template>
  <div id="centerLeft1">
    <div class="bg-color-black">
      <div class="d-flex pt-2 pl-2">
        <span>
          <icon name="chart-bar" class="text-icon"></icon>
        </span>
        <div class="d-flex">
          <span class="fs-xl text mx-2 report-pic-title">最新图片</span>
          <!-- <dv-decoration-3 class="dv-dec-3" /> -->
        </div>
      </div>
      <div class="d-flex bd-report-big-pic">
         <!-- 按钮 start -->
        <div class="bd-pic-btn">
            <nav class="navbar navbar-expand-lg">
               <div class="container-fluid">
                  <div class="collapse navbar-collapse">
                     <button class="btn btn-outline-primary mr-2" type="button" @click="showPicModal('viewImagesFullScreen', 'show', viewFullScreenUrl, 'viewImagesFullScreen')"><i class="fa fa-shopping-cart"></i>全屏</button>
                     <button class="btn btn-outline-primary" type="button" @click="showPicModal('viewImagesFullScreen', 'show', viewFullScreenUrl, 'playVideo')">播放视频</button>
                  </div>
               </div>
            </nav>
        </div>
        <!-- 按钮 end -->
        <div class="report-big-pic">
         <img :src="viewFullScreenUrl" class="img-fluid">
        </div>
      </div>
    </div>

   <!-- Full screen modal -->
   <div class="modal fade modal-fullscreen" id="viewImagesFullScreen" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="viewImagesFullScreenLabel" aria-hidden="true">
      <div class="modal-dialog">
         <div class="modal-content">
            <div class="modal-header">
            <h1 class="modal-title fs-5 text-primary" id="viewImagesFullScreenLabel">{{actionType === 'viewImagesFullScreen' ? '查看图片' : '播放视频'}}</h1>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" @click="showPicModal('viewImagesFullScreen', 'hide')"></button>
            </div>
            <div class="modal-body align-middle text-center">
               <img v-if="actionType === 'viewImagesFullScreen'" :src="viewFullScreenUrl" class="img-fluid" alt="">
               <!-- 视频播放器 -->
               <!-- 视频播放器 start -->
               <videoPlayer v-else
                  ref="videoPlayer"
                  :videoUrl="videoUrl"
                  :videoCover="videoCover"
               />
               <!-- 视频播放器 end -->
            </div>
            <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" @click="showPicModal('viewImagesFullScreen', 'hide')">关闭</button>
            </div>
         </div>
      </div>
   </div>


  </div>
</template>

<script>
import videoPlayer from '../components/videoPlayer.vue'
export default {
  data () {
    return {
      viewFullScreenUrl: 'https://dummyimage.com/914x550',
      actionType: 'viewImagesFullScreen',
      videoUrl: 'https://wlt.shanxi.gov.cn/masvod/public/2024/01/02/20240102_18cc98a8325_r31_600k.mp4',
      videoCover: 'https://dummyimage.com/914x550'
    }
  },
  components: {
    videoPlayer
  },
  mounted () {
    this.changeTiming()
  },
  methods: {
    showPicModal (modalId, action, url, actionType) {
      console.log('showModal----', modalId, action)
      if (actionType) {
        this.actionType = actionType
      }
      if (url) {
        this.viewFullScreenUrl = url
      }
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
    },
    changeTiming () {
      setInterval(() => {
        this.changeNumber()
      }, 3000)
    },
    changeNumber () {
      // this.numberData.forEach((item, index) => {
      //   item.number.number[0] += ++index
      //   item.number = { ...item.number }
      // })
    }
  }
}
</script>

<style lang="scss" scoped>
$box-width: 945px;
$box-height: 580px;

#centerLeft1 {
  padding: 16px;
  height: $box-height;
  width: $box-width;
  border-radius: 10px;
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
  .dv-dec-3 {
    position: relative;
    width: 100px;
    height: 20px;
    top: -3px;
  }

  .bottom-data {
    .item-box {
      & > div {
        padding-right: 5px;
      }
      font-size: 14px;
      float: right;
      position: relative;
      width: 50%;
      color: #d3d6dd;
      .dv-digital-flop {
        width: 120px;
        height: 30px;
      }
      // 金币
      .coin {
        position: relative;
        top: 6px;
        font-size: 20px;
        color: #ffc107;
      }
      .colorYellow {
        color: yellowgreen;
      }
      p {
        text-align: center;
      }
    }
  }
}

.report-pic-title {
    height: 50px;
    font-weight: bold;
    // text-indent: 20px;
    font-size: 20px;
    display: flex;
    align-items: center;
  }

  .report-content {
    padding: 20px 0 0 0;
    text-align: center;
  }
  .bd-report-big-pic {

  }
  .report-big-pic {
    width: 914px;
    height: 490px;
    overflow: hidden;
    position: absolute;
  }
  .report-big-pic img{
    width: 914px;
    height: fit-content;
    
  }
  .bd-pic-btn {
   margin: 0;
    border: 0;
    padding: 1.5rem 0;
    top: 25.8rem;
    position: relative;
    z-index: 1000;
  }
  #viewImagesFullScreen .modal-dialog {
    width: 100vw;
    max-width: none;
    height: 100%;
    margin: 0;
}
</style>
