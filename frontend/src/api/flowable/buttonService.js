import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/extension/button/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/extension/button/delete',
      method: 'get',
      params: { ids }
    })
  },

  queryById (id) {
    return request({
      url: '/extension/button/queryById',
      method: 'get',
      params: { id }
    })
  },
  validateCodeNoExist (params) {
    return request({
      url: '/extension/button/validateCodeNoExist',
      method: 'get',
      params
    })
  },

  validateNameNoExist (params) {
    return request({
      url: '/extension/button/validateNameNoExist',
      method: 'get',
      params
    })
  },

  list (params) {
    return request({
      url: '/extension/button/list',
      method: 'get',
      params
    })
  }
}
