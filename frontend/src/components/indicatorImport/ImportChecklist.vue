<template>
  <div class="indicator-import-checklist">
    <div class="indicator-import-checklist__title">导入前检查</div>
    <div class="indicator-import-checklist__desc">
      上传前先确认这些规则，能减少重复导入和错误修正。
    </div>
    <div class="indicator-import-checklist__items">
      <label
        v-for="item in items"
        :key="item"
        class="indicator-import-checklist__item"
      >
        <span class="indicator-import-checklist__dot"></span>
        <span>{{ item }}</span>
      </label>
    </div>
    <el-button type="text" @click="$emit('show-rules')">
      查看完整字段规则
    </el-button>
  </div>
</template>

<script>
export default {
  name: 'ImportChecklist',
  data () {
    return {
      items: [
        '指标编码在同一指标体系内唯一',
        '一级指标上级编码留空',
        '二级及以下必须填写上级指标编码',
        '指标级别只能填写 1 到 5',
        '排序号用于同级节点排序'
      ]
    }
  }
}
</script>

<style scoped>
.indicator-import-checklist {
  padding: 18px;
  border: 1px solid var(--ul-line);
  border-radius: 24px;
  background: var(--ul-panel);
  box-shadow: var(--ul-shadow-sm);
}

.indicator-import-checklist__title {
  color: var(--ul-text);
  font-size: 18px;
  font-weight: 900;
}

.indicator-import-checklist__desc {
  margin-top: 6px;
  color: var(--ul-muted);
  font-size: 13px;
  line-height: 1.7;
}

.indicator-import-checklist__items {
  display: grid;
  gap: 11px;
  margin-top: 16px;
}

.indicator-import-checklist__item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  color: var(--ul-text);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.6;
}

.indicator-import-checklist__dot {
  width: 8px;
  height: 8px;
  flex: 0 0 auto;
  margin-top: 6px;
  border-radius: 50%;
  background: var(--ul-primary);
}

.indicator-import-checklist >>> .el-button {
  margin-top: 12px;
  padding-left: 0;
  font-weight: 800;
}
</style>
