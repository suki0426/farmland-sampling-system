<template>
  <div class="mini-trend">
    <div class="mini-trend__head">
      <span class="mini-trend__title">{{ title }}</span>
      <span v-if="unit" class="mini-trend__unit">{{ unit }}</span>
      <span class="mini-trend__latest" :style="{ color: accent }">{{ latestText }}</span>
    </div>
    <div ref="chart" class="mini-trend__canvas" :style="{ height: height + 'px' }"></div>
    <div v-if="error" class="mini-trend__error">{{ error }}</div>
  </div>
</template>

<script>
/**
 * 大屏用迷你折线/柱状图（基于 echarts 原生实例，深色主题）
 *
 * 用原生 echarts 而不是 v-charts，是因为大屏需要精确控制深色主题、渐变、网格与坐标轴细节，
 * v-charts 的封装在这里反而束手束脚。数据格式仍保持 { time, value } 的简单结构。
 */
import * as echarts from 'echarts'

export default {
  name: 'MiniTrendChart',
  props: {
    title: { type: String, default: '' },
    unit: { type: String, default: '' },
    /** [{ time, value }] */
    rows: { type: Array, default: () => [] },
    type: { type: String, default: 'line' },   // line | bar
    accent: { type: String, default: '#4fc3f7' },
    height: { type: Number, default: 120 },
    /** 显示上下限参考带（历史报表用） */
    showBand: { type: Boolean, default: false }
  },
  data () {
    return {
      chart: null,
      error: '',
      resizeHandler: null
    }
  },
  computed: {
    latestText () {
      if (!this.rows.length) {
        return '--'
      }
      return `${this.rows[this.rows.length - 1].value}${this.unit}`
    }
  },
  watch: {
    rows: {
      deep: true,
      handler () {
        this.render()
      }
    },
    type () {
      this.render()
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
        const times = this.rows.map(r => r.time)
        const values = this.rows.map(r => r.value)
        const series = [{
          type: this.type,
          data: values,
          smooth: this.type === 'line',
          symbol: 'none',
          lineStyle: { width: 2, color: this.accent },
          itemStyle: { color: this.accent },
          areaStyle: this.type === 'line'
            ? {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: this.accent + '66' },
                  { offset: 1, color: this.accent + '00' }
                ])
              }
            : undefined,
          barMaxWidth: 8
        }]

        if (this.showBand && this.rows[0] && this.rows[0].upper !== undefined) {
          series.push({
            type: 'line',
            data: this.rows.map(r => r.upper),
            symbol: 'none',
            lineStyle: { width: 1, type: 'dashed', color: '#ff8a65' },
            silent: true
          })
          series.push({
            type: 'line',
            data: this.rows.map(r => r.lower),
            symbol: 'none',
            lineStyle: { width: 1, type: 'dashed', color: '#ff8a65' },
            silent: true
          })
        }

        this.chart.setOption({
          backgroundColor: 'transparent',
          grid: { left: 34, right: 10, top: 10, bottom: 20 },
          tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(6,26,50,0.94)',
            borderColor: '#4fc3f7',
            textStyle: { color: '#cfe8ff', fontSize: 12 }
          },
          xAxis: {
            type: 'category',
            data: times,
            boundaryGap: this.type === 'bar',
            axisLine: { lineStyle: { color: 'rgba(79,195,247,0.35)' } },
            axisLabel: { color: '#8fb8d8', fontSize: 10, interval: Math.max(0, Math.floor(times.length / 5) - 1) },
            axisTick: { show: false }
          },
          yAxis: {
            type: 'value',
            scale: true,
            splitLine: { lineStyle: { color: 'rgba(79,195,247,0.12)' } },
            axisLabel: { color: '#8fb8d8', fontSize: 10 }
          },
          series
        }, true)
      } catch (e) {
        this.error = `图表渲染失败：${(e && e.message) || e}`
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.mini-trend {
  position: relative;

  &__head {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 2px;
  }

  &__title {
    color: #cfe8ff;
    font-size: 13px;
  }

  &__unit {
    color: #6d90ad;
    font-size: 11px;
  }

  &__latest {
    margin-left: auto;
    font-size: 15px;
    font-weight: 700;
  }

  &__canvas {
    width: 100%;
  }

  &__error {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    font-size: 11px;
    color: #ff8a65;
  }
}
</style>
