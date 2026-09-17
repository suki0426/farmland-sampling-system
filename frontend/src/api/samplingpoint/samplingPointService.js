/**
 * 采样点模块 API Service（1号 前端GIS 岗位）
 *
 * 接口来源：字段与公共接口约束 V2.1 —— 3.2 前端唯一允许调用的 REST 清单
 *  - GET /samplingpoint/samplingPoint/listByFarmland  farmlandId -> List<SamplingPointBriefDTO>
 *  - GET /samplingpoint/samplingPoint/mapData         farmlandId, status? -> List<SamplingPointMapDTO>
 *
 * 手动选点：前端做 PIP 校验后把点位交给 5号 后端保存，前端不写库。
 * 采样点 ID 由后端生成（算法生成的新点可暂不带 samplingPointId）。
 */

import request from '@/utils/httpRequest'

export default {
  /** 某个农田下的采样点（简要） */
  listByFarmland (farmlandId) {
    return request({
      url: '/samplingpoint/samplingPoint/listByFarmland',
      method: 'get',
      params: { farmlandId }
    })
  },

  /** 地图点位数据 */
  mapData (farmlandId, status) {
    return request({
      url: '/samplingpoint/samplingPoint/mapData',
      method: 'get',
      params: { farmlandId, status }
    })
  },

  /** 保存手动选择的采样点 */
  save (inputForm) {
    return request({
      url: '/samplingpoint/samplingPoint/save',
      method: 'post',
      data: inputForm
    })
  },

  /** 批量保存手动选择的采样点 */
  saveBatch (list) {
    return request({
      url: '/samplingpoint/samplingPoint/saveBatch',
      method: 'post',
      data: { list }
    })
  },

  /** 标记采样点状态（例如到达后置为已采样；实际入库以 5号 接口为准） */
  updateStatus (samplingPointId, status) {
    return request({
      url: '/samplingpoint/samplingPoint/updateStatus',
      method: 'post',
      data: { samplingPointId, status }
    })
  }
}
