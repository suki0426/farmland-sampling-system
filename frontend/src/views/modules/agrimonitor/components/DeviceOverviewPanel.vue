<template>
  <div class="device-overview">
    <!-- ══════════ 统计卡 ══════════ -->
    <div class="device-overview__stats">
      <div v-for="s in stats" :key="s.label" class="device-overview__stat">
        <div class="device-overview__stat-value" :style="{ color: s.color }">{{ s.value }}</div>
        <div class="device-overview__stat-label">{{ s.label }}</div>
      </div>
    </div>

    <!-- ══════════ 设备总览 ══════════ -->
    <div class="device-overview__toolbar">
      <el-radio-group v-model="typeFilter" size="mini">
        <el-radio-button label="">全部类型</el-radio-button>
        <el-radio-button v-for="t in sensorTypes" :key="t.code" :label="t.code">{{ t.label }}</el-radio-button>
      </el-radio-group>
      <el-select v-model="statusFilter" size="mini" class="device-overview__select">
        <el-option label="全部状态" value="" />
        <el-option label="在线" value="online" />
        <el-option label="离线" value="offline" />
        <el-option label="故障" value="fault" />
        <el-option label="延迟" value="delay" />
      </el-select>
      <el-input v-model="keyword" size="mini" class="device-overview__search" placeholder="搜索设备编号/名称" clearable />
      <el-button size="mini" icon="el-icon-refresh" @click="reload">刷新</el-button>
      <span class="device-overview__count">共 {{ filtered.length }} 台</span>
    </div>

    <div class="device-overview__body">
      <!-- 设备列表 -->
      <div class="device-overview__list">
        <div
          v-for="d in filtered"
          :key="d.deviceId"
          class="device-card"
          :class="{ 'is-active': current && current.deviceId === d.deviceId }"
          @click="selectDevice(d)">
          <div class="device-card__head">
            <span class="device-card__code">
              <i :class="iconOf(d.type)"></i>{{ d.deviceCode }}
            </span>
            <el-tag size="mini" :type="statusTagType(d.status)">{{ statusLabel(d.status) }}</el-tag>
          </div>
          <div class="device-card__name">{{ d.deviceName }}</div>
          <div class="device-card__meta">
            <span>电量 {{ d.battery }}%</span>
            <span>信号 {{ d.signal }}%</span>
            <el-tag v-if="d.aiEnabled" size="mini" type="success" effect="plain">AI</el-tag>
          </div>
          <div class="device-card__time">{{ d.collectTime }}</div>
        </div>
        <el-empty v-if="!filtered.length" description="没有匹配的设备" :image-size="60" />
      </div>

      <!-- 设备详情 -->
      <div class="device-overview__detail">
        <template v-if="current">
          <div class="device-overview__detail-head">
            <div>
              <h4>{{ current.deviceName }}</h4>
              <p>
                {{ current.deviceCode }} · {{ current.typeLabel }} ·
                <span class="device-overview__coord">
                  {{ current.longitude }}, {{ current.latitude }}（{{ current.coordinateSystem }}）
                </span>
              </p>
            </div>
            <el-tag :type="statusTagType(current.status)">{{ statusLabel(current.status) }}</el-tag>
          </div>

          <!-- 摄像头：视频 + YOLO -->
          <template v-if="current.type === 'camera'">
            <div class="device-overview__live-head">
              <span><i class="el-icon-video-camera"></i> 实时视频 + AI 检测叠加</span>
              <div>
                <el-switch v-model="aiOn" size="mini" active-text="检测叠加" />
                <el-switch v-model="mockDetectLoop" size="mini" active-text="模拟检测刷新" class="device-overview__switch" />
              </div>
            </div>

            <div class="video-wrap">
              <video
                ref="video"
                class="video-wrap__video"
                muted
                autoplay
                playsinline
                @error="onVideoError"></video>

              <!-- YOLO 检测框：用**归一化坐标**定位，换分辨率也不用改代码 -->
              <template v-if="aiOn">
                <div
                  v-for="(det, index) in detections"
                  :key="index"
                  class="detect-box"
                  :style="detectStyle(det)">
                  <span class="detect-box__label" :style="{ background: det.color }">
                    {{ det.labelName }} {{ (det.confidence * 100).toFixed(0) }}%
                  </span>
                </div>
              </template>

              <div v-if="videoError" class="video-wrap__error">
                <i class="el-icon-warning-outline"></i>
                <div>
                  <strong>视频流不可用</strong>
                  <p>{{ videoError }}</p>
                </div>
              </div>
            </div>
            <div class="device-overview__video-url">
              视频地址（演示占位）：<code>{{ current.videoUrl || '未配置' }}</code>
            </div>

            <!-- 检测结果列表 -->
            <div class="device-overview__detect-list">
              <div class="device-overview__detect-title">
                检测结果
                <span class="device-overview__detect-time">帧时间 {{ detectionFrameTime }}</span>
              </div>
              <el-table :data="detections" size="mini" border height="150" empty-text="当前无检测目标">
                <el-table-column label="类别" prop="labelName" width="96" />
                <el-table-column label="置信度" width="90">
                  <template slot-scope="scope">{{ (scope.row.confidence * 100).toFixed(1) }}%</template>
                </el-table-column>
                <el-table-column label="归一化 bbox (x, y, w, h)" min-width="180">
                  <template slot-scope="scope">{{ scope.row.bbox.join(', ') }}</template>
                </el-table-column>
              </el-table>
            </div>
          </template>

          <!-- 非摄像头：读数 + 趋势 -->
          <template v-else>
            <div class="device-overview__readings">
              <div v-for="(val, key) in current.metrics" :key="key" class="reading">
                <div class="reading__label">{{ metricLabel(key) }}</div>
                <div class="reading__value">{{ val }}<em>{{ metricUnit(key) }}</em></div>
              </div>
            </div>
            <MiniTrendChart
              :title="`${current.deviceCode} · 主要指标趋势`"
              :unit="trendUnit"
              :rows="deviceTrend"
              :accent="'#1890ff'"
              :height="220" />
          </template>

          <!-- ══════════ 接入说明（需求：考虑怎么接入） ══════════ -->
          <div class="device-overview__integrate">
            <div class="device-overview__integrate-title">
              <i class="el-icon-link"></i> YOLO / 视频流接入说明
            </div>
            <p>
              前端**不实现任何检测算法**，只负责「播流 + 叠加框」。要接入你们已有的成果，只需满足两点：
            </p>
            <ol>
              <li>
                <b>视频流地址</b>：在设备数据里给 <code>videoUrl</code>（HLS <code>.m3u8</code> 或 FLV <code>.flv</code>）。
                前端已内置 <code>hls.js</code> / <code>flv.js</code>，会自动选择播放方式。
                <span class="device-overview__tip">当前演示用的是公开测试流，所以可能加载失败 —— 换成你们的内网流即可。</span>
              </li>
              <li>
                <b>检测结果</b>：一帧一组框，坐标用<b>归一化 0~1</b>，前端按百分比定位，换分辨率不用改代码。
                <pre class="device-overview__code">{
  "deviceCode": "CAM-001",
  "frameTime": "2026-09-17 10:30:00",
  "detections": [
    { "label": "pest", "labelName": "蚜虫", "confidence": 0.93,
      "bbox": [0.12, 0.30, 0.18, 0.22] }   // [x, y, w, h] 归一化
  ]
}</pre>
                推送方式二选一，前端两条都支持：<br />
                · <b>WebSocket</b>（推荐，低延迟）：<code>ws://&lt;host&gt;/ws/detect/&lt;deviceCode&gt;</code><br />
                · <b>HTTP 轮询</b>（兜底）：<code>GET /api/detect/latest?deviceCode=xxx</code>
              </li>
            </ol>
            <p class="device-overview__todo">
              要接真实数据时，只需替换本组件的 <code>subscribeDetections()</code> 一处实现（约 20 行），
              视频与叠加层不用动。
            </p>
          </div>
        </template>

        <el-empty v-else description="从左侧选择一台设备查看详情" :image-size="70" />
      </div>
    </div>
  </div>
