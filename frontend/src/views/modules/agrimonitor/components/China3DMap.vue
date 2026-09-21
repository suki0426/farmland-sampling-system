<template>
  <div class="china-3d-map">
    <div ref="chart" class="china-3d-map__canvas"></div>

    <!-- 加载 / 错误状态：不能静默空白 -->
    <div v-if="loading" class="china-3d-map__mask" v-loading="true" element-loading-background="rgba(4, 18, 36, 0.75)" element-loading-text="正在加载 3D 地图数据…"></div>

    <div v-if="error" class="china-3d-map__error">
      <i class="el-icon-warning-outline"></i>
      <div>
        <strong>3D 地图渲染失败</strong>
        <p>{{ error }}</p>
        <p v-if="fallback2D" class="china-3d-map__hint">已自动降级为 2D 省级地图，数据与交互完全一致。</p>
      </div>
    </div>

    <!-- 悬浮信息卡（鼠标移到省份上显示该地区概况，对应"多地区监控"） -->
    <transition name="el-fade-in">
      <div v-if="hover" class="china-3d-map__tip" :style="tipStyle">
        <div class="china-3d-map__tip-title">
          <span>{{ hover.name }}</span>
          <el-tag size="mini" :type="hoverTagType">{{ hover.levelText }}</el-tag>
        </div>
        <div class="china-3d-map__tip-row">
          <span>当前指标</span><b>{{ metricLabel }}</b>
        </div>
        <div class="china-3d-map__tip-row">
          <span>{{ metricLabel }}</span>
          <b class="china-3d-map__tip-value">{{ hover.metricValue }}{{ metricUnit }}</b>
        </div>
        <div class="china-3d-map__tip-row"><span>采样终端</span><b>{{ hover.deviceCount }} 台</b></div>
        <div class="china-3d-map__tip-row"><span>在线率</span><b>{{ hover.onlineRate }}%</b></div>
        <div class="china-3d-map__tip-row"><span>耕地面积</span><b>{{ hover.farmlandArea }} 公顷</b></div>
        <div class="china-3d-map__tip-row">
          <span>预警</span>
          <b :class="{ 'is-danger': hover.warningCount > 12 }">{{ hover.warningCount }} 条</b>
        </div>
        <div class="china-3d-map__tip-foot">点击查看该地区详细监控</div>
      </div>
    </transition>

    <!-- 图例 + 视图控制 -->
    <div class="china-3d-map__legend">
      <div class="china-3d-map__legend-title">{{ metricLabel }}（{{ metricUnit }}）</div>
      <div class="china-3d-map__legend-bar">
        <span v-for="(c, i) in legendColors" :key="i" :style="{ background: c }"></span>
      </div>
      <div class="china-3d-map__legend-range">
        <span>{{ legendMin }}</span><span>{{ legendMax }}</span>
      </div>
    </div>

    <div class="china-3d-map__toolbar">
      <el-button size="mini" :type="autoRotate ? 'primary' : 'default'" @click="toggleRotate">
        {{ autoRotate ? '停止旋转' : '自动旋转' }}
      </el-button>
      <el-button size="mini" @click="resetView">重置视角</el-button>
      <el-button size="mini" @click="toggleShading">{{ shading === 'lambert' ? '切换真实感' : '切换地形感' }}</el-button>
    </div>
  </div>
</template>

<script>
/**
 * 3D 中国地图（省级）—— 首页监控大屏的核心组件
 *
 * 技术实现：
 *   - echarts 4.9.0 + echarts-gl 1.1.2 的 `map3D` 系列（elevation 挤出 + 光照）
 *   - 省份 GeoJSON 由 @/utils/geo/chinaMapLoader 从 public/geo/china.json 加载并注册，
 *     **不依赖运行时外网 CDN**；
 *   - 不同指标（云量 / 降雨 / CO₂ / 土壤湿度 / 终端数 / 预警数）用不同 visualMap 配色，
 *     即需求里的「用不同颜色来表示」；
 *   - 鼠标悬浮显示该地区概况（多地区监控），点击下钻到地区监控页；
 *   - WebGL 不可用或 echarts-gl 加载失败时**自动降级为 2D 省级地图**，功能不缺失、不白屏。
 */
import * as echarts from 'echarts'
import 'echarts-gl'
import { registerChinaMap } from '@/utils/geo/chinaMapLoader'
import { METRICS } from '@/mock/agrimonitor/geoData'

