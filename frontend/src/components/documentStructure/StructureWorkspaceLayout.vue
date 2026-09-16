<template>
  <div
    class="structure-workspace-layout"
    :class="[`is-${canvasMode}`, { 'has-side': hasSide }]"
    v-loading="loading"
  >
    <header class="structure-workspace-layout__header">
      <div class="structure-workspace-layout__header-main">
        <el-button type="text" icon="el-icon-back" @click="$emit('back')">{{
          backText
        }}</el-button>
        <div class="structure-workspace-layout__title-area">
          <h2>{{ title }}</h2>
          <div class="structure-workspace-layout__tags">
            <span
              v-for="(tag, index) in visibleTags"
              :key="`${tag.label}-${index}`"
              class="structure-workspace-layout__tag"
              :class="tagClass(tag)"
            >
              <span class="structure-workspace-layout__tag-text">{{ tag.label }}</span>
            </span>
          </div>
        </div>
      </div>
      <div class="structure-workspace-layout__actions">
        <slot name="actions"></slot>
      </div>
    </header>

    <section v-if="hasBase" class="structure-workspace-layout__base">
      <slot name="base">
        <dl class="structure-workspace-layout__info">
          <div v-for="item in normalizedInfoItems" :key="item.label">
            <dt>{{ item.label }}</dt>
            <dd>{{ item.value || "-" }}</dd>
          </div>
        </dl>
      </slot>
    </section>

    <section class="structure-workspace-layout__workspace">
      <StructureStepNavigator
        :value="value"
        :mode="navigatorMode"
        :title="navigatorTitle"
        :sections="sections"
        @input="$emit('input', $event)"
        @add-step="$emit('add-step')"
        @move-step="forwardMoveStep"
        @remove-step="$emit('remove-step', $event)"
      />
      <StructureBlockCanvas
        v-if="activeSection"
        :section="activeSection"
        :active-block-id="activeBlockId"
        :mode="canvasMode"
        @select-block="$emit('select-block', $event)"
        @add-block="$emit('add-block')"
        @move-block="forwardMoveBlock"
        @copy-block="$emit('copy-block', $event)"
        @remove-block="$emit('remove-block', $event)"
      />
      <el-empty v-else description="暂无结构内容"></el-empty>
      <slot name="side"></slot>
    </section>
  </div>
</template>

<script>
import StructureBlockCanvas from "@/components/documentStructure/StructureBlockCanvas";
import StructureStepNavigator from "@/components/documentStructure/StructureStepNavigator";

export default {
  name: "StructureWorkspaceLayout",
  components: {
    StructureBlockCanvas,
    StructureStepNavigator,
  },
  props: {
    value: { type: Number, default: 0 },
    activeBlockId: { type: String, default: "" },
    loading: { type: Boolean, default: false },
    title: { type: String, default: "教学文档" },
    backText: { type: String, default: "返回" },
    tags: {
      type: Array,
      default: () => [],
    },
    infoItems: {
      type: Array,
      default: () => [],
    },
    sections: {
      type: Array,
      default: () => [],
    },
    navigatorTitle: { type: String, default: "文档结构" },
    navigatorMode: { type: String, default: "readonly" },
    canvasMode: { type: String, default: "readonly" },
    sideVisible: { type: Boolean, default: false },
  },
  computed: {
    visibleTags() {
      return (this.tags || []).filter((tag) => tag && tag.label);
    },
    normalizedInfoItems() {
      return (this.infoItems || []).filter((item) => item && item.label);
    },
    hasBase() {
      return Boolean(this.$slots.base || this.normalizedInfoItems.length);
    },
    hasSide() {
      return this.sideVisible;
    },
    activeSection() {
      return this.sections[this.value];
    },
  },
  methods: {
    forwardMoveStep(index, direction) {
      this.$emit("move-step", index, direction);
    },
    forwardMoveBlock(index, direction) {
      this.$emit("move-block", index, direction);
    },
    tagClass(tag) {
      return tag && tag.type
        ? `is-${tag.type}`
        : "is-primary";
    },
  },
};
</script>

