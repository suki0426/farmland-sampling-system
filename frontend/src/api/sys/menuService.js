import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/sys/menu/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/sys/menu/delete',
      method: 'get',
      params: { ids }
    })
  },

  queryById (id) {
    return request({
      url: '/sys/menu/queryById',
      method: 'get',
      params: { id }
    })
  },

  treeData (params) {
    return request({
      url: '/sys/menu/treeData',
      method: 'get',
      params
    })
  }
}
