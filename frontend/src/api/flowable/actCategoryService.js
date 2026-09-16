import request from '@/utils/httpRequest'

export default {
  treeData (extId) {
    return request({
      url: '/extension/actCategory/treeData',
      method: 'get',
      params: { extId }
    })
  },

  save (inputForm) {
    return request({
      url: '/extension/actCategory/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/extension/actCategory/delete',
      method: 'get',
      params: { ids }
    })
  },

  queryById (id) {
    return request({
      url: '/extension/actCategory/queryById',
      method: 'get',
      params: { id }
    })
  }
}
