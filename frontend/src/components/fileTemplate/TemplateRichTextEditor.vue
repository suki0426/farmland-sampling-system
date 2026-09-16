<template>
  <div class="template-rich-text-editor" :class="`is-${size}`">
    <WangEditor
      ref="editor"
      :value="innerValue"
      :content="innerValue"
      :height="editorHeight"
      @input="handleInput"
      @editorContent="handleInput"
    />
  </div>
</template>

<script>
import WangEditor from '@/components/wangEditor'

export default {
  name: 'TemplateRichTextEditor',
  components: {
    WangEditor
  },
  props: {
    value: { type: String, default: '' },
    size: { type: String, default: 'default' }
  },
  data () {
    return {
      innerValue: ''
    }
  },
  computed: {
    editorHeight () {
      return this.size === 'large' ? 520 : 260
    }
  },
  watch: {
    value: {
      handler (value) {
        if ((value || '') === this.innerValue) return
        this.innerValue = value || ''
      },
      immediate: true
    }
  },
  methods: {
    handleInput (value) {
      if (value === this.innerValue) return
      this.innerValue = value || ''
      this.$emit('input', this.innerValue)
    }
  }
}
</script>

<style scoped>
.template-rich-text-editor {
  min-width: 0;
}
</style>
