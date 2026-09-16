<template>
	<div class="image-upload-multiple">
		<el-upload
			ref="uploader"
			list-type="picture-card"
			:auto-upload="autoUpload"
			:disabled="disabled"
			:action="action"
			:name="name"
			:data="data"
			:http-request="request"
      :file-list="defaultFileList"
			:show-file-list="showFileList"
			:accept="accept"
			:multiple="multiple"
			:limit="limit"
			:before-upload="before"
      :on-remove="remove"
			:on-success="success"
			:on-error="error"
			:on-preview="handlePreview"
			:on-exceed="handleExceed"
		>
			<slot>
        <i class="el-icon-plus"></i>
			</slot>
			<template #tip>
				<div v-if="tip" class="el-upload__tip">{{ tip }}</div>
			</template>
			<template #file="{ file }">
				<div class="image-upload-list-item">
					<el-image
						class="el-upload-list__item-thumbnail"
						:src="file.url"
						fit="cover"
						:preview-src-list="preview"
						:initial-index="preview.findIndex((n) => n == file.url)"
						hide-on-click-modal
						append-to-body
						:z-index="9999"
					>
						<template #placeholder>
							<div class="image-upload-multiple-image-slot">
								Loading...
							</div>
						</template>
					</el-image>
					<div
						v-if="!disabled && file.status == 'success'"
						class="image-upload__item-actions"
					>
            <span class="del" @click="handleRemove(file)">
              <i class="el-icon-delete"></i>
            </span>
          </div>
					<div
						v-if="
							file.status == 'ready' || file.status == 'uploading'
						"
						class="image-upload__item-progress"
					>
						<el-progress
							:percentage="file.percentage"
							:text-inside="true"
							:stroke-width="16"
						/>
					</div>
				</div>
			</template>
		</el-upload>
		<span style="display: none !important"
			><el-input v-model="value"></el-input
		></span>
	</div>
</template>

<script>
import config from './config'
import Sortable from 'sortablejs'

