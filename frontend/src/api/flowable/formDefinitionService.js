import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/extension/formDefinition/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/extension/formDefinition/delete',
      method: 'get',
      params: { ids }
    })
  },

  queryById (id) {
    return request({
      url: '/extension/formDefinition/queryById',
      method: 'get',
      params: { id }
    })
  },
  queryByJsonId (jsonId) {
    return request({
      url: '/extension/formDefinition/queryByJsonId',
      method: 'get',
      params: { jsonId }
    })
  },

  list (params) {
    return request({
      url: '/extension/formDefinition/list',
      method: 'get',
      params
    })
  }
}
