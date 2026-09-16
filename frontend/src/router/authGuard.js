import Vue from 'vue'
import { clearLoginInfo } from '@/utils'
import { updateDocumentTitle } from './routeTitle'

function currentRouteType (route, globalRoutes = []) {
  let temp = []
  for (let i = 0; i < globalRoutes.length; i++) {
    if (route.path === globalRoutes[i].path) {
      return 'global'
    } else if (globalRoutes[i].children && globalRoutes[i].children.length >= 1) {
      temp = temp.concat(globalRoutes[i].children)
    }
  }
  return temp.length >= 1 ? currentRouteType(route, temp) : 'main'
}

export function registerAuthGuard ({ router, globalRoutes, addDynamicRoutes }) {
  router.beforeEach((to, from, next) => {
    let token = Vue.cookie.get('token')
    if (!token || !/\S/.test(token)) { // token为空，跳转到login登录
      clearLoginInfo()
      if (process.env.VUE_APP_SSO_LOGIN === 'true') { // 如果是单点登录
        if (to.name === 'casLogin') { // 单点登录跳转页面获取token
          next()
        } else if (to.name === 'login') {
          next()
        } else {
          window.location.href = `${process.env.VUE_APP_CAS_SERVER}/login?service=${process.env.VUE_APP_CLIENT_LOGIN}`
        }
      } else {
        if (currentRouteType(to, globalRoutes) === 'global') {
          next()
        } else {
          console.log(to.name)
          next({ name: 'login' })
        }
      }
    } else if (router.options.isAddDynamicMenuRoutes) { // 如果已经包含权限
      next()
    } else { // 请求权限
      let routerList = localStorage.getItem('routerList')
      if (routerList) {
        router.options.isAddDynamicMenuRoutes = true
        addDynamicRoutes(JSON.parse(routerList), [])
        next({ ...to, replace: true })
      } else {
        clearLoginInfo()
        next()
        console.log(`请求菜单列表和权限失败，跳转至登录页！！`, 'color:blue')
      }
    }
      // 设置页面默认标题
    updateDocumentTitle()
  })
}
