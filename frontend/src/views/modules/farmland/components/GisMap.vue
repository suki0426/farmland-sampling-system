<template>
  <div class="gis-map">
    <div ref="container" class="gis-map__canvas"></div>

    <!-- 地图未就绪 / 降级提示 -->
    <div v-if="providerError" class="gis-map__notice">
      <i class="el-icon-warning-outline"></i>
      <span>{{ providerMessage }}</span>
      <el-button type="text" size="mini" @click="retryAmap">重试高德地图</el-button>
    </div>

    <div class="gis-map__provider">
      <el-tag size="mini" :type="provider === 'amap' ? 'success' : 'info'" effect="dark">
        {{ providerLabel }}
      </el-tag>
    </div>

    <div v-if="loading" class="gis-map__mask" v-loading="true" element-loading-text="地图加载中..."></div>

    <!-- 手动选点提示 -->
    <div v-if="pickMode" class="gis-map__hint">
      <i class="el-icon-location-outline"></i>
      手动选点模式：点击农田内部区域添加采样点（落在边界外会被拒绝）
    </div>

    <!-- 图例 -->
    <div class="gis-map__legend">
      <div class="gis-map__legend-item"><span class="dot dot-pending"></span>未采样点</div>
      <div class="gis-map__legend-item"><span class="dot dot-sampled"></span>已采样点</div>
      <div class="gis-map__legend-item"><span class="dot dot-device"></span>采样终端</div>
      <div class="gis-map__legend-item"><span class="line line-route"></span>算法路线</div>
      <div class="gis-map__legend-item"><span class="line line-guide"></span>最近未采样点指引</div>
    </div>
  </div>
</template>

<script>
/**
 * 地图组件（1号 前端GIS 岗位）
 *
 * 只依赖 @/utils/gis/mapAdapter 暴露的统一接口，不直接依赖高德或离线地图：
 *  - 优先加载高德地图（需 VUE_APP_AMAP_KEY）
 *  - 高德不可用时自动降级为内置离线矢量地图，并把原因通过 provider-error 抛给页面显示
 */
import { createMapAdapter, MAP_PROVIDER, LAYER } from '@/utils/gis/mapAdapter'

export default {
  name: 'GisMap',
  props: {
    // 场景数据（全部坐标已统一为 GCJ02）
    scene: {
      type: Object,
      default: () => ({})
    },
    // 场景版本号：数值变化时整体重绘，避免对大数组做深度监听
    sceneVersion: {
      type: Number,
      default: 0
    },
    // 图层可见性
    layers: {
      type: Object,
      default: () => ({})
    },
    pickMode: {
      type: Boolean,
      default: false
    },
    // 强制使用哪个地图实现：'' 表示自动（优先高德）
    forceProvider: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      adapter: null,
      provider: '',
      providerLabel: '',
      providerMessage: '',
      providerError: false,
      loading: true,
      LAYER
    }
  },
  watch: {
    sceneVersion () {
      this.applyScene()
      this.applyLayers()
    },
    layers: {
      deep: true,
      handler () {
        this.applyLayers()
      }
    },
    pickMode (value) {
      if (this.adapter) {
        this.adapter.setPickMode(value)
      }
    },
    forceProvider () {
      this.initMap()
    }
  },
  mounted () {
    this.initMap()
  },
  beforeDestroy () {
    if (this.adapter) {
      this.adapter.destroy()
      this.adapter = null
    }
  },
  methods: {
    async initMap () {
      this.loading = true
      this.providerError = false
      this.providerMessage = ''
      if (this.adapter) {
        this.adapter.destroy()
        this.adapter = null
      }

      const wantAmap = this.forceProvider !== MAP_PROVIDER.VECTOR
      if (wantAmap) {
        try {
          await this.setupAdapter(MAP_PROVIDER.AMAP)
          this.loading = false
          return
        } catch (error) {
          const message = (error && error.message) || '高德地图初始化失败'
          this.providerMessage = message
          this.providerError = true
          // 降级不是静默行为：同时通知页面在顶部横幅里说明
          this.$emit('provider-error', { code: (error && error.code) || 'AMAP_INIT_FAILED', message })
        }
      }
      try {
        await this.setupAdapter(MAP_PROVIDER.VECTOR)
      } catch (error) {
        this.providerMessage = (error && error.message) || '地图初始化失败'
        this.providerError = true
        this.$emit('provider-error', { code: 'MAP_INIT_FAILED', message: this.providerMessage })
      }
      this.loading = false
    },

    async setupAdapter (provider) {
      const adapter = createMapAdapter(provider)
      await adapter.init(this.$refs.container, {
        center: this.scene && this.scene.center ? this.scene.center : undefined
      })
      this.adapter = adapter
      this.provider = adapter.provider
      this.providerLabel = adapter.providerLabel

      adapter.on('mapClick', payload => this.$emit('map-click', payload))
      adapter.on('pointClick', payload => this.$emit('point-click', payload))
      adapter.on('deviceClick', payload => this.$emit('device-click', payload))
      adapter.on('boundaryClick', payload => this.$emit('boundary-click', payload))

      this.applyScene()
      this.applyLayers()
      if (adapter.setPickMode) {
        adapter.setPickMode(this.pickMode)
      }
      this.$emit('ready', { provider: adapter.provider })
    },

    retryAmap () {
      this.providerError = false
      this.providerMessage = ''
      this.initMap()
    },

    /** 把场景数据整体推给地图适配器 */
    applyScene () {
      const adapter = this.adapter
      if (!adapter) {
        return
      }
      const scene = this.scene || {}
      adapter.setBoundary(scene.boundaryGeoJson || null, { selectedFarmlandId: scene.farmlandId })
      adapter.setSamplingPoints(scene.points || [])
      adapter.setDevices(scene.devices || [])
      adapter.setRoute(scene.route || null)

      // 轨迹：先清掉已不在场景里的设备轨迹
      const tracks = scene.trajectories || {}
      Object.keys(tracks).forEach((deviceId, index) => {
        adapter.setTrajectory(deviceId, tracks[deviceId], { colorIndex: index })
      })

      adapter.setGuidance(scene.guidance || null)

      if (scene.fitView) {
        this.$nextTick(() => {
          adapter.fitBounds()
        })
      }
    },

    applyLayers () {
      const adapter = this.adapter
      if (!adapter) {
        return
      }
      Object.keys(LAYER).forEach(key => {
        const layerKey = LAYER[key]
        adapter.setLayerVisible(layerKey, this.layers[layerKey] !== false)
      })
    },

    /** 供父组件调用 */
    fitBounds () {
      if (this.adapter) {
        this.adapter.fitBounds()
      }
    },

    /** 只更新设备位置（演示推进时每秒调用，避免整场景重建） */
    updateDevices (devices) {
      if (this.adapter) {
        this.adapter.setDevices(devices || [])
      }
    },

    /** 只更新某台设备的轨迹 */
    updateTrajectory (deviceId, points) {
      if (this.adapter) {
        this.adapter.setTrajectory(deviceId, points || [], { colorIndex: this.trajectoryColorIndex(deviceId) })
      }
    },

    /** 只更新导航指引（最近未采样点） */
    setGuidance (guidance) {
      if (this.adapter) {
        this.adapter.setGuidance(guidance || null)
      }
    },

    trajectoryColorIndex (deviceId) {
      const keys = Object.keys(this.scene.trajectories || {})
      const index = keys.indexOf(deviceId)
      return index === -1 ? 0 : index
    },

    setCenterZoom (longitude, latitude, zoom) {
      if (this.adapter) {
        this.adapter.setCenterZoom(longitude, latitude, zoom)
      }
    },

    /** 定位：由适配器决定用高德定位还是浏览器定位 */
    locateUser () {
      if (!this.adapter) {
        return Promise.reject(new Error('地图尚未初始化'))
      }
      return this.adapter.locateUser()
    },

    /** 在地图上标出「我的位置」 */
    setUserLocation (lngLat) {
      if (this.adapter) {
        this.adapter.setUserLocation(lngLat || null)
      }
    },

    clearTrajectory (deviceId) {
      if (this.adapter && this.adapter.clearTrajectory) {
        this.adapter.clearTrajectory(deviceId)
      }
    },

    getProvider () {
      return this.provider
    }
  }
}
</script>

