import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/test/onetomany/testDataMainForm/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/test/onetomany/testDataMainForm/delete',
      method: 'get',
      params: {ids}
    })
  },

  queryById (id) {
    return request({
      url: '/test/onetomany/testDataMainForm/queryById',
      method: 'get',
      params: {id}
    })
  },

  list (params) {
    return request({
      url: '/test/onetomany/testDataMainForm/list',
      method: 'get',
      params
    })
  },

  exportTemplate () {
    return request({
      url: '/test/onetomany/testDataMainForm/import/template',
      method: 'get',
      responseType: 'blob'
    })
  },

  exportExcel (params) {
    return request({
      url: '/test/onetomany/testDataMainForm/export',
      method: 'get',
      params,
      responseType: 'blob'
    })
  },

  importExcel (data) {
    return request({
      url: '/test/onetomany/testDataMainForm/import',
      method: 'post',
      data
    })
  }
}
