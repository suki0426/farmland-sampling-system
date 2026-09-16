import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/wps/docCategory/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/wps/docCategory/delete',
      method: 'get',
      params: { ids }
    })
  },

  queryById (id) {
    return request({
      url: '/wps/docCategory/queryById',
      method: 'get',
      params: { id }
    })
  },

  treeData (extId) {
    return request({
      url: '/wps/docCategory/treeData',
      method: 'get',
      params: { extId }
    })
  }
}
