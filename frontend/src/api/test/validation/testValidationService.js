import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/test/validation/testValidation/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/test/validation/testValidation/delete',
      method: 'get',
      params: {ids}
    })
  },

  queryById (id) {
    return request({
      url: '/test/validation/testValidation/queryById',
      method: 'get',
      params: {id}
    })
  },

  list (params) {
    return request({
      url: '/test/validation/testValidation/list',
      method: 'get',
      params
    })
  },

  exportTemplate () {
    return request({
      url: '/test/validation/testValidation/import/template',
      method: 'get',
      responseType: 'blob'
    })
  },

  exportExcel (params) {
    return request({
      url: '/test/validation/testValidation/export',
      method: 'get',
      params,
      responseType: 'blob'
    })
  },

  importExcel (data) {
    return request({
      url: '/test/validation/testValidation/import',
      method: 'post',
      data
    })
  }
}
