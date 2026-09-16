<template>
  <div class="document-category-selector">
    <button
      v-for="item in resolvedOptions"
      :key="item.value"
      type="button"
      class="document-category-selector__item"
      :class="{ 'is-active': item.value === value }"
      @click="$emit('input', item.value)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<script>
import { TEMPLATE_DOC_TYPES } from '@/components/fileTemplate/constants'

export default {
  name: 'DocumentCategorySelector',
  props: {
    value: { type: String, default: '' },
    options: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    resolvedOptions () {
      if (this.options && this.options.length) return this.options
      if (this.$dictUtils && this.$dictUtils.getDictList) {
        const dictOptions = this.$dictUtils.getDictList('teaching_doc_type')
        if (dictOptions && dictOptions.length) return dictOptions
      }
      return TEMPLATE_DOC_TYPES
    }
  }
}
</script>

<style scoped>
.document-category-selector {
  --structure-primary: var(--ul-primary, var(--defaultTheme, #0f172a));
  --structure-primary-hover: var(--ul-button-hover, #253047);
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.document-category-selector__item {
  min-width: 104px;
  height: 38px;
  padding: 0 16px;
  border: 1px solid #d8e3f1;
  border-radius: 8px;
  background: #fff;
  color: #334155;
  cursor: pointer;
  transition: border-color .16s ease, background .16s ease, color .16s ease;
}

.document-category-selector__item:hover {
  border-color: var(--structure-primary);
  color: var(--structure-primary);
}

.document-category-selector__item.is-active {
  border-color: var(--structure-primary);
  background: var(--structure-primary);
  color: #fff;
}

.document-category-selector__item.is-active:hover {
  border-color: var(--structure-primary-hover);
  background: var(--structure-primary-hover);
}
</style>
