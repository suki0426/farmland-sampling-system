<template>
  <div class="login-container">
    <div class="login-weaper animated fadeInDown" style="z-index:100">
      <div class="login-branding">
        <p class="login-kicker">
          {{ time }}
        </p>
        <h1 class="login-brand">
          {{ productName || 'JeePlus 管理系统' }}
        </h1>
        <p class="login-brand-subtitle">
          欢迎回来，请使用账号密码完成身份验证
        </p>
      </div>

      <div class="login-border">
        <div class="login-main">
          <div class="login-panel-header">
            <h4 class="login-title">
              登录
            </h4>
            <h3 class="login-sub-title">
              使用账号、密码和验证码完成安全登录
            </h3>
          </div>

          <el-form
            size="small"
            ref="inputForm"
            :model="inputForm"
            :rules="rules"
            class="login-form"
            @keyup.enter.native="login()"
            @submit.native.prevent
          >
            <el-form-item prop="username">
              <el-input type="text" placeholder="请输入账号" v-model="inputForm.username">
                <i slot="prefix" class="el-input__icon el-icon-user-solid"></i>
              </el-input>
            </el-form-item>

            <el-form-item prop="password">
              <el-input
                type="password"
                placeholder="请输入密码"
                v-model="inputForm.password"
              >
                <i slot="prefix" class="el-input__icon el-icon-lock"></i>
              </el-input>
            </el-form-item>

            <el-form-item class="login-captcha-item">
              <div class="login-captcha-row">
                <div class="login-captcha-preview" @click="getCaptcha">
                  <el-image :src="captchaImg"></el-image>
                </div>
                <div class="login-captcha-input">
                  <el-form-item prop="code">
                    <el-input placeholder="请输入验证码" v-model="inputForm.code"></el-input>
                  </el-form-item>
                </div>
              </div>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :loading="loading" class="login-submit" @click="login">登录</el-button>
            </el-form-item>
          </el-form>

          <div class="login-note">
            登录后将自动加载菜单、权限和数据字典配置
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/*eslint-disable */
import CryptoJS from 'crypto-js';
import configService from '@/api/sys/configService'
import loginService from '@/api/auth/loginService'
import userService from '@/api/sys/userService'
export default {
  data () {
    return {
      time: '',
      logo: '',
      productName: '',
      timer: null,
      loading: false,
      captchaImg: '',
      inputForm: {
        username: '',
        password: '',
        uuid: '',
        code: ''
      },
      rules: {
        username: [
          { required: true, message: '帐号不能为空', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '密码不能为空', trigger: 'blur' }
        ],
        code: [
          { required: true, message: '验证码不能为空', trigger: 'blur' }
        ]
      },
      captchaPath: ''
    }
  },
  created () {
    this.getTime()
    this.timer = setInterval(() => {
      this.getTime()
    }, 1000)
  },
  beforeDestroy () {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  },
  mounted () {
    configService.getConfig().then(({ data }) => {
      this.productName = data.productName
      localStorage.setItem('productName', this.productName)
    })
    this.getCaptcha()
  },
  methods: {
    // 提交表单
    login () {
      this.$refs['inputForm'].validate((valid) => {
        if (valid) {
          this.loading = true
          const key = 'quanquankejigong'; // 替换为你自己的密钥
          const submitForm = {
            ...this.inputForm,
            password: CryptoJS.AES.encrypt(
              this.inputForm.password,
              CryptoJS.enc.Utf8.parse(key),  // Convert the key to Utf8 bytes
              {
                mode: CryptoJS.mode.ECB,
                padding: CryptoJS.pad.Pkcs7,
              }
            ).toString()
          }
          loginService.login(submitForm)
            .then(({ data }) => {
              this.$cookie.set('token', data.token)
              return userService.getMenus().then(({ data: menuData }) => ({
                loginData: data,
                menuData
              }))
            })
            .then(({ loginData, menuData }) => {
              localStorage.setItem('routerList', JSON.stringify(menuData.routerList || '[]'))
              localStorage.setItem('allMenuList', JSON.stringify(menuData.menuList || '[]'))
              localStorage.setItem('permissions', JSON.stringify(menuData.permissions || '[]'))
              localStorage.setItem('dictList', JSON.stringify(menuData.dictList || '[]'))
              this.$notify({
                title: '登录成功',
                message: loginData.oldLoginIp ? `欢迎回来！<br/>你上次的登录IP是 ${loginData.oldLoginIp}，登录时间是 ${loginData.oldLoginDate}。` : '欢迎使用本系统',
                dangerouslyUseHTMLString: true,
                duration: 10000,
                type: 'success'
              })
              // 登录后直接进入唯一保留的独立监控大屏，不再先挂载旧 JeePlus 首页。
              window.location.replace(`${window.location.origin}/monitor.html?page=dashboard`)
            })
            .catch(e => {
              if (this.isCaptchaError(e)) {
                this.inputForm.code = ''
                this.$nextTick(() => {
                  this.$refs.inputForm && this.$refs.inputForm.clearValidate(['code'])
                })
              }
              this.getCaptcha()
            })
            .finally(() => {
              this.loading = false
            })
        }
      })
    },
    getErrorMessage (error) {
      if (!error) {
        return ''
      }
      const responseData = error.response && error.response.data
      if (typeof responseData === 'string') {
        return responseData
      }
      if (responseData && typeof responseData.message === 'string') {
        return responseData.message
      }
      if (typeof error.message === 'string') {
        return error.message
      }
      return ''
    },
    isCaptchaError (error) {
      const message = this.getErrorMessage(error)
      return /验证码|captcha|校验码/i.test(message)
    },
    getTime () {
      this.time = this.moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
    },
    // 获取验证码
    getCaptcha () {
      loginService.getCode().then(({ data }) => {
        this.captchaImg = 'data:image/png;base64,' + data.codeImg
        this.inputForm.uuid = data.uuid
      })
    }
  }
}
</script>

<style lang="scss">
@import '~@/assets/scss/login.scss';
</style>
