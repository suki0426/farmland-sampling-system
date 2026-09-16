import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/notify/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/notify/delete',
      method: 'get',
      params: { ids }
    })
  },

  queryById (id) {
    return request({
      url: '/notify/queryById',
      method: 'get',
      params: { id }
    })
  },
  query (params) {
    return request({
      url: '/notify/queryById',
      method: 'get',
      params
    })
  },

  list (params) {
    return request({
      url: '/notify/list',
      method: 'get',
      params
    })
  }
}
