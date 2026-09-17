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
 * @param {object} farmland FarmlandBriefDTO
 * @param {string} fallbackCoordinateSystem 边界未声明坐标系时使用的场景坐标系
 * @returns {{geoJson:object|null, ringCount:number, area:number, error:string, notice:string}}
 */
export function buildBoundaryModel (farmland, fallbackCoordinateSystem) {
  const result = { geoJson: null, ringCount: 0, area: 0, error: '', notice: '' }
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

  let declared = farmland.coordinateSystem
  let source
  if (isValidCoordinateSystem(declared)) {
    source = normalizeCoordinateSystem(declared)
  } else if (isValidCoordinateSystem(fallbackCoordinateSystem)) {
    source = normalizeCoordinateSystem(fallbackCoordinateSystem)
    result.notice = `农田边界未声明 coordinateSystem，按场景坐标系 ${source} 处理（已在接口问题单中登记）`
  } else {
    result.error = '农田边界缺少 coordinateSystem，且场景未声明坐标系，拒绝推测显示'
    return result
  }

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

/** 设备视图模型 */
export function buildDeviceModels (devices, fallbackCoordinateSystem) {
  const result = { devices: [], errors: [] }
  if (!Array.isArray(devices)) {
    return result
  }
  devices.forEach(device => {
    const source = isValidCoordinateSystem(device.coordinateSystem)
      ? device.coordinateSystem
      : fallbackCoordinateSystem
    try {
      const converted = toMapCoordinate({
        longitude: device.longitude,
        latitude: device.latitude,
        coordinateSystem: source
      })
      result.devices.push(Object.assign({}, device, {
        longitude: converted[0],
        latitude: converted[1],
        coordinateSystem: MAP_COORDINATE_SYSTEM
      }))
    } catch (e) {
      // 设备位置缺失不应导致整张地图失败：保留设备但标记为「位置未知」
      result.devices.push(Object.assign({}, device, {
        longitude: NaN,
        latitude: NaN,
        positionError: e.message
      }))
      result.errors.push(`${device.deviceCode || device.deviceId} 位置无效：${e.message}`)
    }
  })
  return result
}

/** 轨迹视图模型 */
export function buildTrackModel (records, fallbackCoordinateSystem) {
  const result = { points: [], errors: [] }
  if (!Array.isArray(records)) {
    return result
  }
  const errors = []
  const converted = toMapCoordinateList(records.map(r => ({
    longitude: r.longitude,
    latitude: r.latitude,
    coordinateSystem: isValidCoordinateSystem(r.coordinateSystem) ? r.coordinateSystem : fallbackCoordinateSystem
  })), errors)
  converted.forEach((c, index) => {
    const raw = records[index] || {}
    result.points.push({
      deviceId: raw.deviceId,
      longitude: c.longitude,
      latitude: c.latitude,
      coordinateSystem: MAP_COORDINATE_SYSTEM,
      collectTime: raw.collectTime
    })
  })
  errors.forEach(e => result.errors.push(`轨迹第 ${e.index + 1} 个点无效：${e.message}`))
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
