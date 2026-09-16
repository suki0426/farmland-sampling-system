<template>
   <div>
      <div id="coverLayer" hidden="hidden">
         <button style="font-size:100px" id="coverLayerBtn">PLAY</button>
      </div>

      <div id="player-container">
         <div id="glplayer" class="glplayer"></div>
         
         <div id="controller" class="controller">
               <div id="progress-contaniner" class="progress-common progress-contaniner">
                  <div id="cachePts" class="progress-common cachePts"></div>
                  <div id="progressPts" class="progress-common progressPts"></div>
               </div>

               <div id="operate-container" class="operate-container">
                  <li id="playBar" class="playBtn">
                     <a href="javascript:void(0)" title="start">Start</a>
                  </li>

                  <span id="ptsLabel" class="ptsLabel">00:00:00/00:00:00</span>
                  <div class="voice-div">
                     <span>
                           <a id="muteBtn" 
                              class="muteBtn" href="javascript:void(0)">
                              <svg class="icon" style="width: 1em;height: 1em;vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="488">
                                 <path d="M153.6 665.6V358.4h204.8V256H153.6c-56.32 0-102.4 46.08-102.4 102.4v307.2c0 56.32 46.08 102.4 102.4 102.4h204.8v-102.4H153.6zM358.4 256v102.4l204.8-128v563.2L358.4 665.6v102.4l307.2 204.8V51.2zM768 261.12v107.52c61.44 20.48 102.4 76.8 102.4 143.36s-40.96 122.88-102.4 143.36v107.52c117.76-25.6 204.8-128 204.8-250.88s-87.04-225.28-204.8-250.88z" p-id="489">
                                 </path>
                              </svg>
                           </a>
                     </span>
                     <progress id="progressVoice" class="progressVoice" value="50" max="100"></progress>
                  </div>

                  <a id="fullScreenBtn" 
                  class="fullScreenBtn" href="javascript:void(0)">
                     <svg class="icon" style="width: 1em;height: 1em;vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="403">
                           <path d="M167.8 903.1c-11.5 0-22.9-4.4-31.7-13.1-17.5-17.5-17.5-45.8 0-63.3l221.1-221.1c17.5-17.5 45.9-17.5 63.3 0 17.5 17.5 17.5 45.8 0 63.3L199.4 890c-8.7 8.7-20.2 13.1-31.6 13.1zM638.5 432.4c-11.5 0-22.9-4.4-31.7-13.1-17.5-17.5-17.5-45.8 0-63.3l221.7-221.7c17.5-17.5 45.8-17.5 63.3 0s17.5 45.8 0 63.3L670.1 419.3c-8.7 8.7-20.2 13.1-31.6 13.1zM859.7 903.8c-11.5 0-23-4.4-31.7-13.1L606.7 668.8c-17.5-17.5-17.4-45.9 0.1-63.4s45.9-17.4 63.3 0.1l221.4 221.9c17.5 17.5 17.4 45.9-0.1 63.4-8.8 8.7-20.2 13-31.7 13zM389 432.1c-11.5 0-23-4.4-31.7-13.1L136.1 197.2c-17.5-17.5-17.4-45.9 0.1-63.4s45.9-17.4 63.3 0.1l221.2 221.7c17.5 17.5 17.4 45.9-0.1 63.4-8.7 8.7-20.2 13.1-31.6 13.1z" fill="#ffffff" p-id="404">
                           </path>
                           <path d="M145 370c-24.7 0-44.8-20.1-44.8-44.8V221.8C100.2 153.5 155.7 98 224 98h103.4c24.7 0 44.8 20.1 44.8 44.8s-20.1 44.8-44.8 44.8H224c-18.9 0-34.2 15.3-34.2 34.2v103.4c0 24.7-20.1 44.8-44.8 44.8zM883.3 370c-24.7 0-44.8-20.1-44.8-44.8V221.8c0-18.9-15.3-34.2-34.2-34.2H700.8c-24.7 0-44.8-20.1-44.8-44.8S676.1 98 700.8 98h103.5c68.2 0 123.8 55.5 123.8 123.8v103.5c0 24.7-20.1 44.7-44.8 44.7zM327.5 926.6H224c-68.2 0-123.8-55.5-123.8-123.8V699.4c0-24.7 20.1-44.8 44.8-44.8s44.8 20.1 44.8 44.8v103.5c0 18.9 15.3 34.2 34.2 34.2h103.5c24.7 0 44.8 20.1 44.8 44.8s-20.1 44.7-44.8 44.7zM804.3 926.6H700.8c-24.7 0-44.8-20.1-44.8-44.8s20.1-44.8 44.8-44.8h103.5c18.9 0 34.2-15.4 34.2-34.2V699.4c0-24.7 20.1-44.8 44.8-44.8 24.7 0 44.8 20.1 44.8 44.8v103.5c0 68.2-55.6 123.7-123.8 123.7z" fill="#ffffff" p-id="405">
                           </path>
                     </svg>
                  </a>
                  <span id="showLabel" class="showLabel"></span>
               </div>
         </div>
      </div>
   </div>
 </template>
 
 <script>
 import { makeH265webjs } from './player-v20221120.js'
 const token = 'base64:QXV0aG9yOmNoYW5neWFubG9uZ3xudW1iZXJ3b2xmLEdpdGh1YjpodHRwczovL2dpdGh1Yi5jb20vbnVtYmVyd29sZixFbWFpbDpwb3JzY2hlZ3QyM0Bmb3htYWlsLmNvbSxRUTo1MzEzNjU4NzIsSG9tZVBhZ2U6aHR0cDovL3h2aWRlby52aWRlbyxEaXNjb3JkOm51bWJlcndvbGYjODY5NCx3ZWNoYXI6bnVtYmVyd29sZjExLEJlaWppbmcsV29ya0luOkJhaWR1'
 export default {
   props: {
     videoBoxClass: { // 播放器外部盒子class
       type: String,
       default: ''
     },
     videoUrl: {
       type: String,
       default: ''
     },
     config: {
       type: Object,
       default () {
         return {
           player: 'glplayer',
         //   width: 960,
         //   height: 540,
           token: token,
           extInfo: {
             rawFps: 24,
             moovStartFlag: true,
             coreProbePart: 0.1,
             ignoreAudio: 0,
             probeSize: 8192,
             autoPlay: true
           }
         }
       }
     }
   },
   data () {
     return {
      //  url: 'http://192.168.1.130/live/test/hls.m3u8',
      //  config: {
      //    'player': 'glplayer',
      //    'width': 640,
      //    'height': 360,
      //    'token': 'base64:QXV0aG9yOmNoYW5neWFubG9uZ3xudW1iZXJ3b2xmLEdpdGh1YjpodHRwczovL2dpdGh1Yi5jb20vbnVtYmVyd29sZixFbWFpbDpwb3JzY2hlZ3QyM0Bmb3htYWlsLmNvbSxRUTo1MzEzNjU4NzIsSG9tZVBhZ2U6aHR0cDovL3h2aWRlby52aWRlbyxEaXNjb3JkOm51bWJlcndvbGYjODY5NCx3ZWNoYXI6bnVtYmVyd29sZjExLEJlaWppbmcsV29ya0luOkJhaWR1',
      //    'extInfo': {
      //      'probeSize': 8192,
      //      'ignoreAudio': 0,
      //      'coreProbePart': 0.1,
      //      'autoPlay': false,
      //      'cacheLength': 50,
      //      'rawFps': 24
      //    }
      //  },
       playerReady: false,
       playerObj: null,
       loggerObj: null,
       loggerCacheObj: null,
       loggerPtsObj: null,
       mediaInfo: null,
       player: null,
       resizeTimer: null, // resize 定时器
      // 优化
       loading: false,
       loadingTimer: null
     }
   },
   mounted () {
     this.initVideo()
   },
   beforeDestroy () {
     this.resizeTimer && clearTimeout(this.resizeTimer)
     this.loadingTimer && clearTimeout(this.loadingTimer)
     this.destoryVideo()
   },
   methods: {
     initVideo () {
       this.loading = true
       this.destoryVideo()
       this.player = makeH265webjs(this.videoUrl, {
         token,
         // width: this.$el.clientWidth || 300,
         // height: this.$el.clientHeight || 400,
         ...this.config,
         event: {
           onLoadFinish: () => {
             this.loading = false
           }
         }
       }, `.${this.videoBoxClass}`) // 修改了打包后的源码的

       window.addEventListener('resize', this.resizeFn)
     },
      // 释放资源
     destoryVideo () {
       window.removeEventListener('resize', this.resizeFn)
       this.player && this.player.release && this.player.release()
       this.player = null
       let playerDom = document.getElementById(this.config.player)
       if (playerDom) { // 清空
         playerDom.innerHTML = ''
       }
     },
     getWH () {
       return {
         width: this.config.width || this.$el.clientWidth || 300,
         height: this.config.height || this.$el.clientHeight || 400
       }
     },
     resizeFn () {
       if (this.resizeTimer) clearTimeout(this.resizeTimer)
       this.resizeTimer = setTimeout(() => { // 有的版本没有resize方法....
         let {width, height} = this.getWH()
         // console.log(this.player.resize,this.player.resize, width, height, 1111)
         this.player.resize && this.player.resize(width, height)
       }, 200)
     }
   }
 }
