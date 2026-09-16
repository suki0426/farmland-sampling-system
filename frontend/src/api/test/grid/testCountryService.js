import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/test/grid/testCountry/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/test/grid/testCountry/delete',
      method: 'get',
      params: {ids}
    })
  },

  queryById (id) {
    return request({
      url: '/test/grid/testCountry/queryById',
      method: 'get',
      params: {id}
    })
  },

  list (params) {
    return request({
      url: '/test/grid/testCountry/list',
      method: 'get',
      params
    })
  },

  exportTemplate () {
    return request({
      url: '/test/grid/testCountry/import/template',
      method: 'get',
      responseType: 'blob'
    })
  },

  exportExcel (params) {
    return request({
      url: '/test/grid/testCountry/export',
      method: 'get',
      params,
      responseType: 'blob'
    })
  },

  importExcel (data) {
    return request({
      url: '/test/grid/testCountry/import',
      method: 'post',
      data
    })
  }
}
