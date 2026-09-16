import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/test/manytomany/studentCourse/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/test/manytomany/studentCourse/delete',
      method: 'get',
      params: {ids}
    })
  },

  queryById (id) {
    return request({
      url: '/test/manytomany/studentCourse/queryById',
      method: 'get',
      params: {id}
    })
  },

  list (params) {
    return request({
      url: '/test/manytomany/studentCourse/list',
      method: 'get',
      params
    })
  },

  exportTemplate () {
    return request({
      url: '/test/manytomany/studentCourse/import/template',
      method: 'get',
      responseType: 'blob'
    })
  },

  exportExcel (params) {
    return request({
      url: '/test/manytomany/studentCourse/export',
      method: 'get',
      params,
      responseType: 'blob'
    })
  },

  importExcel (data) {
    return request({
      url: '/test/manytomany/studentCourse/import',
      method: 'post',
      data
    })
  }
}
