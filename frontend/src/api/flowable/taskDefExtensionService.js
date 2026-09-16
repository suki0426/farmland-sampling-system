import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/extension/taskDefExtension/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/extension/taskDefExtension/delete',
      method: 'get',
      params: { ids }
    })
  },

  queryById (id) {
    return request({
      url: '/extension/taskDefExtension/queryById',
      method: 'get',
      params: { id }
    })
  },

  queryByDefIdAndTaskId (params) {
    return request({
      url: '/extension/taskDefExtension/queryByDefIdAndTaskId',
      method: 'get',
      params
    })
  },

  list (params) {
    return request({
      url: '/extension/taskDefExtension/list',
      method: 'get',
      params
    })
  }
}
