import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/datav/dataComponent/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/datav/dataComponent/delete',
      method: 'get',
      params: {ids}
    })
  },

  queryById (id) {
    return request({
      url: '/datav/dataComponent/queryById',
      method: 'get',
      params: {id}
    })
  },

  list (params) {
    return request({
      url: '/datav/dataComponent/list',
      method: 'get',
      params
    })
  },

  exportTemplate () {
    return request({
      url: '/datav/dataComponent/import/template',
      method: 'get',
      responseType: 'blob'
    })
  },

  exportExcel (params) {
    return request({
      url: '/datav/dataComponent/export',
      method: 'get',
      params,
      responseType: 'blob'
    })
  },

  importExcel (data) {
    return request({
      url: '/datav/dataComponent/import',
      method: 'post',
      data
    })
  }
}