<style scoped>
.structure-workspace-layout {
  --structure-primary: var(--ul-primary, var(--defaultTheme, #0f172a));
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 10px 12px 12px;
  background: #f6f8fb;
  color: #0f172a;
  overflow: hidden;
}

.structure-workspace-layout__header,
.structure-workspace-layout__base,
.structure-workspace-layout__workspace {
  width: 100%;
  border: 1px solid #d8e3f1;
  border-radius: 8px;
  background: #fff;
}

.structure-workspace-layout__header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 10px 14px;
  margin-bottom: 8px;
}

.structure-workspace-layout__header .el-button--text {
  padding: 0;
  color: var(--structure-primary);
  font-weight: 700;
}

.structure-workspace-layout__header-main,
.structure-workspace-layout__title-area {
  display: flex;
  align-items: center;
  min-width: 0;
}

.structure-workspace-layout__header-main {
  flex: 1 1 auto;
  gap: 14px;
  min-width: 0;
}

.structure-workspace-layout__title-area {
  flex: 1 1 auto;
  flex-wrap: wrap;
  gap: 6px 10px;
  min-width: 0;
  line-height: normal;
}

.structure-workspace-layout__header h2 {
  flex: 0 1 auto;
  min-width: 0;
  max-width: min(420px, 100%);
  margin: 0;
  overflow: hidden;
  color: #0f172a;
  font-size: 18px;
  line-height: 24px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.structure-workspace-layout__tags,
.structure-workspace-layout__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.structure-workspace-layout__tags {
  flex: 1 1 auto;
  min-width: 0;
}

.structure-workspace-layout__actions {
  flex: 0 0 auto;
  margin-left: auto;
}

.structure-workspace-layout__tag {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  min-width: 42px;
  padding: 0 10px;
  border: 1px solid #cfe3ff;
  border-radius: 5px;
  background: #edf6ff;
  color: #2f88ff;
  font-size: 12px;
  font-weight: 600;
  line-height: 22px;
  vertical-align: middle;
}

.structure-workspace-layout__tag.is-success {
  border-color: #d8edce;
  background: #f0faeb;
  color: #52b33f;
}

.structure-workspace-layout__tag.is-warning {
  border-color: #f7e0b8;
  background: #fff7e8;
  color: #d89527;
}

.structure-workspace-layout__tag.is-danger {
  border-color: #f8d1d1;
  background: #fff0f0;
  color: #e45f5f;
}

.structure-workspace-layout__tag-text {
  display: block;
  max-width: 132px;
  overflow: hidden;
  line-height: 22px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.structure-workspace-layout__actions >>> .el-button {
  align-self: center;
}

.structure-workspace-layout__base {
  flex: 0 0 auto;
  padding: 10px 14px 0;
  margin-bottom: 8px;
}

.structure-workspace-layout__base >>> .el-form-item {
  margin-bottom: 10px;
}

.structure-workspace-layout__info {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 0 0 10px;
}

.structure-workspace-layout__info dt {
  color: #64748b;
  font-size: 13px;
}

.structure-workspace-layout__info dd {
  margin: 6px 0 0;
  overflow: hidden;
  color: #0f172a;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.structure-workspace-layout__workspace {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: 210px minmax(0, 1fr);
  overflow: hidden;
}

.structure-workspace-layout.has-side .structure-workspace-layout__workspace {
  grid-template-columns: 210px minmax(0, 1fr) 300px;
}

@media (max-width: 720px) {
  .structure-workspace-layout {
    overflow: auto;
  }

  .structure-workspace-layout__header,
  .structure-workspace-layout__header-main,
  .structure-workspace-layout__title-area {
    align-items: flex-start;
  }

  .structure-workspace-layout__header,
  .structure-workspace-layout__title-area {
    flex-direction: column;
  }

  .structure-workspace-layout__info,
  .structure-workspace-layout__workspace,
  .structure-workspace-layout.has-side .structure-workspace-layout__workspace {
    grid-template-columns: 1fr;
  }
}
</style>
