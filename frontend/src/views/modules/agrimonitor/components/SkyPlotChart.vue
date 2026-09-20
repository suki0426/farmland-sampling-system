<template>
  <div class="sky-plot">
    <div class="sky-plot__head">
      <span class="sky-plot__title">卫星天空视图</span>
      <span class="sky-plot__hint">圆心=天顶(90°) · 外圈=地平线(0°) · 角度=方位角(正北为上)</span>
    </div>
    <div ref="chart" class="sky-plot__canvas"></div>
    <div v-if="error" class="sky-plot__error">{{ error }}</div>
    <div class="sky-plot__legend">
      <span v-for="c in constellations" :key="c.code" class="sky-plot__legend-item">
        <i :style="{ background: c.color }"></i>{{ c.label }}
      </span>
    </div>
  </div>
</template>

<script>
/**
 * 卫星天空视图（极坐标散点）
 *
 * 坐标约定（与 GNSS 惯例一致）：
 *   - 方位角 azimuth：0° = 正北，顺时针增大
 *   - 仰角 elevation：0° = 地平线，90° = 天顶
 * 因此半径轴用 `inverse: true`（90 在天顶/圆心），角度轴 `startAngle: 90`（正北朝上）。
 * 每个星座一条 series，用不同颜色区分；点的透明度体现信噪比。
 *
 * ⚠️ 数据来自 @/mock/agrimonitor，前端不做任何轨道/星历计算。
 */
import * as echarts from 'echarts'
import { CONSTELLATIONS } from '@/mock/agrimonitor/satelliteData'

export default {
  name: 'SkyPlotChart',
  props: {
    /** [{ id, constellation, color, azimuth, elevation, snr, visible }] */
    satellites: { type: Array, default: () => [] }
  },
  data () {
    return {
      chart: null,
      error: '',
      constellations: CONSTELLATIONS.filter(c => c.kind === 'navigation'),
      resizeHandler: null
    }
  },
  watch: {
    satellites: {
      deep: true,
      handler () {
        this.render()
      }
    }
  },
  mounted () {
    this.chart = echarts.init(this.$refs.chart)
    this.render()
    this.resizeHandler = () => this.chart && this.chart.resize()
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
    render () {
      if (!this.chart) {
        return
      }
      this.error = ''
      try {
        const series = this.constellations.map(c => {
          const data = this.satellites
            .filter(s => s.constellation === c.code)
            .map(s => ({
              value: [s.azimuth, s.elevation],
              name: s.id,
              snr: s.snr,
              used: s.used,
              visible: s.visible,
              itemStyle: {
                color: c.color,
                opacity: s.visible ? 0.95 : 0.25,
                borderColor: s.used ? '#fff' : 'transparent',
                borderWidth: s.used ? 1.6 : 0
              }
            }))
          return {
            name: c.label,
            type: 'scatter',
            coordinateSystem: 'polar',
            symbolSize: val => (val && val.visible ? Math.max(6, Math.min(16, 6 + (val.snr - 28) * 0.28)) : 5),
            data,
            label: {
              show: true,
              formatter: params => (params.data.visible ? params.name : ''),
              position: 'right',
              color: '#546e7a',
              fontSize: 9
            }
          }
        })

        this.chart.setOption({
          backgroundColor: 'transparent',
          tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(255,255,255,0.98)',
            borderColor: '#90caf9',
            textStyle: { color: '#263238', fontSize: 12 },
            formatter: params => {
              const d = params.data
              return `<b>${d.name}</b><br/>方位角：${d.value[0]}°<br/>仰角：${d.value[1]}°<br/>信噪比：${d.snr} dB<br/>状态：${d.used ? '已参与解算' : (d.visible ? '可见' : '地平线以下')}`
            }
          },
          polar: { center: ['50%', '52%'], radius: '78%' },
          angleAxis: {
            type: 'value',
            min: 0,
            max: 360,
            startAngle: 90,
            clockwise: true,
            axisLine: { lineStyle: { color: '#b0bec5' } },
            axisLabel: {
              color: '#78909c',
              fontSize: 10,
              formatter: value => ({ 0: 'N', 90: 'E', 180: 'S', 270: 'W' }[value] || '')
            },
            splitLine: { lineStyle: { color: 'rgba(144,164,174,0.28)' } }
          },
          radiusAxis: {
            type: 'value',
            min: 0,
            max: 90,
            inverse: true,
            axisLine: { show: false },
            axisLabel: { color: '#90a4ae', fontSize: 9, formatter: v => `${v}°` },
            splitLine: { lineStyle: { color: 'rgba(144,164,174,0.28)' } }
          },
          series
        }, true)
      } catch (e) {
        this.error = `天空视图渲染失败：${(e && e.message) || e}`
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.sky-plot {
  position: relative;

  &__head {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 4px;
  }

  &__title {
    font-size: 13px;
    font-weight: 600;
    color: #263238;
  }

  &__hint {
    color: #90a4ae;
    font-size: 11px;
  }

  &__canvas {
    width: 100%;
    height: 380px;
  }

  &__error {
    position: absolute;
    left: 0;
    right: 0;
    top: 40%;
    text-align: center;
    color: #f5222d;
    font-size: 12px;
  }

  &__legend {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: center;
    margin-top: 4px;
    font-size: 12px;
    color: #546e7a;
  }

  &__legend-item {
    display: flex;
    align-items: center;
    gap: 4px;

    i {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      display: inline-block;
    }
  }
}
</style>
