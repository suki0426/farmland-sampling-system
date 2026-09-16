import request from '@/utils/httpRequest'

export default {
  list (params) {
    return request({
      url: '/dteachingdocument/dTeachingDocument/list',
      method: 'get',
      params
    })
  },

  saveDocument (payload) {
    return request({
      url: '/dteachingdocument/dTeachingDocument/save',
      method: 'post',
      data: payload
    })
  },

  queryDetail (id) {
    return request({
      url: '/dteachingdocument/dTeachingDocument/detail',
      method: 'get',
      params: { id }
    })
  },

  delete (ids) {
    return request({
      url: '/dteachingdocument/dTeachingDocument/delete',
      method: 'delete',
      params: {ids}
    })
  },

  copy (id) {
    return request({
      url: '/dteachingdocument/dTeachingDocument/copy',
      method: 'post',
      data: { id }
    })
  }
}
