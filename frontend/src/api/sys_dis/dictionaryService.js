import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/sys_dis/dictionary/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/sys_dis/dictionary/delete',
      method: 'get',
      params: {ids}
    })
  },

  queryById (id) {
    return request({
      url: '/sys_dis/dictionary/queryById',
      method: 'get',
      params: {id}
    })
  },

  treeData () {
    return request({
      url: '/sys_dis/dictionary/treeData',
      method: 'get'
    })
  }
}
