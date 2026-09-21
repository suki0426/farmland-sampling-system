/**
 * 农业智能监测平台 —— 独立演示入口（本地演示用）
 *
 * 与 gis.html 同样的定位：
 *   - 无需登录、不依赖后端菜单，`npm run serve` 后直接打开 http://localhost:3000/monitor.html
 *   - 复用**同一套组件**（@/views/modules/agrimonitor/*），不是第二套页面；
 *   - 只在**非生产构建**产出（vue.config.js 里 gate 掉），正式环境不存在这个入口；
 *   - 数据全部来自前端 mock，**不连数据库、不写任何数据**。
 *
 * 后端就绪后走 JeePlus 正式路由即可：/agrimonitor/Dashboard 等（已注册在 staticRoutes.js）。
 */

// ⚠️ 与 gis 演示入口同理：先求值 @/router，打断
//   演示入口 → 组件 → api → httpRequest → @/shared/api/request → @/router → staticRoutes → 组件
//   这条循环依赖，否则静态路由的 component 会解析成 undefined。
import '@/router'

import Vue from 'vue'
import VueCookie from 'vue-cookie'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import VCharts from 'v-charts'

import MonitorShell from './Shell'

Vue.config.productionTip = false

// 显式声明演示模式（与 1号 GIS 模块同一套权限开关语义）
window.__GIS_DEMO__ = true

Vue.use(ElementUI, { size: 'small' })
Vue.use(VCharts)
Vue.use(VueCookie)

if (!window.localStorage.getItem('dictList')) {
  window.localStorage.setItem('dictList', JSON.stringify({}))
}

/* eslint-disable no-new */
new Vue({
  el: '#app',
  render: h => h(MonitorShell)
})
