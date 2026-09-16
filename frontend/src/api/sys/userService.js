import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/sys/user/save',
      method: 'post',
      headers: { arrayFormat: 'repeat' },
      data: inputForm
    })
  },

  saveInfo (inputForm) {
    return request({
      url: '/sys/user/saveInfo',
      method: 'post',
      headers: { arrayFormat: 'repeat' },
      data: inputForm
    })
  },

  savePwd (inputForm) {
    return request({
      url: '/sys/user/savePwd',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/sys/user/delete',
      method: 'get',
      params: { ids }
    })
  },

  queryById (id) {
    return request({
      url: '/sys/user/queryById',
      method: 'get',
      params: { id }
    })
  },

  getMenus () {
    return request({
      url: '/sys/user/getMenus',
      method: 'get'
    })
  },

  info () {
    return request({
      url: '/sys/user/info',
      method: 'get'
    })
  },

  list (params) {
    return request({
      url: '/sys/user/list',
      method: 'get',
      params
    })
  },
  exportTemplate () {
    return request({
      url: '/sys/user/import/template',
      method: 'get',
      responseType: 'blob'
    })
  },

  exportExcel (params) {
    return request({
      url: '/sys/user/export',
      method: 'get',
      params,
      responseType: 'blob'
    })
  },

  importExcel (data) {
    return request({
      url: '/sys/user/import',
      method: 'post',
      data
    })
  }
}