</script>

<style scoped lang="less">
.controller li {
  position: relative;
  float: left;
  border: 15px solid #404040;
  color: #404040;
  height: 0;
  width: 0;
  -webkit-border-radius: 100%;
  -moz-border-radius: 100%;
  -o-border-radius: 100%;
  border-radius: 100%;
  margin: 0 5px;
}

.controller li a {
  border-style: solid;
  text-indent: -9999px;
  position: absolute;
  top: -8px;
  left: -5px;
}

.playBtn a {
  border-color: transparent transparent transparent #fff;
  border-width: 8px 0 8px 12px;
  width: 0;
  height: 0;
}

.pauseBtn a {
  border-color: transparent white;
  border-width: 0 3px;
  height: 15px;
  width: 6px;
  left: -6px;
}

.stopBtn a {
  border: 7px solid #fff;
  height: 0;
  width: 0;
  left: -7px;
  top: -7px;
}

.forwardBtn a {
  border-left-width: 8px;
  left: 1px;
}

.forwardBtn a:first-child {
  margin-left: -7px;
}

.rewindBtn a {
  border-width: 8px 8px 8px 0;
  border-color: transparent #fff transparent transparent;
  width: 0;
  height: 0;
}

.rewindBtn a:first-child {
  margin-left: -7px;
}

