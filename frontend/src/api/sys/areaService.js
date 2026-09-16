import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/sys/area/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/sys/area/delete',
      method: 'get',
      params: { ids }
    })
  },

  queryById (id) {
    return request({
      url: '/sys/area/queryById',
      method: 'get',
      params: { id }
    })
  },

  treeData (extId) {
    return request({
      url: '/sys/area/treeData',
      method: 'get',
      params: { extId }
    })
  }
}
