import Vue from 'vue'
import axios from 'axios'
import moment from 'moment'
import lodash from 'lodash/object'
import httpRequest from '@/utils/httpRequest'
import dictUtils from '@/utils/dictUtils'
import utils from '@/utils'
import validator from '@/utils/validator'

export function registerGlobalProperties () {
  Vue.prototype.$http = httpRequest
  Vue.prototype.hasPermission = utils.hasPermission
  Vue.prototype.treeDataTranslate = utils.treeDataTranslate
  Vue.prototype.$utils = utils
  Vue.prototype.$window = window
  Vue.prototype.$dictUtils = dictUtils
  Vue.prototype.recover = utils.recover
  Vue.prototype.recoverNotNull = utils.recoverNotNull
  Vue.prototype.$axios = axios
  Vue.prototype.validator = validator
  Vue.prototype.lodash = lodash
  Vue.prototype.moment = moment
  Vue.prototype.deepClone = utils.deepClone
  Vue.prototype.validatenull = utils.validatenull
  Vue.prototype.$events = new Vue()
}
