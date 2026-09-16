<template>
  <div
    class="teaching-upload-dropzone"
    :class="{ 'is-dragover': dragover, 'is-disabled': disabled }"
    @dragenter.prevent="handleDragEnter"
    @dragover.prevent="handleDragEnter"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <div class="teaching-upload-dropzone__copy">
      <div class="teaching-upload-dropzone__title">
        拖拽文件到此处，或点击上传。支持 .doc/.docx 批量导入。
      </div>
      <div class="teaching-upload-dropzone__desc">
        上传后会进入解析队列，并按当前选择的文档分类生成教学文档。
      </div>
    </div>

    <div class="teaching-upload-dropzone__actions">
      <el-button type="primary" :disabled="disabled" @click="$emit('choose')">
        选择文件
      </el-button>
      <el-button :disabled="disabled || !canStart" @click="$emit('start')">
        {{ loading ? '导入中...' : '开始导入' }}
      </el-button>
    </div>

    <div class="teaching-upload-dropzone__note">
      {{ selectedText }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'UploadDropzone',
  props: {
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    selectedCount: { type: Number, default: 0 }
  },
  data () {
    return {
      dragover: false
    }
  },
  computed: {
    canStart () {
      return this.selectedCount > 0 && !this.loading
    },
    selectedText () {
      return this.selectedCount > 0 ? `已选择 ${this.selectedCount} 个文件` : '尚未选择文件'
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
      this.$emit('drop', Array.from(event.dataTransfer.files || []))
    }
  }
}
</script>

<style scoped>
.teaching-upload-dropzone {
  display: flex;
  min-height: 260px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 34px 28px;
  border: 1px solid var(--ul-line);
  border-radius: 8px;
  background: var(--ul-panel-soft);
  text-align: center;
  transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease;
}

.teaching-upload-dropzone.is-dragover {
  border-color: var(--ul-primary);
  box-shadow: 0 16px 36px rgba(15, 23, 42, .12);
  transform: translateY(-1px);
}

.teaching-upload-dropzone.is-disabled {
  opacity: .72;
  cursor: not-allowed;
}

.teaching-upload-dropzone__copy {
  max-width: 780px;
}

.teaching-upload-dropzone__title {
  color: var(--ul-text);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.7;
}

.teaching-upload-dropzone__desc {
  margin-top: 10px;
  color: var(--ul-muted);
  font-size: 14px;
  line-height: 1.7;
}

.teaching-upload-dropzone__actions {
  display: flex;
  justify-content: center;
  gap: 14px;
  margin-top: 26px;
}

.teaching-upload-dropzone__actions >>> .el-button {
  min-width: 136px;
  border-radius: 8px;
  padding: 14px 24px;
  font-size: 16px;
}

.teaching-upload-dropzone__note {
  margin-top: 18px;
  color: var(--ul-muted);
  font-size: 15px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .teaching-upload-dropzone {
    min-height: 220px;
    padding: 26px 16px;
  }

  .teaching-upload-dropzone__title {
    font-size: 18px;
  }

  .teaching-upload-dropzone__actions {
    flex-direction: column;
    width: 100%;
  }
}
</style>
