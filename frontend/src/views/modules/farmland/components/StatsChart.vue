<template>
  <div class="gis-stats-chart">
    <div class="gis-stats-chart__toolbar">
      <el-select v-model="activeMetrics" multiple collapse-tags size="mini" placeholder="选择指标" class="gis-stats-chart__select" @change="rebuild">
        <el-option
          v-for="metric in metricOptions"
          :key="metric.code"
          :label="metric.label"
          :value="metric.code" />
      </el-select>
      <el-radio-group v-model="chartType" size="mini">
        <el-radio-button label="line">折线</el-radio-button>
        <el-radio-button label="bar">柱状</el-radio-button>
      </el-radio-group>
      <el-button size="mini" icon="el-icon-refresh" :loading="loading" @click="$emit('refresh')">刷新</el-button>
    </div>

    <el-alert
      v-if="error"
      :title="error"
      type="error"
      :closable="false"
      show-icon
      class="gis-stats-chart__alert" />

    <div v-loading="loading" class="gis-stats-chart__body">
      <ve-line
        v-if="!error && chartData.rows && chartData.rows.length && chartType === 'line'"
        :data="chartData"
        :settings="chartSettings"
        :extend="chartExtend"
        height="260px" />
      <ve-histogram
        v-else-if="!error && chartData.rows && chartData.rows.length"
        :data="chartData"
        :settings="chartSettings"
        :extend="chartExtend"
        height="260px" />
      <el-empty v-else-if="!loading" description="暂无统计数据（接口不可用时请检查 5号 analysis 接口）" :image-size="60"></el-empty>
    </div>

    <div v-if="!error && chartData.rows && chartData.rows.length" class="gis-stats-chart__foot">
      数据点 {{ chartData.rows.length }} 条，维度列：{{ dimensionColumn }}
    </div>
  </div>
</template>

<script>
/**
 * 统计图表（1号 前端GIS 岗位）
 *
 * 对应交付要求：「统计展示：接收后端统计数据并渲染 ECharts」
 * 约束：「统计图 | columns, rows | ChartDataDTO | columns 首列为维度，rows key 必须与 columns 完全一致」
 *
 * 实现上直接使用项目已全局注册的 v-charts（底层就是 ECharts），
 * 把 ChartDataDTO 原样传入，不做列重命名，避免出现第二套字段。
 */
import { CORE_METRICS, metricLabel, METRIC_UNITS } from '@/utils/gis/gisDict'

export default {
  name: 'StatsChart',
  props: {
    // ChartDataDTO: { columns: [], rows: [] }
    data: {
      type: Object,
      default: () => ({ columns: [], rows: [] })
    },
    loading: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      chartType: 'line',
      activeMetrics: [],
      chartData: { columns: [], rows: [] },
      chartSettings: {},
      chartExtend: {
        legend: { top: 0 },
        grid: { top: 36, left: 10, right: 16, bottom: 6, containLabel: true },
        series: { smooth: true, symbolSize: 6 }
      }
    }
  },
  computed: {
    metricOptions () {
      return CORE_METRICS.map(code => ({
        code,
        label: metricLabel(code)
      }))
    },
    dimensionColumn () {
      const columns = (this.data && this.data.columns) || []
      return columns.length ? columns[0] : '--'
    }
  },
  watch: {
    data: {
      deep: true,
      immediate: true,
      handler () {
        this.rebuild()
      }
    }
  },
  methods: {
    rebuild () {
      const source = this.data || { columns: [], rows: [] }
      const columns = Array.isArray(source.columns) ? source.columns.slice() : []
      const rows = Array.isArray(source.rows) ? source.rows : []
      if (columns.length === 0 || rows.length === 0) {
        this.chartData = { columns: [], rows: [] }
        return
      }

      const dimension = columns[0]
      const available = columns.slice(1)
      let selected = this.activeMetrics.filter(m => available.indexOf(m) !== -1)
      if (selected.length === 0) {
        // 首次加载默认展示全部可用指标
        selected = available.slice()
        this.activeMetrics = selected
      }

      const nextColumns = [dimension].concat(selected)
      const nextRows = rows.map(row => {
        const next = {}
        nextColumns.forEach(col => {
          next[col] = row[col]
        })
        return next
      })

      this.chartSettings = {
        labelMap: this.buildLabelMap(selected)
      }
      this.chartData = { columns: nextColumns, rows: nextRows }
    },

    /** 图例显示中文指标名 + 单位，但列名仍然使用后端原始字段，保证 rows key 一致 */
    buildLabelMap (metrics) {
      const map = {}
      metrics.forEach(code => {
        map[code] = `${metricLabel(code)}${METRIC_UNITS[code] ? '(' + METRIC_UNITS[code] + ')' : ''}`
      })
      return map
    }
  }
}
</script>

<style lang="scss" scoped>
.gis-stats-chart {
  &__toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    margin-bottom: 8px;
  }

  &__select {
    width: 220px;
  }

  &__alert {
    margin-bottom: 8px;
  }

  &__body {
    min-height: 260px;
  }

  &__foot {
    font-size: 12px;
    color: #90a4ae;
    margin-top: 4px;
  }
}
</style>
