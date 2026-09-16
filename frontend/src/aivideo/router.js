import Router from 'vue-router'
import Vue from 'vue'
Vue.use(Router)
const vueRouter = new Router({
  routes: [
    {
      path: '/',
      name: 'view',
      component: () => import(/* webpackChunkName: "page" */ '@/aivideo/page/index.vue')
    }
  ]
})
export default vueRouter
