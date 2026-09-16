import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/mail/compose/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/mail/compose/delete',
      method: 'get',
      params: { ids }
    })
  },

  queryById (id) {
    return request({
      url: '/mail/compose/queryById',
      method: 'get',
      params: { id }
    })
  },

  list (params) {
    return request({
      url: '/mail/compose/list',
      method: 'get',
      params
    })
  }
}
