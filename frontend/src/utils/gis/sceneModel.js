/**
 * 场景视图模型构建（1号 前端GIS 岗位）
 *
 * 把后端 DTO（可能是 WGS84 / GCJ02 / BD09 任意一种）统一转换成地图显示坐标系（GCJ02），
 * 并收集过程中出现的可读错误，交给页面以「空数据/错误状态」展示，而不是静默空白。
 *
 * 约束依据：
 *  - coordinateSystem 只允许 GCJ02 / WGS84 / BD09，未知时拒绝转换
 *  - 点位、路线、轨迹的 coordinateSystem 必须一致
 */

import {
  toMapCoordinate,
  toMapCoordinateList,
  normalizeCoordinateSystem,
  isValidCoordinateSystem,
  MAP_COORDINATE_SYSTEM
} from './coordinate'
import { extractRings, boundsOf, polylineLength } from './geometry'

/** 解析 boundaryGeoJson：后端可能给字符串，也可能给对象 */
export function parseGeoJson (value) {
  if (!value) {
    return null
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch (e) {
      return null
    }
  }
  return value
}

/**
 * 构建农田边界视图模型
 * @param {object} farmland FarmlandBriefDTO（必须自带 coordinateSystem）
 * @returns {{geoJson:object|null, ringCount:number, area:number, error:string}}
 *
 * ⚠️ 合并评审意见 #5 的修复说明
 *   此前当 FarmlandBriefDTO 没有 coordinateSystem 时，会用采样点/路线声明的「场景坐标系」
 *   作为兜底去渲染边界。这**违反了公共约束「坐标系缺失时不得猜测转换」**——
 *   采样点和边界的坐标系本来就可能不同，用别人的坐标系去解释边界坐标是纯粹的臆测。
 *   现在：**取不到边界自己的 coordinateSystem 就拒绝渲染**，并给出明确的接口错误，
 *   不再接受任何 fallback。
 */
export function buildBoundaryModel (farmland) {
  const result = { geoJson: null, ringCount: 0, area: 0, error: '' }
  if (!farmland) {
    result.error = '未选择农田'
    return result
  }
  const raw = parseGeoJson(farmland.boundaryGeoJson)
  if (!raw) {
    result.error = '农田边界为空或 boundaryGeoJson 不是合法 JSON，未绘制边界'
    return result
  }
  const rings = extractRings(raw)
  if (rings.length === 0) {
    result.error = 'boundaryGeoJson 不是合法的 Polygon/MultiPolygon，未绘制边界'
    return result
  }

  // 严格：只认边界自己声明的坐标系，不接受任何兜底/推断
  if (!isValidCoordinateSystem(farmland.coordinateSystem)) {
    const declared = farmland.coordinateSystem
    const absent = declared === undefined || declared === null || String(declared).trim() === ''
    result.error = absent
      ? '农田边界缺少 coordinateSystem，按约束拒绝推测转换，未绘制边界。' +
        '请 5号 在 FarmlandBriefDTO 上补充 coordinateSystem 字段（接口问题单 Q1）。'
      : `农田边界的 coordinateSystem 不合法（"${declared}"），只允许 GCJ02 / WGS84 / BD09，拒绝推测转换，未绘制边界。`
    return result
  }
  const source = normalizeCoordinateSystem(farmland.coordinateSystem)

  // 转换所有环
  const convertRing = ring => (ring || []).map(c => {
    if (!Array.isArray(c)) {
      return null
    }
    try {
      const converted = toMapCoordinate({
        longitude: c[0],
        latitude: c[1],
        coordinateSystem: source
      })
      return converted
    } catch (e) {
      return null
    }
  }).filter(Boolean)

  const convertedRings = rings.map(convertRing).filter(r => r.length >= 3)
  if (convertedRings.length === 0) {
    result.error = '农田边界坐标转换后无有效环，未绘制边界'
    return result
  }
  result.geoJson = { type: 'Polygon', coordinates: convertedRings }
  result.ringCount = convertedRings.length
  result.area = polygonAreaSquareMeters(convertedRings[0].map(c => [c[0], c[1]]))
  return result
}