</template>

<script>
/**
 * 传感器设备总览 + 实时监控 + YOLO 叠加（需求 2-(3)）
 *
 * 需求原文：「有监控，传感器设备总览，实时监控+yolo，这方面已经做差不多了，只需要考虑怎么接入就可以」
 * 因此本组件把重点放在**接入契约**上：
 *   1) 视频流：设备数据里给 `videoUrl`（HLS/FLV），前端自动选 hls.js 或 flv.js 播放；
 *   2) 检测结果：一帧一组归一化 bbox，通过 WebSocket 或 HTTP 轮询推送；
 *   3) 前端只画框、上色、显示置信度，**不做任何算法**。
 * 真实接入时只改 `subscribeDetections()` 一处。
 *
 * ⚠️ 数据来自 @/mock/agrimonitor，纯前端演示，不连数据库、不写任何数据。
 */
import MiniTrendChart from './MiniTrendChart'
import {
  SENSOR_TYPES, DEVICE_STATUS_LABELS, mockDevices, mockDeviceSeries, mockDetections
} from '@/mock/agrimonitor'

const METRIC_LABELS = {
  soilMoisture: '土壤湿度', soilTemperature: '土壤温度', soilDepth: '土壤深度',
  airTemperature: '空气温度', airHumidity: '空气湿度', rain: '降雨量', cloud: '云量', co2: '二氧化碳'
}
const METRIC_UNITS = {
  soilMoisture: '%', soilTemperature: '°C', soilDepth: 'cm',
  airTemperature: '°C', airHumidity: '%', rain: 'mm', cloud: '%', co2: 'ppm'
}

