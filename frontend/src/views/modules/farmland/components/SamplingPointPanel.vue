<template>
  <div class="gis-point-panel">
    <el-alert
      v-if="demoMode"
      title="当前为显式演示模式；但写操作仍然被禁用 —— v2.1 §3.2 未冻结任何采样点写接口。"
      type="warning"
      :closable="false"
      show-icon
      class="gis-point-panel__alert" />

    <div class="gis-point-panel__toolbar">
      <el-button
        size="mini"
        :type="pickMode ? 'danger' : 'primary'"
        :icon="pickMode ? 'el-icon-close' : 'el-icon-plus'"
        :disabled="!canPick"
        @click="$emit('toggle-pick')">
        {{ pickMode ? '退出手动选点' : '手动选点' }}
      </el-button>
      <el-button size="mini" icon="el-icon-refresh" :loading="loading" @click="$emit('refresh')">刷新点位</el-button>
      <!--
        写操作按钮保持**禁用**。
        合并评审意见 #1：/samplingPoint/saveBatch 与 /updateStatus 未在 v2.1 §3.2 中约定，
        且请求体信封写错（{ list: { farmlandId, taskId, points } }），后端无法解析。
        需 5号 冻结端点 / DTO / 权限后再启用。
      -->
      <el-tooltip
        effect="dark"
        placement="top"
        content="写接口尚未冻结：需 5号 补充采样点写接口的端点、DTO、权限后再联调">
        <span>
          <el-button
            size="mini"
            type="info"
            plain
            icon="el-icon-upload"
            disabled
            @click="$emit('save-manual')">
            提交手动点({{ pendingManualCount }}) · 接口未冻结
          </el-button>
        </span>
      </el-tooltip>
      <el-button
        size="mini"
        plain
        icon="el-icon-delete"
        :disabled="pendingManualCount === 0"
        @click="$emit('clear-manual-preview')">
        清空本地预览
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
      <el-table-column label="经度" min-width="98">
        <template slot-scope="scope">{{ format(scope.row.longitude) }}</template>
      </el-table-column>
      <el-table-column label="纬度" min-width="98">
        <template slot-scope="scope">{{ format(scope.row.latitude) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="78">
        <template slot-scope="scope">
          <el-tag size="mini" :type="statusTagType(scope.row.status)">
            {{ statusLabel(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="来源" width="66" align="center">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.manual" size="mini" type="warning" effect="plain">本地预览</el-tag>
          <span v-else>接口</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="128" align="center">
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
      共 {{ points.length }} 个采样点（任务书 M1 要求 3~4 个），已采样 {{ sampledCount }} 个，未采样 {{ points.length - sampledCount }} 个
      <span v-if="pendingManualCount">（其中 {{ pendingManualCount }} 个手动点为<b>本地预览，未写入后端</b>）</span>
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
 *
 * ⚠️ 合并评审意见 #1 修复：
 *   手动选点保留（这是 M1 要求的交互与落点校验），但**不提供写库能力** ——
 *   v2.1 §3.2 未约定任何采样点写接口，提交按钮保持禁用并说明原因。
 *
 * ⚠️ 合并评审意见 #2 修复：
 *   按钮可见性由 `canPick`（严格权限校验结果）决定，不再依赖"权限列表是否为空"。
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
    manualCount: {
      type: Number,
      default: 0
    },
    /** 是否允许「手动选点」这个交互（严格权限校验结果） */
    canPick: {
      type: Boolean,
      default: false
    },
    /** 是否处于显式声明的演示模式（仅用于界面提示） */
    demoMode: {
      type: Boolean,
      default: false
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
