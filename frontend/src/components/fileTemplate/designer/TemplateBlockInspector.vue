<template>
  <aside class="template-block-inspector">
    <div class="template-block-inspector__title">属性设置</div>

    <section class="template-block-inspector__section">
      <label>模板名称</label>
      <el-input size="small" v-model="template.templateName"></el-input>
      <label>文档分类</label>
      <el-input size="small" :value="docTypeLabel" disabled></el-input>
      <label>模板版本</label>
      <el-input size="small" v-model="template.versionNo"></el-input>
    </section>

    <section v-if="block" class="template-block-inspector__section">
      <label>二级标题名称</label>
      <el-input size="small" v-model="block.sectionTitle"></el-input>
      <label>默认内容</label>
      <TemplateRichTextEditor
        :key="`${block.clientId}-richtext`"
        v-model="block.defaultvalue"
      />
    </section>

    <section v-else class="template-block-inspector__empty">
      请选择一个内容块进行编辑。
    </section>
  </aside>
</template>

<script>
import { getTemplateDocTypeLabel } from '../constants'
import TemplateRichTextEditor from '../TemplateRichTextEditor'

export default {
  name: 'TemplateBlockInspector',
  components: {
    TemplateRichTextEditor
  },
  props: {
    template: { type: Object, required: true },
    block: { type: Object, default: null }
  },
  watch: {
    block: {
      handler () {
        this.ensureRichTextBlock()
      },
      immediate: true
    }
  },
  computed: {
    docTypeLabel () {
      if (this.$dictUtils && this.$dictUtils.getDictLabel) {
        return this.$dictUtils.getDictLabel('teaching_doc_type', this.template.docType, getTemplateDocTypeLabel(this.template.docType) || '-')
      }
      return getTemplateDocTypeLabel(this.template.docType) || '-'
    }
  },
  methods: {
    ensureRichTextBlock () {
      if (this.block) {
        this.block.componentType = 'richtext'
        this.block.requiredFlag = '1'
        this.block.visibleFlag = '1'
      }
    }
  }
}
</script>

<style scoped>
.template-block-inspector {
  min-height: 0;
  padding: 18px;
  border-left: 1px solid #d8e3f1;
  background: #f8fbff;
  overflow: auto;
}

.template-block-inspector__title {
  margin-bottom: 16px;
  color: #0f172a;
  font-weight: 800;
}

.template-block-inspector__section {
  margin-bottom: 18px;
  padding-bottom: 18px;
  border-bottom: 1px solid #d8e3f1;
}

.template-block-inspector label {
  display: block;
  margin: 12px 0 8px;
  color: #64748b;
  font-size: 13px;
}

.template-block-inspector__empty {
  color: #64748b;
  line-height: 1.8;
}
</style>