.ejectBtn a.arrow {
  border-width: 0 8px 8px 8px;
  border-color: transparent transparent #fff transparent;
  top: -26px;
  left: -8px;
}

.ejectBtn a.dash {
  border-width: 0 0 4px;
  border-color: transparent transparent #fff;
  height: 0;
  width: 16px;
  left: -8px;
  top: 4px;
}
.player-container {
  position: relative;
  /*width: 960px;
  height: 540px;*/
  /*overflow: hidden;*/
}

.bottom-container {
  margin-top: 600px;
}

.controller {
  background-color: black;
  /*background-image: linear-gradient(
      to right, red 50px, yellow, blue, green);*/
  /*background-position: 100% 50%;*/
  width: 100%;
  min-height: 50px;
  position: absolute;
  /*float: bottom;*/
  z-index: 99999;
  left: 0;
  bottom: 0;
}

/*.controller:hover {
    background-color: white;
}*/

.operate-container {
  min-height: 20px;
  padding: 3px;
  /*position: relative;
    top: 50%;
    transform: translateY(-50%);*/
}

.muteBtn {
  color: white;
}

.progressVoice {
  float: left;
  width: 50%;
  margin-top: 0.2rem;
  /*border: 10px solid rgba(255,255,255,0);*/
  color: #d9d9d9;
  height: 10px;

  -moz-border-radius: 5px;
  -webkit-border-radius: 5px;
  border-radius: 5px;
  border: none;
}

.progressVoice::-moz-progress-bar {
  background-color: #d9d9d9;
}

.progressVoice::-webkit-progress-value {
  background-color: #d9d9d9;
}

.coverLayer {
  width: 100%;
  height: 100%;
  padding-top: 300px;
  z-index: 10000;
  position: absolute;
  top: 0px;
  left: 0px;
  background-color: rgba(0, 0, 0, 0.5);
}

.coverLayerBtn {
  width: 20%;
  height: 200px;
  border-radius: 50px;
}


