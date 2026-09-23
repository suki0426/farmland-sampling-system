/**
 * 采样点模块 API Service（1号 前端GIS 岗位）
 *
 * 接口来源：字段与公共接口约束 V2.1 —— §3.2 前端唯一允许调用的 REST 清单
 *  - GET /samplingpoint/samplingPoint/listByFarmland  farmlandId -> List<SamplingPointBriefDTO>
 *  - GET /samplingpoint/samplingPoint/mapData         farmlandId, status? -> List<SamplingPointMapDTO>
 *
 * ⚠️ 本模块**只允许读**，不提供任何写接口。
 *
 * 原因（合并评审意见 #1）：v2.1 §3.2 的白名单里**没有任何采样点写接口**，
 * 此前这里存在 `save` / `saveBatch` / `updateStatus` 三个自造端点，问题有三层：
 *   1. 端点本身未约定、未冻结，后端不存在，调用必然 404；
 *   2. 权限 `samplingpoint:samplingPoint:add/edit` 未在 §2.2 冻结；
 *   3. 请求体形态是错的——调用方传 `{ farmlandId, taskId, points[] }`，
 *      这里又包了一层 `{ list: ... }`，后端无法按常规批量保存解析。
 *
 * 因此按评审要求**删除**这三类写操作。前端仍然支持"手动选点"这个交互
 * （M1 要求的落点校验与展示），但点位的**入库由 5号 提供冻结的写接口后再接入**，
 * 在那之前前端不会向任何未约定端点发请求，也不会伪造成"保存成功"。
 *
 * 待 5号 冻结后需要补充的契约：
 *   - 端点：POST /samplingpoint/samplingPoint/saveBatch（或等价的冻结路径）
 *   - 权限：samplingpoint:samplingPoint:add
 *   - 请求体：明确的批量 DTO（例如 List<SamplingPointDTO>），并写明信封结构
 *   - 响应：明确成功语义（是否需要回填后端生成的 samplingPointId）
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
  }

  // ↓ 以下写接口在 v2.1 §3.2 白名单之外，且 DTO/权限/信封均未冻结，
  //   按合并评审意见 #1 删除。5号 冻结契约后再在此补充。
  // save (inputForm) { ... }
  // saveBatch (list) { ... }
  // updateStatus (samplingPointId, status) { ... }
}
