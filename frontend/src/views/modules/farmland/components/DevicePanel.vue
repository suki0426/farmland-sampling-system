<template>
  <div class="gis-device-panel">
    <div class="gis-device-panel__toolbar">
      <el-button size="mini" icon="el-icon-refresh" :loading="loading" @click="$emit('refresh')">刷新设备</el-button>
      <el-button
        size="mini"
        :type="demoMode ? 'warning' : 'default'"
        :icon="demoMode ? 'el-icon-video-pause' : 'el-icon-video-play'"
        @click="$emit('toggle-demo')">
        {{ demoMode ? '停止演示推进' : '演示推进设备' }}
      </el-button>
      <el-button size="mini" plain icon="el-icon-turn-off" @click="$emit('simulate-offline')">模拟离线</el-button>
    </div>

    <div v-for="device in devices" :key="device.deviceId" class="gis-device-card" :class="{ 'is-active': device.deviceId === selectedDeviceId }" @click="$emit('select', device)">
      <div class="gis-device-card__head">
        <span class="gis-device-card__code">
          <i class="el-icon-truck"></i>
          {{ device.deviceCode || device.deviceId }}
        </span>
        <el-tag size="mini" :type="statusTagType(device.status)">{{ statusLabel(device.status) }}</el-tag>
      </div>
      <div class="gis-device-card__body">
        <div>
          {{ device.deviceName || '--' }}
          <span class="gis-device-card__category">{{ categoryLabel(device.category) }}</span>
        </div>
        <div class="gis-device-card__meta">
          <span>经度 {{ format(device.longitude) }}</span>
          <span>纬度 {{ format(device.latitude) }}</span>
        </div>
        <div class="gis-device-card__meta">
          <span>采集时间 {{ device.collectTime || '--' }}</span>
        </div>
        <div v-if="device.positionError" class="gis-device-card__error">
          <i class="el-icon-warning-outline"></i> 位置无效：{{ device.positionError }}
        </div>
        <div v-if="nextTarget" class="gis-device-card__guide">
          <i class="el-icon-position"></i>
          下一目标 {{ nextTarget.pointCode }} · 直线距离 {{ nextTarget.distanceText }}
        </div>
      </div>
    </div>

    <el-empty v-if="!devices.length" description="暂无设备数据" :image-size="60"></el-empty>
  </div>
</template>

<script>
/**
 * 设备面板（1号 前端GIS 岗位）
 *
 * 对应交付要求：
 *  - 「设备实时位置：至少 3 台设备实时/准实时更新位置」
 *  - 「设备轨迹：历史轨迹折线/轨迹点显示」（点击设备卡片即叠加该设备轨迹）
 *  - 「路线展示：显示 3号 算法生成的采样路线，并提示当前最近的未采样点」
 */
import { deviceStatusLabel, deviceStatusTagType } from '@/utils/gis/gisDict'
import { formatDistance } from '@/utils/gis/geometry'

export default {
  name: 'DevicePanel',
  props: {
    devices: {
      type: Array,
      default: () => []
    },
    selectedDeviceId: {
      type: String,
      default: ''
    },
    demoMode: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    guidance: {
      type: Object,
      default: null
    }
  },
  computed: {
    nextTarget () {
      const guidance = this.guidance
      if (!guidance || !guidance.targetPoint) {
        return null
      }
      return {
        pointCode: guidance.targetPoint.pointCode || guidance.targetPoint.samplingPointId,
        distanceText: formatDistance(guidance.distance)
      }
    }
  },
  methods: {
    statusLabel (status) {
      return deviceStatusLabel(status)
    },
    statusTagType (status) {
      return deviceStatusTagType(status)
    },
    /** 设备类别：字段约束 §3.1 要求消费 DeviceBriefDTO.category */
    categoryLabel (category) {
      if (!category) {
        return '未分类'
      }
      const map = {
        sampler: '采样终端',
        gateway: '网关',
        sensor: '传感器'
      }
      return map[category] || category
    },
    format (value) {
      const num = Number(value)
      return isFinite(num) ? num.toFixed(6) : '--'
    }
  }
}
</script>

<style lang="scss" scoped>
.gis-device-panel {
  &__toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;

    ::v-deep .el-button + .el-button {
      margin-left: 0;
    }
  }
}

.gis-device-card {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 8px 10px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;

  &:hover {
    border-color: #90caf9;
    box-shadow: 0 2px 8px rgba(25, 118, 210, 0.12);
  }

  &.is-active {
    border-color: #1976d2;
    background: #f5faff;
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  &__code {
    font-weight: 700;
    color: #0d47a1;

    i {
      margin-right: 4px;
      color: #1976d2;
    }
  }

  &__body {
    font-size: 12px;
    color: #546e7a;
    line-height: 18px;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  &__category {
    display: inline-block;
    margin-left: 6px;
    padding: 0 6px;
    border-radius: 8px;
    background: #eceff1;
    color: #546e7a;
    font-size: 11px;
  }

  &__error {
    color: #c62828;
  }

  &__guide {
    color: #d81b60;
    margin-top: 2px;
  }
}
</style>
