import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/dictionary/dictionary/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/dictionary/dictionary/delete',
      method: 'get',
      params: {ids}
    })
  },

  queryById (id) {
    return request({
      url: '/dictionary/dictionary/queryById',
      method: 'get',
      params: {id}
    })
  },

  treeData () {
    return request({
      url: '/dictionary/dictionary/treeData',
      method: 'get'
    })
  }
}
