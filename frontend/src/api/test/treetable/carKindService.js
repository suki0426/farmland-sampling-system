import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/test/treetable/carKind/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/test/treetable/carKind/delete',
      method: 'get',
      params: {ids}
    })
  },

  queryById (id) {
    return request({
      url: '/test/treetable/carKind/queryById',
      method: 'get',
      params: {id}
    })
  },

  treeData () {
    return request({
      url: '/test/treetable/carKind/treeData',
      method: 'get'
    })
  }
}
