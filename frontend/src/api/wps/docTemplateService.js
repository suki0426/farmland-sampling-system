import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/wps/docTemplate/save',
      method: 'post',
      data: inputForm
    })
  },

  createFile (type) {
    return request({
      url: '/weboffice/new/url',
      method: 'get',
      params: { type }
    })
  },

  delete (ids) {
    return request({
      url: '/wps/docTemplate/delete',
      method: 'get',
      params: { ids }
    })
  },

  queryById (id) {
    return request({
      url: '/wps/docTemplate/queryById',
      method: 'get',
      params: { id }
    })
  },

  list (params) {
    return request({
      url: '/wps/docTemplate/list',
      method: 'get',
      params
    })
  }
}
