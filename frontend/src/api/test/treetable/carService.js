import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/test/treetable/car/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/test/treetable/car/delete',
      method: 'get',
      params: {ids}
    })
  },

  queryById (id) {
    return request({
      url: '/test/treetable/car/queryById',
      method: 'get',
      params: {id}
    })
  },

  list (params) {
    return request({
      url: '/test/treetable/car/list',
      method: 'get',
      params
    })
  },

  exportTemplate () {
    return request({
      url: '/test/treetable/car/import/template',
      method: 'get',
      responseType: 'blob'
    })
  },

  exportExcel (params) {
    return request({
      url: '/test/treetable/car/export',
      method: 'get',
      params,
      responseType: 'blob'
    })
  },

  importExcel (data) {
    return request({
      url: '/test/treetable/car/import',
      method: 'post',
      data
    })
  }
}
