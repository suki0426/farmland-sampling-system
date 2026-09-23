<template>
  <div class="gis-route-panel">
    <el-form label-width="94px" size="mini" class="gis-route-panel__form">
      <el-form-item label="taskId">
        <span class="gis-mono">{{ route.taskId || '--' }}</span>
      </el-form-item>
      <el-form-item label="算法">
        <el-tag size="mini" type="info">{{ route.method || '--' }}</el-tag>
      </el-form-item>
      <el-form-item label="总距离">
        <span class="gis-route-panel__strong">{{ route.distanceText }}</span>
      </el-form-item>
      <el-form-item label="预计耗时">
        <span>{{ durationText }}</span>
      </el-form-item>
      <el-form-item v-if="route.diagnostics" label="优化对比">
        <span>
          初始 {{ formatDistance(route.diagnostics.initialDistance) }}
          →
          优化后 {{ formatDistance(route.diagnostics.optimizedDistance) }}
          <el-tag v-if="improvement !== null" size="mini" type="success">缩短 {{ improvement }}%</el-tag>
        </span>
      </el-form-item>
    </el-form>

    <el-alert
      v-if="route.error"
      :title="route.error"
      type="warning"
      :closable="false"
      show-icon
      class="gis-route-panel__alert" />

    <div v-if="target" class="gis-route-panel__guide">
      <i class="el-icon-position"></i>
      最近未采样点：<b>{{ target.pointCode }}</b>
      （直线 {{ formatDistance(guidance.distance) }}）
      <div class="gis-route-panel__guide-sub">
        由 {{ guidance.deviceCode }} 前往；实际路线由 3号 算法给出
      </div>
    </div>
    <el-alert
      v-else-if="allSampled"
      title="全部采样点已完成采样"
      type="success"
      :closable="false"
      show-icon
      class="gis-route-panel__alert" />

    <div v-if="sequence.length" class="gis-route-panel__sequence">
      <div class="gis-route-panel__title">算法访问顺序</div>
      <div class="gis-route-panel__chips">
        <span v-for="(item, index) in sequence" :key="item.key" class="gis-route-panel__chip">
          <b>{{ index + 1 }}</b> {{ item.label }}
        </span>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * 路线面板（1号 前端GIS 岗位）
 * 对应交付要求：「路线展示：显示 3号 算法生成的采样路线，并提示当前最近的未采样点」
 *
 * 前端不实现路线优化算法：总距离/耗时/顺序全部来自 5号 下发的 NavigationRouteDTO；
 * 「最近未采样点」只做界面提示，若后端下发了 nextPoint 则优先采用后端结果。
 */
import { formatDistance } from '@/utils/gis/geometry'

export default {
  name: 'RoutePanel',
  props: {
    route: {
      type: Object,
      default: () => ({})
    },
    points: {
      type: Array,
      default: () => []
    },
    guidance: {
      type: Object,
      default: null
    }
  },
  computed: {
    durationText () {
      const seconds = Number(this.route.durationSeconds)
      if (!isFinite(seconds) || seconds <= 0) {
        return '--'
      }
      const minutes = Math.floor(seconds / 60)
      const rest = Math.round(seconds % 60)
      return `${minutes} 分 ${rest} 秒`
    },
    improvement () {
      const diagnostics = this.route.diagnostics
      if (!diagnostics || !diagnostics.initialDistance || !diagnostics.optimizedDistance) {
        return null
      }
      const ratio = 1 - diagnostics.optimizedDistance / diagnostics.initialDistance
      return (ratio * 100).toFixed(1)
    },
    target () {
      return this.guidance && this.guidance.targetPoint ? this.guidance.targetPoint : null
    },
    allSampled () {
      return this.points.length > 0 && this.points.every(p =>
        ['sampled', 'done', 'finished', 'completed', '2'].indexOf(String(p.status).toLowerCase()) !== -1)
    },
    sequence () {
      const ordered = this.route.orderedPoints || []
      return ordered.map((point, index) => ({
        key: point.samplingPointId || `idx-${index}`,
        label: point.pointCode || point.samplingPointId || `P${index + 1}`
      }))
    }
  },
  methods: {
    formatDistance
  }
}
</script>

<style lang="scss" scoped>
.gis-route-panel {
  &__form ::v-deep .el-form-item {
    margin-bottom: 4px;
  }

  &__form ::v-deep .el-form-item__label {
    color: #78909c;
    line-height: 26px;
  }

  &__form ::v-deep .el-form-item__content {
    line-height: 26px;
    color: #263238;
  }

  &__strong {
    font-size: 15px;
    font-weight: 700;
    color: #1565c0;
  }

  &__alert {
    margin-top: 6px;
  }

  &__guide {
    margin-top: 8px;
    padding: 8px 10px;
    border-radius: 4px;
    background: #fce4ec;
    color: #ad1457;
    font-size: 13px;
    line-height: 20px;
  }

  &__guide-sub {
    font-size: 12px;
    color: #d81b60;
  }

  &__sequence {
    margin-top: 10px;
  }

  &__title {
    font-size: 12px;
    color: #78909c;
    margin-bottom: 6px;
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__chip {
    background: #e3f2fd;
    color: #1565c0;
    border-radius: 12px;
    padding: 2px 10px;
    font-size: 12px;

    b {
      margin-right: 2px;
    }
  }
}

.gis-mono {
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
}
</style>
