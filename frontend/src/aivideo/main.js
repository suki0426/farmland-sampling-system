import Vue from 'vue'
import dataV from '@jiaminghi/data-view'
import router from './router.js'

import VueCookie from 'vue-cookie'

import App from './App.vue'
import './styles/common.less'
import '@/aivideo/utils/es6'

import httpRequest from '@/utils/httpRequest'
Vue.prototype.$http = httpRequest // ajax请求方法
Vue.config.productionTip = false
Vue.use(VueCookie)
Vue.use(dataV)
new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
