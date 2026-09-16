<template>
  <div class="template-manual-build-step">
    <aside class="template-manual-build-step__steps">
      <h4>一级标题</h4>
      <div
        v-for="(section, index) in sections"
        :key="section.clientId"
        class="template-manual-build-step__step-row"
        :class="{ 'is-active': activeIndex === index }"
      >
        <button
          type="button"
          class="template-manual-build-step__step-button"
          @click="activeIndex = index"
        >
          <span>{{ index + 1 }}</span>
          <span class="template-manual-build-step__step-title">{{ section.sectionTitle || '未命名步骤' }}</span>
        </button>
        <el-button
          v-if="sections.length > 1"
          class="template-manual-build-step__step-delete"
          type="text"
          size="mini"
          icon="el-icon-delete"
          @click.stop="removeSection(index)">
        </el-button>
      </div>
      <el-button
        class="template-manual-build-step__add-section"
        size="mini"
        icon="el-icon-plus"
        @click="addSection">
        新增一级标题
      </el-button>
    </aside>

    <section class="template-manual-build-step__main">
      <div class="template-manual-build-step__head">
        <div>
          <h4>{{ activeSection.sectionTitle }}</h4>
          <p>手动新增一级标题与二级标题，生成模板草稿后可进入编辑器继续完善。</p>
        </div>
        <el-input size="small" v-model="activeSection.sectionTitle" placeholder="一级标题名称"></el-input>
      </div>

      <div
        v-for="child in activeSection.children"
        :key="child.clientId"
        class="template-manual-build-step__block"
      >
        <el-row :gutter="12">
          <el-col :span="16">
            <el-input size="small" v-model="child.sectionTitle" placeholder="二级标题名称"></el-input>
          </el-col>
          <el-col :span="8" class="template-manual-build-step__actions">
            <el-button type="text" size="mini" @click="copyBlock(child)">复制</el-button>
            <el-button type="text" size="mini" class="red" @click="removeBlock(child)">删除</el-button>
          </el-col>
        </el-row>
        <TemplateRichTextEditor
          :key="`${child.clientId}-richtext`"
          class="template-manual-build-step__richtext"
          v-model="child.defaultvalue"
        />
      </div>

      <el-button size="small" icon="el-icon-plus" @click="addBlock">新增二级标题</el-button>
    </section>

    <div class="template-manual-build-step__footer">
      <el-button size="small" @click="$emit('back')">上一步</el-button>
      <el-button size="small" @click="submit(true)">保存草稿</el-button>
      <el-button size="small" type="primary" @click="submit(false)">确认生成模板</el-button>
    </div>
  </div>
</template>

<script>
import { DEFAULT_MANUAL_SECTIONS, getTemplateDocTypeLabel } from './constants'
import { createTemplateDraft, createTemplateSection, ensureUniqueSectionCodes } from './utils'
import TemplateRichTextEditor from './TemplateRichTextEditor'