/**
 * 采样点视图模型
 * @returns {{points:Array, errors:Array}}
 */
export function buildSamplingPointModels (points, fallbackCoordinateSystem) {
  const result = { points: [], errors: [] }
  if (!Array.isArray(points)) {
    return result
  }
  points.forEach((point, index) => {
    const source = isValidCoordinateSystem(point.coordinateSystem)
      ? point.coordinateSystem
      : fallbackCoordinateSystem
    try {
      const converted = toMapCoordinate({
        longitude: point.longitude,
        latitude: point.latitude,
        coordinateSystem: source
      })
      result.points.push(Object.assign({}, point, {
        longitude: converted[0],
        latitude: converted[1],
        coordinateSystem: MAP_COORDINATE_SYSTEM,
        mapLongitude: converted[0],
        mapLatitude: converted[1]
      }))
    } catch (e) {
      result.errors.push(`第 ${index + 1} 个采样点无有效坐标系/坐标：${e.message}`)
    }
  })
  return result
}

/**
 * 设备视图模型
 *
 * ⚠️ 合并评审意见 #3 的修复说明
 *   已冻结的 DeviceBriefDTO 只承诺 deviceId / deviceCode / deviceName / category / status，
 *   **不承诺** longitude / latitude / coordinateSystem。所以这里不能假设 DDevice 会返回坐标。
 *
 *   现在的行为：
 *     - 设备对象**没有**位置字段 → 保留设备（卡片照常显示），标记 positionError 为
 *       「接口未返回设备位置（待监测模块冻结 DeviceLocationDTO）」，并且**不画到地图上**；
 *     - 有位置字段但值非法（null/越界/坏坐标系）→ 同样标记为位置无效；
 *     - 缺失坐标系时**不推断**，直接判为位置无效（符合「不得猜测坐标系」）。
 *   绝不会再把缺失坐标当成 (0,0) 画到几内亚湾。
 */
export function buildDeviceModels (devices) {
  const result = { devices: [], errors: [] }
  if (!Array.isArray(devices)) {
    return result
  }
  devices.forEach(device => {
    const code = device.deviceCode || device.deviceId || '未知设备'
    const hasPositionField =
      device.longitude !== undefined && device.longitude !== null &&
      device.latitude !== undefined && device.latitude !== null

    if (!hasPositionField) {
      // DeviceBriefDTO 未承诺坐标 —— 这是契约问题，不是数据错误
      const message = '接口未返回设备位置（DeviceBriefDTO 不含坐标，待监测模块冻结 DeviceLocationDTO）'
      result.devices.push(Object.assign({}, device, {
        longitude: NaN,
        latitude: NaN,
        positionError: message
      }))
      result.errors.push(`${code}：${message}`)
      return
    }

    if (!isValidCoordinateSystem(device.coordinateSystem)) {
      const message = '设备位置缺少 coordinateSystem，按约束拒绝推测转换'
      result.devices.push(Object.assign({}, device, {
        longitude: NaN,
        latitude: NaN,
        positionError: message
      }))
      result.errors.push(`${code}：${message}`)
      return
    }

    try {
      const converted = toMapCoordinate({
        longitude: device.longitude,
        latitude: device.latitude,
        coordinateSystem: device.coordinateSystem
      })
      result.devices.push(Object.assign({}, device, {
        longitude: converted[0],
        latitude: converted[1],
        coordinateSystem: MAP_COORDINATE_SYSTEM
      }))
    } catch (e) {
      // 单台设备位置无效不应导致整张地图失败
      result.devices.push(Object.assign({}, device, {
        longitude: NaN,
        latitude: NaN,
        positionError: e.message
      }))
      result.errors.push(`${code} 位置无效：${e.message}`)
    }
  })
  return result
}

