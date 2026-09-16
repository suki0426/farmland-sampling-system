<template>
  <div ref="editorShell" class="wang-editor-shell">
    <div>
      <div ref="wang-editor" class="wang-editor" />
    </div>
  </div>
</template>
<script>
import E from 'wangeditor'
import AlertMenu from './editor'
import HtmlMenu from './html'
import util from './bus'
import fileService from '@/api/file/fileService'

export default {
  name: 'Index',
  props: {
    content: {
      type: String,
      default: ''
    },
    value: {
      type: String,
      default: ''
    },
    height: {
      type: Number,
      default: 600
    }
  },
  data () {
    return {
      newHtml: '',
      modalPic: false,
      isChoice: '多选',
      picTit: 'danFrom',
      img: '',
      modalVideo: false,
      editor: null,
      fullscreenObserver: null,
      fullscreenPlaceholder: null,
      originalParent: null,
      originalNextSibling: null,
      isShellFullscreen: false,
      uploadSize: 2,
      video: ''
    }
  },
  watch: {
    content (val) {
      this.setEditorHtml(val)
    },
    value (val) {
      this.setEditorHtml(val)
    }
  },
  created () {

  },
  mounted () {
    this.createEditor()
    util.$on('Video', (Video) => {
      this.getvideoint()
    })
    util.$on('Html', (Html) => {
      this.getHtmlint()
    })
  },
  beforeDestroy () {
    if (this.fullscreenObserver) {
      this.fullscreenObserver.disconnect()
      this.fullscreenObserver = null
    }
    this.restoreFullscreenShell()
    if (this.editor) {
      this.editor.destroy()
      this.editor = null
    }
  },
  methods: {
    changeValue (value) {
      this.newHtml = value
      this.$emit('editorContent', value)
      this.$emit('input', value)
    },
    getHtmlint () {
      this.editor.txt.html(this.newHtml)
    },
    setEditorHtml (html) {
      if (!this.editor) return
      const nextHtml = html || ''
      if (nextHtml === this.editor.txt.html()) return
      this.editor.txt.html(nextHtml)
    },
    createEditor () {
      const menuKey = 'alertMenuKey'
      const html = 'alertHtml'
      this.editor = new E(this.$refs['wang-editor'])
      this.editor.menus.extend(menuKey, AlertMenu)
      this.editor.menus.extend(html, HtmlMenu)
      this.editor.config.menus = this.editor.config.menus.concat(html)
      this.editor.config.menus = this.editor.config.menus.concat(menuKey)
      this.editor.config.height = this.height
      this.editor.config.menus = [
        'head',
        'bold',
        'fontSize',
        'fontName',
        'italic',
        'underline',
        'strikeThrough',
        'indent',
        'lineHeight',
        'foreColor',
        'backColor',
        'link',
        'image',
        'list',
        'justify',
        'quote',
        'emoticon',
        'table',
        'splitLine'
      ]
      // 配置全屏功能按钮是否展示
      this.editor.config.showFullScreen = true
      this.editor.config.uploadImgShowBase64 = false
      this.editor.config.uploadImgMaxSize = 5 * 1024 * 1024
      this.editor.config.uploadImgAccept = ['jpg', 'jpeg', 'png', 'gif', 'webp']
      this.editor.config.customUploadImg = this.uploadImages
      this.editor.config.zIndex = 0
      this.editor.config.compatibleMode = () => {
        // 返回 true 表示使用兼容模式；返回 false 使用标准模式
        return true
      }
      this.editor.config.onchange = (newHtml) => {
        this.newHtml = newHtml
        this.$emit('editorContent', newHtml)
        this.$emit('input', newHtml)
      }
      this.editor.config.onchangeTimeout = 300 // change后多久更新数据

      this.editor.create()
      this.bindFullscreenObserver()
      this.setEditorHtml(this.value || this.content)
    },
    bindFullscreenObserver () {
      const target = this.$refs['wang-editor']
      if (!target || typeof MutationObserver === 'undefined') return
      this.fullscreenObserver = new MutationObserver(() => {
        this.syncFullscreenShell()
      })
      this.fullscreenObserver.observe(target, {
        attributes: true,
        attributeFilter: ['class']
      })
    },
    syncFullscreenShell () {
      const target = this.$refs['wang-editor']
      if (!target) return
      const isFullscreen = target.classList.contains('w-e-full-screen-editor')
      if (isFullscreen && !this.isShellFullscreen) {
        this.mountFullscreenShell()
      } else if (!isFullscreen && this.isShellFullscreen) {
        this.restoreFullscreenShell()
      }
    },
    mountFullscreenShell () {
      const shell = this.$refs.editorShell
      if (!shell || this.isShellFullscreen) return
      this.originalParent = shell.parentNode
      this.originalNextSibling = shell.nextSibling
      this.fullscreenPlaceholder = document.createComment('wang-editor-fullscreen-placeholder')
      this.originalParent.insertBefore(this.fullscreenPlaceholder, shell)
      document.body.appendChild(shell)
      document.body.classList.add('wang-editor--fullscreen-open')
      this.isShellFullscreen = true
    },
    restoreFullscreenShell () {
      const shell = this.$refs.editorShell
      document.body.classList.remove('wang-editor--fullscreen-open')
      if (!shell || !this.isShellFullscreen) return

      if (this.fullscreenPlaceholder && this.originalParent) {
        this.originalParent.insertBefore(shell, this.fullscreenPlaceholder)
        this.originalParent.removeChild(this.fullscreenPlaceholder)
      } else if (this.originalParent) {
        this.originalParent.insertBefore(shell, this.originalNextSibling)
      }
      this.fullscreenPlaceholder = null
      this.originalParent = null
      this.originalNextSibling = null
      this.isShellFullscreen = false
    },
    uploadImages (files, insertImgFn) {
      Array.from(files || []).forEach(file => {
        if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
          this.$message.warning(`选择的文件类型 ${file.type} 非图像类文件`)
          return
        }
        if (file.size / 1024 / 1024 > 5) {
          this.$message.warning('上传图片大小不能超过 5MB')
          return
        }

        const formData = new FormData()
        formData.append('file', file)
        fileService.upload(formData).then(response => {
          const url = this.resolveUploadUrl(response)
          if (!url) {
            this.$message.error('图片上传成功，但未返回图片地址')
            return
          }
          insertImgFn(url)
        }).catch(() => {
          this.$message.error('图片上传失败')
        })
      })
    },
    resolveUploadUrl (response) {
      const data = response && response.data ? response.data : response
      if (!data) return ''
      if (typeof data === 'string') return data
      return data.url || data.fileUrl || data.src || data.path || (data.data && (data.data.url || data.data.fileUrl || data.data.src || data.data.path)) || ''
    }
  }
}
</script>

<style lang="less" scoped>
.bottom {
  margin-bottom: 10px;
  cursor: pointer;
}
.monaco-box ::v-deep .el-textarea__inner{
  height: 600px;
}

.wang-editor-shell {
  min-width: 0;
}

.wang-editor-shell ::v-deep .w-e-full-screen-editor {
  z-index: 99999 !important;
}

.wang-editor-shell ::v-deep .w-e-full-screen-editor .w-e-text-container {
  height: calc(100vh - 41px) !important;
}
</style>

<style>
body.wang-editor--fullscreen-open {
  overflow: hidden;
}

body.wang-editor--fullscreen-open .wang-editor-shell {
  position: fixed;
  z-index: 99999;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: #fff;
}
</style>
