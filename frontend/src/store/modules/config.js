import { resolveThemeColor } from '@/utils/themeColor'

const resolveDefaultTheme = () => resolveThemeColor(localStorage.getItem('defaultTheme'))

export default {
  namespaced: true,
  state: {
    smtp: '', // 邮箱服务器地址
    port: '', // 邮箱服务器端口
    mailName: '', // 系统邮箱地址
    mailPassword: '', // 系统邮箱密码
   /*
     阿里大鱼配置信息
    */
    accessKeyId: '', // 由后端安全配置提供
    accessKeySecret: '', // 由后端安全配置提供
    signature: '', // 必填:短信签名-可在短信控制台中找到
    templateCode: '', // 必填:短信模板-可在短信控制台中找到-->
   /*
      外观配置
    */
    defaultTheme: resolveDefaultTheme(), // 默认主题
    defaultLayout: localStorage.getItem('defaultLayout'),
    productName: '', // 产品名称
    brandSubtitle: localStorage.getItem('brandSubtitle') || '', // 品牌副标题
    logo: '', // 产品logo: '',

    /**
     * 预警配置
     */
    aiBoxEnabled: '', // 是否启用AI-Box
    alarmLogSaveDays: '' // 预警日志保存天数

  },
  mutations: {
    updateDefaultTheme (state, val) {
      state.defaultTheme = resolveThemeColor(val)
    },
    updateDefaultLayout (state, val) {
      state.defaultLayout = val
    },
    updateProductName (state, val) {
      state.productName = val
    },
    updateBrandSubtitle (state, val) {
      state.brandSubtitle = val
    },
    updateLogo (state, val) {
      state.logo = val
    },
    updateConfig (state, config) {
      state.smtp = config.smtp
      state.port = config.port
      state.mailName = config.mailName
      state.mailPassword = config.mailPassword
      state.accessKeyId = config.accessKeyId
      state.accessKeySecret = config.accessKeySecret
      state.signature = config.signature
      state.templateCode = config.templateCode
      state.defaultTheme = resolveThemeColor(config.defaultTheme)
      state.defaultLayout = config.defaultLayout
      state.productName = config.productName
      state.brandSubtitle = config.brandSubtitle || localStorage.getItem('brandSubtitle') || ''
      state.logo = config.logo
      state.aiBoxEnabled = config.aiBoxEnabled
      state.alarmLogSaveDays = config.alarmLogSaveDays
    }
  }
}
