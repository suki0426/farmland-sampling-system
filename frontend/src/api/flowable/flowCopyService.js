import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/extension/flowCopy/save',
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
      },
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/extension/flowCopy/delete',
      method: 'get',
      params: { ids }
    })
  },

  list (params) {
    return request({
      url: '/extension/flowCopy/list',
      method: 'get',
      params
    })
  }
}
