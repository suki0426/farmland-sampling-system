<template>
  <div class="create-method-selector">
    <button
      v-for="item in options"
      :key="item.value"
      type="button"
      class="create-method-selector__item"
      :class="{ 'is-active': item.value === value }"
      @click="$emit('input', item.value)"
    >
      <span class="create-method-selector__dot"></span>
      <span class="create-method-selector__copy">
        <strong>{{ item.label }}</strong>
        <small>{{ item.desc }}</small>
      </span>
    </button>
  </div>
</template>

<script>
export default {
  name: 'CreateMethodSelector',
  props: {
    value: { type: String, default: '' },
    options: {
      type: Array,
      default: () => []
    }
  }
}
</script>

<style scoped>
.create-method-selector {
  --structure-primary: var(--ul-primary, var(--defaultTheme, #0f172a));
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.create-method-selector__item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-height: 84px;
  padding: 18px;
  border: 1px solid #d8e3f1;
  border-radius: 8px;
  background: #fff;
  color: #0f172a;
  text-align: left;
  cursor: pointer;
  transition: border-color .16s ease, box-shadow .16s ease;
}

.create-method-selector__item:hover,
.create-method-selector__item.is-active {
  border-color: var(--structure-primary);
  box-shadow: 0 0 0 2px rgba(15, 23, 42, .08);
}

.create-method-selector__dot {
  flex: 0 0 auto;
  width: 10px;
  height: 10px;
  margin-top: 5px;
  border: 2px solid #cbd5e1;
  border-radius: 50%;
}

.create-method-selector__item.is-active .create-method-selector__dot {
  border-color: var(--structure-primary);
  background: var(--structure-primary);
}

.create-method-selector__copy {
  min-width: 0;
}

.create-method-selector strong,
.create-method-selector small {
  display: block;
}

.create-method-selector strong {
  margin-bottom: 6px;
  font-size: 15px;
}

.create-method-selector small {
  color: #64748b;
  line-height: 1.6;
}

@media (max-width: 760px) {
  .create-method-selector {
    grid-template-columns: 1fr;
  }
}
</style>
