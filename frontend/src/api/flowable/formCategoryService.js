import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/extension/formCategory/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/extension/formCategory/delete',
      method: 'get',
      params: { ids }
    })
  },

  queryById (id) {
    return request({
      url: '/extension/formCategory/queryById',
      method: 'get',
      params: { id }
    })
  },

  treeData () {
    return request({
      url: '/extension/formCategory/treeData',
      method: 'get'
    })
  }
}
