<template>
   <div>
      <!-- 全屏查看图片和视频 modal start -->
      <!-- Full screen modal -->
      <div class="modal fade modal-fullscreen" id="view-Images-Full-Screen" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="viewImagesFullScreenLabel" aria-hidden="true">
         <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content viewImagesFullScreen">
               <div class="modal-header">
               <h1 class="modal-title fs-5 text-primary" id="viewImagesFullScreenLabel">{{modalFullScreenTitle}}</h1>
               <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" @click="showModal('view-Images-Full-Screen', 'hide')"></button>
               </div>
               <div class="modal-body align-middle text-center video-player-1">
                  <!-- 预警类型 -->
                  <!-- <span class="badge badge-danger active-status" v-if="actionEvent != 'viewLive'">{{alarmDetail.alarmTypeDetail && alarmDetail.alarmTypeDetail.name ? alarmDetail.alarmTypeDetail.name : alarmDetail.summary}}</span> -->
                  <!-- 监控设备名称 -->
                  <div class="media-name btn btn-sm btn-light rounded d-block" v-if="mediaName">{{mediaName}}</div>
                  <!-- 全屏查看图片 -->
                  <img v-if="actionEvent === 'viewImagesFullScreen'" :src="mediaUrl" class="img-fluid" alt="">

                  <!-- 西瓜播放器 start -->
                  <xgplayer :actionEvent="actionEvent" :videoUrl="mediaUrl" :videoCover="videoCover" v-if="actionEvent && mediaUrl && (actionEvent === 'playVideo' || actionEvent === 'viewLive') "></xgplayer>
                  <!-- 西瓜播放器 end -->

               </div>
               <div class="modal-footer">
               <button type="button" class="btn btn-primary" data-bs-dismiss="modal" @click="showModal('view-Images-Full-Screen', 'hide')">关闭</button>
               </div>
            </div>
         </div>
      </div>
      <!-- 全屏查看图片和视频 modal end -->
   </div>
