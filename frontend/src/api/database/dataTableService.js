import request from '@/utils/httpRequest'

export default {
  executeSql (tableName, dataSourceId) {
    return request({
      url: `/database/table/executeSql/${tableName}?dataSourceId=${dataSourceId}`,
      method: 'get'
    })
  },

  save (inputForm) {
    return request({
      url: '/gen/genTable/saveTableFromDB',
      method: 'post',
      data: inputForm
    })
  },

  queryAlter (dataSourceId, tableName) {
    return request({
      url: '/database/table/alter',
      method: 'get',
      params: { dataSourceId, name: tableName }
    })
  },

  submitAlter (inputForm) {
    return request({
      url: '/database/table/alter/do',
      method: 'post',
      data: inputForm
    })
  },

  queryCreate (dataSourceId) {
    return request({
      url: '/database/table/create',
      method: 'get',
      params: { dataSourceId }
    })
  },

  submitCreate (inputForm) {
    return request({
      url: '/database/table/create/do',
      method: 'post',
      data: inputForm
    })
  },

  list (params) {
    return request({
      url: '/database/table/list',
      method: 'get',
      params
    })
  },

  drop (tableName, dataSourceId) {
    return request({
      url: '/database/table/drop',
      method: 'get',
      params: { tableName, dataSourceId }
    })
  }
}
