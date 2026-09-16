import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/test/manytomany/student/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/test/manytomany/student/delete',
      method: 'get',
      params: {ids}
    })
  },

  queryById (id) {
    return request({
      url: '/test/manytomany/student/queryById',
      method: 'get',
      params: {id}
    })
  },

  list (params) {
    return request({
      url: '/test/manytomany/student/list',
      method: 'get',
      params
    })
  },

  exportTemplate () {
    return request({
      url: '/test/manytomany/student/import/template',
      method: 'get',
      responseType: 'blob'
    })
  },

  exportExcel (params) {
    return request({
      url: '/test/manytomany/student/export',
      method: 'get',
      params,
      responseType: 'blob'
    })
  },

  importExcel (data) {
    return request({
      url: '/test/manytomany/student/import',
      method: 'post',
      data
    })
  }
}
