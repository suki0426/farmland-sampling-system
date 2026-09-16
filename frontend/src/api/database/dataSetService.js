import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/database/datamodel/dataSet/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/database/datamodel/dataSet/delete',
      method: 'get',
      params: { ids }
    })
  },
  getData (id) {
    return request({
      url: `/database/datamodel/dataSet/getData/${id}/json`,
      method: 'get'
    })
  },
  queryById (id) {
    return request({
      url: '/database/datamodel/dataSet/queryById',
      method: 'get',
      params: { id }
    })
  },

  getMeta (params) {
    return request({
      url: '/database/datamodel/dataSet/getMeta',
      method: 'get',
      headers: { arrayFormat: 'brackets' },
      params
    })
  },

  exec (params) {
    return request({
      url: '/database/datamodel/dataSet/exec',
      method: 'get',
      headers: { arrayFormat: 'brackets' },
      params
    })
  },

  list (params) {
    return request({
      url: '/database/datamodel/dataSet/list',
      method: 'get',
      params
    })
  }
}
