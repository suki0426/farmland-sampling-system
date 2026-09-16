import Vue from 'vue'
import ImageSelect from '@/components/upload/ImageSelect'
import ImageUpload from '@/components/upload/ImageUpload'
import FileUpload from '@/components/upload/FileUpload'
import awesomeIcon from 'vue-awesome/components/Icon'
import 'vue-awesome/icons/chart-bar.js'
import 'vue-awesome/icons/chart-area.js'
import 'vue-awesome/icons/chart-pie.js'
import 'vue-awesome/icons/chart-line.js'
import 'vue-awesome/icons/align-left.js'

export function registerGlobalComponents () {
  Vue.component('ImageSelect', ImageSelect)
  Vue.component('ImageUpload', ImageUpload)
  Vue.component('FileUpload', FileUpload)
  Vue.component('icon', awesomeIcon)
}
