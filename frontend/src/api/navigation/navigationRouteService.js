/**
 * 路线模块 API Service（1号 前端GIS 岗位）
 *
 * 接口来源：字段与公共接口约束 V2.1 —— 3.2 / 7.2
 *  - GET /navigation/navigationRoute/byTaskId  taskId -> NavigationRouteDTO
 *    NavigationRouteDTO: taskId / routeGeoJson / distance / durationSeconds / coordinateSystem
 *
 * 路线由 3号 算法生成、5号 下发，前端只负责展示，不实现路线优化算法。
 */

import request from '@/utils/httpRequest'

export default {
  /** 按任务取算法路线结果 */
  byTaskId (taskId) {
    return request({
      url: '/navigation/navigationRoute/byTaskId',
      method: 'get',
      params: { taskId }
    })
  }
}
