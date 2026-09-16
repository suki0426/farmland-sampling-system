import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/datav/dataScreenCategory/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/datav/dataScreenCategory/delete',
      method: 'get',
      params: { ids }
    })
  },

  queryById (id) {
    return request({
      url: '/datav/dataScreenCategory/queryById',
      method: 'get',
      params: { id }
    })
  },

  treeData (extId) {
    return request({
      url: '/datav/dataScreenCategory/treeData',
      method: 'get',
      params: { extId }
    })
  }
}
