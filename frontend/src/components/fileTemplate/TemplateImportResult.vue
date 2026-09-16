<template>
  <div class="template-import-result">
    <div class="template-import-result__status">
      <span class="template-import-result__icon">✓</span>
      <h3>模板草稿已生成</h3>
      <p>已生成可编辑的模板草稿，建议进入编辑器继续完善结构和默认内容。</p>
    </div>
    <div class="template-import-result__summary">
      <div><span>模板名称</span><strong>{{ template.templateName }}</strong></div>
      <div><span>文档分类</span><strong>{{ docTypeLabel }}</strong></div>
      <div><span>版本号</span><strong>{{ template.versionNo }}</strong></div>
      <div><span>步骤页</span><strong>{{ template.sections.length }}</strong></div>
      <div><span>内容块</span><strong>{{ blockCount }}</strong></div>
      <div><span>创建方式</span><strong>手动录入</strong></div>
    </div>
    <div class="template-import-result__actions">
      <el-button size="small" @click="$emit('close')">返回列表</el-button>
      <el-button size="small" @click="$emit('again')">继续创建</el-button>
      <el-button size="small" type="primary" @click="$emit('edit', template)">进入编辑</el-button>
    </div>
  </div>
</template>

<script>
import { getTemplateDocTypeLabel } from './constants'

export default {
  name: 'TemplateImportResult',
  props: {
    template: { type: Object, required: true }
  },
  computed: {
    blockCount () {
      return (this.template.sections || []).reduce((sum, section) => sum + ((section.children || []).length), 0)
    },
    docTypeLabel () {
      if (this.$dictUtils && this.$dictUtils.getDictLabel) {
        return this.$dictUtils.getDictLabel('teaching_doc_type', this.template.docType, getTemplateDocTypeLabel(this.template.docType) || '-')
      }
      return getTemplateDocTypeLabel(this.template.docType) || '-'
    }
  }
}
</script>

<style scoped>
.template-import-result {
  --template-primary: var(--ul-primary, var(--defaultTheme, #0f172a));
  display: grid;
  grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr);
  gap: 20px;
}

.template-import-result__status,
.template-import-result__summary {
  padding: 28px;
  border: 1px solid #d8e3f1;
  border-radius: 16px;
  background: #fff;
}

.template-import-result__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: #f1f5f9;
  color: var(--template-primary);
  font-size: 30px;
  font-weight: 800;
}

.template-import-result h3 {
  margin: 18px 0 10px;
  color: #0f172a;
}

.template-import-result p {
  color: #64748b;
  line-height: 1.8;
}

.template-import-result__summary {
  display: grid;
  gap: 12px;
}

.template-import-result__summary div {
  display: flex;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid #edf2f7;
}

.template-import-result__summary span {
  color: #64748b;
}

.template-import-result__summary strong {
  color: #0f172a;
}

.template-import-result__actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
