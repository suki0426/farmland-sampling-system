<template>
  <div
    class="indicator-template-dropzone"
    :class="{ 'is-dragover': dragover, 'is-disabled': disabled }"
    @dragenter.prevent="handleDragEnter"
    @dragover.prevent="handleDragEnter"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <div class="indicator-template-dropzone__mark">
      <i class="el-icon-document-add"></i>
    </div>
    <div class="indicator-template-dropzone__copy">
      <div class="indicator-template-dropzone__title">上传指标文件，覆盖当前指标数据</div>
      <div class="indicator-template-dropzone__desc">
        支持 .xls / .xlsx 文件，系统会校验编码、层级、父子关系和重复项。
      </div>
    </div>

    <div class="indicator-template-dropzone__actions ul-action-group ul-action-group--center">
      <el-button type="primary" :disabled="disabled" @click="$emit('choose')">
        选择文件
      </el-button>
      <el-button :disabled="disabled || !selected || importing" @click="$emit('import')">
        {{ importing ? '导入中...' : '开始导入' }}
      </el-button>
    </div>

    <div class="indicator-template-dropzone__selected">
      {{ selected ? `已选择：${selected.name}（${selected.sizeText}）` : '尚未选择文件' }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'TemplateDropzone',
  props: {
    selected: { type: Object, default: null },
    disabled: { type: Boolean, default: false },
    importing: { type: Boolean, default: false }
  },
  data () {
    return {
      dragover: false
    }
  },
  methods: {
    handleDragEnter () {
      if (this.disabled) return
      this.dragover = true
    },
    handleDragLeave () {
      this.dragover = false
    },
    handleDrop (event) {
      if (this.disabled) return
      this.dragover = false
      const files = Array.from(event.dataTransfer.files || [])
      this.$emit('select', files[0])
    }
  }
}
</script>

<style scoped>
.indicator-template-dropzone {
  position: relative;
  display: grid;
  min-height: 380px;
  place-items: center;
  padding: 36px 32px;
  border: 1px solid var(--ul-line);
  border-radius: 32px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, .88), rgba(248, 250, 252, .96)),
    radial-gradient(circle at 15% 12%, rgba(15, 23, 42, .08), transparent 28%);
  text-align: center;
  overflow: hidden;
  transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease;
}

.indicator-template-dropzone::after {
  content: "";
  position: absolute;
  right: -80px;
  bottom: -90px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: rgba(15, 23, 42, .06);
}

.indicator-template-dropzone.is-dragover {
  border-color: var(--ul-primary);
  box-shadow: 0 18px 42px rgba(15, 23, 42, .12);
  transform: translateY(-1px);
}

.indicator-template-dropzone__mark {
  display: grid;
  width: 68px;
  height: 68px;
  place-items: center;
  border-radius: 22px;
  background: var(--ul-primary);
  color: var(--ul-primary-contrast);
  font-size: 31px;
  box-shadow: 0 16px 32px rgba(15, 23, 42, .18);
}

.indicator-template-dropzone__copy {
  position: relative;
  z-index: 1;
  max-width: 720px;
}

.indicator-template-dropzone__title {
  margin-top: 22px;
  color: var(--ul-text);
  font-size: 26px;
  font-weight: 900;
  line-height: 1.35;
}

.indicator-template-dropzone__desc {
  margin-top: 12px;
  color: var(--ul-muted);
  font-size: 15px;
  line-height: 1.8;
}

.indicator-template-dropzone__actions {
  position: relative;
  z-index: 1;
  margin-top: 26px;
}

.indicator-template-dropzone__actions >>> .el-button {
  min-width: 118px;
  border-radius: 16px;
  padding: 13px 22px;
}

.indicator-template-dropzone__selected {
  position: relative;
  z-index: 1;
  margin-top: 18px;
  color: var(--ul-muted);
  font-size: 14px;
  font-weight: 700;
}

@media (max-width: 768px) {
  .indicator-template-dropzone {
    min-height: 280px;
    padding: 28px 16px;
  }

  .indicator-template-dropzone__title {
    font-size: 21px;
  }
}
</style>
