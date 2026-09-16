<template>
  <div class="template-rule-list">
    <div
      v-for="column in columns"
      :key="column.name"
      class="template-rule-list__item"
    >
      <span>{{ column.name }}</span>
      <em>{{ column.desc }}</em>
    </div>
  </div>
</template>

<script>
import { TEMPLATE_COLUMNS } from './constants'

export default {
  name: 'TemplateRuleList',
  props: {
    columns: {
      type: Array,
      default: () => TEMPLATE_COLUMNS
    }
  }
}
</script>

<style scoped>
.template-rule-list {
  display: grid;
  gap: 10px;
}

.template-rule-list__item {
  display: grid;
  gap: 4px;
  padding: 12px 0;
  border-bottom: 1px solid var(--ul-line);
}

.template-rule-list__item:last-child {
  border-bottom: 0;
}

.template-rule-list__item span {
  color: var(--ul-text);
  font-size: 14px;
  font-weight: 800;
}

.template-rule-list__item em {
  color: var(--ul-muted);
  font-size: 13px;
  font-style: normal;
  line-height: 1.6;
}
</style>
