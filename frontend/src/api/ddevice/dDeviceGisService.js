/**
 * 设备模块 GIS 相关 API Service（1号 前端GIS 岗位）
 *
 * 这是新增文件，不修改既有的 @/api/ddevice/dDeviceService.js，
 * 因此不会影响其他成员对设备的增删改查页面。
 *
 * 接口来源：字段与公共接口约束 V2.1 —— §3.2 / §7.2
 *  - GET /ddevice/dDevice/briefByIds  ids -> List<DeviceBriefDTO>
 *  - GET /ddevice/dDevice/listUsable  category?, status? -> List<DeviceBriefDTO>
 *
 * ⚠️ 已冻结的 DeviceBriefDTO 只承诺以下字段：
 *      deviceId / deviceCode / deviceName / category / status
 *    **不承诺** longitude / latitude / coordinateSystem（合并评审意见 #3）。
 *
 *   因此本模块**只用于取设备清单与设备基本信息**，绝不把 DDevice 当作设备位置数据源。
 *   设备实时位置需要由监测模块提供明确的 DeviceLocationDTO（或等价 API），
 *   在其冻结之前，sceneModel.buildDeviceModels 会把拿不到位置的设备标记为
 *    「位置未提供」并**不画到地图上**，而不是假设 DDevice 会返回坐标。
 *
 *   关联一律用 deviceId，显示一律用 deviceCode。
 */

import request from '@/utils/httpRequest'

export default {
  /** 设备简要信息（批量） */
  briefByIds (ids) {
    return request({
      url: '/ddevice/dDevice/briefByIds',
      method: 'get',
      params: { ids: Array.isArray(ids) ? ids.join(',') : ids }
    })
  },

  /** 可用设备列表（地图上要展示的设备集合） */
  listUsable (params) {
    return request({
      url: '/ddevice/dDevice/listUsable',
      method: 'get',
      params
    })
  },

  /** 按设备编码解析设备（仅在边界适配场景使用） */
  queryByCode (deviceCode) {
    return request({
      url: '/ddevice/dDevice/queryByCode',
      method: 'get',
      params: { deviceCode }
    })
  }
}
