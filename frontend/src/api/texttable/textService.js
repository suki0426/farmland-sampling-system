import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/texttable/text/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/texttable/text/delete',
      method: 'get',
      params: {ids}
    })
  },

  queryById (id) {
    return request({
      url: '/texttable/text/queryById',
      method: 'get',
      params: {id}
    })
  },

  list (params) {
    return request({
      url: '/texttable/text/list',
      method: 'get',
      params
    })
  },

  exportTemplate () {
    return request({
      url: '/texttable/text/import/template',
      method: 'get',
      responseType: 'blob'
    })
  },

  exportExcel (params) {
    return request({
      url: '/texttable/text/export',
      method: 'get',
      params,
      responseType: 'blob'
    })
  },

  importExcel (data) {
    return request({
      url: '/texttable/text/import',
      method: 'post',
      data
    })
  }
}
