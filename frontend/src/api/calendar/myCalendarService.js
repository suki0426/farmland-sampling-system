import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/myCalendar/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (id) {
    return request({
      url: '/myCalendar/del',
      method: 'get',
      params: { id }
    })
  },

  queryById (id) {
    return request({
      url: '/myCalendar/queryById',
      method: 'get',
      params: { id }
    })
  },

  drag (params) {
    return request({
      url: '/myCalendar/drag',
      method: 'put',
      params
    })
  },

  resize (params) {
    return request({
      url: '/myCalendar/resize',
      method: 'put',
      params
    })
  },

  list () {
    return request({
      url: '/myCalendar/findList',
      method: 'get'
    })
  }
}
