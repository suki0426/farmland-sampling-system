<template>
  <TemplateRichTextEditor v-model="innerValue" />
</template>

<script>
import TemplateRichTextEditor from '@/components/fileTemplate/TemplateRichTextEditor'

export default {
  name: 'DocumentRichTextEditor',
  components: {
    TemplateRichTextEditor
  },
  props: {
    value: { type: String, default: '' }
  },
  computed: {
    innerValue: {
      get () {
        return this.value
      },
      set (value) {
        this.$emit('input', value)
      }
    }
  }
}
</script>
