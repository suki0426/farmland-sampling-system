import request from '@/utils/httpRequest'

export default {
  list (params) {
    return request({
      url: '/flowable/process/list',
      method: 'get',
      params
    })
  },

  runningDataList (params) {
    return request({
      url: '/flowable/process/runningData',
      method: 'get',
      params
    })
  },

  historyListData (params) {
    return request({
      url: '/flowable/process/historyListData',
      method: 'get',
      params
    })
  },

  revokeProcIns (id) {
    return request({
      url: '/flowable/process/revokeProcIns',
      method: 'put',
      params: { id }
    })
  },

  deleteProcIns (ids, reason) {
    return request({
      url: '/flowable/process/deleteProcIns',
      method: 'get',
      params: {
        ids,
        reason
      }
    })
  },

  deleteAllProcIns (ids) {
    return request({
      url: '/flowable/process/deleteAllProcIns',
      method: 'get',
      params: { procInsIds: ids }
    })
  },

  suspend (procDefId) {
    return request({
      url: '/flowable/process/update/suspend',
      method: 'put',
      params: { procDefId }
    })
  },

  active (procDefId) {
    return request({
      url: '/flowable/process/update/active',
      method: 'put',
      params: { procDefId }
    })
  },

  stop (id, message) {
    return request({
      url: '/flowable/process/stop',
      method: 'put',
      params: { id, message }
    })
  },

  getFlowChart (processDefId) {
    return request({
      url: '/flowable/process/getFlowChart',
      method: 'get',
      params: { processDefId }
    })
  },

  queryProcessStatus (procDefId, procInsId) {
    return request({
      url: '/flowable/process/queryProcessStatus',
      method: 'get',
      params: { procDefId, procInsId }
    })
  },

  exist (key) {
    return request({
      url: '/flowable/process/exist',
      method: 'get',
      params: { key }
    })
  }
}
