import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/masterservetable/masterTable/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/masterservetable/masterTable/delete',
      method: 'get',
      params: {ids}
    })
  },

  queryById (id) {
    return request({
      url: '/masterservetable/masterTable/queryById',
      method: 'get',
      params: {id}
    })
  },

  list (params) {
    return request({
      url: '/masterservetable/masterTable/list',
      method: 'get',
      params
    })
  },

  exportTemplate () {
    return request({
      url: '/masterservetable/masterTable/import/template',
      method: 'get',
      responseType: 'blob'
    })
  },

  exportExcel (params) {
    return request({
      url: '/masterservetable/masterTable/export',
      method: 'get',
      params,
      responseType: 'blob'
    })
  },

  importExcel (data) {
    return request({
      url: '/masterservetable/masterTable/import',
      method: 'post',
      data
    })
  }
}
