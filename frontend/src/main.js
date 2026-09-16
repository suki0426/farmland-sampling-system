import Vue from 'vue'
import App from '@/App'
import router from '@/router'
import store from '@/store'
import cloneDeep from 'lodash/cloneDeep'
import '@/bootstrap/styles'
import { bootstrapApp } from '@/bootstrap'

Vue.config.productionTip = false

bootstrapApp()

// utils.printLogo()

// 保存整站vuex本地储存初始状态
window.SITE_CONFIG = {}
window.SITE_CONFIG['storeState'] = cloneDeep(store.state)
// window.Hls = require('hls.js')

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
})
