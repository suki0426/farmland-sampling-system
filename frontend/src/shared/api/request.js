import Vue from 'vue'
import axios from 'axios'
// import axiosRetry from 'axios-retry'
import router from '@/router'
import { clearLoginInfo } from '@/utils'
import qs from 'qs'
import {
  Message,
  Loading
} from 'element-ui'

// 超时时间
axios.defaults.timeout = 100000
// 跨域请求，允许保存cookie
axios.defaults.withCredentials = true
axios.defaults.headers = { 'Content-Type': 'application/json; charset=utf-8' }
// axios.defaults.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=utf-8'
axios.defaults.headers['Access-Control-Allow-Origin'] = '*'
// 非生产环境 && 开启代理, 接口前缀统一使用[/api]前缀做代理拦截!
const BASE_URL = process.env.NODE_ENV !== 'production' ? process.env.VUE_APP_BASE_API : process.env.VUE_APP_SERVER_URL
// 对面暴露的基础请求路径
axios.BASE_URL = BASE_URL

function getResponseMessage (response) {
  if (!response) {
    return ''
  }
  const data = response.data
  if (typeof data === 'string') {
    return data
  }
  if (data && typeof data.message === 'string') {
    return data.message
  }
  if (data && typeof data.msg === 'string') {
    return data.msg
  }
  if (data === undefined || data === null) {
    return ''
  }
  try {
    return JSON.stringify(data)
  } catch (e) {
    return String(data)
  }
}

function showErrorMessage (message, duration = 3000) {
  Message({
    message: String(message || ''),
    type: 'error',
    showClose: true,
    duration
  })
}

let loading
let loadingCount = 0

function openLoading (config) {
  if (config.loading !== true) {
    return
  }
  config._showLoading = true
  loadingCount += 1
  if (!loading) {
    loading = Loading.service({
      text: config.loadingText || 'Loading...',
      spinner: 'el-icon-loading',
      background: 'rgba(0, 0, 0, 0.7)'
    })
  }
}

function closeLoading (config = {}) {
  if (!config._showLoading) {
    return
  }
  loadingCount = Math.max(loadingCount - 1, 0)
  if (loadingCount === 0 && loading) {
    loading.close()
    loading = null
  }
}

/**
 * 请求拦截
 */
axios.interceptors.request.use(config => {
  openLoading(config)
  // 请求头带上token
  if (Vue.cookie.get('token')) {
    config.headers.token = Vue.cookie.get('token')
  }
  // 请求地址处理
  if (!config.url.startsWith('http')) {
    config.url = BASE_URL + config.url
  }

  const type = config.method
  const arrayFormat = config.headers.arrayFormat || 'indices'
  if (type === 'post' && config.headers['Content-Type'] === 'application/x-www-form-urlencoded; charset=utf-8') {
    // post请求参数处理
    config.data = qs.stringify(config.data, { allowDots: true, arrayFormat: arrayFormat })
  } else if (type === 'get') {
    // get请求参数处理
    config.paramsSerializer = (params) => {
      return qs.stringify(params, {
        allowDots: true, arrayFormat: arrayFormat
      })
    }
  }
  return config
}, error => {
  return Promise.reject(error)
})

/**
 * 响应拦截
 */
axios.interceptors.response.use(response => {
  closeLoading(response.config)
  return response
}, error => {
  closeLoading(error && error.config)
  const response = error && error.response
  if (!response) {
    showErrorMessage('网络请求失败，请检查后端服务和代理配置是否正常。', 5000)
    return Promise.reject(error)
  }
  const responseMessage = getResponseMessage(response)
  if (response.status === 408 || response.status === 401) { // 需要重新登录
    clearLoginInfo()
    router.push({ name: 'login' })
    showErrorMessage(responseMessage)
  } else if (response.status === 404) { // 路径找不到
    showErrorMessage('404 路径找不到' + ': ' + response.config.url)
  } else if (response.status === 503) {
    showErrorMessage('503 服务不可用' + ': ' + response.config.url)
  } else if (response.status === 504) {
    showErrorMessage('504 网络连接错误' + ': ' + responseMessage)
    //
  } else if (response.status === 500 && responseMessage.includes('Proxy error: Could not proxy request')) {
    console.log('error0000000', error)
    // Message({
    //   message: 'API服务未启动',
    //   type: 'error',
    //   showClose: true,
    //   dangerouslyUseHTMLString: true,
    //   duration: 3000
    // })
  } else {
    showErrorMessage(responseMessage || response || error, 5000)
  }

  return Promise.reject(error)
})

// 配置axios
// axiosRetry(axios, {
//   retries: 3,  // 设置自动发送请求次数
//   retryCondition: () => {
//       // true为打开自动发送请求，false为关闭自动发送请求
//       // 这里的意思是当请求方式为get时打开自动发送请求功能
//     return false
//   }
// })
export default axios
