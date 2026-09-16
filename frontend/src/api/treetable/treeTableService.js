import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/treetable/treeTable/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/treetable/treeTable/delete',
      method: 'get',
      params: {ids}
    })
  },

  queryById (id) {
    return request({
      url: '/treetable/treeTable/queryById',
      method: 'get',
      params: {id}
    })
  },

  treeData () {
    return request({
      url: '/treetable/treeTable/treeData',
      method: 'get'
    })
  }
}
