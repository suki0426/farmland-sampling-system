import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/dindicator/dIndicator/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/dindicator/dIndicator/delete',
      method: 'delete',
      params: {ids}
    })
  },

  queryById (id) {
    return request({
      url: '/dindicator/dIndicator/queryById',
      method: 'get',
      params: {id}
    })
  },

  treeData () {
    return request({
      url: '/dindicator/dIndicator/treeData',
      method: 'get'
    })
  }
}
