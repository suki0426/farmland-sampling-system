import request from '@/utils/httpRequest'

export default {
  models (data) {
    return request({
      url: '/rest/models',
      method: 'post',
      data
    })
  },

  editorJson (modelId) {
    return request({
      url: `/rest/models/${modelId}/editor/json?version=${new Date().getTime()}`,
      method: 'get'
    })
  }
}
