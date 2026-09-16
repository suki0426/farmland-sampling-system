import request from '@/utils/httpRequest'

export default {
  upload (formData, config = {}) {
    return request({
      url: '/file/upload?uploadPath=userdir',
      method: 'post',
      config,
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  download (params) {
    return request({
      url: '/file/download',
      method: 'get',
      params
    })
  },

  uploadFile (formData, config = {}) {
    return request({
      url: '/file/uploadFile?uploadPath=userdir',
      method: 'post',
      config,
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  downloadFile (params) {
    return request({
      url: '/file/downloadFile',
      method: 'get',
      params
    })
  }
}
