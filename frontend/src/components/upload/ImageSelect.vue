<template>
	<div class="jp-upload" :class="{ 'jp-upload-round': round }" :style="style">
		<div
			v-if="file && file.status != 'success'"
			class="jp-upload__uploading"
		>
			<div class="jp-upload__progress">
				<el-progress
					:percentage="file.percentage"
					:text-inside="true"
					:stroke-width="16"
				/>
			</div>
			<el-image class="image" :src="file.tempFile" fit="cover"></el-image>
		</div>
		<div v-if="file && file.status == 'success'" class="jp-upload__img">
			<el-image
				class="image"
				:src="file.url"
				:preview-src-list="[file.url]"
				fit="cover"
				hide-on-click-modal
				append-to-body
				:z-index="9999"
			>
				<template #placeholder>
					<div class="jp-upload__img-slot">Loading...</div>
				</template>
			</el-image>
      <div class="jp-upload__img-actions" v-if="!disabled">
        <span class="del" @click="handleRemove()">
          <i class="el-icon-delete"></i
        ></span>
      </div>
		</div>
		<el-upload
			v-if="!file"
			class="uploader"
			ref="uploader"
			:auto-upload="cropper ? false : autoUpload"
			:disabled="disabled"
			:show-file-list="showFileList"
			:action="action"
			:name="name"
			:data="data"
			:accept="accept"
			:limit="1"
			:http-request="request"
			:on-change="change"
			:before-upload="before"
			:on-success="success"
			:on-error="error"
			:on-exceed="handleExceed"
		>
			<slot>
				<div class="el-upload--picture-card">
					<div class="file-empty">
           
						<h4 v-if="title">
							<i :class="icon"></i>
							{{ title }}
						</h4>
						<i  v-else :class="icon"></i>
					</div>
				</div>
			</slot>
		</el-upload>
		<span style="display: none !important"
			><el-input v-model="value"></el-input
		></span>
		<el-dialog
			title="剪裁"
			draggable
			v-model="cropperDialogVisible"
      width="580"
			@closed="cropperClosed"
			destroy-on-close
		>
			<cropper
				:src="cropperFile.tempCropperFile"
				:compress="compress"
				:aspectRatio="aspectRatio"
				ref="cropper"
			></cropper>
			<template #footer>
				<el-button @click="cropperDialogVisible = false"
					>取 消</el-button
				>
				<el-button type="primary" @click="cropperSave">确 定</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script>
import cropper from '@/components/cropper'
import config from './config'