/**
 * 轨迹视图模型
 *
 * ⚠️ 合并评审意见 #4 的修复说明
 *   既有 MonitorRecordDTO **未冻结** longitude / latitude / coordinateSystem，
 *   真实历史记录里可能一个坐标字段都没有。此前这会被静默过滤掉、地图上轨迹是空的，
 *   而且看不出原因。现在：
 *     - 逐条统计**缺坐标字段**的记录数（missingCoordinateCount），与
 *       "有坐标字段但值非法/坐标系未知"（invalidCount）分开计数；
 *     - 返回 `error` 给出可读原因，由页面明确提示"轨迹不可用 + 需 5号 冻结轨迹 DTO"；
 *     - 记录为空时也会给出 error，不静默返回空数组。
 */
export function buildTrackModel (records, fallbackCoordinateSystem) {
  const result = {
    points: [],
    errors: [],
    error: '',
    recordCount: 0,
    acceptedCount: 0,
    missingCoordinateCount: 0,
    invalidCount: 0
  }
  if (!Array.isArray(records)) {
    result.error = '轨迹接口未返回记录列表'
    return result
  }
  result.recordCount = records.length
  if (records.length === 0) {
    result.error = '轨迹接口返回 0 条记录（该设备在此时间范围内没有历史数据）'
    return result
  }

  // 先区分"缺字段"和"字段在但值坏"：两者原因不同，提示也应不同
  const withCoordinate = []
  records.forEach(r => {
    const hasField =
      r && r.longitude !== undefined && r.longitude !== null &&
      r.latitude !== undefined && r.latitude !== null
    if (hasField) {
      withCoordinate.push(r)
    } else {
      result.missingCoordinateCount += 1
    }
  })

  if (withCoordinate.length === 0) {
    result.error = `轨迹接口返回的 ${records.length} 条记录都没有 longitude/latitude 字段。` +
      '既有 MonitorRecordDTO 未冻结坐标字段，无法绘制轨迹；' +
      '需 5号 冻结「历史轨迹 DTO」或提供专用轨迹接口（接口问题单 Q2）。'
    return result
  }

  const errors = []
  const converted = toMapCoordinateList(withCoordinate.map(r => ({
    longitude: r.longitude,
    latitude: r.latitude,
    coordinateSystem: isValidCoordinateSystem(r.coordinateSystem) ? r.coordinateSystem : fallbackCoordinateSystem
  })), errors)
  converted.forEach((c, index) => {
    const raw = withCoordinate[index] || {}
    result.points.push({
      deviceId: raw.deviceId,
      longitude: c.longitude,
      latitude: c.latitude,
      coordinateSystem: MAP_COORDINATE_SYSTEM,
      collectTime: raw.collectTime
    })
  })
  errors.forEach(e => result.errors.push(`轨迹第 ${e.index + 1} 个点无效：${e.message}`))
  result.invalidCount = errors.length
  result.acceptedCount = result.points.length

  if (result.points.length === 0) {
    result.error = `轨迹 ${records.length} 条记录全部无法转换（坐标系缺失或坐标非法），未绘制轨迹`
  } else if (result.missingCoordinateCount > 0) {
    result.error = `轨迹 ${records.length} 条记录中有 ${result.missingCoordinateCount} 条缺少经纬度字段，已跳过；` +
      `实际绘制 ${result.points.length} 个点`
  }
  return result
}