export default {
  name: 'TemplateManualBuildStep',
  components: {
    TemplateRichTextEditor
  },
  props: {
    form: { type: Object, required: true }
  },
  data () {
    return {
      activeIndex: 0,
      sections: []
    }
  },
  computed: {
    activeSection () {
      return this.sections[this.activeIndex] || { children: [] }
    }
  },
  created () {
    this.sections = DEFAULT_MANUAL_SECTIONS.map((section, index) => createTemplateSection(section, {
      sortNo: index + 1,
      sectionLevel: 1
    }))
  },
  methods: {
    addSection () {
      this.sections.push(createTemplateSection({
        sectionTitle: `新增步骤${this.sections.length + 1}`,
        children: [{ sectionTitle: '新增内容块', componentType: 'richtext' }]
      }, {
        sortNo: this.sections.length + 1,
        sectionLevel: 1
      }))
      this.activeIndex = this.sections.length - 1
    },
    removeSection (index) {
      if (this.sections.length <= 1) {
        this.$message.warning('至少保留一个一级标题')
        return
      }
      const section = this.sections[index]
      const title = section && section.sectionTitle ? section.sectionTitle : '当前一级标题'
      this.$confirm(`确定删除一级标题“${title}”吗？其下所有二级标题也会一起删除。`, '提示', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.sections.splice(index, 1)
        this.sections.forEach((item, itemIndex) => {
          item.sortNo = itemIndex + 1
        })
        if (this.activeIndex >= this.sections.length) {
          this.activeIndex = this.sections.length - 1
        } else if (this.activeIndex > index) {
          this.activeIndex -= 1
        }
      }).catch(() => {})
    },
    addBlock () {
      this.activeSection.children.push(createTemplateSection({
        sectionTitle: `新增内容块${this.activeSection.children.length + 1}`,
        componentType: 'richtext'
      }, {
        sortNo: this.activeSection.children.length + 1,
        sectionLevel: 2,
        parentClientId: this.activeSection.clientId
      }))
    },
    copyBlock (block) {
      this.activeSection.children.push(createTemplateSection({
        ...block,
        id: '',
        clientId: '',
        sectionTitle: `${block.sectionTitle}副本`,
        componentType: 'richtext'
      }, {
        sortNo: this.activeSection.children.length + 1,
        sectionLevel: 2,
        parentClientId: this.activeSection.clientId
      }))
    },
    removeBlock (block) {
      this.activeSection.children = this.activeSection.children.filter(item => item.clientId !== block.clientId)
    },
    normalizeRequiredVisible () {
      this.sections.forEach(section => {
        ;(section.children || []).forEach(child => {
          child.requiredFlag = '1'
          child.visibleFlag = '1'
          child.componentType = 'richtext'
        })
      })
    },
    submit (saveOnly) {
      this.normalizeRequiredVisible()
      const payload = createTemplateDraft({
        ...this.form,
        templateName: this.form.templateName || `${getTemplateDocTypeLabel(this.form.docType) || '教学文档'}模板 V1`,
        sourceMode: 'manual',
        sections: this.sections
      })
      ensureUniqueSectionCodes(payload)
      this.$emit('confirm', payload, { saveOnly })
    }
  }
}
</script>

<style scoped>
.template-manual-build-step {
  --template-primary: var(--ul-primary, var(--defaultTheme, #0f172a));
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 16px;
}

.template-manual-build-step__steps,
.template-manual-build-step__main {
  border: 1px solid #d8e3f1;
  border-radius: 16px;
  background: #fff;
  padding: 18px;
}

.template-manual-build-step h4 {
  margin: 0 0 12px;
  color: #0f172a;
}

.template-manual-build-step p {
  margin: 0;
  color: #64748b;
}

.template-manual-build-step__steps {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.template-manual-build-step__step-row {
  display: flex;
  align-items: center;
  min-height: 38px;
  border-radius: 9px;
  background: transparent;
}

.template-manual-build-step__step-row.is-active {
  background: #f1f5f9;
  color: var(--template-primary);
}

.template-manual-build-step__step-button {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  min-height: 38px;
  padding: 0 10px;
  border: 0;
  background: transparent;
  color: #334155;
  text-align: left;
  cursor: pointer;
}

.template-manual-build-step__step-row.is-active .template-manual-build-step__step-button {
  color: var(--template-primary);
}

.template-manual-build-step__step-button span:first-child {
  flex: 0 0 auto;
}

.template-manual-build-step__step-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-manual-build-step__step-delete {
  flex: 0 0 auto;
  margin-right: 6px;
  color: #ef4444;
}

.template-manual-build-step__add-section {
  justify-content: flex-start;
  width: 100%;
  margin-top: 4px;
  text-align: left;
}

.template-manual-build-step__head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 240px;
  gap: 20px;
  align-items: start;
  margin-bottom: 16px;
}

.template-manual-build-step__block {
  margin-bottom: 12px;
  padding: 14px;
  border: 1px solid #d8e3f1;
  border-radius: 12px;
  background: #fbfdff;
}

.template-manual-build-step__richtext {
  margin-top: 12px;
}

.template-manual-build-step__actions {
  text-align: right;
}

.template-manual-build-step__footer {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
