import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/treelist/treeList/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/treelist/treeList/delete',
      method: 'get',
      params: {ids}
    })
  },

  queryById (id) {
    return request({
      url: '/treelist/treeList/queryById',
      method: 'get',
      params: {id}
    })
  },

  list (params) {
    return request({
      url: '/treelist/treeList/list',
      method: 'get',
      params
    })
  },

  exportTemplate () {
    return request({
      url: '/treelist/treeList/import/template',
      method: 'get',
      responseType: 'blob'
    })
  },

  exportExcel (params) {
    return request({
      url: '/treelist/treeList/export',
      method: 'get',
      params,
      responseType: 'blob'
    })
  },

  importExcel (data) {
    return request({
      url: '/treelist/treeList/import',
      method: 'post',
      data
    })
  }
}
