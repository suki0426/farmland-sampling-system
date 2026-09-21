/**
 * GIS mock 数据入口（1号 前端GIS 岗位）
 *
 * 所有方法返回的都是「后端 DTO 形态的纯数据」，与真实接口 `response.data` 结构一致，
 * 因此 gisGateway 在真实接口与 mock 之间切换时，页面字段完全不需要改。
 */

import {
  mockFarmlandList,
  mockFarmlandBrief,
  mockSamplingPoints,
  mockNavigationRoute,
  mockLatestByPoint,
  mockChartData,
  mockHistoryPage,
  MOCK_FARMLAND_ID,
  MOCK_TASK_ID
} from './scene'
import { mockDevices, mockTrack, mockAllTracks } from './devices'

/** 模拟网络延迟，让「加载中」状态在演示时可见 */
function delay (data, ms = 260) {
  return new Promise(resolve => {
    window.setTimeout(() => resolve(data), ms)
  })
}

export default {
  MOCK_FARMLAND_ID,
  MOCK_TASK_ID,

  farmlandList () {
    return delay(mockFarmlandList())
  },

  farmlandBriefByIds (ids) {
    const all = mockFarmlandList()
    const list = String(ids || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
    const filtered = list.length ? all.filter(f => list.indexOf(f.farmlandId) !== -1) : all
    return delay(filtered.length ? filtered : all)
  },

  /** 农田详情：boundaryGeoJson 是字符串，与后端一致 */
  farmlandByBoundary (farmlandId) {
    return delay(mockFarmlandBrief({ farmlandId: farmlandId || MOCK_FARMLAND_ID }))
  },

  samplingPoints (farmlandId) {
    return delay(mockSamplingPoints().map(p => Object.assign({}, p, {
      farmlandId: farmlandId || MOCK_FARMLAND_ID
    })))
  },

  devices () {
    return delay(mockDevices())
  },

  route (taskId) {
    return delay(Object.assign({}, mockNavigationRoute(), { taskId: taskId || MOCK_TASK_ID }))
  },

  latestByPoint (samplingPointId) {
    return delay(mockLatestByPoint(samplingPointId))
  },

  /** 监测历史分页（IPage<MonitorRecordDTO> 形态） */
  history (params) {
    return delay(mockHistoryPage(params))
  },

  trajectory (deviceId) {
    return delay(mockTrack(deviceId))
  },

  chart () {
    return delay(mockChartData())
  },

  allTracks: mockAllTracks
}

export { mockAllTracks, mockTrack, mockDevices }
