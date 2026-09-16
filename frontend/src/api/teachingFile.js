import request from '@/utils/httpRequest'

export default {
  uploadTeachingFile (formData, config = {}) {
    return request({
      url: '/teaching/file/import/upload',
      method: 'post',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: config.onUploadProgress
    })
  },

  getParseStatus (taskId) {
    return request({
      url: '/teaching/file/import/status',
      method: 'get',
      params: { taskId }
    })
  }
}
