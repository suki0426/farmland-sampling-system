import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/test/shop/goods/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/test/shop/goods/delete',
      method: 'get',
      params: {ids}
    })
  },

  queryById (id) {
    return request({
      url: '/test/shop/goods/queryById',
      method: 'get',
      params: {id}
    })
  },

  list (params) {
    return request({
      url: '/test/shop/goods/list',
      method: 'get',
      params
    })
  },

  exportTemplate () {
    return request({
      url: '/test/shop/goods/import/template',
      method: 'get',
      responseType: 'blob'
    })
  },

  exportExcel (params) {
    return request({
      url: '/test/shop/goods/export',
      method: 'get',
      params,
      responseType: 'blob'
    })
  },

  importExcel (data) {
    return request({
      url: '/test/shop/goods/import',
      method: 'post',
      data
    })
  }
}
