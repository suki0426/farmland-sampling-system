/**
 * 全站路由配置
 * 代码中路由统一使用path属性跳转
 */
import Vue from 'vue'
import Router from 'vue-router'
import { registerAuthGuard } from './authGuard'
import { addDynamicMenuRoutes } from './dynamicRoutes'
import { createGlobalRoutes, createMainRoutes } from './staticRoutes'

Vue.use(Router)

const routerPush = Router.prototype.push
Router.prototype.push = function push (location) {
  return routerPush.call(this, location).catch(error => error)
}

// 开发环境不使用懒加载
const _import = require('./import-' + process.env.NODE_ENV)
const globalRoutes = createGlobalRoutes(_import)
const mainRoutes = createMainRoutes(_import)

const router = new Router({
  mode: 'hash',
  scrollBehavior: () => ({ y: 0 }),
  isAddDynamicMenuRoutes: false, // 是否已经添加动态(菜单)路由
  routes: globalRoutes.concat(mainRoutes)
})

registerAuthGuard({
  router,
  globalRoutes,
  addDynamicRoutes: (menuList, routes) => addDynamicMenuRoutes({
    router,
    mainRoutes,
    _import,
    menuList,
    routes
  })
})

export default router
