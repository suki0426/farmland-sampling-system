<template>
	<div class="file-upload">
		<el-upload
			:disabled="disabled"
			:auto-upload="autoUpload"
			:action="action"
			:name="name"
			:data="data"
			:http-request="request"
      :file-list="defaultFileList"
			:show-file-list="showFileList"
			:drag="drag"
			:accept="accept"
			:multiple="multiple"
			:limit="limit"
			:before-upload="before"
			:on-success="success"
      :on-remove="remove"
			:on-error="error"
			:on-preview="handlePreview"
			:on-exceed="handleExceed"
      v-if="uploadBtnVisible"
		>
			<slot>
				<el-button type="primary" :disabled="disabled"
					>上传文件</el-button
				>
			</slot>
			<template #tip>
				<div v-if="tip" class="el-upload__tip">{{ tip }}</div>
			</template>
		</el-upload>
		<span style="display: none !important"
			><el-input v-model="value"></el-input
		></span>
	</div>
</template>

<script>
import config from './config'

export default {
  props: {
    modelValue: { type: String, default: '' },
    tip: { type: String, default: '' },
    action: { type: String, default: '' },
    apiObj: { type: Object, default: () => {} },
    name: { type: String, default: config.filename },
    data: { type: Object, default: () => {} },
    accept: { type: String, default: '' },
    maxSize: { type: Number, default: config.maxSize },
    limit: { type: Number, default: 0 },
    autoUpload: { type: Boolean, default: true },
    showFileList: { type: Boolean, default: true },
    drag: { type: Boolean, default: false },
    multiple: { type: Boolean, default: true },
    disabled: { type: Boolean, default: false },
    onSuccess: {
      type: Function,
      default: () => {
        return true
      }
    },
    uploadBtnVisible: { type: Boolean, default: true } // 是否显示上传按钮
  },
  // 超级牛
  model: {
    prop: 'modelValue',
    event: 'change'
  },
  data () {
    return {
      value: '',
      defaultFileList: []
    }
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
  mounted () {
    this.value = this.modelValue
    this.defaultFileList = this.toArr(this.modelValue)
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
    before (file) {
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
      apiObj.upload(data, {
        onUploadProgress: (e) => {
          const complete = parseInt(((e.loaded / e.total) * 100) | 0, 10)
          param.onProgress({ percent: complete })
        }
      }).then((res) => {
        param.onSuccess(res)// eslint-disable-next-line no-unused-vars
      }).catch(() => {
// param.onError(err)
      })
    }
  }
}
</script>

<style scoped>
.el-form-item.is-error .file-upload:deep(.el-upload-dragger) {
	border-color: var(--el-color-danger);
}
.file-upload {
	width: 100%;
}
.file-upload:deep(.el-upload-list__item) {
	transition: none !important;
}
</style>
