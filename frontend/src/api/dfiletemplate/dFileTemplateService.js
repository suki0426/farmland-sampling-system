import request from '@/utils/httpRequest'
import {
  buildTemplateSavePayload,
  normalizeTemplateDetail,
  normalizeTemplateTreeItems
} from '@/utils/fileTemplateAdapter'

export default {
  save (inputForm) {
    return request({
      url: '/dfiletemplate/dFileTemplate/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/dfiletemplate/dFileTemplate/delete',
      method: 'delete',
      params: {ids}
    })
  },

  queryById (id) {
    return request({
      url: '/dfiletemplate/dFileTemplate/queryById',
      method: 'get',
      params: {id}
    })
  },

  list (params) {
    return request({
      url: '/dfiletemplate/dFileTemplate/list',
      method: 'get',
      params
    })
  },

  treeData () {
    return request({
      url: '/dfiletemplate/dFileTemplate/list',
      method: 'get',
      params: {
        current: 1,
        size: -1
      }
    }).then(response => {
      const data = response.data || {}
      return {
        ...response,
        data: normalizeTemplateTreeItems(data.records || [])
      }
    })
  },

  exportTemplate () {
    return request({
      url: '/dfiletemplate/dFileTemplate/import/template',
      method: 'get',
      responseType: 'blob'
    })
  },

  exportExcel (params) {
    return request({
      url: '/dfiletemplate/dFileTemplate/export',
      method: 'get',
      params,
      responseType: 'blob'
    })
  },

  importExcel (data) {
    return request({
      url: '/dfiletemplate/dFileTemplate/import',
      method: 'post',
      data
    })
  },

  queryDetail (id) {
    return request({
      url: '/dfiletemplate/dFileTemplate/queryById',
      method: 'get',
      params: {id}
    })
  },

  saveDraft (inputForm) {
    const payload = buildTemplateSavePayload(inputForm)
    return request({
      url: '/dfiletemplate/dFileTemplate/save',
      method: 'post',
      data: payload
    }).then(() => this.queryDetail(payload.id || inputForm.id)).then(response => ({
      ...response,
      data: {
        id: (response.data && response.data.id) || payload.id || inputForm.id,
        template: normalizeTemplateDetail(response),
        message: '模板草稿已保存'
      }
    }))
  },

  publish (inputForm) {
    const payload = buildTemplateSavePayload({
      ...inputForm,
      status: 'published'
    })
    return request({
      url: '/dfiletemplate/dFileTemplate/publish',
      method: 'post',
      data: payload
    }).then(() => this.queryDetail(payload.id || inputForm.id)).then(response => ({
      ...response,
      data: {
        id: (response.data && response.data.id) || payload.id || inputForm.id,
        template: normalizeTemplateDetail(response),
        message: '模板已发布'
      }
    }))
  },

  validate (inputForm) {
    const normalized = normalizeTemplateDetail({ data: inputForm })
    const errors = []
    if (!normalized.docType) errors.push({ field: 'docType', message: '请选择文档分类' })
    if (!normalized.templateName) errors.push({ field: 'templateName', message: '请填写模板名称' })
    if (!normalized.sections || !normalized.sections.length) errors.push({ field: 'sections', message: '至少需要一个一级标题' })
    return Promise.resolve({
      data: {
        valid: errors.length === 0,
        errors
      }
    })
  },

  usableTemplates (params) {
    return request({
      url: '/dfiletemplate/dFileTemplate/list',
      method: 'get',
      params: {
        current: 1,
        size: -1,
        docType: params.docType,
        status: params.status
      }
    }).then(response => {
      const data = response.data || {}
      return {
        ...response,
        data: normalizeTemplateTreeItems(data.records || [])
      }
    })
  },

  createManual (inputForm) {
    return this.saveDraft({
      ...inputForm,
      status: 'draft',
      sourceMode: 'manual'
    })
  }
}
