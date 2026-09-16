import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/test/activiti/testActivitiAudit/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/test/activiti/testActivitiAudit/delete',
      method: 'get',
      params: {ids}
    })
  },

  queryById (id) {
    return request({
      url: '/test/activiti/testActivitiAudit/queryById',
      method: 'get',
      params: {id}
    })
  },

  list (params) {
    return request({
      url: '/test/activiti/testActivitiAudit/list',
      method: 'get',
      params
    })
  },

  exportTemplate () {
    return request({
      url: '/test/activiti/testActivitiAudit/import/template',
      method: 'get',
      responseType: 'blob'
    })
  },

  exportExcel (params) {
    return request({
      url: '/test/activiti/testActivitiAudit/export',
      method: 'get',
      params,
      responseType: 'blob'
    })
  },

  importExcel (data) {
    return request({
      url: '/test/activiti/testActivitiAudit/import',
      method: 'post',
      data
    })
  }
}
