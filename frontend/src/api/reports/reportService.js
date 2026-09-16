import request from '@/utils/httpRequest'

export default {
  delete (id) {
    return request({
      url: '/reports/delete',
      method: 'get',
      params: { id }
    })
  },

  list (params) {
    return request({
      url: '/reports/list',
      method: 'get',
      params
    })
  }
}
