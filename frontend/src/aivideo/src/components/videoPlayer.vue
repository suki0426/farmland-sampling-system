<template>
   <div class="player">
     <video-player
       ref="videoPlayer"
       class="player-video"
       :playsinline="false"
       :options="playOptions"
       @ready="onPlayerReady"
       @play="onPlayerPlay($event)"
       @pause="onPlayerPause($event)"
       @ended="onPlayerEnd($event)"
       @waiting="onPlayerWaiting($event)"
       @playing="onPlayerPlaying($event)"
       @loadeddata="onPlayerLoadeddata($event)"
       @timeupdate="onPlayerTimeupdate($event)"
       @statechanged="playerStateChanged($event)"
     />
   </div>
 </template>
  
 <script>
 export default {
   props: {
     videoUrl: {  // 传入的地址
       type: String,
       default: ''
     },
     videoCover: {  // 传入的封面地址
       type: String,
       default: ''
     },
     lastTime: {  // 传入的上次播放位置
       type: Number,
       default: 0
     }
   },
   components: {},
   data () {
     return {
       playedTime: this.lastTime,
       currentTime: 0,
       maxTime: 0,
       playOptions: {
         height: '100px',
         width: '90%',
         playbackRates: [1.0], // 可选的播放速度
         autoplay: true, // 如果为true,浏览器准备好时开始回放
         muted: false, // 默认情况下静音播放
         loop: false, // 是否视频一结束就重新开始
         preload: 'auto', // 建议浏览器在<video>加载元素后是否应该开始下载视频数据，auto浏览器选择最佳行为,立即开始加载视频（如果浏览器支持）
         language: 'zh-CN',
         aspectRatio: '16:9', // 将播放器置于流畅模式，并在计算播放器的动态大小时使用该值，值应该代表一个比例 - 用冒号分隔的两个数字（例如"16:9"或"4:3"）
         fluid: true, // 当true时，Video.js player将拥有流体大小，换句话说，它将按比例缩放以适应其容器
         sources: [
           {
             type: 'video/mp4', // 类型
             src: this.videoUrl // require("./1.mp4"), // url地址，在使用本地的资源时，需要用require()引入，否则控制台会报错
           }
         ],
         poster: this.videoCover, // 设置封面地址
         notSupportedMessage: '此视频暂无法播放，请稍后再试', // 允许覆盖Video.js无法播放媒体源时显示的默认信息
         controlBar: {
           currentTimeDisplay: true,
           progressControl: true,  // 是否显示进度条
           playbackRateMenuButton: true, // 是否显示调整播放倍速按钮
           timeDivider: true, // 当前时间和持续时间的分隔符
           durationDisplay: true, // 显示持续时间
           remainingTimeDisplay: true, // 是否显示剩余时间功能
           fullscreenToggle: true // 是否显示全屏按钮
         }
       }
     }
   },
   computed: {
   },
   mounted () {
 
   },
   methods: {
     // 准备好了
     onPlayerReady () {
       console.log('准备好了')
     },
     // 视频播放
     onPlayerPlay (player) {
       console.log('播放了')
       console.log(player)
       let playTime = 0
       if (
           Number(Math.floor(this.playedTime)) ===
           Number(Math.floor(player.duration()))
         ) {
         this.playedTime = 0
         playTime = 0
       } else if (
           Number(Math.floor(player.currentTime())) !==
           Number(Math.floor(this.playedTime))
         ) {
         playTime = this.playedTime
         player.currentTime(playTime)
       }
     },
     // 视频暂停的
     onPlayerPause (player) {
       console.log('暂停中')
       console.log(player)
       this.playedTime = player.currentTime()
     },
     // 视频播放完
     onPlayerEnd (player) {
       console.log('播放结束了')
       console.log(player)
     },
     // DOM元素上的readyState更改导致播放停止
     onPlayerWaiting (player) {
       console.log('播放停止中')
       console.log(player)
     },
     // 视频已开始播放
     onPlayerPlaying (player) {
       console.log('开始播放了')
       console.log(player)
     },
     // 当播放器在当前播放位置下载数据时触发
     onPlayerLoadeddata (player) {
       console.log('开始下载数据')
       console.log(player)
     },
     // 当前播放位置发生变化时触发
     onPlayerTimeupdate (player) {
       console.log('播放位置变化了')
       console.log(player)
       let timeDisplay = player.currentTime()
       if (timeDisplay - this.currentTime > 1) {
         player.currentTime(this.currentTime > this.maxTime ? this.currentTime : this.maxTime)
       }
       this.currentTime = player.currentTime()
       this.maxTime = this.currentTime > this.maxTime ? this.currentTime : this.maxTime
     },
     // 播放状态改变
     playerStateChanged (playerCurrentState) {
       console.log('播放状态变化了')
       console.log(playerCurrentState)
     },
     // 手动暂停视频的播放
     pause () {
       // 视频播放器的方法调用，要使用this.$refs.videoPlayer.player这个对象去调用
       this.$refs.videoPlayer.player.pause()
     }
   }
 }
 </script>
  
 <style lang="scss" scoped>
 </style>