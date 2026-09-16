import request from '@/utils/httpRequest'
import { normalizeTemplateSectionRows } from '@/utils/fileTemplateAdapter'

export default {
  save (inputForm) {
    return request({
      url: '/dfiletemplate/dFileTemplateSection/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/dfiletemplate/dFileTemplateSection/delete',
      method: 'delete',
      params: {ids}
    })
  },

  queryById (id) {
    return request({
      url: '/dfiletemplate/dFileTemplateSection/queryById',
      method: 'get',
      params: {id}
    })
  },

  list (params) {
    return request({
      url: '/dfiletemplate/dFileTemplateSection/list',
      method: 'get',
      params
    })
  },

  exportTemplate () {
    return request({
      url: '/dfiletemplate/dFileTemplateSection/import/template',
      method: 'get',
      responseType: 'blob'
    })
  },

  exportExcel (params) {
    return request({
      url: '/dfiletemplate/dFileTemplateSection/export',
      method: 'get',
      params,
      responseType: 'blob'
    })
  },

  importExcel (data) {
    return request({
      url: '/dfiletemplate/dFileTemplateSection/import',
      method: 'post',
      data
    })
  },

  listByTemplate (templateId) {
    return request({
      url: '/dfiletemplate/dFileTemplate/queryById',
      method: 'get',
      params: {id: templateId}
    }).then(response => ({
      ...response,
      data: normalizeTemplateSectionRows(response)
    }))
  },

  batchSave (data) {
    return request({
      url: '/dfiletemplate/dFileTemplateSection/batchSave',
      method: 'post',
      data
    })
  }
}
