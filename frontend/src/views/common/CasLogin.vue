
<template></template>
<script>
import userService from '@/api/sys/userService'
import { clearLoginInfo } from '@/utils'
export default {
  mounted: function () {
    this.casLogin()
  },
  methods: {

    // cas登录
    casLogin () {
      let st = this.getTicket()
      let sevice = window.location.protocol + '//' + window.location.host + '/'
      this.$http({
        url: '/sys/hbCasLogin',
        method: 'get',
        params: { 'ticket': st, 'service': sevice }
      }).then(({ data }) => {
        this.$cookie.set('token', data.token)
        userService.getMenus().then(({ data }) => {
          localStorage.setItem('routerList', JSON.stringify(data.routerList || '[]'))
          localStorage.setItem('allMenuList', JSON.stringify(data.menuList || '[]'))
          localStorage.setItem('permissions', JSON.stringify(data.permissions || '[]'))
          localStorage.setItem('dictList', JSON.stringify(data.dictList || '[]'))
          this.$router.push({ name: 'home' })
        })
      }).cache((e) => {
        clearLoginInfo()
        this.$message.error(e)
        this.$router.push({ name: 'login' })
        // window.location.href = `${process.env.VUE_APP_CAS_SERVER}/login?service=${process.env.VUE_APP_CLIENT_LOGIN}`
      })
    },
    getTicket () {
      let url = document.location.toString()
      return url.split('?')[1].split('#')[0].split('=')[1]
    }
  }

}
</script>