import request from '@/utils/httpRequest'

export default {
  deploy (params) {
    return request({
      url: '/flowable/model/deploy',
      method: 'put',
      params
    })
  },
  updateCategory (params) {
    return request({
      url: '/flowable/model/updateCategory',
      method: 'put',
      params
    })
  },
  copy (id) {
    return request({
      url: '/flowable/model/copy',
      method: 'get',
      params: { id }
    })
  },

  getBpmnXml (id) {
    return request({
      url: '/flowable/model/getBpmnXml',
      method: 'get',
      params: { id }
    })
  },

  exportBpmnXml (id) {
    return request({
      url: '/flowable/model/exportBpmnXml',
      method: 'get',
      params: { id },
      responseType: 'blob'
    })
  },

  delete (ids) {
    return request({
      url: '/flowable/model/delete',
      method: 'get',
      params: { ids }
    })
  },

  saveModel (modelId, data) {
    return request({
      url: `/flowable/model/saveModel/${modelId}`,
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
      },
      data
    })
  },

  list (params) {
    return request({
      url: '/flowable/model/list',
      method: 'get',
      params
    })
  }
}
