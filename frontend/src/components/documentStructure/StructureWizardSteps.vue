<template>
  <div class="structure-wizard-steps">
    <button
      v-for="(step, index) in steps"
      :key="step.key"
      type="button"
      class="structure-wizard-steps__item"
      :class="{
        'is-active': step.key === value,
        'is-done': isDone(step.key),
        'is-disabled': !canJump(step.key)
      }"
      @click="handleClick(step.key)"
    >
      <span class="structure-wizard-steps__index">{{ index + 1 }}</span>
      <span class="structure-wizard-steps__label">{{ step.label }}</span>
    </button>
  </div>
</template>

<script>
export default {
  name: 'StructureWizardSteps',
  props: {
    value: { type: String, default: '' },
    steps: {
      type: Array,
      default: () => []
    },
    maxStep: { type: String, default: '' }
  },
  methods: {
    indexOf (key) {
      return this.steps.findIndex(item => item.key === key)
    },
    isDone (key) {
      return this.indexOf(key) > -1 && this.indexOf(key) < this.indexOf(this.value)
    },
    canJump (key) {
      const targetIndex = this.indexOf(key)
      const maxIndex = this.indexOf(this.maxStep)
      if (targetIndex < 0) return false
      if (maxIndex < 0) return targetIndex <= this.indexOf(this.value)
      return targetIndex <= maxIndex
    },
    handleClick (key) {
      if (!this.canJump(key)) return
      this.$emit('input', key)
    }
  }
}
</script>

<style scoped>
.structure-wizard-steps {
  --structure-primary: var(--ul-primary, var(--defaultTheme, #0f172a));
  --structure-primary-hover: var(--ul-button-hover, #253047);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.structure-wizard-steps__item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 126px;
  height: 38px;
  padding: 0 16px;
  border: 1px solid #d8e3f1;
  border-radius: 999px;
  background: #fff;
  color: #64748b;
  cursor: pointer;
  transition: border-color .16s ease, background .16s ease, color .16s ease;
}

.structure-wizard-steps__item.is-active {
  border-color: var(--structure-primary);
  background: var(--structure-primary);
  color: #fff;
}

.structure-wizard-steps__item.is-active:hover {
  border-color: var(--structure-primary-hover);
  background: var(--structure-primary-hover);
}

.structure-wizard-steps__item.is-done {
  color: var(--structure-primary);
}

.structure-wizard-steps__item.is-disabled {
  cursor: not-allowed;
  opacity: .52;
}

.structure-wizard-steps__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #f1f5f9;
  color: var(--structure-primary);
  font-size: 12px;
  font-weight: 700;
}

.structure-wizard-steps__item.is-active .structure-wizard-steps__index {
  background: #fff;
}

.structure-wizard-steps__label {
  white-space: nowrap;
}
</style>