export default {
  name: 'DeviceOverviewPanel',
  components: { MiniTrendChart },
  props: {
    regionKey: { type: String, default: '' }
  },
  data () {
    return {
      sensorTypes: SENSOR_TYPES,
      devices: [],
      current: null,
      typeFilter: '',
      statusFilter: '',
      keyword: '',
      aiOn: true,
      mockDetectLoop: true,
      detections: [],
      detectionFrameTime: '--',
      deviceTrend: [],
      trendMetric: 'soilMoisture',
      videoError: '',
      hlsInstance: null,
      detectTimer: null
    }
  },
  computed: {
    filtered () {
      const kw = this.keyword.trim().toLowerCase()
      return this.devices.filter(d =>
        (!this.typeFilter || d.type === this.typeFilter) &&
        (!this.statusFilter || d.status === this.statusFilter) &&
        (!kw || (d.deviceCode + d.deviceName).toLowerCase().indexOf(kw) !== -1)
      )
    },
    stats () {
      const list = this.devices
      return [
        { label: '设备总数', value: list.length, color: '#1890ff' },
        { label: '在线', value: list.filter(d => d.status === 'online').length, color: '#52c41a' },
        { label: '离线', value: list.filter(d => d.status === 'offline').length, color: '#8c8c8c' },
        { label: '故障', value: list.filter(d => d.status === 'fault').length, color: '#f5222d' },
        { label: '带 AI 检测', value: list.filter(d => d.aiEnabled).length, color: '#722ed1' }
      ]
    },
    trendUnit () {
      return METRIC_UNITS[this.trendMetric] || ''
    }
  },
  watch: {
    regionKey () {
      this.reload()
    },
    mockDetectLoop (v) {
      if (v) {
        this.startDetectLoop()
      } else {
        this.stopDetectLoop()
      }
    },
    current () {
      this.setupVideo()
      this.detections = []
      this.detectionFrameTime = '--'
      this.loadTrend()
      this.subscribeDetections()
    }
  },
  mounted () {
    this.reload()
  },
  beforeDestroy () {
    this.teardownVideo()
    this.stopDetectLoop()
  },
  methods: {
    reload () {
      this.devices = mockDevices(this.regionKey)
      const firstCamera = this.devices.filter(d => d.type === 'camera')[0]
      this.selectDevice(firstCamera || this.devices[0])
    },

    selectDevice (device) {
      if (!device) {
        return
      }
      this.current = device
      // 选一台主要指标（非摄像头按实际存在的指标）
      const keys = Object.keys(device.metrics || {})
      this.trendMetric = keys.indexOf('soilMoisture') !== -1 ? 'soilMoisture' : (keys[0] || 'soilMoisture')
    },

    loadTrend () {
      if (!this.current) {
        return
      }
      this.deviceTrend = mockDeviceSeries(this.current.deviceCode, this.trendMetric, 36)
    },

    /* ─────────────── 视频播放（HLS / FLV 自动选择） ─────────────── */
    setupVideo () {
      this.teardownVideo()
      this.videoError = ''
      const url = this.current && this.current.videoUrl
      const video = this.$refs.video
      if (!url) {
        this.videoError = '该设备未配置 videoUrl，无法播放'
        return
      }
      if (!video) {
        return
      }

      if (/\.m3u8($|\?)/i.test(url)) {
        // Safari / iOS 原生支持 HLS
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = url
          video.play().catch(() => {})
          return
        }
        // 其他浏览器用 hls.js
        import('hls.js').then(mod => {
          const Hls = mod.default || mod
          if (!Hls || !Hls.isSupported()) {
            this.videoError = '当前浏览器不支持 HLS 播放'
            return
          }
          const hls = new Hls({ enableWorker: true, lowLatencyMode: true })
          this.hlsInstance = hls
          hls.loadSource(url)
          hls.attachMedia(video)
          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data && data.fatal) {
              this.videoError = `HLS 播放失败：${data.type} / ${data.details}`
            }
          })
          video.play().catch(() => {})
        }).catch(e => {
          this.videoError = `hls.js 加载失败：${(e && e.message) || e}`
        })
      } else if (/\.flv($|\?)/i.test(url)) {
        import('flv.js').then(mod => {
          const flvjs = mod.default || mod
          if (!flvjs || !flvjs.isSupported()) {
            this.videoError = '当前浏览器不支持 FLV 播放'
            return
          }
          const player = flvjs.createPlayer({ type: 'flv', url, isLive: true })
          player.attachMediaElement(video)
          player.load()
          player.play()
          this.flvPlayer = player
        }).catch(e => {
          this.videoError = `flv.js 加载失败：${(e && e.message) || e}`
        })
      } else {
        video.src = url
        video.play().catch(() => {})
      }
    },

    teardownVideo () {
      if (this.hlsInstance) {
        this.hlsInstance.destroy()
        this.hlsInstance = null
      }
      if (this.flvPlayer) {
        try {
          this.flvPlayer.pause()
          this.flvPlayer.unload()
          this.flvPlayer.detachMediaElement()
          this.flvPlayer.destroy()
        } catch (e) { /* 忽略销毁异常 */ }
        this.flvPlayer = null
      }
      const video = this.$refs.video
      if (video) {
        video.removeAttribute('src')
        try { video.load() } catch (e) { /* 忽略 */ }
      }
    },

    onVideoError () {
      this.videoError = '视频元素报错：流地址不可达或格式不被支持（演示用的是公开测试流，换成内网流即可）'
    },

    /* ─────────────── YOLO 检测结果订阅（真实接入点） ─────────────── */
    /**
     * ⚠️ 真实接入时**只改这一个方法**。
     *
     * 方式 A（推荐，WebSocket）：
     *   const ws = new WebSocket(`ws://${host}/ws/detect/${this.current.deviceCode}`)
     *   ws.onmessage = e => { const msg = JSON.parse(e.data); this.applyDetections(msg) }
     *   this.detectSocket = ws
     *   // 销毁时 ws.close()
     *
     * 方式 B（HTTP 轮询兜底）：
     *   this.detectTimer = setInterval(async () => {
     *     const res = await fetch(`/api/detect/latest?deviceCode=${this.current.deviceCode}`)
     *     this.applyDetections(await res.json())
     *   }, 1000)
     *
     * 现在没有真实数据源，因此用 mock 定时刷新，把交互和渲染链路先跑通。
     */
    subscribeDetections () {
      this.stopDetectLoop()
      if (this.current && this.current.aiEnabled && this.mockDetectLoop) {
        this.startDetectLoop(true)
      }
    },

    startDetectLoop (immediate) {
      this.stopDetectLoop()
      const tick = () => {
        if (!this.current || !this.current.aiEnabled) {
          return
        }
        this.applyDetections(mockDetections(this.current.deviceCode))
      }
      if (immediate) {
        tick()
      }
      this.detectTimer = window.setInterval(tick, 2500)
    },

    stopDetectLoop () {
      if (this.detectTimer) {
        window.clearInterval(this.detectTimer)
        this.detectTimer = null
      }
    },

    /** 统一的检测结果入口：WebSocket / 轮询 / mock 都走这里 */
    applyDetections (payload) {
      if (!payload) {
        return
      }
      this.detections = Array.isArray(payload.detections) ? payload.detections : []
      this.detectionFrameTime = payload.frameTime || '--'
    },

    /** 归一化 bbox → 百分比定位 */
    detectStyle (det) {
      const [x, y, w, h] = det.bbox
      return {
        left: (x * 100).toFixed(2) + '%',
        top: (y * 100).toFixed(2) + '%',
        width: (w * 100).toFixed(2) + '%',
        height: (h * 100).toFixed(2) + '%',
        borderColor: det.color
      }
    },

    iconOf (type) {
      const item = SENSOR_TYPES.filter(t => t.code === type)[0]
      return item ? item.icon : 'el-icon-cpu'
    },

    statusLabel (status) {
      return DEVICE_STATUS_LABELS[status] || status
    },

    statusTagType (status) {
      return { online: 'success', offline: 'info', fault: 'danger', delay: 'warning' }[status] || 'info'
    },

    metricLabel (key) {
      return METRIC_LABELS[key] || key
    },

    metricUnit (key) {
      return METRIC_UNITS[key] || ''
    }
  }
}
</script>