export default {
  props: {
    modelValue: { type: String, default: '' },
    tip: { type: String, default: '' },
    action: { type: String, default: '' },
    apiObj: { type: Object, default: () => {} },
    name: { type: String, default: config.filename },
    data: { type: Object, default: () => {} },
    accept: { type: String, default: 'image/gif, image/jpeg, image/png' },
    maxSize: { type: Number, default: config.maxSize },
    limit: { type: Number, default: 0 },
    autoUpload: { type: Boolean, default: true },
    showFileList: { type: Boolean, default: true },
    multiple: { type: Boolean, default: true },
    disabled: { type: Boolean, default: false },
    draggable: { type: Boolean, default: false },
    onSuccess: {
      type: Function,
      default: () => {
        return true
      }
    }
  },
  data () {
    return {
      value: '',
      defaultFileList: []
    }
  },
  // 超级牛
  model: {
    prop: 'modelValue',
    event: 'change'
  },
  watch: {
    modelValue (val) {
      if (val !== this.toStr(this.defaultFileList)) {
        this.defaultFileList = this.toArr(val)
        this.value = val
      }
    },
    defaultFileList: {
      handler (val) {
        this.$emit('change', this.toStr(val))
        this.value = this.toStr(val)
      },
      deep: true
    }
  },
  computed: {
    preview () {
      return this.defaultFileList.map((v) => v.url)
    }
  },
  mounted () {
    this.value = this.modelValue
    this.defaultFileList = this.toArr(this.modelValue)
    if (!this.disabled && this.draggable) {
      this.rowDrop()
    }
  },
  methods: {
// 默认值转换为数组
    toArr (str) {
      var _arr = []
      var arr = str.split(',')
      arr.forEach((item) => {
        if (item) {
          var urlArr = item.split('&name=')
          var fileName = urlArr[urlArr.length - 1]
          _arr.push({
            name: fileName,
            url: item
          })
        }
      })
      return _arr
    },
// 数组转换为原始值
    toStr (arr) {
      return arr.map((v) => v.url).join(',')
    },
// 拖拽
    rowDrop () {
      const _this = this
      const itemBox = this.$refs.uploader.$el.querySelector('.el-upload-list')
      Sortable.create(itemBox, {
        handle: '.el-upload-list__item',
        animation: 200,
        ghostClass: 'ghost',
        onEnd ({ newIndex, oldIndex }) {
          const tableData = _this.defaultFileList
          const currRow = tableData.splice(oldIndex, 1)[0]
          tableData.splice(newIndex, 0, currRow)
        }
      })
    },
    before (file) {
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        this.$message.warning(`选择的文件类型 ${file.type} 非图像类文件`)
        return false
      }
      const maxSize = file.size / 1024 / 1024 < this.maxSize
      if (!maxSize) {
        this.$message.warning(`上传文件大小不能超过 ${this.maxSize}MB!`)
        return false
      }
    },
    success (res, file, fileList) {
      var os = this.onSuccess(res, file)
      if (os !== undefined && os === false) {
        return false
      }
      var response = config.parseData(res)
      // 20231120 增加属性url
      file.url = response.src.data.url
      this.defaultFileList = fileList
    },
    remove (file, fileList) {
      this.defaultFileList = fileList
    },
    error (err) {
      this.$notify.error({
        title: '上传文件未成功',
        message: err
      })
    },
    beforeRemove (uploadFile) {
      return this.$confirm(`是否移除 ${uploadFile.name} ?`, '提示', {
        type: 'warning'
      }).then(() => {
        return true
      }).catch(() => {
        return false
      })
    },
    handleRemove (file) {
      this.$refs.uploader.handleRemove(file)
// this.defaultFileList.splice(this.defaultFileList.findIndex(item => item.uid===file.uid), 1)
    },
    handleExceed () {
      this.$message.warning(`当前设置最多上传 ${this.limit} 个文件，请移除后上传!`)
    },
    handlePreview (uploadFile) {
      window.open(uploadFile.url)
    },
    request (param) {
      var apiObj = config.apiObj
      if (this.apiObj) {
        apiObj = this.apiObj
      }
      const data = new FormData()
      data.append(param.filename, param.file)
      for (const key in param.data) {
        data.append(key, param.data[key])
      }
      apiObj.upload(data, {onUploadProgress: (e) => {
        const complete = parseInt(((e.loaded / e.total) * 100) | 0, 10)
        param.onProgress({ percent: complete })
      }
      }).then((res) => {
        param.onSuccess(res)
      }).catch((err) => {
        param.onError(err)
      })
    }
  }
}
</script>

<style scoped>
.el-form-item.is-error .image-upload-multiple:deep(.el-upload--picture-card) {
	border-color: var(--el-color-danger);
}
:deep(.el-upload-list__item) {
	transition: none;
	border-radius: 0;
}
.image-upload-multiple:deep(.el-upload-list__item.el-list-leave-active) {
	position: static !important;
}
.image-upload-multiple:deep(.el-upload--picture-card) {
	border-radius: 0;
}
.image-upload-list-item {
	width: 100%;
	height: 100%;
	position: relative;
}
.image-upload-multiple .el-image {
	display: block;
}
.image-upload-multiple .el-image:deep(img) {
	-webkit-user-drag: none;
}
.image-upload-multiple-image-slot {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 100%;
	height: 100%;
	font-size: 12px;
}
.image-upload-multiple .el-upload-list__item:hover .image-upload__item-actions {
	display: block;
}
.image-upload__item-actions {
	position: absolute;
	top: 0;
	right: 0;
	display: none;
}
.image-upload__item-actions span {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 25px;
	height: 25px;
	cursor: pointer;
	color: #fff;
}
.image-upload__item-actions span i {
	font-size: 12px;
}
.image-upload__item-actions .del {
	background: #f56c6c;
}
.image-upload__item-progress {
	position: absolute;
	width: 100%;
	height: 100%;
	top: 0;
	left: 0;
	background-color: var(--el-overlay-color-lighter);
}
</style>
