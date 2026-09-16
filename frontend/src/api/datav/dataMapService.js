import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/datav/dataMap/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/datav/dataMap/delete',
      method: 'get',
      params: { ids }
    })
  },

  queryById (id) {
    return request({
      url: '/datav/dataMap/queryById',
      method: 'get',
      params: { id }
    })
  },

  list (params) {
    return request({
      url: '/datav/dataMap/list',
      method: 'get',
      params
    })
  }
}