<style lang="scss" scoped>
.device-overview {
  &__stats {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
    margin-bottom: 10px;
  }

  &__stat {
    padding: 8px;
    border: 1px solid #e4e9f0;
    border-radius: 4px;
    background: #fafcff;
    text-align: center;
  }

  &__stat-value {
    font-size: 20px;
    font-weight: 700;
    font-family: Consolas, Monaco, monospace;
  }

  &__stat-label {
    color: #78909c;
    font-size: 12px;
  }

  &__toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }

  &__select {
    width: 130px;
  }

  &__search {
    width: 190px;
  }

  &__count {
    margin-left: auto;
    color: #90a4ae;
    font-size: 12px;
  }

  &__body {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  &__list {
    width: 300px;
    flex: none;
    max-height: 620px;
    overflow: auto;
  }

  &__detail {
    flex: 1;
    min-width: 0;
  }

  &__detail-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding-bottom: 8px;
    margin-bottom: 10px;
    border-bottom: 1px solid #eceff1;

    h4 {
      margin: 0 0 4px;
      font-size: 15px;
    }

    p {
      margin: 0;
      color: #78909c;
      font-size: 12px;
    }
  }

  &__coord {
    font-family: Consolas, Monaco, monospace;
  }

  &__live-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
    font-size: 13px;
    color: #455a64;

    i {
      color: #f5222d;
      margin-right: 4px;
    }
  }

  &__switch {
    margin-left: 12px;
  }

  &__video-url {
    margin-top: 6px;
    color: #90a4ae;
    font-size: 12px;
    word-break: break-all;

    code {
      background: #f5f7fa;
      padding: 1px 4px;
      border-radius: 2px;
    }
  }

  &__detect-list {
    margin-top: 12px;
  }

  &__detect-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
    font-size: 13px;
    color: #455a64;
  }

  &__detect-time {
    color: #90a4ae;
    font-size: 12px;
  }

  &__readings {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 10px;
  }

  &__integrate {
    margin-top: 14px;
    padding: 12px 14px;
    border: 1px dashed #b0bec5;
    border-radius: 4px;
    background: #fafcff;
    font-size: 12px;
    color: #546e7a;
    line-height: 20px;

    p {
      margin: 6px 0;
    }

    ol {
      margin: 6px 0;
      padding-left: 20px;
    }

    li {
      margin-bottom: 6px;
    }

    code {
      background: #eef3f8;
      padding: 0 4px;
      border-radius: 2px;
      color: #1565c0;
    }
  }

  &__integrate-title {
    font-size: 13px;
    font-weight: 700;
    color: #1565c0;
    margin-bottom: 4px;
  }

  &__tip {
    color: #ef6c00;
  }

  &__code {
    margin: 6px 0;
    padding: 8px 10px;
    background: #263238;
    color: #b2ff59;
    border-radius: 4px;
    font-size: 11px;
    line-height: 16px;
    overflow: auto;
  }

  &__todo {
    color: #1565c0;
  }
}

