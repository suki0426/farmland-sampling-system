<template>
  <div class="gis-farmland-info">
    <el-form label-width="86px" size="mini" class="gis-farmland-info__form">
      <el-form-item label="农田名称">
        <span>{{ farmland.farmlandName || '--' }}</span>
      </el-form-item>
      <el-form-item label="farmlandId">
        <span class="gis-mono">{{ farmland.farmlandId || '--' }}</span>
      </el-form-item>
      <el-form-item label="农田编码">
        <span>{{ farmland.farmlandCode || '--' }}</span>
      </el-form-item>
      <el-form-item label="状态">
        <el-tag size="mini" :type="farmland.status === '1' || farmland.status === 'enable' ? 'success' : 'info'">
          {{ farmland.status === '1' ? '启用' : (farmland.status || '--') }}
        </el-tag>
      </el-form-item>
      <el-form-item label="估算面积">
        <span>{{ areaText }}</span>
      </el-form-item>
      <el-form-item label="边界环数">
        <span>{{ boundary.ringCount || 0 }} 个（含禁入区）</span>
      </el-form-item>
      <el-form-item label="坐标系">
        <span>{{ coordinateSystemText }}</span>
      </el-form-item>
    </el-form>

    <el-alert
      v-if="boundary.error"
      :title="boundary.error"
      type="error"
      :closable="false"
      show-icon
      class="gis-farmland-info__alert" />
    <el-alert
      v-else-if="boundary.notice"
      :title="boundary.notice"
      type="warning"
      :closable="false"
      show-icon
      class="gis-farmland-info__alert" />
  </div>
</template>

<script>
/**
 * 农田信息面板（1号 前端GIS 岗位）
 * 对应交付要求：「农田边界：GeoJSON/坐标边界绘制与选中效果」
 */
import { formatArea } from '@/utils/gis/sceneModel'
import { coordinateSystemLabel } from '@/utils/gis/gisDict'

export default {
  name: 'FarmlandInfoPanel',
  props: {
    farmland: {
      type: Object,
      default: () => ({})
    },
    boundary: {
      type: Object,
      default: () => ({})
    },
    coordinateSystem: {
      type: String,
      default: ''
    }
  },
  computed: {
    areaText () {
      return formatArea(this.boundary.area)
    },
    coordinateSystemText () {
      if (!this.coordinateSystem) {
        return '未声明'
      }
      return coordinateSystemLabel(this.coordinateSystem)
    }
  }
}
</script>

<style lang="scss" scoped>
.gis-farmland-info {
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

  &__alert {
    margin-top: 8px;
  }
}

.gis-mono {
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
  color: #37474f;
}
</style>
