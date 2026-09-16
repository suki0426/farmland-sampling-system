<template>
  <div class="jp-container ultra-page-shell" :class="{ 'jp-container--with-tags': isTab }">
      <div class="main-maximize-exit" @click="exitMaximize"><i class="el-icon"><svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M764.288 214.592 512 466.88 259.712 214.592a31.936 31.936 0 0 0-45.12 45.12L466.752 512 214.528 764.224a31.936 31.936 0 1 0 45.12 45.184L512 557.184l252.288 252.288a31.936 31.936 0 0 0 45.12-45.12L557.12 512.064l252.288-252.352a31.936 31.936 0 1 0-45.12-45.184z"></path></svg></i></div>
      <tags-view :style="{ '--defaultTheme': defaultTheme}" v-if="isTab"></tags-view>
      <div class="jp-center">
            <div v-if="!isTab" class="ultra-theme ul-page-head ul-page-head--compact ultra-page-breadcrumbs">
              <el-breadcrumb separator="/">
                  <el-breadcrumb-item><router-link to="/home">首页</router-link></el-breadcrumb-item>
                  <el-breadcrumb-item :key="index" v-for="(breadcrumb, index) in breadcrumbs">{{breadcrumb}}</el-breadcrumb-item>
              </el-breadcrumb>
            </div>
            <div class="ultra-page-body">
              <iframe
                v-if="$route.meta.type === 'iframe'"
                :src="$route.query.iframeUrl || $route.meta.iframeUrl"
                width="100%" height="100%" frameborder="0" scrolling="yes">
              </iframe>
              <keep-alive v-else>
                <router-view v-if="isRouterAlive"/>
              </keep-alive>
            </div>
      </div>
  </div>
</template>

<script>
  import TagsView from './components/TagsView'
  import { mapState } from 'vuex'
  import Vue from 'vue'
  export default {
    data () {
      return {
        contextmenuFlag: false,
        isRouterAlive: true,
        selectTabName: '',
        breadcrumbs: [],
        eventHub: new Vue()
      }
    },
    components: {
      TagsView
    },
  
    computed: {
      ...mapState({
        isTab: state => state.common.isTab,
        defaultTheme: state => state.config.defaultTheme
      })
    },
    watch: {
      $route: {
        handler (val, from) {
          if (val && from && val.path === from.path && val.fullPath !== from.fullPath) { // 强制刷新参数不同的路由页面
            this.$router.replace({
              path: '/redirect' + val.fullPath
            })
          }
          this.breadcrumbs = []
          if (val.meta && val.meta.parentIds) {
            let ids = val.meta.parentIds.split(',')
            ids.forEach((id) => {
              if (id && id !== '0' && id !== '1') {
                let obj = {title: ''}
                this.getTitle(JSON.parse(localStorage.getItem('allMenuList') || '[]'), id, obj)
                this.breadcrumbs.push(obj.title)
              }
            })
            this.breadcrumbs.push(this.$route.query.title || this.$route.meta.title)
          }
        },
        immediate: true,
        deep: false
      }
    },
    methods: {
      // 获取路由名字
      getTitle (menus, id, obj) {
        menus.forEach((menu) => {
          if (menu.id === id) {
            obj.title = menu.name
          } else if (menu.children) {
            this.getTitle(menu.children, id, obj)
          }
        })
      },
      // 退出最大化
      exitMaximize () {
        document.getElementById('app').classList.remove('main-maximize')
      }
    }
  }
</script>

<style>
.el-icon svg {
    margin-bottom: -20px;
    height: 1em;
    width: 1em;
}
.jp-tags__contentmenu {
    position: fixed;
    width: 150px;
    background-color: #fff;
    z-index: 2024;
    border-radius: 5px;
    -webkit-box-shadow: 1px 2px 10px #ccc;
    box-shadow: 1px 2px 10px #ccc;
}
.jp-navbar__menu .el-badge__content.is-fixed {
    top: 15px;
}
</style>
