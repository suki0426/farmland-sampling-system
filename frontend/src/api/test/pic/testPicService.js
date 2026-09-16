import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/test/pic/testPic/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/test/pic/testPic/delete',
      method: 'get',
      params: {ids}
    })
  },

  queryById (id) {
    return request({
      url: '/test/pic/testPic/queryById',
      method: 'get',
      params: {id}
    })
  },

  list (params) {
    return request({
      url: '/test/pic/testPic/list',
      method: 'get',
      params
    })
  },

  exportTemplate () {
    return request({
      url: '/test/pic/testPic/import/template',
      method: 'get',
      responseType: 'blob'
    })
  },

  exportExcel (params) {
    return request({
      url: '/test/pic/testPic/export',
      method: 'get',
      params,
      responseType: 'blob'
    })
  },

  importExcel (data) {
    return request({
      url: '/test/pic/testPic/import',
      method: 'post',
      data
    })
  }
}
