import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/test/note/testNote/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/test/note/testNote/delete',
      method: 'get',
      params: {ids}
    })
  },

  queryById (id) {
    return request({
      url: '/test/note/testNote/queryById',
      method: 'get',
      params: {id}
    })
  },

  list (params) {
    return request({
      url: '/test/note/testNote/list',
      method: 'get',
      params
    })
  },

  exportTemplate () {
    return request({
      url: '/test/note/testNote/import/template',
      method: 'get',
      responseType: 'blob'
    })
  },

  exportExcel (params) {
    return request({
      url: '/test/note/testNote/export',
      method: 'get',
      params,
      responseType: 'blob'
    })
  },

  importExcel (data) {
    return request({
      url: '/test/note/testNote/import',
      method: 'post',
      data
    })
  }
}
