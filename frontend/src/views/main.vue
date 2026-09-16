<template>
  <div id="app"
    class="jp-wrapper ultra-layout-shell"
    :style="themeStyleVars"
    :class="{ 'jp-sidebar--fold': sidebarFold }">
    <template>
      <main-navbar ref="navbar" @showRight="showRight" />
      <main-sidebar/>
      <div class="jp-content__wrapper ultra-layout-shell__content">
        <main-content/>
      </div>
      <main-right ref="mainRight"/>
    </template>
  </div>
</template>

<script>
  import MainNavbar from './layout/_common_top'
  import MainSidebar from './layout/_common_left'
  import MainContent from './layout/_common_center'
  import MainRight from './layout/_common_right'
  import configService from '@/api/sys/configService'
  import userService from '@/api/sys/userService'
  import { createThemeStyleVars, resolveThemeColor } from '@/utils/themeColor'

  export default {
    data () {
      return {
        isRightVisible: false
      }
    },
    components: {
      MainNavbar,
      MainSidebar,
      MainContent,
      MainRight
    },
    computed: {
      defaultTheme () {
        return this.$store.state.config.defaultTheme
      },
      themeStyleVars () {
        return createThemeStyleVars(this.defaultTheme)
      },
      sidebarFold: {
        get () {
          return this.$store.state.common.sidebarFold
        }
      }
    },
    watch: {
      themeStyleVars: {
        immediate: true,
        handler (vars) {
          this.syncDocumentTheme(vars)
        }
      }
    },
    mounted () {
      this.getUserInfo()
      this.getConfig()
      this.resetDocumentClientHeight()
    },
    methods: {
      syncDocumentTheme (vars) {
        if (!vars || typeof document === 'undefined') return

        Object.keys(vars).forEach((key) => {
          document.documentElement.style.setProperty(key, vars[key])
        })
      },
      // 重置窗口可视高度
      resetDocumentClientHeight () {
        window.onresize = () => {
          if (this.$refs.navbar) {
            let _defaultLayout = this.$refs.navbar.defaultLayout
            if (_defaultLayout === 'top') {
              this.$refs.navbar.fixTopMenu()
            }
          }
        }
      },
      showRight (flag) {
        this.$refs.mainRight.showRight()
        this.isRightVisible = flag
      },
      // 获取当前登录用户信息
      getUserInfo () {
        userService.info().then(({data}) => {
          this.$store.commit('user/updateUser', data.user)
        })
      },
      // 获取产品name 和 logo
      getConfig () {
        configService.getConfig().then(({data}) => {
          const storedTheme = localStorage.getItem('defaultTheme')
          const resolvedStoredTheme = storedTheme ? resolveThemeColor(storedTheme) : ''
          const resolvedServerTheme = resolveThemeColor(data.defaultTheme)
          const activeTheme = resolvedStoredTheme || resolvedServerTheme
          this.$store.commit('config/updateProductName', data.productName)
          this.$store.commit('config/updateBrandSubtitle', data.brandSubtitle || localStorage.getItem('brandSubtitle') || '')
          this.$store.commit('config/updateLogo', data.logo)
          if (!localStorage.getItem('defaultLayout')) {
            this.$store.commit('config/updateDefaultLayout', data.defaultLayout)
          }
          if (storedTheme && storedTheme !== resolvedStoredTheme) {
            localStorage.setItem('defaultTheme', resolvedStoredTheme)
          }
          localStorage.setItem('defaultTheme', activeTheme)
          this.$store.commit('config/updateDefaultTheme', activeTheme)
        })
      }
    }
  }
</script>