.ptsLabel {
  font-size: 15px;
  color: white;
  background: rgb(0, 0, 0);
  /*border: 1px solid white;*/
  float: left;
  /*border-radius: 7px;*/
  padding: 1px;
  margin-top: 4px;
  margin-left: 5px;
}

.voice-div {
  color: white;
  /*background: rgb(0, 0, 0);
  border: 2px solid white;
  border-radius: 7px;
  padding-left: 20px;*/
  width: 18%;
  float: left;
  margin-top: 3px;
  margin-left: 10px;

  /*position: relative;*/
  /*margin-top: 50%;*/
  /*transform: translateY(-50%);*/
}

.voice-div > span {
  /*font-size: 15px;*/
  float: left;
  color: white;
  margin-right: 5px;
}

.voice-div > progress {
  margin-top: 8px;
}

.fullScreenBtn {
  /*font-size: 10px;*/
  float: right;
  margin-top: 3px;
  margin-right: 5px;
  color: white;
  /*background: #ffffff;*/
  /*border: 2px solid white;*/
  /*text-align: center;*/
  /*line-height: 20px;*/
  height: 24px;
  /*font-weight: bold;*/
  /*border-radius: 7px;*/
}

.showLabel {
  height: 18px;
  font-size: 8px;
  color: white;
  background: rgb(0, 0, 0);
  border-bottom: 1px solid #666666;
  /*border-radius: 7px;*/
  padding-top: 1px;
  padding-left: 5px;
  padding-right: 5px;
  float: right;
  margin-top: 5px;
  margin-right: 5px;
}

.progress-common {
  height: 10px; /** same as progress-contaniner **/
  -moz-border-radius: 5px;
  -webkit-border-radius: 5px;
  border-radius: 5px;
  border: none;
  margin-bottom: 2px;
}

.progress-contaniner {
  z-index: 1000;
  width: 100%;
  background-color: #666666;
}

.cachePts {
  position: absolute;
  z-index: 1001;
  width: 0px;
  /*margin-top: 0.125rem;*/
  background-color: #d9d9d9;
}

/*.cachePts::-moz-progress-bar {
    background-color: #e9e9e9;
}
.cachePts::-webkit-progress-value {
    background-color: #e9e9e9;
}*/

.progressPts {
  position: absolute;
  z-index: 1002;
  width: 0px;
  /*margin-top: 0.125rem;*/
  background-color: rgba(246, 79, 30, 255);
}

/*.progressPts::-moz-progress-bar {
    background-color: yellow;
}
.progressPts::-webkit-progress-value {
    background-color: yellow;
}*/



</style>
<style scoped lang="less">
// 自定义样式
.player-container {
  background: black;

  /deep/ .el-loading-spinner {
    margin-top: 0;
    transform: translateY(-50%);

    i {
      font-size: 10em;
      color: #ffffff;
      font-weight: bold;
    }
  }
}
div#glplayer {
    width: 100% !important;
}

canvas{
    width: 100% !important;
    margin: 0 !important;
}
</style>

<style>
#player-container {
	position: absolute;
	margin:auto;
    left: 0;
    right: 0;
	/*width: 960px;
	height: 540px;*/
	/*overflow: hidden;*/
}

.bottom-container {
	margin-top: 600px;
}

.controller {
    background-color: black;
    /*background-image: linear-gradient(
        to right, red 50px, yellow, blue, green);*/
    /*background-position: 100% 50%;*/
    width: 960px;
    min-height: 50px;
    position: absolute; 
    /*float: bottom;*/
    z-index: 99999;
    left: 0;
    bottom: 0;
}

/*.controller:hover {
	background-color: white;
}*/

.operate-container {
	min-height: 20px;
	padding: 3px;
	/*position: relative;
    top: 50%;
    transform: translateY(-50%);*/
}

.muteBtn {
	color: white;
}

.progressVoice {
    float: left;
    width: 50%;
    margin-top: 0.2rem;
    /*border: 10px solid rgba(255,255,255,0);*/
    color: #d9d9d9;
    height: 10px;

    -moz-border-radius: 5px;
    -webkit-border-radius: 5px;
    border-radius: 5px;
    border: none;
}
.progressVoice::-moz-progress-bar {
    background-color:#d9d9d9;
}

.progressVoice::-webkit-progress-value {
    background-color:#d9d9d9;
}

