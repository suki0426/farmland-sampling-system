import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/datav/dataScreen/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/datav/dataScreen/delete',
      method: 'get',
      params: { ids }
    })
  },

  queryById (id) {
    return request({
      url: '/datav/dataScreen/queryById',
      method: 'get',
      params: { id }
    })
  },

  copy (id) {
    return request({
      url: '/datav/dataScreen/copy',
      method: 'get',
      params: { id }
    })
  },

  sqlQuery (inputForm) {
    return request({
      url: '/datav/dataScreen/sqlQuery',
      method: 'post',
      data: inputForm
    })
  },

  list (params) {
    return request({
      url: '/datav/dataScreen/list',
      method: 'get',
      params
    })
  }
}
