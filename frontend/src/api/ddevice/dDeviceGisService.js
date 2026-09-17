/**
 * 设备模块 GIS 相关 API Service（1号 前端GIS 岗位）
 *
 * 这是新增文件，不修改既有的 @/api/ddevice/dDeviceService.js，
 * 因此不会影响其他成员对设备的增删改查页面。
 *
 * 接口来源：字段与公共接口约束 V2.1 —— 3.2 / 7.2
 *  - GET /ddevice/dDevice/briefByIds  ids -> List<DeviceBriefDTO>
 *  - GET /ddevice/dDevice/listUsable category?, status? -> List<DeviceBriefDTO>
 *
 * 字段：deviceId / deviceCode / deviceName / category / status / longitude / latitude /
 *      coordinateSystem / collectTime。关联一律用 deviceId，显示用 deviceCode。
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