</template>
<script>
import xgplayer from '@/components/xgplayer'
export default {
  props: {
    mediaName: {
      type: String,
      default: ''
    },
    mediaUrl: {
      type: String,
      default: ''
    },
    // 封面图片
    videoCover: {
      type: String,
      default: '' // 默认封面图片
    },
    actionEvent: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      algType: '',
      alarmDetail: {},
      selectedAlgTypeLabel: [],
      algLogTimer: null,
      videoUrl: '',
      viewLiveUrl: '',
      modalFullScreenTitle: '',
      alarmLogList: [],
      newAlarmLogList: [],
      alarmVideoLoading: false
    }
  },
  components: {
    xgplayer
  },
  mounted () {

  },
  watch: {
    actionEvent: {
      handler (newVal) {
        if (newVal) {
          console.log('actionEvent', newVal, this.mediaUrl)
          this.showModal('view-Images-Full-Screen', 'show', newVal)
        }
      },
      immediate: true,
      deep: false
    }
  },
  methods: {
    // 显示或隐藏弹框
    showModal (modalId, action, actionEvent, data) {
      console.log('index-showModal----', this.algType, modalId, action, actionEvent, data)
      // 预警类型选择全部类型
      if (actionEvent === 'switchAlgTypeLabel') {
        // 先清空数组
        this[this.algType].alg.labels.splice(0, this[this.algType].alg.labels.length)

         // 添加新元素
        this.$set(this[this.algType].alg.labels, 0, {
          name: '全部类型',
          label: 'all'
        })
      }
      if (modalId === 'staticBackdrop' && action === 'show') {
         // 已选择的预警类型名称
        this.selectedAlgTypeLabel = []
      }
      // 执行的操作事件
      if (this.actionEvent) {
        // 预览图片
        if (this.actionEvent === 'viewImagesFullScreen') {
          this.modalFullScreenTitle = '预览图片'
        }
        // 播放视频
        if (this.actionEvent === 'playVideo') {
          this.modalFullScreenTitle = '播放视频'
        }
        // 实时画面
        if (this.actionEvent === 'viewLive') {
          this.modalFullScreenTitle = '实时画面'
          // 请求接口获取流地址
          this.getStreamUrl(data)
        }
      }

      const modal = document.getElementById(modalId)
      if (modal) {
        // 移除 show 和 hide 类
        modal.classList.remove('show', 'hide')

        // 根据 action 参数设置类和显示属性
        if (action === 'show') {
          if (this.alarmVideoLoading === false && this.actionEvent === 'viewLive') {
            return
          }
          modal.classList.add('show')
          modal.style.display = 'block'
        } else if (action === 'hide') {
          this.alarmDetail = {}
          modal.classList.add('hide')
          modal.style.display = 'none'
          this.$emit('closeModal')
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../../assets/scss/aivideo_index.scss';
</style>
<style lang="less">
.main-content-container {
   background-image: url('/static/img/aivideo-home-bg.png');
}
.player {
   width: 88% !important;
   margin: 0 auto;
}
.video-player.player-video {
    width: 98% !important;
}
.bg-color-black {
    background-color: rgba(19, 25, 47, 0.6) !important;
}
.card-header,.card-footer {
   border: none !important;
}
.card-footer{
   padding: 0rem 1.875rem !important;
}
.dv-scroll-board .header {
    height: unset !important;
    padding-left: 0 !important;
}

.bd-pic-btn .navbar {
    padding: 0.5rem 0rem;
}
.text-center .img-fluid{
   width: 86.4%;
}
.card-item span.alarm-type-detail {
  height: unset !important;
    width: unset !important;
    position: relative !important;
    bottom: 96px;
    left: 30px;
    border-radius: 2rem;
    border: 0px solid #fff;
    box-shadow: 0px 0px 5px 1px rgba(67, 220, 128, 0.3);
    font-size: 14px;
}

.select-alg,.el-input__inner,.el-select-dropdown__item {
    font-size: 18px !important;
}
.select-alg .form-select {
    --bs-form-select-bg-img: '';
    padding: 0.375rem 0.75rem 0.375rem 0.75rem !important;
    margin-top: 0.5rem;
}
.el-select-dropdown.el-popper {
   z-index: 3000 !important;
}
#staticBackdrop * .modal-body {
    padding: 0.875rem 1.875rem 1.875rem ;
}

#view-Images-Full-Screen .modal-dialog {
    width: 60%;
    max-width: none;
    height: 100%;
    margin: 0 auto;
}
.el-message .el-message--error {
   z-index: 3000 !important;
} 

.el-select__tags .el-tag {
    font-size: 18px;
}
.video-box {
  width: 100%;
  max-width: 500px;
  max-height: 500px;
}
// 查看视频播放器
.video-player-1 .xgplayer {
   height: 500px !important;
   padding-top: 0 !important;
}
.video-player-1 .img-fluid {
   height: 100% !important;
}

.alarmDetail.modal-body {
   padding-top: 0 !important;
   padding-bottom: 0 !important;
}
// 查看图片或视频时的监控设备名称
.video-player-1 .media-name  {
  height: unset !important;
    width: unset !important;
    position: absolute !important;
    top: 80px;
    border-radius: 2rem;
    border: 0px solid #fff;
    box-shadow: 0px 0px 5px 1px rgba(67, 220, 128, 0.3);
    font-size: 20px !important;
    right: 215px;
    padding: 0.3rem;
    z-index: 9999;
}
// 查看图片或视频时的预警类型
.video-player-1 .active-status {
  height: unset !important;
    width: unset !important;
    position: relative !important;
    top: 130px;
    left: 95px;
    border-radius: 2rem;
    border: 0px solid #fff;
    box-shadow: 0px 0px 5px 1px rgba(67, 220, 128, 0.3);
    font-size: 20px !important;
    z-index: 9999;
}
</style>