export default {
  name: 'China3DMap',
  props: {
    /** 省级数据 [{ name, cloud, rain, co2, ... }] */
    stats: {
      type: Array,
      default: () => []
    },
    /** 当前指标 key，见 METRICS */
    metric: {
      type: String,
      default: 'cloud'
    }
  },
  data () {
    return {
      loading: true,
      error: '',
      fallback2D: false,
      hover: null,
      tipStyle: { left: '0px', top: '0px' },
      autoRotate: false,
      shading: 'lambert',
      chart: null,
      resizeHandler: null
    }
  },
  computed: {
    metricDef () {
      return METRICS.filter(m => m.key === this.metric)[0] || METRICS[0]
    },
    metricLabel () {
      return this.metricDef.label
    },
    metricUnit () {
      return this.metricDef.unit
    },
    legendColors () {
      return this.metricDef.colors
    },
    legendMin () {
      return this.metricDef.min
    },
    legendMax () {
      return this.metricDef.max
    },
    metricKeyCamel () {
      return this.metric
    },
    hoverTagType () {
      if (!this.hover) {
        return 'info'
      }
      if (this.hover.warningCount > 12) {
        return 'danger'
      }
      if (this.hover.warningCount > 6) {
        return 'warning'
      }
      return 'success'
    }
  },
  watch: {
    metric () {
      this.renderChart()
    },
    stats: {
      deep: true,
      handler () {
        this.renderChart()
      }
    },
    autoRotate (v) {
      if (this.chart && !this.fallback2D) {
        this.chart.setOption({
          series: [{ viewControl: { autoRotate: v, autoRotateSpeed: 8 } }]
        })
      }
    }
  },
  mounted () {
    this.init()
    this.resizeHandler = () => {
      if (this.chart) {
        // 容器尺寸变化后必须重新渲染（3D 视图尤其敏感）
        this.chart.resize()
      }
    }
    window.addEventListener('resize', this.resizeHandler)
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.resizeHandler)
    if (this.chart) {
      this.chart.dispose()
      this.chart = null
    }
  },
  methods: {
    async init () {
      this.loading = true
      this.error = ''
      try {
        await registerChinaMap(echarts)
      } catch (e) {
        this.error = `地图数据加载失败：${(e && e.message) || e}`
        this.loading = false
        return
      }
      if (!this.chart) {
        this.chart = echarts.init(this.$refs.chart)
      }
      this.renderChart()
      this.loading = false
    },

    /** 组装 echarts option 并渲染 */
    renderChart () {
      if (!this.chart || !this.stats.length) {
        return
      }
      const def = this.metricDef
      const metric = this.metricKeyCamel
      const data = this.stats.map(p => ({
        name: p.name,
        value: Number(p[metric]) || 0,
        raw: p
      }))

      const common = {
        backgroundColor: 'transparent',
        tooltip: { show: false } // 用自定义悬浮卡代替 echarts 默认 tooltip
      }

      const visualMap = {
        show: false,
        min: def.min,
        max: def.max,
        inRange: { color: def.colors },
        calculable: false
      }

      const option3D = Object.assign({}, common, {
        visualMap,
        series: [{
          type: 'map3D',
          map: 'china',
          name: def.label,
          data,
          regionHeight: 2.4,
          shading: this.shading,
          boxWidth: 120,
          boxDepth: 90,
          itemStyle: {
            borderWidth: 0.8,
            borderColor: 'rgba(120, 200, 255, 0.55)',
            opacity: 1
          },
          emphasis: {
            itemStyle: { color: '#ffd54f' },
            label: { show: true, color: '#fff', fontSize: 14 }
          },
          label: {
            show: true,
            color: 'rgba(230, 245, 255, 0.85)',
            fontSize: 10,
            formatter: params => params.name
          },
          light: {
            main: { intensity: 1.4, shadow: true, alpha: 40, beta: 40 },
            ambient: { intensity: 0.35 }
          },
          viewControl: {
            alpha: 45,
            beta: 5,
            distance: 130,
            minDistance: 60,
            maxDistance: 300,
            autoRotate: this.autoRotate,
            autoRotateSpeed: 8,
            panSensitivity: 1,
            zoomSensitivity: 1
          },
          postEffect: {
            enable: false
          },
          groundPlane: { show: false }
        }]
      })

      const option2D = Object.assign({}, common, {
        visualMap: Object.assign({}, visualMap, { show: true, left: 12, bottom: 12, textStyle: { color: '#cfe8ff' } }),
        series: [{
          type: 'map',
          map: 'china',
          roam: true,
          data,
          label: { show: true, fontSize: 9, color: '#dfefff' },
          itemStyle: { borderColor: 'rgba(120,200,255,0.6)', borderWidth: 0.8 },
          emphasis: { itemStyle: { areaColor: '#ffd54f' }, label: { color: '#fff' } }
        }]
      })

      try {
        if (this.fallback2D) {
          this.chart.setOption(option2D, true)
        } else {
          this.chart.setOption(option3D, true)
        }
        this.bindEvents()
      } catch (e) {
        // WebGL 不可用 / echarts-gl 异常 → 降级 2D
        console.error('[agrimonitor] map3D render failed, fallback to 2D:', e)
        this.fallback2D = true
        this.error = `3D 渲染失败（可能是当前环境不支持 WebGL）：${(e && e.message) || e}`
        try {
          this.chart.setOption(option2D, true)
          this.bindEvents()
        } catch (e2) {
          this.error = `地图渲染失败：${(e2 && e2.message) || e2}`
        }
      }
    },

    /** 事件绑定：悬浮显示地区概况、点击下钻、鼠标位置驱动浮层跟随 */
    bindEvents () {
      if (!this.chart || this._eventsBound) {
        return
      }
      this._eventsBound = true

      this.chart.on('mouseover', params => {
        if (!params || !params.data || !params.data.raw) {
          return
        }
        this.hover = this.decorate(params.data.raw)
      })
      this.chart.on('mouseout', () => {
        this.hover = null
      })
      this.chart.on('click', params => {
        if (params && params.data && params.data.raw) {
          this.$emit('select-province', params.data.raw)
        }
      })
      this.chart.getZr().on('mousemove', e => {
        if (!this.hover) {
          return
        }
        // 让信息卡跟随鼠标，同时避免超出容器右/下边界
        const rect = this.$refs.chart.getBoundingClientRect()
        const x = e.offsetX
        const y = e.offsetY
        const tipW = 240
        const tipH = 190
        this.tipStyle = {
          left: (x + tipW > rect.width ? x - tipW - 12 : x + 16) + 'px',
          top: (y + tipH > rect.height ? Math.max(0, y - tipH) : y + 12) + 'px'
        }
      })
    },

    decorate (raw) {
      const metric = this.metricKeyCamel
      return Object.assign({}, raw, {
        metricValue: raw[metric],
        onlineRate: raw.deviceCount ? Math.round((raw.onlineCount / raw.deviceCount) * 1000) / 10 : 0,
        levelText: raw.warningCount > 12 ? '重点关注' : (raw.warningCount > 6 ? '需关注' : '正常')
      })
    },

    toggleRotate () {
      this.autoRotate = !this.autoRotate
    },

    resetView () {
      if (!this.chart || this.fallback2D) {
        return
      }
      this.chart.setOption({
        series: [{
          viewControl: { alpha: 45, beta: 5, distance: 130 }
        }]
      })
    },

    toggleShading () {
      this.shading = this.shading === 'lambert' ? 'realistic' : 'lambert'
      this.renderChart()
    }
  }
}
</script>

