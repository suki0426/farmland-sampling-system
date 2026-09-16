<template>
  <aside class="indicator-inspector">
    <section class="indicator-inspector__block">
      <div class="indicator-inspector__title">结构检查</div>
      <div class="indicator-inspector__desc">
        当前 mock 数据用于验证浏览、搜索和详情联动，真实接口稳定后可直接替换。
      </div>

      <div class="indicator-inspector__stats">
        <div v-for="item in statsList" :key="item.label" class="indicator-inspector__stat">
          <strong>{{ item.value }}</strong>
          <span>{{ item.label }}</span>
        </div>
      </div>
    </section>

    <section class="indicator-inspector__block">
      <div class="indicator-inspector__title">当前节点</div>
      <template v-if="indicator">
        <div class="indicator-inspector__node-name">{{ indicator.name }}</div>
        <div class="indicator-inspector__node-code">{{ indicator.code }}</div>
        <div class="indicator-inspector__path">
          {{ pathText }}
        </div>
      </template>
      <div v-else class="indicator-inspector__desc">尚未选择指标。</div>
    </section>

    <section class="indicator-inspector__block">
      <div class="indicator-inspector__title">快捷操作</div>
      <div class="indicator-inspector__actions ul-action-group ul-action-group--stack">
        <el-button type="primary" round size="small" @click="$emit('add-child')">新增下级</el-button>
        <el-button round size="small" @click="$emit('edit')">编辑指标</el-button>
        <el-button round size="small" @click="$emit('disable')">停用指标</el-button>
        <el-button round size="small" @click="$emit('import-record')">查看导入</el-button>
      </div>
    </section>
  </aside>
</template>

<script>
import { getChildCount, getDescendantCount } from '@/utils/indicatorTree'

export default {
  name: 'IndicatorInspector',
  props: {
    indicator: { type: Object, default: null },
    path: { type: Array, default: () => [] },
    stats: {
      type: Object,
      default: () => ({
        total: 0,
        enabled: 0,
        warning: 0,
        disabled: 0,
        maxLevel: 0
      })
    }
  },
  computed: {
    statsList () {
      return [
        { label: '指标总数', value: this.stats.total || 0 },
        { label: '最大层级', value: this.stats.maxLevel || 0 },
        { label: '当前子级', value: getChildCount(this.indicator) },
        { label: '全部下级', value: getDescendantCount(this.indicator) }
      ]
    },
    pathText () {
      if (!this.path.length) return '暂无路径'
      return this.path.map(item => item.name).join(' / ')
    }
  }
}
</script>

<style scoped>
.indicator-inspector {
  display: grid;
  gap: 16px;
  align-content: start;
}

.indicator-inspector__block {
  padding: 18px;
  border: 1px solid var(--ul-line);
  border-radius: 26px;
  background: rgba(255, 255, 255, .92);
  box-shadow: var(--ul-shadow-sm);
}

.indicator-inspector__title {
  color: var(--ul-text);
  font-size: 18px;
  font-weight: 900;
}

.indicator-inspector__desc {
  margin-top: 8px;
  color: var(--ul-muted);
  font-size: 13px;
  font-weight: 650;
  line-height: 1.7;
}

.indicator-inspector__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.indicator-inspector__stat {
  min-height: 82px;
  padding: 14px;
  border: 1px solid var(--ul-line);
  border-radius: 18px;
  background: var(--ul-panel-soft);
}

.indicator-inspector__stat strong {
  display: block;
  color: var(--ul-text);
  font-size: 28px;
  font-weight: 950;
  line-height: 1;
}

.indicator-inspector__stat span {
  display: block;
  margin-top: 10px;
  color: var(--ul-muted);
  font-size: 12px;
  font-weight: 800;
}

.indicator-inspector__node-name {
  margin-top: 14px;
  color: var(--ul-text);
  font-size: 20px;
  font-weight: 950;
  line-height: 1.35;
}

.indicator-inspector__node-code {
  margin-top: 8px;
  color: var(--ul-muted);
  font-size: 13px;
  font-weight: 900;
  letter-spacing: .08em;
}

.indicator-inspector__path {
  margin-top: 14px;
  padding: 12px;
  border-radius: 16px;
  background: var(--ul-panel-soft);
  color: var(--ul-muted);
  font-size: 12px;
  font-weight: 750;
  line-height: 1.7;
}

.indicator-inspector__actions {
  margin-top: 16px;
}
</style>
