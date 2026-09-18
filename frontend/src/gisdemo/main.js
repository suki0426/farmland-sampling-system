/**
 * 前端 GIS 独立演示入口（1号 前端GIS 岗位）
 *
 * 为什么需要它：
 *  正式的 JeePlus 页面（/farmland/FarmlandGis）必须登录后由后端菜单下发动态路由才能访问，
 *  而 5号 后端和菜单尚未就绪时无法登录，页面就跑不起来。
 *  这个入口直接挂载同一个 FarmlandGis 组件，不做登录、不依赖后端菜单，
 *  数据由 gisGateway 自动降级到字段一致的 mock，因此「今天就能演示」。
 *
 * 启动方式：npm run serve → 浏览器打开 http://localhost:3000/gis.html
 *
 * 注意：它复用的是同一套组件与同一套 API Service，
 * 后端就绪后走 /farmland/FarmlandGis 正式路由即可，不需要重写任何页面代码。
 */

// ⚠️ 必须放在最前面。
// 依赖链是：演示入口 → FarmlandGis.vue → gisGateway → httpRequest → @/shared/api/request
//          → @/router → staticRoutes → 再次 require FarmlandGis.vue
// 这是一条循环依赖。如果从 FarmlandGis 开始求值，webpack 在环内取到的 `.default`
// 会是 undefined，导致静态路由 /farmland/FarmlandGis 的 component 变成空。
// 先求值 @/router，让环在 router 内部被打断，FarmlandGis 就能完整求值。
import '@/router'

import Vue from 'vue'
import VueCookie from 'vue-cookie'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import VCharts from 'v-charts'

import FarmlandGis from '@/views/modules/farmland/FarmlandGis'

Vue.config.productionTip = false

/**
 * ⚠️ 显式声明"这是演示入口"。
 *
 * 合并评审意见 #2 要求：演示放行**只能由显式开关触发**，不能以"权限列表为空"为条件。
 * 这个入口就是那个显式开关：
 *   - 只有走到 gis.html 才会设置它；
 *   - gisPermission.isGisDemoMode() 在生产构建（NODE_ENV === 'production'）下
 *     一律返回 false，所以**正式打包产物里的 gis.html 也不会放行写操作**；
 *   - JeePlus 正式页面 /farmland/FarmlandGis 走的是主应用入口，永远不会设置这个标志，
 *     因此永远严格校验权限。
 */
window.__GIS_DEMO__ = true

// 页面里用到 $message / v-loading / el-* 组件，这里注册 ElementUI 与 v-charts（ECharts 封装）
Vue.use(ElementUI, { size: 'small' })
Vue.use(VCharts)

// 路由守卫会调用 Vue.cookie.get('token')，这里一并注册，避免演示页出现不必要的告警
Vue.use(VueCookie)

// 与主应用保持一致：字典读取工具依赖 localStorage 中的 dictList，缺失时使用内置兜底标签
if (!window.localStorage.getItem('dictList')) {
  window.localStorage.setItem('dictList', JSON.stringify({}))
}

/* eslint-disable no-new */
new Vue({
  el: '#app',
  render: h => h(FarmlandGis)
})