<style lang="scss" scoped>
.china-3d-map {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 420px;

  &__canvas {
    width: 100%;
    height: 100%;
  }

  &__mask {
    position: absolute;
    inset: 0;
    z-index: 8;
  }

  &__error {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 9;
    display: flex;
    gap: 10px;
    max-width: 78%;
    padding: 14px 18px;
    border-radius: 6px;
    background: rgba(120, 30, 30, 0.92);
    border: 1px solid #ff7043;
    color: #ffe0db;
    font-size: 13px;
    line-height: 20px;

    i {
      font-size: 20px;
      color: #ffab91;
    }

    p {
      margin: 4px 0 0;
      word-break: break-all;
    }
  }

  &__hint {
    color: #a5d6a7 !important;
  }

  &__tip {
    position: absolute;
    z-index: 20;
    width: 240px;
    padding: 10px 12px;
    border-radius: 6px;
    background: rgba(6, 26, 50, 0.94);
    border: 1px solid rgba(79, 195, 247, 0.5);
    box-shadow: 0 6px 22px rgba(0, 0, 0, 0.45);
    color: #cfe8ff;
    font-size: 12px;
    pointer-events: none;
  }

  &__tip-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 15px;
    font-weight: 700;
    color: #4fc3f7;
    margin-bottom: 6px;
  }

  &__tip-row {
    display: flex;
    justify-content: space-between;
    line-height: 22px;

    span {
      color: #8fb8d8;
    }

    b {
      color: #e6f5ff;
    }
  }

  &__tip-value {
    color: #ffd54f !important;
    font-size: 14px;
  }

  &__tip-foot {
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px dashed rgba(79, 195, 247, 0.3);
    color: #64b5f6;
    text-align: center;
  }

  .is-danger {
    color: #ff7043 !important;
  }

  &__legend {
    position: absolute;
    left: 14px;
    bottom: 14px;
    z-index: 10;
    width: 190px;
    padding: 8px 10px;
    border-radius: 4px;
    background: rgba(6, 26, 50, 0.72);
    border: 1px solid rgba(79, 195, 247, 0.28);
    color: #cfe8ff;
    font-size: 12px;
  }

  &__legend-title {
    margin-bottom: 6px;
    color: #8fb8d8;
  }

  &__legend-bar {
    display: flex;
    height: 10px;
    border-radius: 2px;
    overflow: hidden;

    span {
      flex: 1;
    }
  }

  &__legend-range {
    display: flex;
    justify-content: space-between;
    margin-top: 3px;
    color: #8fb8d8;
  }

  &__toolbar {
    position: absolute;
    right: 14px;
    top: 14px;
    z-index: 10;
    display: flex;
    gap: 6px;

    ::v-deep .el-button + .el-button {
      margin-left: 0;
    }
  }
}
</style>
