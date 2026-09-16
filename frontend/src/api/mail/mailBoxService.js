import request from '@/utils/httpRequest'

export default {
  delete (ids) {
    return request({
      url: '/mail/box/delete',
      method: 'get',
      params: { ids }
    })
  },

  queryById (id) {
    return request({
      url: '/mail/box/queryById',
      method: 'get',
      params: { id }
    })
  },
  queryStatus () {
    return request({
      url: '/mail/box/queryStatus',
      method: 'get'
    })
  },

  list (params) {
    return request({
      url: '/mail/box/list',
      method: 'get',
      params
    })
  }
}
