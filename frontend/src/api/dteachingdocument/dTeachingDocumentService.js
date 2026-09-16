import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/dteachingdocument/dTeachingDocument/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/dteachingdocument/dTeachingDocument/delete',
      method: 'delete',
      params: {ids}
    })
  },

  queryById (id) {
    return request({
      url: '/dteachingdocument/dTeachingDocument/queryById',
      method: 'get',
      params: {id}
    })
  },

  list (params) {
    return request({
      url: '/dteachingdocument/dTeachingDocument/list',
      method: 'get',
      params
    })
  },

  exportTemplate () {
    return request({
      url: '/dteachingdocument/dTeachingDocument/import/template',
      method: 'get',
      responseType: 'blob'
    })
  },

  exportExcel (params) {
    return request({
      url: '/dteachingdocument/dTeachingDocument/export',
      method: 'get',
      params,
      responseType: 'blob'
    })
  },

  importExcel (data) {
    return request({
      url: '/dteachingdocument/dTeachingDocument/import',
      method: 'post',
      data
    })
  }
}
