import request from '@/utils/httpRequest'

export default {

  getUrl (params) {
    return request({
      url: '/file/getUrl',
      method: 'get',
      params
    })
  },

  getVehicleVideolist (params) {
    return request({
      url: '/file/filemanager/vehicleVideolist',
      method: 'get',
      params
    })
  },

  download (params) {
    return request({
      url: '/file/filemanager/download',
      method: 'get',
      params
    })
  }
}
