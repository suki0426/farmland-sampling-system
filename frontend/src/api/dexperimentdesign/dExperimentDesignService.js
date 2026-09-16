import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/dexperimentdesign/dExperimentDesign/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/dexperimentdesign/dExperimentDesign/delete',
      method: 'delete',
      params: {ids}
    })
  },

  queryById (id) {
    return request({
      url: '/dexperimentdesign/dExperimentDesign/queryById',
      method: 'get',
      params: {id}
    })
  },

  list (params) {
    return request({
      url: '/dexperimentdesign/dExperimentDesign/list',
      method: 'get',
      params
    })
  },

  exportTemplate () {
    return request({
      url: '/dexperimentdesign/dExperimentDesign/import/template',
      method: 'get',
      responseType: 'blob'
    })
  },

  exportExcel (params) {
    return request({
      url: '/dexperimentdesign/dExperimentDesign/export',
      method: 'get',
      params,
      responseType: 'blob'
    })
  },

  importExcel (data) {
    return request({
      url: '/dexperimentdesign/dExperimentDesign/import',
      method: 'post',
      data
    })
  }
}
