import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/extension/formDefinitionJson/save',
      method: 'post',
      data: inputForm
    })
  },

  updatePrimary (id) {
    return request({
      url: '/extension/formDefinitionJson/updatePrimary',
      method: 'put',
      params: { id }
    })
  },

  delete (ids) {
    return request({
      url: '/extension/formDefinitionJson/delete',
      method: 'get',
      params: { ids }
    })
  },

  queryById (id) {
    return request({
      url: '/extension/formDefinitionJson/queryById',
      method: 'get',
      params: { id }
    })
  },

  list (params) {
    return request({
      url: '/extension/formDefinitionJson/list',
      method: 'get',
      params
    })
  }
}
