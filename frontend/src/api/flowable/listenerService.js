import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/extension/listener/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/extension/listener/delete',
      method: 'get',
      params: { ids }
    })
  },

  queryById (id) {
    return request({
      url: '/extension/listener/queryById',
      method: 'get',
      params: { id }
    })
  },

  list (params) {
    return request({
      url: '/extension/listener/list',
      method: 'get',
      params
    })
  }
}
