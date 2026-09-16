<template>
  <div class="indicator-import-steps">
    <div
      v-for="(step, index) in steps"
      :key="step.title"
      class="indicator-import-steps__item"
      :class="{ 'is-active': index === activeIndex }"
    >
      <span class="indicator-import-steps__index">{{ index + 1 }}</span>
      <div>
        <strong>{{ step.title }}</strong>
        <em>{{ step.desc }}</em>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ImportStepGuide',
  props: {
    activeIndex: { type: Number, default: 0 }
  },
  data () {
    return {
      steps: [
        { title: '准备文件', desc: '使用统一字段格式' },
        { title: '确认覆盖', desc: '导入后替换旧数据' },
        { title: '上传校验', desc: '检查父子关系' },
        { title: '查看结果', desc: '处理错误明细' }
      ]
    }
  }
}
</script>

<style scoped>
.indicator-import-steps {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.indicator-import-steps__item {
  display: flex;
  gap: 12px;
  align-items: center;
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid var(--ul-line);
  border-radius: 18px;
  background: rgba(255, 255, 255, .72);
  transition: border-color .2s ease, background .2s ease, transform .2s ease;
}

.indicator-import-steps__item.is-active {
  border-color: var(--ul-primary);
  background: var(--ul-panel);
  transform: translateY(-1px);
}

.indicator-import-steps__index {
  display: grid;
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 999px;
  background: var(--ul-primary);
  color: var(--ul-primary-contrast);
  font-size: 13px;
  font-weight: 900;
}

.indicator-import-steps strong {
  display: block;
  color: var(--ul-text);
  font-size: 14px;
  line-height: 1.2;
}

.indicator-import-steps em {
  display: block;
  margin-top: 5px;
  color: var(--ul-muted);
  font-size: 12px;
  font-style: normal;
  line-height: 1.3;
}

@media (max-width: 1180px) {
  .indicator-import-steps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .indicator-import-steps {
    grid-template-columns: 1fr;
  }
}
</style>
