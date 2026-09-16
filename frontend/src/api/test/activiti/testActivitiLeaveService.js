import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/test/activiti/testActivitiLeave/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/test/activiti/testActivitiLeave/delete',
      method: 'get',
      params: {ids}
    })
  },

  queryById (id) {
    return request({
      url: '/test/activiti/testActivitiLeave/queryById',
      method: 'get',
      params: {id}
    })
  },

  list (params) {
    return request({
      url: '/test/activiti/testActivitiLeave/list',
      method: 'get',
      params
    })
  },

  exportTemplate () {
    return request({
      url: '/test/activiti/testActivitiLeave/import/template',
      method: 'get',
      responseType: 'blob'
    })
  },

  exportExcel (params) {
    return request({
      url: '/test/activiti/testActivitiLeave/export',
      method: 'get',
      params,
      responseType: 'blob'
    })
  },

  importExcel (data) {
    return request({
      url: '/test/activiti/testActivitiLeave/import',
      method: 'post',
      data
    })
  }
}
