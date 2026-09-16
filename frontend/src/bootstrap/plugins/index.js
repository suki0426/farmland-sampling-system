import Vue from 'vue'
import VueCookie from 'vue-cookie'
import ElementUI from 'element-ui'
import VueClipboard from 'vue-clipboard2'
import VCharts from 'v-charts'
import JeeplusGencode from 'jeeplus-gencode-v2'
import Print from 'vue-print-nb'
import XEUtils from 'xe-utils'
import VxeUI from 'vxe-pc-ui'
import VXETable from 'vxe-table'
import VXETablePluginExportXLSX from 'vxe-table-plugin-export-xlsx'
import zhCN from 'vxe-table/lib/locale/lang/zh-CN'
import dataV from '@jiaminghi/data-view'

export function registerPlugins () {
  VXETable.setup({
    i18n: (key, args) => XEUtils.toFormatString(XEUtils.get(zhCN, key), args)
  })

  VXETable.use(VXETablePluginExportXLSX)

  Vue.use(VxeUI)
  Vue.use(VXETable)
  Vue.use(Print)

  // Ultra layout turns the main content area into its own stacking context.
  // Mount dialogs to body so Element's modal mask cannot cover dialog content.
  ElementUI.Dialog.props.appendToBody.default = true

  Vue.use(JeeplusGencode)
  Vue.use(VCharts)

  VueClipboard.config.autoSetContainer = true
  Vue.use(VueClipboard)
  Vue.use(VueCookie)
  Vue.use(ElementUI)
  Vue.use(dataV)
}
