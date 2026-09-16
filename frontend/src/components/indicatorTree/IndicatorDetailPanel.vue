<template>
  <section class="indicator-detail-panel">
    <div v-if="indicator" class="indicator-detail-panel__content">
      <div class="indicator-detail-panel__hero">
        <div>
          <div class="indicator-detail-panel__eyebrow">当前指标</div>
          <h2>{{ indicator.name }}</h2>
          <div class="indicator-detail-panel__code">{{ indicator.code }}</div>
        </div>
      </div>

      <div class="indicator-detail-panel__path">
        <span v-for="(item, index) in path" :key="item.id">
          {{ item.name }}<i v-if="index < path.length - 1">/</i>
        </span>
      </div>

      <p class="indicator-detail-panel__desc">{{ indicator.description || '暂无指标说明。' }}</p>

      <div class="indicator-detail-panel__facts">
        <div v-for="fact in facts" :key="fact.label" class="indicator-detail-panel__fact">
          <span>{{ fact.label }}</span>
          <strong>{{ fact.value }}</strong>
        </div>
      </div>

      <div class="indicator-detail-panel__section">
        <div class="indicator-detail-panel__section-title">关联教学文件</div>
        <div class="indicator-detail-panel__table">
          <div class="indicator-detail-panel__table-row is-head">
            <span>文件类型</span>
            <span>数量</span>
            <span>最近更新</span>
          </div>
          <div
            v-for="file in relationFiles"
            :key="file.type"
            class="indicator-detail-panel__table-row"
          >
            <span>{{ file.type }}</span>
            <span>{{ file.count }}</span>
            <span>{{ file.updatedAt }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="indicator-detail-panel__empty">
      请选择左侧指标，查看详细信息。
    </div>
  </section>
</template>

<script>
export default {
  name: 'IndicatorDetailPanel',
  props: {
    indicator: { type: Object, default: null },
    path: { type: Array, default: () => [] }
  },
  computed: {
    facts () {
      if (!this.indicator) return []
      return [
        { label: '指标级别', value: `${this.indicator.level || '-'} 级` },
        { label: '上级指标', value: this.indicator.parentCode || '一级指标' },
        { label: '指标权重', value: this.indicator.weight || '-' },
        { label: '负责人', value: this.indicator.owner || '-' },
        { label: '关联文件', value: `${this.indicator.fileCount || 0} 份` },
        { label: '评分任务', value: `${this.indicator.scoreTaskCount || 0} 个` }
      ]
    },
    relationFiles () {
      const count = this.indicator ? this.indicator.fileCount || 0 : 0
      return [
        { type: '课程大纲', count: Math.min(count, 3), updatedAt: this.indicator.updatedAt },
        { type: '教案与课件', count: Math.max(count - 3, 0), updatedAt: this.indicator.updatedAt },
        { type: '评价记录', count: this.indicator.scoreTaskCount || 0, updatedAt: this.indicator.updatedAt }
      ]
    }
  }
}
</script>

<style scoped>
.indicator-detail-panel {
  min-height: 640px;
  padding: 24px;
  border: 1px solid var(--ul-line);
  border-radius: 30px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, .96), rgba(248, 250, 252, .94)),
    radial-gradient(circle at 88% 8%, rgba(15, 23, 42, .07), transparent 28%);
  box-shadow: var(--ul-shadow-sm);
}

.indicator-detail-panel__content {
  display: grid;
  gap: 22px;
}

.indicator-detail-panel__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.indicator-detail-panel__eyebrow {
  color: var(--ul-muted);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: .08em;
}

.indicator-detail-panel h2 {
  margin: 8px 0 0;
  color: var(--ul-text);
  font-size: 32px;
  font-weight: 950;
  line-height: 1.25;
}

.indicator-detail-panel__code {
  margin-top: 10px;
  color: var(--ul-muted);
  font-size: 15px;
  font-weight: 900;
  letter-spacing: .08em;
}

.indicator-detail-panel__path {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  color: var(--ul-muted);
  font-size: 13px;
  font-weight: 800;
}

.indicator-detail-panel__path i {
  margin-left: 7px;
  color: var(--ul-line-strong);
  font-style: normal;
}

.indicator-detail-panel__desc {
  margin: 0;
  max-width: 760px;
  color: var(--ul-text);
  font-size: 15px;
  font-weight: 650;
  line-height: 1.8;
}

.indicator-detail-panel__facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.indicator-detail-panel__fact {
  min-height: 86px;
  padding: 15px;
  border: 1px solid var(--ul-line);
  border-radius: 22px;
  background: rgba(255, 255, 255, .76);
}

.indicator-detail-panel__fact span {
  display: block;
  color: var(--ul-muted);
  font-size: 12px;
  font-weight: 800;
}

.indicator-detail-panel__fact strong {
  display: block;
  margin-top: 10px;
  color: var(--ul-text);
  font-size: 18px;
  font-weight: 950;
}

.indicator-detail-panel__section {
  padding-top: 2px;
}

.indicator-detail-panel__section-title {
  margin-bottom: 12px;
  color: var(--ul-text);
  font-size: 18px;
  font-weight: 900;
}

.indicator-detail-panel__table {
  overflow: hidden;
  border: 1px solid var(--ul-line);
  border-radius: 20px;
  background: var(--ul-panel);
}

.indicator-detail-panel__table-row {
  display: grid;
  grid-template-columns: 1.2fr .7fr 1fr;
  gap: 12px;
  padding: 13px 16px;
  border-top: 1px solid var(--ul-line);
  color: var(--ul-text);
  font-size: 14px;
  font-weight: 700;
}

.indicator-detail-panel__table-row.is-head {
  border-top: none;
  background: var(--ul-panel-soft);
  color: var(--ul-muted);
  font-size: 12px;
  font-weight: 900;
}

.indicator-detail-panel__empty {
  display: grid;
  min-height: 520px;
  place-items: center;
  color: var(--ul-muted);
  font-size: 15px;
  font-weight: 700;
}

@media (max-width: 760px) {
  .indicator-detail-panel__facts,
  .indicator-detail-panel__table-row {
    grid-template-columns: 1fr;
  }

  .indicator-detail-panel h2 {
    font-size: 26px;
  }
}
</style>
