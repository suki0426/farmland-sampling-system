import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/database/datalink/dataSource/save',
      method: 'post',
      data: inputForm
    })
  },

  test (inputForm) {
    return request({
      url: '/database/datalink/dataSource/test',
      method: 'post',
      data: inputForm
    })
  },

  checkEnName (oldEnName, enName) {
    return request({
      url: '/database/datalink/dataSource/checkEnName',
      method: 'get',
      params: {
        oldEnName,
        enName
      }
    })
  },

  delete (ids) {
    return request({
      url: '/database/datalink/dataSource/delete',
      method: 'get',
      params: { ids }
    })
  },

  queryById (id) {
    return request({
      url: '/database/datalink/dataSource/queryById',
      method: 'get',
      params: { id }
    })
  },

  list (params) {
    return request({
      url: '/database/datalink/dataSource/list',
      method: 'get',
      params
    })
  },

  treeData () {
    return request({
      url: '/database/datalink/dataSource/treeData',
      method: 'get'
    })
  }
}
