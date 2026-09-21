/**
 * 农田模块 API Service（1号 前端GIS 岗位）
 *
 * 接口来源：第12课题五人岗位字段与公共接口约束 V2.1 —— 3.2 前端唯一允许调用的 REST 清单
 *  - GET /farmland/farmland/briefByIds   ids  -> List<FarmlandBriefDTO>
 *  - GET /farmland/farmland/list         标准列表（用于农田下拉选择，遵循 2.2 通用 REST 规则）
 *
 * 前端不直连数据库，也不猜测坐标系；boundaryGeoJson 由后端给出。
 */

import request from '@/utils/httpRequest'

export default {
  /** 农田简要信息（批量） */
  briefByIds (ids) {
    return request({
      url: '/farmland/farmland/briefByIds',
      method: 'get',
      params: { ids: Array.isArray(ids) ? ids.join(',') : ids }
    })
  },

  /** 农田列表（用于页面上的农田选择器） */
  list (params) {
    return request({
      url: '/farmland/farmland/list',
      method: 'get',
      params
    })
  },

  /** 按主键查询农田详情（含 boundaryGeoJson） */
  queryById (id) {
    return request({
      url: '/farmland/farmland/queryById',
      method: 'get',
      params: { id }
    })
  }
}
