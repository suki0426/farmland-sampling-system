import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/onlytable/onlyTable/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/onlytable/onlyTable/delete',
      method: 'get',
      params: {ids}
    })
  },

  queryById (id) {
    return request({
      url: '/onlytable/onlyTable/queryById',
      method: 'get',
      params: {id}
    })
  },

  list (params) {
    return request({
      url: '/onlytable/onlyTable/list',
      method: 'get',
      params
    })
  },

  exportTemplate () {
    return request({
      url: '/onlytable/onlyTable/import/template',
      method: 'get',
      responseType: 'blob'
    })
  },

  exportExcel (params) {
    return request({
      url: '/onlytable/onlyTable/export',
      method: 'get',
      params,
      responseType: 'blob'
    })
  },

  importExcel (data) {
    return request({
      url: '/onlytable/onlyTable/import',
      method: 'post',
      data
    })
  }
}
