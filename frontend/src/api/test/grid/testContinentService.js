import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/test/grid/testContinent/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/test/grid/testContinent/delete',
      method: 'get',
      params: {ids}
    })
  },

  queryById (id) {
    return request({
      url: '/test/grid/testContinent/queryById',
      method: 'get',
      params: {id}
    })
  },

  list (params) {
    return request({
      url: '/test/grid/testContinent/list',
      method: 'get',
      params
    })
  },

  exportTemplate () {
    return request({
      url: '/test/grid/testContinent/import/template',
      method: 'get',
      responseType: 'blob'
    })
  },

  exportExcel (params) {
    return request({
      url: '/test/grid/testContinent/export',
      method: 'get',
      params,
      responseType: 'blob'
    })
  },

  importExcel (data) {
    return request({
      url: '/test/grid/testContinent/import',
      method: 'post',
      data
    })
  }
}
