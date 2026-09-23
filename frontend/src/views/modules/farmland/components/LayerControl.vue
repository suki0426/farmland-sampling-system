<template>
  <div class="gis-layer-control">
    <div v-for="item in items" :key="item.key" class="gis-layer-control__row">
      <el-checkbox
        :value="layers[item.key] !== false"
        @change="value => $emit('update', { key: item.key, value })">
        <span class="gis-layer-control__label">
          <i :class="item.icon"></i>
          {{ item.label }}
        </span>
      </el-checkbox>
      <span v-if="item.count !== undefined && item.count !== null" class="gis-layer-control__count">{{ item.count }}</span>
    </div>
  </div>
</template>

<script>
/**
 * 图层管理（1号 前端GIS 岗位）
 * 对应交付要求：「高德地图：地图正常初始化、缩放、定位、图层管理」
 */
export default {
  name: 'LayerControl',
  props: {
    layers: {
      type: Object,
      default: () => ({})
    },
    counts: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    items () {
      return [
        { key: 'boundary', label: '农田边界 / 禁入区', icon: 'el-icon-crop', count: this.counts.boundary },
        { key: 'samplingPoint', label: '采样点', icon: 'el-icon-location', count: this.counts.samplingPoint },
        { key: 'device', label: '采样终端位置', icon: 'el-icon-truck', count: this.counts.device },
        { key: 'route', label: '算法采样路线', icon: 'el-icon-guide', count: this.counts.route },
        { key: 'trajectory', label: '历史轨迹', icon: 'el-icon-s-marketing', count: this.counts.trajectory },
        { key: 'guidance', label: '最近未采样点指引', icon: 'el-icon-position' },
        { key: 'label', label: '文字标注', icon: 'el-icon-price-tag' }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.gis-layer-control {
  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 30px;
  }

  &__label i {
    margin-right: 4px;
    color: #607d8b;
  }

  &__count {
    color: #90a4ae;
    font-size: 12px;
  }
}
</style>
