import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/ddevice/dDevice/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/ddevice/dDevice/delete',
      method: 'delete',
      params: {ids}
    })
  },

  queryById (id) {
    return request({
      url: '/ddevice/dDevice/queryById',
      method: 'get',
      params: {id}
    })
  },

  list (params) {
    return request({
      url: '/ddevice/dDevice/list',
      method: 'get',
      params
    })
  },

  exportTemplate () {
    return request({
      url: '/ddevice/dDevice/import/template',
      method: 'get',
      responseType: 'blob'
    })
  },

  exportExcel (params) {
    return request({
      url: '/ddevice/dDevice/export',
      method: 'get',
      params,
      responseType: 'blob'
    })
  },

  importExcel (data) {
    return request({
      url: '/ddevice/dDevice/import',
      method: 'post',
      data
    })
  }
}
