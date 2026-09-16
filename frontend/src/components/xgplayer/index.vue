<template>
  <div :id="playerId"></div>
</template>
<script>
import Player, { Events } from 'xgplayer'
import FlvPlugin from 'xgplayer-flv'
import HlsPlugin from 'xgplayer-hls'
import 'xgplayer/dist/index.min.css'
export default {
  name: 'xgplayer',
  data () {
    return {
      player: null,
      playerId: 'video-player-' + this.getRandomStrings()
    }
  },
  props: {
    // 视频地址
    videoUrl: {
      type: String
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
  mounted () {
  },
  destroyed () {

  },
  watch: {
    'videoUrl': {
      handler (newVal) {
        console.log('xgplayer-newVal', newVal, this.actionEvent)
        this.$nextTick(() => {
          this.initPlayer()
        })
      },
      immediate: true,
      deep: false
    }
  },
  methods: {
    initPlayer () {
      // 初始化播放器
      const commonOptions = {
        'lang': 'zh',  // 语言设置为中文
        'id': this.playerId,  // 视频播放器的元素ID
        'url': this.videoUrl, // 'http://192.168.1.130:80/live/test2/hls.fmp4.m3u8', // 'http://192.168.1.130:80/live/test/hls.m3u8', // this.videoUrl,  // 视频的URL地址
        'playsinline': true,  // 在内联播放模式下播放
        'poster': this.videoCover,  // 视频封面
        'autoplay': true,  // 自动播放视频
        'fluid': true,  // 视频流式布局
        height: '70%',  // 高度70%
        width: '70%'  // 宽度70%
      }
      console.log('commonOptions', commonOptions)
      // 根据 actionEvent 条件创建一个新的 Player 实例
      if (this.actionEvent === 'playVideo') {
        // 为播放视频创建一个新的 Player 实例
        // eslint-disable-next-line no-new
        new Player({
          ...commonOptions,
          plugins: []  // 对于播放常规视频，不使用任何插件
        })
      }

      if (this.actionEvent === 'viewLive') {
        console.log('viewLive---------', commonOptions)
        // 为查看直播内容创建一个新的 Player 实例 使用FlvPlugin
        // eslint-disable-next-line no-new
        const player = new Player({
          ...commonOptions,
          isLive: true,
          plugins: [FlvPlugin],  // 使用 FlvPlugin 来处理直播流
          flv: {
            retryCount: 3, // 重试 3 次，默认值
            retryDelay: 1000, // 每次重试间隔 1 秒，默认值
            loadTimeout: 10000, // 请求超时时间为 10 秒，默认值
            fetchOptions: {
              maxReaderInterval: 150000, // 默认值 5000 毫秒 它是fetch流式拉流两次接收数据的最大间隔
              targetLatency: 10, // 直播目标延迟，默认 5 秒
              maxLatency: 30, // 直播允许的最大延迟，默认 10 秒 需要确保 maxLatency 大于 targetLatency，并且应该大很多，默认值是大两倍
              disconnectTime: 0 // 直播断流时间，默认 0 秒，（独立使用时等于 maxLatency）
            }
          }
        })

        // 为查看直播内容创建一个新的 Player 实例 使用HlsPlugin
        // eslint-disable-next-line no-new
        // let player
        // console.log('viewLive---------player', document.createElement('video').canPlayType('application/vnd.apple.mpegurl'))
        // if (document.createElement('video').canPlayType('application/vnd.apple.mpegurl')) {
        //   // 原生支持 hls 播放
        //   player = new Player({
        //     el: document.querySelector('.player'),
        //     ...commonOptions
        //   })
        // } else if (HlsPlugin.isSupported()) { // 第一步
        //   player = new Player({
        //     ...commonOptions,
        //     isLive: true,
        //     plugins: [HlsPlugin],  // 使用 HlsPlugin  来处理直播流
        //     hls: {
        //       retryCount: 3, // 重试 3 次，默认值
        //       retryDelay: 1000, // 每次重试间隔 1 秒，默认值
        //       loadTimeout: 10000, // 请求超时时间为 10 秒，默认值
        //       fetchOptions: {
        //         maxReaderInterval: 5000, // 默认值 5000 毫秒 它是fetch流式拉流两次接收数据的最大间隔
        //         targetLatency: 10, // 直播目标延迟，默认 10 秒
        //         maxLatency: 20, // 直播允许的最大延迟，默认 20 秒 需要确保 maxLatency 大于 targetLatency，并且应该大很多，默认值是大两倍
        //         disconnectTime: 0 // 直播断流时间，默认 0 秒，（独立使用时等于 maxLatency）
        //       }
        //     }
        //   })
        // }

        // 开始拉流或者后续播放阶段时获取
        player.on(Events.LOAD_START, () => {
          console.log('开始拉流或者后续播放阶段时获取', player) // 调用方法
          //  console.log(player.plugins.flv.core.getStats())
        })

        player.on(Events.ERROR, (error) => {
          console.log('error', error)
        })
      }
    },
    // 生成随机字符串
    getRandomStrings () {
      return ('xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx').replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }
  }
}
</script>