#coverLayer {
    width: 100%;
    height: 100%;
    padding-top: 300px;
    z-index: 10000;
    position: absolute;
    top: 0px;
    left: 0px;
    background-color: rgba(0, 0, 0, 0.5);
}
#coverLayerBtn {
    width: 20%;
    height: 200px;
    border-radius: 50px;
}


.ptsLabel {
	font-size: 15px;
    color: white;
    background: rgb(0, 0, 0);
    /*border: 1px solid white;*/
    float: left;
    /*border-radius: 7px;*/
    padding: 1px;
    margin-top: 4px;
    margin-left: 5px;
}

.voice-div {
    color: white;
    /*background: rgb(0, 0, 0);
    border: 2px solid white;
    border-radius: 7px;
    padding-left: 20px;*/
    width: 18%;
    float: left;
    margin-top: 3px;
    margin-left: 10px;

    /*position: relative;*/
    /*margin-top: 50%;*/
    /*transform: translateY(-50%);*/
}
.voice-div > span {
	/*font-size: 15px;*/
    float: left;
    color: white;
    margin-right: 5px;
}
.voice-div > progress {
    margin-top: 8px;
}

.fullScreenBtn {
	/*font-size: 10px;*/
    float: right;
    margin-top: 3px;
    margin-right: 5px;
    color: white;
    /*background: #ffffff;*/
    /*border: 2px solid white;*/
    /*text-align: center;*/
    /*line-height: 20px;*/
    height: 24px;
    /*font-weight: bold;*/
    /*border-radius: 7px;*/
}
.showLabel {
	height: 18px;
	font-size: 8px;
    color: white;
    background: rgb(0, 0, 0);
    border-bottom: 1px solid #666666;
    /*border-radius: 7px;*/
    padding-top: 1px;
    padding-left: 5px;
    padding-right: 5px;
    float: right;
    margin-top: 5px;
    margin-right: 5px;
}

.progress-common {
    height: 10px; /** same as progress-contaniner **/
    -moz-border-radius: 5px;
    -webkit-border-radius: 5px;
    border-radius: 5px;
    border: none;
    margin-bottom: 2px;
}
.progress-contaniner {
    z-index: 1000;
	width: 100%;
    background-color: #666666;
}

.cachePts {
	position: absolute;
	z-index: 1001;
    width: 0px;
    /*margin-top: 0.125rem;*/
    background-color: #d9d9d9;
}
.progressPts {
	position: absolute;
	z-index: 1002;
    width: 0px;
    /*margin-top: 0.125rem;*/
    background-color: rgba(246, 79, 30, 255);
}
.controller li { 
    position: relative; 
    float: left;
    border: 15px solid #404040;
    color: #404040; height: 0;
    width:0;
    -webkit-border-radius: 100%;
    -moz-border-radius: 100%;
    -o-border-radius: 100%;
    border-radius: 100%;
    margin: 0 5px; 
}
.controller li a { 
    border-style: solid; 
    text-indent: -9999px; 
    position: absolute; 
    top: -8px; 
    left: -5px;  
}

.playBtn a {
    border-color: transparent transparent transparent #fff;
    border-width: 8px 0 8px 12px;
    width: 0; 
    height: 0;
}
.pauseBtn a {
    border-color: transparent white;  
    border-width: 0 3px; 
    height: 15px; 
    width: 6px; 
    left: -6px;
}
.stopBtn a {
    border: 7px solid #fff; 
    height: 0; 
    width: 0; 
    left: -7px; 
    top: -7px;
}
.forwardBtn a {
    border-left-width: 8px; 
    left: 1px;
}
.forwardBtn a:first-child {
    margin-left: -7px; 
}

.rewindBtn a {
    border-width: 8px 8px 8px 0; 
    border-color: transparent #fff transparent transparent; 
    width: 0; 
    height: 0;
}
.rewindBtn a:first-child {
    margin-left: -7px;
}

.ejectBtn a.arrow {
    border-width: 0 8px 8px 8px; 
    border-color: transparent transparent #fff transparent; 
    top:-26px; 
    left:-8px;
}
.ejectBtn a.dash {
    border-width: 0 0 4px; 
    border-color: transparent transparent #fff; 
    height: 0; width:16px; 
    left: -8px; 
    top: 4px;
}
</style>