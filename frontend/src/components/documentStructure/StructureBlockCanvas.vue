<template>
  <main
    class="structure-block-canvas"
    :class="{ 'is-document-fill': isDocumentFill, 'is-template-edit': isTemplateEdit }"
  >
    <div class="structure-block-canvas__head" :class="{ 'is-readonly': isReadonly }">
      <div>
        <h3>{{ section.sectionTitle || '未命名步骤' }}</h3>
        <p v-if="helperText">{{ helperText }}</p>
      </div>
      <el-input v-if="isTemplateEdit" size="small" v-model="section.sectionTitle" placeholder="一级标题名称"></el-input>
    </div>

    <div
      v-for="(block, index) in displayBlocks"
      :key="block.clientId || block.id || index"
      class="structure-block-canvas__block"
      :class="{ 'is-active': isTemplateEdit && block.clientId === activeBlockId, 'is-readonly': isReadonly }"
      @click="selectBlock(block)"
    >
      <template v-if="isDocumentFill">
        <label class="structure-block-canvas__field-label">
          {{ block.sectionTitle || '未命名内容块' }}
          <span v-if="block.requiredFlag === '1'">*</span>
        </label>
        <component
          :is="resolveEditor(block)"
          v-model="block.value"
          :size="editorSize"
          class="structure-block-canvas__editor"
        />
      </template>

      <template v-else-if="isReadonly">
        <label class="structure-block-canvas__field-label">
          {{ block.sectionTitle || '未命名内容块' }}
          <span v-if="block.requiredFlag === '1'">*</span>
        </label>
        <div class="structure-block-canvas__rich">{{ displayValue(block) }}</div>
      </template>

      <template v-else>
        <div class="structure-block-canvas__block-head">
          <strong>{{ block.sectionTitle || '未命名内容块' }}</strong>
        </div>
        <div class="structure-block-canvas__preview">
          {{ displayValue(block, '暂无默认内容，教师录入时显示为空白输入区。') }}
        </div>
      </template>

      <div v-if="isTemplateEdit" class="structure-block-canvas__actions">
        <el-button
          type="text"
          size="mini"
          icon="el-icon-arrow-up"
          title="上移"
          :disabled="index === 0"
          @click.stop="$emit('move-block', index, -1)">
        </el-button>
        <el-button
          type="text"
          size="mini"
          icon="el-icon-arrow-down"
          title="下移"
          :disabled="index === displayBlocks.length - 1"
          @click.stop="$emit('move-block', index, 1)">
        </el-button>
        <el-button type="text" size="mini" @click.stop="$emit('copy-block', block)">复制</el-button>
        <el-button type="text" size="mini" class="red" @click.stop="$emit('remove-block', block)">删除</el-button>
      </div>
    </div>

    <el-empty v-if="!displayBlocks.length" description="当前步骤没有可填写内容"></el-empty>
    <el-button v-if="isTemplateEdit" size="small" icon="el-icon-plus" @click="$emit('add-block')">新增二级标题</el-button>
  </main>
</template>

<script>
import TemplateRichTextEditor from '@/components/fileTemplate/TemplateRichTextEditor'

export default {
  name: 'StructureBlockCanvas',
  components: {
    TemplateRichTextEditor
  },
  props: {
    section: { type: Object, required: true },
    activeBlockId: { type: String, default: '' },
    mode: { type: String, default: 'readonly' }
  },
  computed: {
    isTemplateEdit () {
      return this.mode === 'template-edit'
    },
    isDocumentFill () {
      return this.mode === 'document-fill'
    },
    isReadonly () {
      return this.mode === 'readonly'
    },
    displayBlocks () {
      const children = this.section.children || this.section.sections || []
      if (this.isTemplateEdit) return children
      return children.filter(block => block.visibleFlag !== '0')
    },
    editorSize () {
      return this.isDocumentFill ? 'large' : 'default'
    },
    helperText () {
      if (this.isTemplateEdit) return '二级标题作为内容块，后续会用于教学文件录入和导入校验。'
      if (this.isDocumentFill) return ''
      return '以下为教学文档中已经填写或解析出的内容。'
    }
  },
  methods: {
    selectBlock (block) {
      if (!this.isTemplateEdit) return
      this.$emit('select-block', block.clientId)
    },
    resolveEditor () {
      return 'TemplateRichTextEditor'
    },
    stripRichText (value) {
      const source = String(value || '')
      if (!source) return ''
      return source
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\r/g, '')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]{2,}/g, ' ')
        .trim()
    },
    displayValue (block, fallback = '暂无内容') {
      const text = this.stripRichText(block.value || block.defaultvalue)
      return text || fallback
    }
  }
}
</script>

<style scoped>
.structure-block-canvas {
  --structure-primary: var(--ul-primary, var(--defaultTheme, #0f172a));
  min-height: 0;
  padding: 22px;
  background: #fff;
  overflow: auto;
}

.structure-block-canvas.is-document-fill {
  padding: 14px 18px 18px;
}

.structure-block-canvas__head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 20px;
  align-items: start;
  margin-bottom: 18px;
}

.structure-block-canvas__head.is-readonly,
.structure-block-canvas.is-document-fill .structure-block-canvas__head {
  grid-template-columns: minmax(0, 1fr);
}

.structure-block-canvas__head h3 {
  margin: 0 0 8px;
  color: #0f172a;
}

.structure-block-canvas.is-document-fill .structure-block-canvas__head h3 {
  margin-bottom: 10px;
  font-size: 22px;
}

.structure-block-canvas__head p {
  margin: 0;
  color: #64748b;
  line-height: 1.6;
}

.structure-block-canvas__block {
  margin-bottom: 14px;
  padding: 16px;
  border: 1px solid #d8e3f1;
  border-radius: 8px;
  background: #fbfdff;
}

.structure-block-canvas.is-document-fill .structure-block-canvas__block {
  padding: 14px;
  background: #fff;
}

.structure-block-canvas__block:not(.is-readonly) {
  cursor: pointer;
}

.structure-block-canvas__block.is-active {
  border-color: var(--structure-primary);
  box-shadow: 0 0 0 2px rgba(15, 23, 42, .08);
}

.structure-block-canvas__block-head {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  color: #0f172a;
}

.structure-block-canvas__preview,
.structure-block-canvas__value,
.structure-block-canvas__rich {
  min-height: 54px;
  padding: 12px;
  border: 1px solid #edf2f7;
  border-radius: 8px;
  background: #fff;
  color: #334155;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.structure-block-canvas__field-label {
  display: block;
  margin-bottom: 8px;
  color: #0f172a;
  font-weight: 700;
}

.structure-block-canvas__field-label span {
  color: #ef4444;
}

.structure-block-canvas__editor {
  width: 100%;
}

.structure-block-canvas__actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 10px;
}

.structure-block-canvas__actions .red {
  color: #ef4444;
}
</style>