export default {
  name: 'ImageSelect',
  props: {
    modelValue: { type: String, default: '' },
    icon: { type: String, default: 'el-icon-plus' },
    height: { type: Number, default: 148 },
    width: { type: Number, default: 148 },
    title: { type: String, default: '' },
    action: { type: String, default: '' },
    apiObj: { type: Object, default: () => {} },
    name: { type: String, default: config.filename },
    data: { type: Object, default: () => {} },
    accept: { type: String, default: 'image/gif, image/jpeg, image/png' },
    maxSize: { type: Number, default: config.maxSize },
    limit: { type: Number, default: 1 },
    autoUpload: { type: Boolean, default: true },
    showFileList: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    round: { type: Boolean, default: false },
    onSuccess: {
      type: Function,
      default: () => {
        return true
      }
    },

    cropper: { type: Boolean, default: false },
    compress: { type: Number, default: 1 },
    aspectRatio: { type: Number, default: NaN }
  },
  // 超级牛
  model: {
    prop: 'modelValue',
    event: 'change'
  },
  components: {
    cropper
  },
  data () {
    return {
      value: '',
      file: null,
      style: {
        width: this.width + 'px',
        height: this.height + 'px'
      },
      cropperDialogVisible: false,
      cropperFile: {
        tempCropperFile: null
      }
    }
  },
  watch: {
    modelValue (val) {
      this.value = val
      this.newFile(val)
    },
    value (val) {
      this.$emit('change', val)
    }
  },
  mounted () {
    this.value = this.modelValue
    this.newFile(this.modelValue)
  },
  methods: {
    newFile (url) {
      if (url) {
        this.file = {
          status: 'success',
          url: url
        }
      } else {
        this.file = null
      }
    },
    cropperSave () {
      this.$refs.cropper.getCropFile((file) => {
        file.uid = this.cropperFile.uid
        this.cropperFile.raw = file

        this.file = this.cropperFile
        this.file.tempFile = URL.createObjectURL(this.file.raw)
        this.$refs.uploader.submit()
      }, this.cropperFile.name, this.cropperFile.type)
      this.cropperDialogVisible = false
    },
    cropperClosed () {
      URL.revokeObjectURL(this.cropperFile.tempCropperFile)
      delete this.cropperFile.tempCropperFile
    },
    handleRemove () {
      this.clearFiles()
    },
    clearFiles () {
      URL.revokeObjectURL(this.file.tempFile)
      this.value = ''
      this.file = null
      this.$nextTick(() => {
        this.$refs.uploader.clearFiles()
      })
    },
    change (file) {
      if (this.cropper && file.status === 'ready') {
        const acceptIncludes = [
          'image/gif',
          'image/jpeg',
          'image/png'
        ].includes(file.raw.type)
        if (!acceptIncludes) {
          this.$notify.warning({
            title: '上传文件警告',
            message: '选择的文件非图像类文件'
          })
          return false
        }
        this.cropperFile = file
        this.cropperFile.tempCropperFile = URL.createObjectURL(file.raw)
        this.cropperDialogVisible = true
        return false
      }
      this.file = file
      if (file.status === 'ready') {
        file.tempFile = URL.createObjectURL(file.raw)
      }
    },
    before (file) {
      const acceptIncludes = this.accept.replace(/\s/g, '').split(',').includes(file.type)
      if (!acceptIncludes) {
        this.$notify.warning({
          title: '上传文件警告',
          message: '选择的文件非图像类文件'
        })
        this.clearFiles()
        return false
      }
      const maxSize = file.size / 1024 / 1024 < this.maxSize
      if (!maxSize) {
        this.$message.warning(`上传文件大小不能超过 ${this.maxSize}MB!`)
        this.clearFiles()
        return false
      }
    },
    handleExceed (files) {
      const file = files[0]
      // file.uid = randomUUID.ni;
      this.$refs.uploader.handleStart(file)
    },
    success (res, file) {
      var response = config.parseData(res)
      // 20231120 增加属性url
      file.url = response.src.data.url
      this.value = file.url
// 释放内存删除blob
      URL.revokeObjectURL(file.tempFile)
      delete file.tempFile
    },
    error (err) {
      this.$nextTick(() => {
        this.clearFiles()
      })
      this.$notify.error({
        title: '上传文件未成功',
        message: err
      })
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
@charset "utf-8";
.el-form-item.is-error .jp-upload .el-upload--picture-card {
	border-color: var(--el-color-danger);
}
.jp-upload .el-upload--picture-card {
	border-radius: 0;
}

.jp-upload .uploader,
.jp-upload:deep(.el-upload) {
	width: 100%;
	height: 100%;
}

.jp-upload__img {
	width: 100%;
	height: 100%;
	position: relative;
}
.jp-upload__img .image {
	width: 100%;
	height: 100%;
}
.jp-upload__img-actions {
	position: absolute;
	top: 0;
	right: 0;
	display: none;
}
.jp-upload__img-actions span {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 25px;
	height: 25px;
	cursor: pointer;
	color: #fff;
}
.jp-upload__img-actions span i {
	font-size: 12px;
}
.jp-upload__img-actions .del {
	background: #f56c6c;
}
.jp-upload__img:hover .jp-upload__img-actions {
	display: block;
}
.jp-upload__img-slot {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 100%;
	height: 100%;
	font-size: 12px;
	background-color: var(--el-fill-color-lighter);
}

.jp-upload__uploading {
	width: 100%;
	height: 100%;
	position: relative;
}
.jp-upload__progress {
	position: absolute;
	width: 100%;
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
	background-color: var(--el-overlay-color-lighter);
	z-index: 1;
	padding: 10px;
}
.jp-upload__progress .el-progress {
	width: 100%;
}
.jp-upload__uploading .image {
	width: 100%;
	height: 100%;
}

.jp-upload .file-empty {
	width: 100%;
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: column;
}
.jp-upload .file-empty i {
	font-size: 28px;
}
.jp-upload .file-empty h4 {
	font-size: 12px;
	font-weight: normal;
	color: #8c939d;
	margin-top: 8px;
}

.jp-upload.jp-upload-round {
	border-radius: 50%;
	overflow: hidden;
}
.jp-upload.jp-upload-round .el-upload--picture-card {
	border-radius: 50%;
}
.jp-upload.jp-upload-round .jp-upload__img-actions {
	top: auto;
	left: 0;
	right: 0;
	bottom: 0;
}
.jp-upload.jp-upload-round .jp-upload__img-actions span {
	width: 100%;
}
</style>
