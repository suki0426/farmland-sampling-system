<template>
  <aside class="structure-step-navigator" :class="{ 'is-editable': canEditStructure }">
    <div class="structure-step-navigator__title">{{ title }}</div>
    <div
      v-for="(section, index) in sections"
      :key="section.clientId || section.id || index"
      class="structure-step-navigator__row"
      :class="{ 'is-active': index === value }"
    >
      <button
        type="button"
        class="structure-step-navigator__item"
        @click="$emit('input', index)"
      >
        <span>{{ index + 1 }}</span>
        <span class="structure-step-navigator__name">{{ section.sectionTitle || emptyTitle }}</span>
      </button>
      <div
        v-if="canEditStructure && sections.length > 1"
        class="structure-step-navigator__actions">
        <el-button
          class="structure-step-navigator__sort"
          type="text"
          size="mini"
          icon="el-icon-arrow-up"
          title="上移"
          :disabled="index === 0"
          @click.stop="$emit('move-step', index, -1)">
        </el-button>
        <el-button
          class="structure-step-navigator__sort"
          type="text"
          size="mini"
          icon="el-icon-arrow-down"
          title="下移"
          :disabled="index === sections.length - 1"
          @click.stop="$emit('move-step', index, 1)">
        </el-button>
        <el-button
          class="structure-step-navigator__delete"
          type="text"
          size="mini"
          icon="el-icon-delete"
          title="删除"
          @click.stop="$emit('remove-step', index)">
        </el-button>
      </div>
    </div>
    <el-button
      v-if="canEditStructure"
      class="structure-step-navigator__add"
      size="mini"
      icon="el-icon-plus"
      @click="$emit('add-step')">
      {{ addLabel }}
    </el-button>
  </aside>
</template>

<script>
export default {
  name: 'StructureStepNavigator',
  props: {
    value: { type: Number, default: 0 },
    sections: {
      type: Array,
      default: () => []
    },
    mode: { type: String, default: 'readonly' },
    title: { type: String, default: '文档结构' },
    emptyTitle: { type: String, default: '未命名步骤' },
    addLabel: { type: String, default: '新增一级标题' }
  },
  computed: {
    canEditStructure () {
      return this.mode === 'template-edit'
    }
  }
}
</script>

<style scoped>
.structure-step-navigator {
  --structure-primary: var(--ul-primary, var(--defaultTheme, #0f172a));
  min-height: 0;
  padding: 18px;
  border-right: 1px solid #d8e3f1;
  background: #f8fbff;
  overflow: auto;
}

.structure-step-navigator__title {
  margin-bottom: 14px;
  color: #0f172a;
  font-weight: 800;
}

.structure-step-navigator__row {
  position: relative;
  width: 100%;
  min-height: 38px;
  margin-bottom: 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
}

.structure-step-navigator__row.is-active {
  background: #f1f5f9;
}

.structure-step-navigator__row:hover,
.structure-step-navigator__row:focus-within {
  background: #f8fafc;
}

.structure-step-navigator__row.is-active:hover,
.structure-step-navigator__row.is-active:focus-within {
  background: #f1f5f9;
}

.structure-step-navigator__item {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  width: 100%;
  min-width: 0;
  min-height: 38px;
  padding: 0 12px 0 10px;
  border: 0;
  background: transparent;
  color: #334155;
  text-align: left;
  cursor: pointer;
  transition: padding-right .16s ease;
}

.structure-step-navigator.is-editable .structure-step-navigator__row:hover .structure-step-navigator__item,
.structure-step-navigator.is-editable .structure-step-navigator__row:focus-within .structure-step-navigator__item {
  padding-right: 66px;
}

.structure-step-navigator__row.is-active .structure-step-navigator__item {
  color: var(--structure-primary);
}

.structure-step-navigator__item span:first-child {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 7px;
  background: #fff;
  color: var(--structure-primary);
  font-size: 12px;
  font-weight: 700;
}

.structure-step-navigator__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.structure-step-navigator__actions {
  box-sizing: border-box;
  position: absolute;
  top: 50%;
  right: 6px;
  z-index: 1;
  display: flex;
  transform: translateY(-50%);
  justify-content: flex-end;
  gap: 2px;
  width: 58px;
  padding-left: 6px;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  background: linear-gradient(90deg, rgba(248, 251, 255, 0), #f8fbff 28%);
  transition: opacity .16s ease, visibility .16s ease;
}

.structure-step-navigator__row:hover .structure-step-navigator__actions,
.structure-step-navigator__row:focus-within .structure-step-navigator__actions {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.structure-step-navigator__actions .el-button {
  width: 16px;
  height: 28px;
  padding: 0;
  margin: 0;
  line-height: 28px;
}

.structure-step-navigator__sort {
  color: #64748b;
}

.structure-step-navigator__delete {
  color: #ef4444;
}

.structure-step-navigator__add {
  justify-content: flex-start;
  width: 100%;
  margin-top: 8px;
  border-radius: 8px;
}
</style>
