import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/extension/nodeSetting/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/extension/nodeSetting/delete',
      method: 'get',
      params: { ids }
    })
  },

  queryValueByKey (params) {
    return request({
      url: '/extension/nodeSetting/queryValueByKey',
      method: 'get',
      params
    })
  },

  queryById (id) {
    return request({
      url: '/extension/nodeSetting/queryById',
      method: 'get',
      params: { id }
    })
  },

  list (params) {
    return request({
      url: '/extension/nodeSetting/list',
      method: 'get',
      params
    })
  }
}
