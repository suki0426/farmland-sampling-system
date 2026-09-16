import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/sys/role/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/sys/role/delete',
      method: 'get',
      params: { ids }
    })
  },

  queryById (id) {
    return request({
      url: '/sys/role/queryById',
      method: 'get',
      params: { id }
    })
  },

  validateNotExist (obj) {
    return request({
      url: '/sys/role/validateNotExist',
      method: 'get',
      params: obj
    })
  },

  list (params) {
    return request({
      url: '/sys/role/list',
      method: 'get',
      params
    })
  },
  assign (params) {
    return request({
      url: '/sys/role/assign',
      method: 'get',
      params
    })
  },

  assignAuthorityToRole (inputForm) {
    return request({
      url: '/sys/role/assignAuthorityToRole',
      method: 'post',
      data: inputForm
    })
  },

  removeUserFromRole (userId, roleId) {
    return request({
      url: '/sys/role/removeUserFromRole',
      method: 'get',
      params: { userId, roleId }
    })
  },

  addUserToRole (roleId, userIds) {
    return request({
      url: '/sys/role/addUserToRole',
      method: 'put',
      params: {
        roleId,
        userIds
      }
    })
  }
}
