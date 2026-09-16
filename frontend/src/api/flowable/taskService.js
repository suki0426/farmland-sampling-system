import request from '@/utils/httpRequest'

export default {
  start (data) {
    return request({
      url: '/flowable/task/start',
      method: 'post',
      data
    })
  },

  todoList (params) {
    return request({
      url: '/flowable/task/todo',
      method: 'get',
      params
    })
  },

  historicList (params) {
    return request({
      url: '/flowable/task/historic',
      method: 'get',
      params
    })
  },

  historicTaskList (procInsId) {
    return request({
      url: '/flowable/task/historicTaskList',
      method: 'get',
      params: { procInsId }
    })
  },

  myApplyedList (params) {
    return request({
      url: '/flowable/task/myApplyed',
      method: 'get',
      params
    })
  },

  getTaskDef (params) {
    return request({
      url: '/flowable/task/getTaskDef',
      method: 'get',
      params
    })
  },

  delegate (taskId, userId) {
    return request({
      url: '/flowable/task/delegate',
      method: 'put',
      params: { taskId, userId }
    })
  },

  callback (params) {
    return request({
      url: '/flowable/task/callback',
      method: 'put',
      params
    })
  },

  audit (data) {
    return request({
      url: '/flowable/task/audit',
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
      },
      data
    })
  },

  backNodes (taskId) {
    return request({
      url: '/flowable/task/backNodes',
      method: 'put',
      params: { taskId }
    })
  },

  back (params) {
    return request({
      url: '/flowable/task/back',
      method: 'put',
      params
    })
  },

  transfer (taskId, userId) {
    return request({
      url: '/flowable/task/transfer',
      method: 'put',
      params: { taskId, userId }
    })
  },

  addSignTask (data) {
    return request({
      url: '/flowable/task/addSignTask',
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
      },
      data
    })
  },
  getFlowChart (processInstanceId) {
    return request({
      url: '/flowable/task/getFlowChart',
      method: 'get',
      params: { processInstanceId }
    })
  },

  urge (data) {
    return request({
      url: '/flowable/task/urge',
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
      },
      data
    })
  }
}
