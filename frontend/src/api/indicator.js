import request from '@/utils/httpRequest'
import {
  mockDownloadIndicatorTemplate,
  mockGetIndicatorImportResult,
  mockGetIndicatorList,
  mockGetIndicatorTree,
  mockImportIndicatorTemplate,
  mockSaveIndicatorOrder,
  mockUpdateIndicatorLeaf
} from '@/mock/indicator'

export default {
  downloadIndicatorTemplate (config = {}) {
    if (config.mock) {
      return mockDownloadIndicatorTemplate()
    }

    return request({
      url: '/indicator/template/download',
      method: 'get',
      responseType: 'blob'
    })
  },

  importIndicatorTemplate (formData, config = {}) {
    if (config.mock) {
      return mockImportIndicatorTemplate(formData.get('file'))
    }

    return request({
      url: '/indicator/import',
      method: 'post',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: config.onUploadProgress
    })
  },

  getIndicatorImportResult (batchNo, config = {}) {
    if (config.mock) {
      return mockGetIndicatorImportResult(batchNo)
    }

    return request({
      url: '/indicator/template/import/result',
      method: 'get',
      params: { batchNo }
    })
  },

  getIndicatorTree (config = {}) {
    if (config.mock) {
      return mockGetIndicatorTree()
    }

    return request({
      url: '/indicator/tree',
      method: 'get',
      params: config.params
    })
  },

  getIndicatorList (params = {}, config = {}) {
    if (config.mock) {
      return mockGetIndicatorList(params)
    }

    return request({
      url: '/indicator/list',
      method: 'get',
      params
    })
  },

  saveIndicatorOrder (payload = {}, config = {}) {
    if (config.mock) {
      return mockSaveIndicatorOrder(payload)
    }

    return request({
      url: '/indicator/order/save',
      method: 'post',
      data: payload
    })
  },

  updateIndicatorLeaf (payload = {}, config = {}) {
    if (config.mock) {
      return mockUpdateIndicatorLeaf(payload)
    }

    return request({
      url: '/indicator/leaf/update',
      method: 'post',
      data: payload
    })
  }
}
