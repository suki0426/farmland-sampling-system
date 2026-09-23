<template>
  <div class="data-report">
    <el-tabs v-model="activeTab" class="data-report__tabs">
      <!-- ══════════ 实时数据 ══════════ -->
      <el-tab-pane label="实时数据" name="realtime">
        <div class="data-report__toolbar">
          <el-select v-model="metric" size="mini" class="data-report__select" @change="refreshRealtime">
            <el-option v-for="m in metricOptions" :key="m.key" :label="`${m.label}（${m.unit}）`" :value="m.key" />
          </el-select>
          <el-switch v-model="live" size="mini" active-text="实时刷新" />
          <span class="data-report__hint">每 3 秒自动刷新（演示：前端按当前值平稳推进，不请求后端）</span>
        </div>

        <div class="data-report__cards">
          <div v-for="c in realtimeCards" :key="c.label" class="data-report__card">
            <div class="data-report__card-label">{{ c.label }}</div>
            <div class="data-report__card-value" :style="{ color: c.color }">{{ c.value }}</div>
            <div class="data-report__card-unit">{{ c.unit }}</div>
          </div>
        </div>

        <MiniTrendChart
          :title="`${currentMetric.label} · 实时曲线`"
          :unit="currentMetric.unit"
          :rows="realtimeRows"
          :accent="currentMetric.colors[3]"
          :height="240" />
      </el-tab-pane>

      <!-- ══════════ 历史数据 ══════════ -->
      <el-tab-pane label="历史数据" name="history">
        <div class="data-report__toolbar">
          <el-select v-model="metric" size="mini" class="data-report__select" @change="refreshHistory">
            <el-option v-for="m in metricOptions" :key="m.key" :label="`${m.label}（${m.unit}）`" :value="m.key" />
          </el-select>
          <el-radio-group v-model="granularity" size="mini" @change="refreshHistory">
            <el-radio-button label="day">按日</el-radio-button>
            <el-radio-button label="month">按月</el-radio-button>
          </el-radio-group>
          <el-date-picker
            v-model="range"
            size="mini"
            type="daterange"
            value-format="yyyy-MM-dd"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            class="data-report__range" />
          <el-button size="mini" icon="el-icon-refresh" @click="refreshHistory">查询</el-button>
        </div>

        <MiniTrendChart
          :title="`${currentMetric.label} · 历史趋势`"
          :unit="currentMetric.unit"
          :rows="historyRows"
          :accent="currentMetric.colors[3]"
          :height="230"
          show-band />

        <el-table :data="historyRows.slice(-12).reverse()" size="mini" border height="180" class="data-report__table">
          <el-table-column label="时间" prop="time" width="110" />
          <el-table-column :label="`${currentMetric.label}（${currentMetric.unit}）`" prop="value" width="130" />
          <el-table-column label="参考上限" prop="upper" width="100" />
          <el-table-column label="参考下限" prop="lower" width="100" />
          <el-table-column label="状态" min-width="90">
            <template slot-scope="scope">
              <el-tag size="mini" :type="scope.row.value > scope.row.upper ? 'danger' : (scope.row.value < scope.row.lower ? 'warning' : 'success')">
                {{ scope.row.value > scope.row.upper ? '偏高' : (scope.row.value < scope.row.lower ? '偏低' : '正常') }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ══════════ 生成报表 ══════════ -->
      <el-tab-pane label="生成报表" name="report">
        <div class="data-report__toolbar">
          <el-select v-model="reportTemplate" size="mini" class="data-report__select-lg">
            <el-option v-for="t in reportTemplates" :key="t.code" :label="t.label" :value="t.code">
              <span>{{ t.label }}</span>
              <span class="data-report__option-desc">{{ t.desc }}</span>
            </el-option>
          </el-select>
          <el-date-picker
            v-model="range"
            size="mini"
            type="daterange"
            value-format="yyyy-MM-dd"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            class="data-report__range" />
          <el-button size="mini" type="primary" icon="el-icon-document" :loading="reportLoading" @click="generateReport">
            生成报表
          </el-button>
        </div>

        <el-alert
          type="info"
          :closable="false"
          show-icon
          class="data-report__note"
          title="报表在本页以表格预览；Excel 文件由 4号/5号 的导出接口生成（尚未冻结），前端只预留入口。" />

        <div v-if="report" class="data-report__report">
          <div class="data-report__report-head">
            <div>
              <h4>{{ report.title }}</h4>
              <p>{{ report.summary }}</p>
            </div>
            <div class="data-report__report-meta">
              <div>报表编号：{{ report.reportId }}</div>
              <div>统计区间：{{ report.startTime }} ~ {{ report.endTime }}</div>
              <div>生成时间：{{ report.generatedAt }}</div>
            </div>
          </div>
          <el-table :data="report.rows" size="mini" border max-height="260">
            <el-table-column
              v-for="col in report.columns"
              :key="col"
              :label="col"
              :prop="col"
              min-width="90" />
          </el-table>
        </div>
        <el-empty v-else description="选择报表模板与时间范围后点击「生成报表」" :image-size="70" />
      </el-tab-pane>

      <!-- ══════════ 自动预警规则 ══════════ -->
      <el-tab-pane label="自动预警" name="rules">
        <el-alert
          type="warning"
          :closable="false"
          show-icon
          class="data-report__note"
          title="阈值为本地编辑，不会写入任何数据库；保存动作等 5号 冻结运维接口后再接入。" />

        <el-table :data="rules" size="mini" border>
          <el-table-column label="启用" width="70" align="center">
            <template slot-scope="scope">
              <el-switch v-model="scope.row.enabled" />
            </template>
          </el-table-column>
          <el-table-column label="规则名称" prop="name" min-width="140" />
          <el-table-column label="监测指标" prop="metricLabel" width="110" />
          <el-table-column label="条件" width="170">
            <template slot-scope="scope">
              <el-select v-model="scope.row.operator" size="mini" class="data-report__op">
                <el-option label="大于" value="gt" />
                <el-option label="小于" value="lt" />
                <el-option label="离线" value="offline" />
              </el-select>
              <el-input-number
                v-model="scope.row.threshold"
                size="mini"
                :controls="false"
                class="data-report__threshold" />
            </template>
          </el-table-column>
          <el-table-column label="单位" prop="unit" width="76" />
          <el-table-column label="级别" width="90">
            <template slot-scope="scope">
              <el-tag size="mini" :type="scope.row.level === 'high' ? 'danger' : (scope.row.level === 'medium' ? 'warning' : 'info')">
                {{ levelLabel(scope.row.level) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="触发来源" width="92" align="center">
            <template slot-scope="scope">
              <el-tag size="mini" type="success" effect="plain">自动</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
/**
 * 数据报表面板（需求 2-(1)）
 *
 * 覆盖：历史数据 + 实时图表 + 生成报表 + 自动预警
 *
 * ⚠️ 数据全部来自 @/mock/agrimonitor（前端演示数据）：
 *   - 不访问数据库、不请求后端、不写文件；
 *   - 「生成报表」只在本页做表格预览，Excel 由后端导出接口负责（尚未冻结，前端只留入口）；
 *   - 「自动预警」的阈值只在本地编辑，保存动作等 5号 冻结运维接口后再接入。
 */
import MiniTrendChart from './MiniTrendChart'
import {
  METRICS, mockDeviceSeries, mockHistorySeries, REPORT_TEMPLATES,
  mockGenerateReport, mockWarningRules, WARNING_LEVELS
} from '@/mock/agrimonitor'

export default {
  name: 'DataReportPanel',
  components: { MiniTrendChart },
  props: {
    regionKey: { type: String, default: '' },
    deviceCode: { type: String, default: 'SOIL-001' }
  },
  data () {
    return {
      activeTab: 'realtime',
      metric: 'soilMoisture',
      granularity: 'day',
      range: ['2026-08-19', '2026-09-17'],
      live: true,
      realtimeRows: [],
      historyRows: [],
      reportTemplates: REPORT_TEMPLATES,
      reportTemplate: 'daily',
      report: null,
      reportLoading: false,
      rules: [],
      timer: null
    }
  },
  computed: {
    metricOptions () {
      return METRICS.filter(m => ['cloud', 'rain', 'co2', 'soilMoisture'].indexOf(m.key) !== -1)
    },
    currentMetric () {
      return METRICS.filter(m => m.key === this.metric)[0] || METRICS[0]
    },
    realtimeCards () {
      const rows = this.realtimeRows
      if (!rows.length) {
        return []
      }
      const values = rows.map(r => r.value)
      return [
        { label: '最新值', value: values[values.length - 1], unit: this.currentMetric.unit, color: '#1890ff' },
        { label: '平均值', value: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1), unit: this.currentMetric.unit, color: '#13c2c2' },
        { label: '最大值', value: Math.max.apply(null, values).toFixed(1), unit: this.currentMetric.unit, color: '#fa8c16' },
        { label: '最小值', value: Math.min.apply(null, values).toFixed(1), unit: this.currentMetric.unit, color: '#52c41a' }
      ]
    }
  },
  watch: {
    regionKey () {
      this.refreshRealtime()
      this.refreshHistory()
    }
  },
  mounted () {
    this.rules = mockWarningRules()
    this.refreshRealtime()
    this.refreshHistory()
    this.timer = window.setInterval(() => {
      if (this.live && this.activeTab === 'realtime') {
        this.pushRealtimePoint()
      }
    }, 3000)
  },
  beforeDestroy () {
    if (this.timer) {
      window.clearInterval(this.timer)
    }
  },
  methods: {
    refreshRealtime () {
      this.realtimeRows = mockDeviceSeries(this.deviceCode + '|' + this.regionKey, this.metric, 40)
    },

    /**
     * 实时刷新：在最后一点的基础上做小幅平稳游走（演示用）。
     * 真实接入时这里换成 WebSocket / SSE 推送或定时轮询后端。
     */
    pushRealtimePoint () {
      if (!this.realtimeRows.length) {
        return
      }
      const last = this.realtimeRows[this.realtimeRows.length - 1].value
      const drift = (Math.random() - 0.5) * this.currentMetric.max * 0.012
      const next = Number(Math.max(this.currentMetric.min, Math.min(this.currentMetric.max, last + drift)).toFixed(1))
      const d = new Date()
      const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      const rows = this.realtimeRows.slice(1)
      rows.push({ time, value: next })
      this.realtimeRows = rows
    },

    refreshHistory () {
      const result = mockHistorySeries(this.regionKey, this.metric, this.granularity, 30)
      this.historyRows = result.rows
    },

    generateReport () {
      this.reportLoading = true
      // 模拟后端生成耗时；真实接入时改为调用导出接口
      window.setTimeout(() => {
        this.report = mockGenerateReport({
          templateCode: this.reportTemplate,
          regionKey: this.regionKey,
          startTime: this.range && this.range[0] ? this.range[0] + ' 00:00:00' : '',
          endTime: this.range && this.range[1] ? this.range[1] + ' 23:59:59' : ''
        })
        this.reportLoading = false
        this.$message.success('报表已生成（本页预览，未写入任何文件）')
      }, 600)
    },

    levelLabel (level) {
      const item = WARNING_LEVELS.filter(l => l.code === level)[0]
      return item ? item.label : level
    }
  }
}
</script>

<style lang="scss" scoped>
.data-report {
  &__toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }

  &__select {
    width: 190px;
  }

  &__select-lg {
    width: 260px;
  }

  &__range {
    width: 250px;
  }

  &__option-desc {
    float: right;
    color: #b0bec5;
    font-size: 11px;
  }

  &__hint {
    color: #90a4ae;
    font-size: 12px;
  }

  &__note {
    margin-bottom: 10px;
  }

  &__cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 6px;
  }

  &__card {
    padding: 8px 10px;
    border: 1px solid #e4e9f0;
    border-radius: 4px;
    background: #fafcff;
    text-align: center;
  }

  &__card-label {
    color: #78909c;
    font-size: 12px;
  }

  &__card-value {
    font-size: 20px;
    font-weight: 700;
    font-family: Consolas, Monaco, monospace;
  }

  &__card-unit {
    color: #b0bec5;
    font-size: 11px;
  }

  &__table {
    margin-top: 10px;
  }

  &__report {
    border: 1px solid #e4e9f0;
    border-radius: 4px;
    padding: 12px;
    background: #fff;
  }

  &__report-head {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 10px;

    h4 {
      margin: 0 0 4px;
      font-size: 15px;
    }

    p {
      margin: 0;
      color: #607d8b;
      font-size: 12px;
      line-height: 18px;
    }
  }

  &__report-meta {
    flex: none;
    color: #90a4ae;
    font-size: 12px;
    line-height: 19px;
    text-align: right;
  }

  &__op {
    width: 74px;
  }

  &__threshold {
    width: 76px;
    margin-left: 4px;
  }
}
</style>
