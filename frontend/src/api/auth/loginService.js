import request from '@/utils/httpRequest'

export default {
  getCode () {
    return request({
      url: '/sys/getCode',
      method: 'get'
    })
  },
  login (data) {
    return request({
      url: '/sys/login',
      method: 'post',
      data
    })
  },
  logout () {
    return request({
      url: '/sys/logout',
      method: 'get'
    })
  }
}
