<template>
  <div class="gis-point-panel">
    <div class="gis-point-panel__toolbar">
      <el-button
        size="mini"
        :type="pickMode ? 'danger' : 'primary'"
        :icon="pickMode ? 'el-icon-close' : 'el-icon-plus'"
        :disabled="!canEdit"
        @click="$emit('toggle-pick')">
        {{ pickMode ? '退出手动选点' : '手动选点' }}
      </el-button>
      <el-button size="mini" icon="el-icon-refresh" :loading="loading" @click="$emit('refresh')">刷新点位</el-button>
      <el-button
        size="mini"
        type="success"
        plain
        icon="el-icon-upload"
        :disabled="pendingManualCount === 0 || !canEdit"
        :loading="saving"
        @click="$emit('save-manual')">
        提交手动点({{ pendingManualCount }})
      </el-button>
    </div>

    <el-alert
      v-if="pickError"
      :title="pickError"
      type="error"
      :closable="true"
      show-icon
      class="gis-point-panel__alert"
      @close="$emit('clear-pick-error')" />

    <el-table
      ref="table"
      :data="points"
      size="mini"
      border
      height="240"
      highlight-current-row
      empty-text="暂无采样点数据"
      @current-change="row => $emit('select', row)">
      <el-table-column label="编号" width="62">
        <template slot-scope="scope">
          {{ scope.row.pointCode || scope.row.samplingPointId }}
        </template>
      </el-table-column>
      <el-table-column label="经度" min-width="100">
        <template slot-scope="scope">{{ format(scope.row.longitude) }}</template>
      </el-table-column>
      <el-table-column label="纬度" min-width="100">
        <template slot-scope="scope">{{ format(scope.row.latitude) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template slot-scope="scope">
          <el-tag size="mini" :type="statusTagType(scope.row.status)">
            {{ statusLabel(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="112" align="center">
        <template slot-scope="scope">
          <el-button
            type="text"
            size="mini"
            icon="el-icon-view"
            @click.stop="$emit('view-data', scope.row)">数据</el-button>
          <el-button
            v-if="scope.row.manual"
            type="text"
            size="mini"
            icon="el-icon-delete"
            @click.stop="$emit('remove-manual', scope.row)">移除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="gis-point-panel__summary">
      共 {{ points.length }} 个采样点，已采样 {{ sampledCount }} 个，未采样 {{ points.length - sampledCount }} 个
      <span v-if="pendingManualCount">（其中 {{ pendingManualCount }} 个手动点待提交）</span>
    </div>
  </div>
</template>

<script>
/**
 * 采样点面板（1号 前端GIS 岗位）
 *
 * 对应交付要求：
 *  - 「采样点：支持在农田内手动选择 3~4 个采样点；点位展示、状态样式、点击信息，点必须在多边形内」
 *  - 「到达采样点后，标记该点状态为已采样，弹出窗口展示 5 项采样数据」
 */
import { samplingPointStatusLabel, samplingPointStatusTagType } from '@/utils/gis/gisDict'
import { isSampled } from '@/utils/gis/geometry'

export default {
  name: 'SamplingPointPanel',
  props: {
    points: {
      type: Array,
      default: () => []
    },
    pickMode: {
      type: Boolean,
      default: false
    },
    pickError: {
      type: String,
      default: ''
    },
    loading: {
      type: Boolean,
      default: false
    },
    saving: {
      type: Boolean,
      default: false
    },
    manualCount: {
      type: Number,
      default: 0
    },
    /** 是否允许写操作（权限校验结果；平台未下发权限时由父组件放行） */
    canEdit: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    sampledCount () {
      return this.points.filter(p => isSampled(p.status)).length
    },
    pendingManualCount () {
      return this.manualCount
    }
  },
  methods: {
    statusLabel (status) {
      return samplingPointStatusLabel(status)
    },
    statusTagType (status) {
      return samplingPointStatusTagType(status)
    },
    format (value) {
      const num = Number(value)
      return isFinite(num) ? num.toFixed(6) : '--'
    }
  }
}
</script>

<style lang="scss" scoped>
.gis-point-panel {
  &__toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;

    ::v-deep .el-button + .el-button {
      margin-left: 0;
    }
  }

  &__alert {
    margin-bottom: 8px;
  }

  &__summary {
    margin-top: 6px;
    font-size: 12px;
    color: #607d8b;
  }
}
</style>
