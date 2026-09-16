<template>
   <div class="video" :style="{ height: voidHeight }">
     <video ref="videoElement" muted controls></video>
     <div class="img_error" v-if="imgError">
       <!-- <img src="https://img.yzcdn.cn/vant/leaf.jpg" alt="" /> -->
       <!-- <p>视频播放错误，请联系管理员！</p> -->
     </div>
   </div>
 </template>
 
 <script>
 import flvjs from 'flv.js'
 export default {
   name: 'assemblyFlv',
   props: ['url', 'height', 'destroy'], // 视频流路径，播放器高度，是否销毁播放器
   data () {
     return {
       flvPlayer: '',
       imgError: false,
       voidHeight: ''
     }
   },
   mounted () {
     // 判断是否传入高度，如果没有，高度100%
     this.height ? (this.voidHeight = this.height) : (this.voidHeight = '100%')
    // 页面加载完成后，初始化
     this.$nextTick(() => {
       this.init(this.url)
     })
   },
   methods: {
     // 初始化
     init (source) {
       if (flvjs.isSupported()) {
         this.flvPlayer = flvjs.createPlayer(
           {
             type: 'flv',
             url: source
           },
           {
             enableWorker: false, // 不启用分离线程
             enableStashBuffer: false, // 关闭IO隐藏缓冲区
             reuseRedirectedURL: true, // 重用301/302重定向url，用于随后的请求，如查找、重新连接等。
             autoCleanupSourceBuffer: true // 自动清除缓存
           }
         )

        // const videoElement = this.$refs.videoElement
        // videoElement.volume = 1  // 设置默认音量
        // videoElement.muted = false  // 确保静音关闭
         this.flvPlayer.attachMediaElement(this.$refs.videoElement)
         this.flvPlayer.load()
         this.flvPlayer.play()

        // 加载完成
         this.flvPlayer.on(flvjs.Events.LOADING_COMPLETE, () => {
           this.imgError = false
         })

        // 加载失败
         this.flvPlayer.on(
           flvjs.Events.ERROR,
           () => {
             this.imgError = true
           },
           (error) => {
             console.log(error)
           }
         )
       } else {
         this.imgError = true
       }
     },
     // 销毁
     detachMediaElement () {
       this.flvPlayer.pause()
       this.flvPlayer.unload()
       this.flvPlayer.detachMediaElement()
       this.flvPlayer.destroy()
       this.flvPlayer = ''
     }
   },
   watch: {
     url () {
       this.imgError = false
      // 切换流之前，判断之前的流是否销毁
       this.flvPlayer == '' ? '' : this.detachMediaElement()
      // 初始化
       this.init(this.url)
     },
     destroy () {
       // 传入开关值
       if (this.destroy) {
         this.init(this.url)
       } else {
         this.flvPlayer == '' ? '' : this.detachMediaElement()
       }
     }
   },
   beforeDestroy () {
     this.detachMediaElement()
   }
 }
 </script>
 
 <style scoped>
 .video {
   position: relative;
   height: 100%;
 }
 video {
   width: 100%;
   height: 100%;
   object-fit: fill;
 }
 .img_error {
   position: absolute;
   top: 30%;
   left: 50%;
   margin-left: -120px;
   text-align: center;
 }
 .img_error > img {
   margin-bottom: 1em;
 }
 .img_error > p {
   color: #ff0000;
   font-weight: bold;
   font-size: 1.2em;
 }
 </style>