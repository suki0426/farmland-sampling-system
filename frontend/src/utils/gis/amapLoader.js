/**
 * 高德地图 JS API 加载器（1号 前端GIS 岗位）
 *
 * 说明：
 *  - 高德地图 JavaScript API 2.0 需要「Web端(JS API)」Key；2021-12-02 之后申请的 Key
 *    还必须配合「安全密钥 securityJsCode」才能使用（两者在 .env 中配置）。
 *  - 加载失败（未配置 Key / 网络不可达 / 域名白名单不通过）时不抛到页面上，
 *    而是返回结构化错误，由 GisMap 决定降级到内置离线矢量地图，保证页面永远可演示。
 */

export const AMAP_ERROR = {
  NO_KEY: 'NO_KEY',
  LOAD_FAILED: 'LOAD_FAILED',
  TIMEOUT: 'TIMEOUT'
}

const SCRIPT_ID = 'amap-jsapi-script'
const DEFAULT_PLUGINS = ['AMap.Scale', 'AMap.ToolBar', 'AMap.Geolocation']

let loadingPromise = null

/**
 * 读取高德配置。
 *
 * 来源只有两个，**刻意不支持 localStorage**：
 *   1. `window.SITE_CONFIG.amapKey` —— 由部署方在运行时注入（推荐用于正式环境/密钥轮换）
 *   2. 构建期环境变量 `VUE_APP_AMAP_KEY` / `VUE_APP_AMAP_SECURITY_CODE`
 *
 * ⚠️ 合并评审意见 #7：此前这里还有一条"从浏览器本地存储读取 Key"的兜底分支，
 *    并在文档里引导"临时调试就写浏览器本地存储"。该分支已被**移除**，原因：
 *      - 把 API Key 放进 localStorage 会被任意同源脚本读取（XSS 即可窃取），
 *        而且会长久留在用户浏览器里，属于典型的凭据暴露反模式；
 *      - Key 的配置应当走**构建期环境变量**或**部署期注入**，是可审计、可轮换的路径；
 *      - 前端本来就不该承担"凭据分发"的职责。
 *    现在若未配置 Key，页面会明确提示去配置环境变量，并自动降级到内置离线矢量地图。
 */
export function getAmapConfig () {
  const siteConfig = (typeof window !== 'undefined' && window.SITE_CONFIG) || {}
  return {
    key: siteConfig.amapKey || process.env.VUE_APP_AMAP_KEY || '',
    securityJsCode: siteConfig.amapSecurityJsCode || process.env.VUE_APP_AMAP_SECURITY_CODE || '',
    version: siteConfig.amapVersion || process.env.VUE_APP_AMAP_VERSION || '2.0'
  }
}

/** 是否已成功加载 */
export function isAmapLoaded () {
  return typeof window !== 'undefined' && !!window.AMap
}

/**
 * 动态加载高德 JS API
 * @returns {Promise<object>} resolve(window.AMap)
 * @throws {{code:string, message:string}} 结构化错误
 */
export function loadAMap (options = {}) {
  const config = Object.assign({}, getAmapConfig(), options)
  if (isAmapLoaded()) {
    return Promise.resolve(window.AMap)
  }
  if (!config.key) {
    return Promise.reject({
      code: AMAP_ERROR.NO_KEY,
      message: '未配置高德地图 Key，已切换到内置离线地图。请在 .env.development 中填写 VUE_APP_AMAP_KEY 后重启前端。'
    })
  }
  if (loadingPromise) {
    return loadingPromise
  }

  const plugins = options.plugins || DEFAULT_PLUGINS
  loadingPromise = new Promise((resolve, reject) => {
    // 安全密钥必须在脚本加载之前挂到 window 上
    if (config.securityJsCode) {
      window._AMapSecurityConfig = { securityJsCode: config.securityJsCode }
    }

    let settled = false
    const timer = window.setTimeout(() => {
      if (settled) {
        return
      }
      settled = true
      loadingPromise = null
      reject({
        code: AMAP_ERROR.TIMEOUT,
        message: '高德地图脚本加载超时（可能是网络不通或 Key 域名白名单未放行），已切换到内置离线地图。'
      })
    }, options.timeout || 12000)

    const finish = (fn, payload) => {
      if (settled) {
        return
      }
      settled = true
      window.clearTimeout(timer)
      fn(payload)
    }

    const params = [
      `v=${encodeURIComponent(config.version)}`,
      `key=${encodeURIComponent(config.key)}`
    ]
    if (plugins.length) {
      params.push(`plugin=${encodeURIComponent(plugins.join(','))}`)
    }

    const existing = document.getElementById(SCRIPT_ID)
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing)
    }

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.type = 'text/javascript'
    script.async = true
    script.src = `https://webapi.amap.com/maps?${params.join('&')}`
    script.onload = () => {
      if (window.AMap) {
        finish(resolve, window.AMap)
      } else {
        loadingPromise = null
        finish(reject, {
          code: AMAP_ERROR.LOAD_FAILED,
          message: '高德地图脚本已返回但未挂载 AMap 对象，请检查 Key 是否有效或域名白名单设置。已切换到内置离线地图。'
        })
      }
    }
    script.onerror = () => {
      loadingPromise = null
      finish(reject, {
        code: AMAP_ERROR.LOAD_FAILED,
        message: '高德地图脚本请求失败（网络不可达或 Key 无权限），已切换到内置离线地图。'
      })
    }
    document.head.appendChild(script)
  })
  return loadingPromise
}

export default { AMAP_ERROR, getAmapConfig, isAmapLoaded, loadAMap }