.device-card {
  border: 1px solid #e4e9f0;
  border-radius: 4px;
  padding: 8px 10px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.18s;
  background: #fff;

  &:hover {
    border-color: #90caf9;
    box-shadow: 0 2px 8px rgba(25, 118, 210, 0.12);
  }

  &.is-active {
    border-color: #1976d2;
    background: #f5faff;
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__code {
    font-weight: 700;
    color: #0d47a1;
    font-size: 13px;

    i {
      margin-right: 4px;
      color: #1976d2;
    }
  }

  &__name {
    margin: 3px 0;
    font-size: 12px;
    color: #546e7a;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 11px;
    color: #90a4ae;
  }

  &__time {
    margin-top: 2px;
    font-size: 11px;
    color: #b0bec5;
  }
}

.video-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  border-radius: 4px;
  overflow: hidden;

  &__video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }

  &__error {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 16px;
    background: rgba(0, 0, 0, 0.82);
    color: #ffccbc;
    font-size: 12px;
    line-height: 18px;
    text-align: left;

    i {
      font-size: 22px;
      color: #ff8a65;
    }

    p {
      margin: 4px 0 0;
      word-break: break-all;
    }
  }
}

.detect-box {
  position: absolute;
  border: 2px solid #f5222d;
  border-radius: 2px;
  box-sizing: border-box;
  pointer-events: none;

  &__label {
    position: absolute;
    left: -2px;
    top: -18px;
    padding: 0 5px;
    height: 18px;
    line-height: 18px;
    border-radius: 2px 2px 0 0;
    color: #fff;
    font-size: 11px;
    white-space: nowrap;
  }
}

.reading {
  padding: 8px 10px;
  border: 1px solid #e4e9f0;
  border-radius: 4px;
  background: #fafcff;
  text-align: center;

  &__label {
    color: #78909c;
    font-size: 12px;
  }

  &__value {
    font-size: 19px;
    font-weight: 700;
    color: #1565c0;
    font-family: Consolas, Monaco, monospace;

    em {
      margin-left: 2px;
      font-style: normal;
      font-size: 11px;
      color: #90a4ae;
    }
  }
}
</style>
