<template>
  <section class="indicator-tree-panel">
    <div class="indicator-tree-panel__head">
      <div>
        <div class="indicator-tree-panel__title">五级指标树</div>
        <div class="indicator-tree-panel__desc">按编码和层级浏览指标结构</div>
      </div>
      <el-button size="mini" round @click="$emit('refresh')">刷新</el-button>
    </div>

    <el-input
      v-model="localKeyword"
      class="indicator-tree-panel__search"
      clearable
      size="small"
      prefix-icon="el-icon-search"
      placeholder="搜索指标编码 / 名称"
      @input="$emit('search', localKeyword)"
    />

    <div class="indicator-tree-panel__body" v-loading="loading">
      <el-tree
        v-if="treeData.length"
        ref="tree"
        class="indicator-tree-panel__tree"
        node-key="id"
        :data="treeData"
        :props="treeProps"
        :default-expanded-keys="defaultExpandedKeys"
        :expand-on-click-node="false"
        :filter-node-method="filterNode"
        :highlight-current="false"
        @node-click="handleNodeClick"
      >
        <div
          slot-scope="{ data }"
          class="indicator-tree-panel__node"
          :class="{ 'is-active': data.id === selectedId }"
          :data-indicator-id="data.id"
        >
          <div class="indicator-tree-panel__node-copy">
            <span class="indicator-tree-panel__node-code">{{ data.code }}</span>
            <span class="indicator-tree-panel__node-name">{{ data.name }}</span>
          </div>
          <span class="indicator-tree-panel__node-level">L{{ data.level }}</span>
        </div>
      </el-tree>

      <div v-else class="indicator-tree-panel__empty">
        <div>
          <strong>暂无指标数据</strong>
          <span>可先导入 Excel 文件生成指标结构。</span>
          <el-button type="primary" round size="small" @click="$emit('import')">
            去导入
          </el-button>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'IndicatorTreePanel',
  props: {
    treeData: { type: Array, default: () => [] },
    selectedId: { type: String, default: '' },
    keyword: { type: String, default: '' },
    loading: { type: Boolean, default: false }
  },
  data () {
    return {
      localKeyword: this.keyword,
      treeProps: {
        label: 'name',
        children: 'children'
      }
    }
  },
  computed: {
    defaultExpandedKeys () {
      return this.treeData.map(node => node.id)
    }
  },
  watch: {
    keyword (value) {
      this.localKeyword = value
      this.filterTree(value)
    },
    treeData () {
      this.$nextTick(() => {
        this.filterTree(this.localKeyword)
        this.revealSelectedNode(this.selectedId)
      })
    },
    selectedId (value) {
      this.$nextTick(() => this.revealSelectedNode(value))
    }
  },
  mounted () {
    this.filterTree(this.localKeyword)
    this.revealSelectedNode(this.selectedId)
  },
  methods: {
    filterTree (value) {
      if (this.$refs.tree) {
        this.$refs.tree.filter(value)
      }
    },
    filterNode (value, data) {
      if (!value) return true
      const keyword = value.toLowerCase()
      return `${data.code} ${data.name}`.toLowerCase().indexOf(keyword) > -1
    },
    handleNodeClick (data) {
      this.$emit('select', data)
    },
    revealSelectedNode (id) {
      if (!this.$refs.tree || !id) return

      this.$refs.tree.setCurrentKey(id)
      const treeNode = this.$refs.tree.getNode(id)
      let parent = treeNode && treeNode.parent
      while (parent) {
        parent.expanded = true
        parent = parent.parent
      }

      this.$nextTick(() => {
        const nodeEl = this.$el.querySelector(`[data-indicator-id="${id}"]`)
        if (nodeEl && nodeEl.scrollIntoView) {
          nodeEl.scrollIntoView({ block: 'nearest' })
        }
      })
    }
  }
}
</script>

<style scoped>
.indicator-tree-panel {
  display: grid;
  min-height: 640px;
  grid-template-rows: auto auto 1fr;
  padding: 18px;
  border: 1px solid var(--ul-line);
  border-radius: 28px;
  background: rgba(255, 255, 255, .92);
  box-shadow: var(--ul-shadow-sm);
}

.indicator-tree-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.indicator-tree-panel__title {
  color: var(--ul-text);
  font-size: 18px;
  font-weight: 900;
}

.indicator-tree-panel__desc {
  margin-top: 6px;
  color: var(--ul-muted);
  font-size: 13px;
  line-height: 1.5;
}

.indicator-tree-panel__search {
  margin: 16px 0;
}

.indicator-tree-panel__search >>> .el-input__inner {
  border-radius: 15px;
  border-color: var(--ul-line);
  background: var(--ul-panel-soft);
}

.indicator-tree-panel__body {
  min-height: 0;
  overflow: auto;
}

.indicator-tree-panel__tree {
  background: transparent;
}

.indicator-tree-panel__tree >>> .el-tree-node__content {
  height: auto;
  min-height: 46px;
  margin-bottom: 8px;
  border-radius: 16px;
}

.indicator-tree-panel__tree >>> .el-tree-node__content:hover {
  background: transparent;
}

.indicator-tree-panel__node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 10px;
  padding: 9px 10px;
  border: 1px solid transparent;
  border-radius: 16px;
  color: var(--ul-text);
  transition: background .18s ease, border-color .18s ease, color .18s ease;
}

.indicator-tree-panel__node.is-active {
  border-color: var(--ul-primary);
  background: var(--ul-primary);
  color: var(--ul-primary-contrast);
}

.indicator-tree-panel__node-copy {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.indicator-tree-panel__node-code {
  color: inherit;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: .04em;
  opacity: .72;
}

.indicator-tree-panel__node-name {
  overflow: hidden;
  font-size: 14px;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.indicator-tree-panel__node-level {
  flex: 0 0 auto;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(100, 116, 139, .12);
  color: inherit;
  font-size: 11px;
  font-weight: 900;
}

.indicator-tree-panel__node.is-active .indicator-tree-panel__node-level {
  background: rgba(255, 255, 255, .16);
}

.indicator-tree-panel__empty {
  display: grid;
  min-height: 260px;
  place-items: center;
  border: 1px dashed var(--ul-line-strong);
  border-radius: 22px;
  color: var(--ul-muted);
  font-size: 14px;
  text-align: center;
}

.indicator-tree-panel__empty div {
  display: grid;
  justify-items: center;
  gap: 10px;
}

.indicator-tree-panel__empty strong {
  color: var(--ul-text);
  font-size: 16px;
  font-weight: 900;
}

.indicator-tree-panel__empty span {
  color: var(--ul-muted);
}
</style>
