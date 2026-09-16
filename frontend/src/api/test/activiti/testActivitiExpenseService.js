import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/test/activiti/testActivitiExpense/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/test/activiti/testActivitiExpense/delete',
      method: 'get',
      params: {ids}
    })
  },

  queryById (id) {
    return request({
      url: '/test/activiti/testActivitiExpense/queryById',
      method: 'get',
      params: {id}
    })
  },

  list (params) {
    return request({
      url: '/test/activiti/testActivitiExpense/list',
      method: 'get',
      params
    })
  },

  exportTemplate () {
    return request({
      url: '/test/activiti/testActivitiExpense/import/template',
      method: 'get',
      responseType: 'blob'
    })
  },

  exportExcel (params) {
    return request({
      url: '/test/activiti/testActivitiExpense/export',
      method: 'get',
      params,
      responseType: 'blob'
    })
  },

  importExcel (data) {
    return request({
      url: '/test/activiti/testActivitiExpense/import',
      method: 'post',
      data
    })
  }
}
