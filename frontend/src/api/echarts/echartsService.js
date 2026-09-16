import request from '@/utils/httpRequest'

export default {
  save (inputForm) {
    return request({
      url: '/echarts/save',
      method: 'post',
      data: inputForm
    })
  },

  delete (ids) {
    return request({
      url: '/echarts/delete',
      method: 'get',
      params: { ids }
    })
  },

  queryById (id) {
    return request({
      url: '/echarts/queryById',
      method: 'get',
      params: { id }
    })
  },

  mergeChartData (params) {
    return request({
      url: '/echarts/mergeChartData',
      method: 'get',
      params
    })
  },

  queryDesignById (id) {
    return request({
      url: '/echarts/queryDesignById',
      method: 'get',
      params: { id }
    })
  },

  getChartData (id) {
    return request({
      url: `/echarts/getChartData/${id}`,
      method: 'get'
    })
  },
  list (params) {
    return request({
      url: '/echarts/list',
      method: 'get',
      params
    })
  }
}
