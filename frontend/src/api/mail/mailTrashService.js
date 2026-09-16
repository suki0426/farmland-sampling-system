import request from '@/utils/httpRequest'

export default {
  delete (ids) {
    return request({
      url: '/mail/trash/delete',
      method: 'get',
      params: { ids }
    })
  },

  queryById (id) {
    return request({
      url: '/mail/trash/queryById',
      method: 'get',
      params: { id }
    })
  },

  list (params) {
    return request({
      url: '/mail/trash/list',
      method: 'get',
      params
    })
  }
}
