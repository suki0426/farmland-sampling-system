import request from '@/utils/httpRequest'

export default {
  queryNeedByDataSetId (id) {
    return request({
      url: '/database/datamodel/dataMeta/queryNeedByDataSetId',
      method: 'get',
      params: { id }
    })
  }
}
