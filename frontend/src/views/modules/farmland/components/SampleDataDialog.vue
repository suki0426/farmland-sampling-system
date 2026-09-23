<template>
  <el-dialog
    :title="title"
    :visible.sync="dialogVisible"
    width="520px"
    append-to-body
    @closed="$emit('closed')">
    <div v-if="point" class="gis-sample-dialog">
      <el-alert
        :title="`${deviceCode} 已到达采样点 ${pointLabel}，采集时间 ${collectTime || '--'}`"
        type="success"
        :closable="false"
        show-icon
        class="gis-sample-dialog__alert" />

      <el-descriptions :column="2" border size="medium" class="gis-sample-dialog__desc">
        <el-descriptions-item
          v-for="metric in metricList"
          :key="metric.code"
          :label="metric.label">
          <span class="gis-sample-dialog__value">{{ metric.display }}</span>
          <span class="gis-sample-dialog__unit">{{ metric.unit }}</span>
        </el-descriptions-item>
      </el-descriptions>

      <el-descriptions :column="2" border size="small" class="gis-sample-dialog__meta">
        <el-descriptions-item label="samplingPointId">
          <span class="gis-mono">{{ point.samplingPointId || '--' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="deviceId">
          <span class="gis-mono">{{ deviceId || '--' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="经度">
          <span class="gis-mono">{{ format(point.longitude) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="纬度">
          <span class="gis-mono">{{ format(point.latitude) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="坐标系">
          {{ coordinateSystem || '--' }}
        </el-descriptions-item>
        <el-descriptions-item label="采样状态">
          <el-tag size="mini" type="success">{{ statusLabel }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <div slot="footer">
      <el-button size="small" @click="dialogVisible = false">关闭</el-button>
      <el-button v-if="point" size="small" type="primary" @click="$emit('view-history', point)">查看历史数据</el-button>
    </div>
  </el-dialog>
</template>

<script>
/**
 * 到达采样点弹窗（1号 前端GIS 岗位）
 *
 * 对应老师任务书 M3：「到达采样点后，标记该点状态为已采样，
 * 弹出窗口展示土壤温度、土壤湿度、空气温度、空气湿度、土壤深度」
 *
 * 5 项指标字段名与统一内部对象一致：soilTemperature / soilMoisture /
 * airTemperature / airHumidity / soilDepth。
 */
import { CORE_METRICS, METRIC_UNITS, metricLabel, samplingPointStatusLabel } from '@/utils/gis/gisDict'

export default {
  name: 'SampleDataDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    point: {
      type: Object,
      default: null
    },
    deviceCode: {
      type: String,
      default: ''
    },
    deviceId: {
      type: String,
      default: ''
    },
    metrics: {
      type: Object,
      default: () => ({})
    },
    collectTime: {
      type: String,
      default: ''
    }
  },
  computed: {
    dialogVisible: {
      get () {
        return this.visible
      },
      set (value) {
        this.$emit('update:visible', value)
      }
    },
    title () {
      return '采样数据到达提示'
    },
    pointLabel () {
      if (!this.point) {
        return '--'
      }
      return this.point.pointCode || this.point.pointName || this.point.samplingPointId
    },
    coordinateSystem () {
      return (this.point && this.point.coordinateSystem) || ''
    },
    statusLabel () {
      return samplingPointStatusLabel(this.point && this.point.status)
    },
    metricList () {
      return CORE_METRICS.map(code => {
        const value = this.metrics ? this.metrics[code] : undefined
        return {
          code,
          label: metricLabel(code),
          unit: METRIC_UNITS[code],
          display: (value === undefined || value === null || value === '') ? '--' : value
        }
      })
    }
  },
  methods: {
    format (value) {
      const num = Number(value)
      return isFinite(num) ? num.toFixed(6) : '--'
    }
  }
}
</script>

<style lang="scss" scoped>
.gis-sample-dialog {
  &__alert {
    margin-bottom: 12px;
  }

  &__desc {
    margin-bottom: 8px;
  }

  &__value {
    font-size: 18px;
    font-weight: 700;
    color: #1565c0;
    margin-right: 4px;
  }

  &__unit {
    color: #90a4ae;
    font-size: 12px;
  }
}

.gis-mono {
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
}
</style>
