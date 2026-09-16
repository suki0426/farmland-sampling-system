import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/sys/dataRule/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (id) {
    return request({
      url: '/sys/dataRule/delete',
      method: 'get',
      params: { id }
    })
  },

  queryById (id) {
    return request({
      url: '/sys/dataRule/queryById',
      method: 'get',
      params: { id }
    })
  },

  list (params) {
    return request({
      url: '/sys/dataRule/list',
      method: 'get',
      params
    })
  },
  treeData () {
    return request({
      url: '/sys/dataRule/treeData',
      method: 'get'
    })
  }
}
