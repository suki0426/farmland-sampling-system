import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/test/manytomany/course/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/test/manytomany/course/delete',
      method: 'get',
      params: {ids}
    })
  },

  queryById (id) {
    return request({
      url: '/test/manytomany/course/queryById',
      method: 'get',
      params: {id}
    })
  },

  list (params) {
    return request({
      url: '/test/manytomany/course/list',
      method: 'get',
      params
    })
  },

  exportTemplate () {
    return request({
      url: '/test/manytomany/course/import/template',
      method: 'get',
      responseType: 'blob'
    })
  },

  exportExcel (params) {
    return request({
      url: '/test/manytomany/course/export',
      method: 'get',
      params,
      responseType: 'blob'
    })
  },

  importExcel (data) {
    return request({
      url: '/test/manytomany/course/import',
      method: 'post',
      data
    })
  }
}
