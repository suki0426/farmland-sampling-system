import request from '@/utils/httpRequest'

export default {
  list (params) {
    return request({
      url: '/sys/log/list',
      method: 'get',
      params
    })
  },

  mine (params) {
    return request({
      url: '/sys/log/data/mine',
      method: 'get',
      params
    })
  },

  delete (ids) {
    return request({
      url: '/sys/log/delete',
      method: 'get',
      params: { ids }
    })
  },

  empty () {
    return request({
      url: '/sys/log/empty',
      method: 'get'
    })
  }
}
