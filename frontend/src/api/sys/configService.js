import request from '@/utils/httpRequest'

export default {
  getConfig () {
    return request({
      url: '/sys/sysConfig/getConfig',
      method: 'get'
    })
  },

  queryById () {
    return request({
      url: '/sys/sysConfig/queryById',
      method: 'get'
    })
  },

  save (inputForm) {
    return request({
      url: '/sys/sysConfig/save',
      method: 'post',
      data: inputForm
    })
  }
}
