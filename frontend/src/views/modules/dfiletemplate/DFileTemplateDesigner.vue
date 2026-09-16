<template>
  <TemplateEditorWorkspace
    :template-id="templateId"
    :readonly="readonly"
  />
</template>

<script>
import TemplateEditorWorkspace from '@/components/fileTemplate/designer/TemplateEditorWorkspace'

export default {
  name: 'DFileTemplateDesigner',
  components: {
    TemplateEditorWorkspace
  },
  computed: {
    templateId () {
      return this.$route.query.id || ''
    },
    readonly () {
      return this.$route.query.mode === 'preview'
    }
  }
}
</script>
