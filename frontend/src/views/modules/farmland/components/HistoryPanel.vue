<template>
  <div class="gis-history-panel">
    <div class="gis-history-panel__filters">
      <el-select v-model="query.samplingPointId" size="mini" clearable placeholder="全部采样点" class="gis-history-panel__select" @change="reload">
        <el-option
          v-for="point in points"
          :key="point.samplingPointId"
          :label="point.pointCode || point.samplingPointId"
          :value="point.samplingPointId" />
      </el-select>
      <el-select v-model="query.deviceId" size="mini" clearable placeholder="全部设备" class="gis-history-panel__select" @change="reload">
        <el-option
          v-for="device in devices"
          :key="device.deviceId"
          :label="device.deviceCode || device.deviceId"
          :value="device.deviceId" />
      </el-select>
      <el-select v-model="query.metricCode" size="mini" clearable placeholder="全部指标" class="gis-history-panel__select" @change="reload">
        <el-option
          v-for="metric in metricOptions"
          :key="metric.code"
          :label="metric.label"
          :value="metric.code" />
      </el-select>
      <el-button size="mini" icon="el-icon-refresh" :loading="loading" @click="reload">查询</el-button>
      <el-button size="mini" plain icon="el-icon-download" @click="$emit('export')">导出(4号/5号接口)</el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="records"
      size="mini"
      border
      height="210"
      empty-text="暂无历史数据">
      <el-table-column label="采集时间" prop="collectTime" width="150" />
      <el-table-column label="设备" width="74">
        <template slot-scope="scope">{{ scope.row.deviceCode || scope.row.deviceId || '--' }}</template>
      </el-table-column>
      <el-table-column label="采样点" width="70">
        <template slot-scope="scope">{{ scope.row.pointCode || scope.row.samplingPointId || '--' }}</template>
      </el-table-column>
      <el-table-column label="指标" min-width="96">
        <template slot-scope="scope">{{ metricLabel(scope.row.metricCode) }}</template>
      </el-table-column>
      <el-table-column label="数值" width="80" align="right">
        <template slot-scope="scope">
          <span class="gis-history-panel__value">{{ scope.row.metricValue }}</span>
          <span class="gis-history-panel__unit">{{ scope.row.metricUnit }}</span>
        </template>
      </el-table-column>
      <el-table-column label="taskId" prop="taskId" min-width="120" show-overflow-tooltip />
    </el-table>

    <div class="gis-history-panel__footer">
      <span>共 {{ page.total }} 条记录</span>
      <el-pagination
        small
        background
        layout="prev, pager, next, sizes"
        :current-page.sync="page.current"
        :page-size.sync="page.size"
        :page-sizes="[10, 20, 50]"
        :total="page.total"
        @current-change="load"
        @size-change="reload" />
    </div>

    <div v-if="error" class="gis-history-panel__error">
      <i class="el-icon-warning-outline"></i> {{ error }}
    </div>
  </div>
</template>

<script>
/**
 * 历史数据面板（1号 前端GIS 岗位）
 *
 * 对应老师任务书 M4 的后半句：「…并在历史数据界面展示」。
 *
 * 数据来自 5号 的 GET /monitor/monitorRecord/history（§7.2），
 * 返回 IPage<MonitorRecordDTO>：records / total / current / size / pages。
 * 前端只做展示与筛选，不做入库、不做 Excel 生成（导出走 4号/5号 的 export 接口）。
 */
import gateway from '@/api/gis/gisGateway'
import { CORE_METRICS, metricLabel } from '@/utils/gis/gisDict'

export default {
  name: 'HistoryPanel',
  props: {
    points: {
      type: Array,
      default: () => []
    },
    devices: {
      type: Array,
      default: () => []
    },
    taskId: {
      type: String,
      default: ''
    },
    // 外部指定的过滤条件（例如从采样数据弹窗点「查看历史数据」跳过来）
    focusSamplingPointId: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      loading: false,
      error: '',
      records: [],
      query: {
        samplingPointId: '',
        deviceId: '',
        metricCode: '',
        startTime: '',
        endTime: ''
      },
      page: {
        current: 1,
        size: 20,
        total: 0
      }
    }
  },
  computed: {
    metricOptions () {
      return CORE_METRICS.map(code => ({ code, label: metricLabel(code) }))
    }
  },
  watch: {
    focusSamplingPointId (value) {
      if (value) {
        this.query.samplingPointId = value
        this.reload()
      }
    }
  },
  mounted () {
    this.load()
  },
  methods: {
    metricLabel,
    reload () {
      this.page.current = 1
      this.load()
    },
    async load () {
      this.loading = true
      this.error = ''
      try {
        const data = await gateway.loadHistory(Object.assign({}, this.query, {
          taskId: this.taskId,
          current: this.page.current,
          size: this.page.size
        }))
        if (Array.isArray(data)) {
          this.records = data
          this.page.total = data.length
        } else {
          this.records = (data && data.records) || []
          this.page.total = Number(data && data.total) || 0
          if (data && data.size) {
            this.page.size = Number(data.size)
          }
        }
      } catch (error) {
        this.records = []
        this.page.total = 0
        this.error = `历史数据接口调用失败：${(error && error.message) || error}`
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.gis-history-panel {
  &__filters {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;

    ::v-deep .el-button + .el-button {
      margin-left: 0;
    }
  }

  &__select {
    width: 128px;
  }

  &__value {
    font-weight: 700;
    color: #1565c0;
    margin-right: 2px;
  }

  &__unit {
    color: #90a4ae;
    font-size: 11px;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
    font-size: 12px;
    color: #607d8b;
  }

  &__error {
    margin-top: 6px;
    color: #c62828;
    font-size: 12px;
  }
}
</style>
