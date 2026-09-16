<template>
  <DocumentCategorySelector
    :value="value"
    :options="options"
    @input="$emit('input', $event)"
  />
</template>

<script>
import DocumentCategorySelector from '@/components/documentStructure/DocumentCategorySelector'
import { TEMPLATE_DOC_TYPES } from './constants'

export default {
  name: 'TemplateCategorySelector',
  components: {
    DocumentCategorySelector
  },
  props: {
    value: { type: String, default: '' },
    options: {
      type: Array,
      default: () => TEMPLATE_DOC_TYPES
    }
  }
}
</script>
