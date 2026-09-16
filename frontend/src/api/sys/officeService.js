import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/sys/office/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/sys/office/delete',
      method: 'get',
      params: { ids }
    })
  },

  queryById (id) {
    return request({
      url: '/sys/office/queryById',
      method: 'get',
      params: { id }
    })
  },

  treeData (params) {
    return request({
      url: '/sys/office/treeData',
      method: 'get',
      params
    })
  }
}