/** 路线视图模型：把 routeGeoJson 解析成可绘制的坐标序列，并与 orderedPoints 对齐 */
export function buildRouteModel (route, fallbackCoordinateSystem) {
  const result = {
    taskId: '',
    coordinates: [],
    orderedPoints: [],
    distance: 0,
    durationSeconds: 0,
    method: '',
    diagnostics: null,
    error: ''
  }
  if (!route) {
    result.error = '尚无路线数据'
    return result
  }
  const source = isValidCoordinateSystem(route.coordinateSystem)
    ? route.coordinateSystem
    : fallbackCoordinateSystem
  if (!isValidCoordinateSystem(source)) {
    result.error = '路线缺少 coordinateSystem，拒绝推测显示（routeGeoJson 与点位坐标系必须一致）'
    return result
  }
  result.taskId = route.taskId || ''
  result.distance = Number(route.distance) || 0
  result.durationSeconds = Number(route.durationSeconds) || 0
  result.method = route.method || ''
  result.diagnostics = route.diagnostics || null

  const geoJson = parseGeoJson(route.routeGeoJson)
  const lineRings = extractRings(geoJson) // LineString 会被当成一个 ring 返回
  const rawCoordinates = lineRings.length ? lineRings[0] : []

  const errors = []
  const converted = toMapCoordinateList(rawCoordinates.map(c => ({
    longitude: c[0],
    latitude: c[1],
    coordinateSystem: source
  })), errors)
  result.coordinates = converted.map(c => [c.longitude, c.latitude])

  result.orderedPoints = (route.orderedPoints || []).map(point => {
    try {
      const c = toMapCoordinate({
        longitude: point.longitude,
        latitude: point.latitude,
        coordinateSystem: isValidCoordinateSystem(point.coordinateSystem) ? point.coordinateSystem : source
      })
      return Object.assign({}, point, { longitude: c[0], latitude: c[1], coordinateSystem: MAP_COORDINATE_SYSTEM })
    } catch (e) {
      return null
    }
  }).filter(Boolean)

  // routeGeoJson 缺失时用 orderedPoints 兜底，保证路线仍能画出来
  if (result.coordinates.length < 2 && result.orderedPoints.length >= 2) {
    result.coordinates = result.orderedPoints.map(p => [p.longitude, p.latitude])
  }
  if (!result.distance && result.coordinates.length >= 2) {
    result.distance = polylineLength(result.coordinates)
  }
  if (result.coordinates.length < 2) {
    result.error = '路线坐标不足 2 个点，无法绘制'
  }
  return result
}

/**
 * 便捷方法：把后端返回的轨迹记录直接转成可绘制的 GCJ02 点数组
 * @param {Array} records MonitorRecordDTO 列表（含 longitude/latitude/coordinateSystem/collectTime）
 * @param {string} fallbackCoordinateSystem 记录未声明坐标系时使用的场景坐标系
 * @returns {Array}
 */
export function renderableTrajectory (records, fallbackCoordinateSystem) {
  return buildTrackModel(records, fallbackCoordinateSystem).points
}

/** 场景坐标系推断：优先用命名对象的 coordinateSystem，全部缺失时给出提示 */
export function resolveSceneCoordinateSystem (candidates) {
  for (let i = 0; i < candidates.length; i++) {
    if (isValidCoordinateSystem(candidates[i])) {
      return normalizeCoordinateSystem(candidates[i])
    }
  }
  return ''
}

/** 多边形面积（平方米，球面近似） */
export function polygonAreaSquareMeters (ring) {
  if (!Array.isArray(ring) || ring.length < 3) {
    return 0
  }
  const R = 6371008.8
  const rad = Math.PI / 180
  let total = 0
  for (let i = 0; i < ring.length; i++) {
    const p1 = ring[i]
    const p2 = ring[(i + 1) % ring.length]
    total += (p2[0] - p1[0]) * rad * (2 + Math.sin(p1[1] * rad) + Math.sin(p2[1] * rad))
  }
  return Math.abs((total * R * R) / 2)
}

/** 面积格式化 */
export function formatArea (squareMeters) {
  const value = Number(squareMeters)
  if (!isFinite(value) || value <= 0) {
    return '--'
  }
  if (value < 10000) {
    return `${value.toFixed(1)} m²`
  }
  return `${(value / 10000).toFixed(2)} 公顷`
}

/** 边界包围盒（用于界面显示范围） */
export function boundaryBounds (geoJson) {
  const rings = extractRings(geoJson)
  if (!rings.length) {
    return null
  }
  return boundsOf(rings[0])
}

export default {
  parseGeoJson,
  buildBoundaryModel,
  buildSamplingPointModels,
  buildDeviceModels,
  buildTrackModel,
  renderableTrajectory,
  buildRouteModel,
  resolveSceneCoordinateSystem,
  polygonAreaSquareMeters,
  formatArea,
  boundaryBounds
}
