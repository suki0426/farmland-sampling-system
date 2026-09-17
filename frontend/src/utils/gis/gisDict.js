/**
 * GIS 模块字典（1号 前端GIS 岗位）
 *
 * 约束来源：字段与公共接口约束 V2.1
 *  - status 传字典 code，不传中文标签；前端用字典显示。
 *
 * 实现方式：优先走平台字典（sys_dict，通过 @/utils/dictUtils 读取 localStorage 中的 dictList），
 * 字典未配置时退回本文件的兜底标签。兜底标签只用于「字典尚未由 5号 落库」的过渡期，
 * 字典一旦配置即以字典为准，不需要改动页面代码。
 */

import { getDictLabel } from '@/utils/dictUtils'

/** 需要 5号 在平台字典中创建的类型（缺失时使用兜底标签） */
export const GIS_DICT_TYPES = {
  DEVICE_STATUS: 'gis_device_status',
  SAMPLING_POINT_STATUS: 'gis_sampling_point_status',
  COORDINATE_SYSTEM: 'gis_coordinate_system',
  METRIC: 'gis_metric'
}

const FALLBACK = {
  gis_device_status: {
    online: '在线',
    offline: '离线',
    fault: '故障',
    delay: '延迟'
  },
  gis_sampling_point_status: {
    pending: '未采样',
    sampled: '已采样',
    skipped: '已跳过'
  },
  gis_coordinate_system: {
    GCJ02: 'GCJ02 火星坐标系',
    WGS84: 'WGS84 大地坐标系',
    BD09: 'BD09 百度坐标系'
  },
  gis_metric: {
    soilTemperature: '土壤温度',
    soilMoisture: '土壤湿度',
    airTemperature: '空气温度',
    airHumidity: '空气湿度',
    soilDepth: '土壤深度'
  }
}

/**
 * 取字典标签：先查平台字典，再退回兜底标签
 * @param {string} type 字典类型
 * @param {string} code 字典值（code）
 * @param {string} [placeholder] 全部为空时的占位符
 */
export function dictLabel (type, code, placeholder = '--') {
  if (code === undefined || code === null || code === '') {
    return placeholder
  }
  // 平台字典优先
  try {
    const fromPlatform = getDictLabel(type, code, undefined)
    if (fromPlatform && fromPlatform !== '--') {
      return fromPlatform
    }
  } catch (e) {
    // 平台字典不可用时忽略，继续使用兜底
  }
  const fallback = FALLBACK[type]
  if (fallback && fallback[code] !== undefined) {
    return fallback[code]
  }
  return String(code)
}

/** 设备状态标签 */
export function deviceStatusLabel (code) {
  return dictLabel(GIS_DICT_TYPES.DEVICE_STATUS, code)
}

/** 采样点状态标签 */
export function samplingPointStatusLabel (code) {
  return dictLabel(GIS_DICT_TYPES.SAMPLING_POINT_STATUS, code)
}

/** 坐标系标签 */
export function coordinateSystemLabel (code) {
  return dictLabel(GIS_DICT_TYPES.COORDINATE_SYSTEM, code)
}

/** 采样指标标签 */
export function metricLabel (code) {
  return dictLabel(GIS_DICT_TYPES.METRIC, code)
}

/** 指标单位（与老师回传帧的 5 项采样指标一一对应） */
export const METRIC_UNITS = {
  soilTemperature: '°C',
  soilMoisture: '%',
  airTemperature: '°C',
  airHumidity: '%',
  soilDepth: 'cm'
}

/** 老师任务书规定的 5 项采样指标（顺序即回传帧顺序） */
export const CORE_METRICS = [
  'soilTemperature',
  'soilMoisture',
  'airTemperature',
  'airHumidity',
  'soilDepth'
]

/** Element UI 标签类型：设备状态 -> 颜色语义 */
export function deviceStatusTagType (code) {
  switch (String(code || '').toLowerCase()) {
    case 'online': return 'success'
    case 'offline': return 'info'
    case 'fault': return 'danger'
    case 'delay': return 'warning'
    default: return 'info'
  }
}

/** Element UI 标签类型：采样点状态 -> 颜色语义 */
export function samplingPointStatusTagType (code) {
  switch (String(code || '').toLowerCase()) {
    case 'sampled':
    case 'done':
    case 'finished':
    case 'completed':
    case '2':
      return 'success'
    case 'skipped':
      return 'info'
    default:
      return 'warning'
  }
}

export default {
  GIS_DICT_TYPES,
  CORE_METRICS,
  METRIC_UNITS,
  dictLabel,
  deviceStatusLabel,
  samplingPointStatusLabel,
  coordinateSystemLabel,
  metricLabel,
  deviceStatusTagType,
  samplingPointStatusTagType
}
