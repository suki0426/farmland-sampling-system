import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/sys/post/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/sys/post/delete',
      method: 'get',
      params: { ids }
    })
  },

  queryById (id) {
    return request({
      url: '/sys/post/queryById',
      method: 'get',
      params: { id }
    })
  },

  list (params) {
    return request({
      url: '/sys/post/list',
      method: 'get',
      params
    })
  }
}