<style>
/* 以下样式是高德 Marker 注入的 HTML 使用的，必须是全局样式（不能 scoped） */
.gis-marker {
  position: relative;
  width: 32px;
  height: 32px;
  color: var(--gis-color, #1976d2);
}
.gis-marker-dot {
  position: absolute;
  left: 4px;
  top: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--gis-color, #1976d2);
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
  color: #fff;
  font-size: 12px;
  line-height: 20px;
  text-align: center;
  font-weight: 700;
}
.gis-marker-device .gis-marker-core {
  position: absolute;
  left: 10px;
  top: 10px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--gis-color, #1976d2);
  border: 2px solid #fff;
}
.gis-marker-device .gis-marker-ring {
  position: absolute;
  left: 2px;
  top: 2px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(25, 118, 210, 0.18);
}
.gis-marker-device .gis-marker-arrow {
  position: absolute;
  left: 12px;
  top: -3px;
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-bottom: 8px solid var(--gis-color, #1976d2);
  transform-origin: 4px 19px;
}
.gis-marker-label {
  position: absolute;
  left: 50%;
  top: 30px;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 12px;
  color: #263238;
  background: rgba(255, 255, 255, 0.88);
  padding: 0 4px;
  border-radius: 3px;
  pointer-events: none;
}
.gis-marker-label-strong {
  font-weight: 700;
  color: #0d47a1;
}
.gis-marker-user .gis-marker-user-core {
  position: absolute;
  left: 9px;
  top: 9px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #0288d1;
  border: 3px solid #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
}
.gis-marker-user .gis-marker-user-ring {
  position: absolute;
  left: 1px;
  top: 1px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(2, 136, 209, 0.18);
}
</style>

<style lang="scss" scoped>
.gis-map {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 420px;
  background: #eef4ea;

  &__canvas {
    width: 100%;
    height: 100%;
  }

  &__notice {
    position: absolute;
    left: 12px;
    top: 12px;
    right: 12px;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 4px;
    background: rgba(255, 248, 225, 0.97);
    border: 1px solid #ffe082;
    color: #8d6e00;
    font-size: 13px;

    i {
      font-size: 16px;
    }

    span {
      flex: 1;
    }
  }

  &__provider {
    position: absolute;
    right: 12px;
    top: 12px;
    z-index: 15;
  }

  &__mask {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 18;
  }

  &__hint {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    bottom: 16px;
    z-index: 16;
    background: rgba(21, 101, 192, 0.92);
    color: #fff;
    font-size: 13px;
    padding: 6px 14px;
    border-radius: 16px;
  }

  &__legend {
    position: absolute;
    left: 12px;
    bottom: 12px;
    z-index: 12;
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 8px 10px;
    font-size: 12px;
    color: #37474f;
    line-height: 20px;
  }

  &__legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;

    &.dot-pending { background: #f9a825; }
    &.dot-sampled { background: #2e7d32; }
    &.dot-device { background: #1976d2; }
  }

  .line {
    width: 18px;
    height: 0;
    display: inline-block;
    border-top: 3px solid;

    &.line-route { border-color: #1565c0; }
    &.line-guide { border-color: #d81b60; border-top-style: dashed; }
  }
}
</style>
