/**
 * 几何工具（1号 前端GIS 岗位）
 *
 * 负责前端的展示层几何计算：
 *  - 点在多边形内判定（PIP）：用于「手动选点必须落在农田内」的即时校验
 *    （老师任务书 M1；算法侧的 PIP 由 3号 提供，前端只做交互校验，不承担算法职责）
 *  - 球面距离：用于「提示当前最近的未采样点」的展示提示
 *  - GeoJSON 解析：把 boundaryGeoJson / routeGeoJson 转成可绘制的坐标数组
 */

import { toMapCoordinate, MAP_COORDINATE_SYSTEM } from './coordinate'

const EARTH_RADIUS = 6371008.8

/** 取出 GeoJSON 的所有外环（Polygon / MultiPolygon），返回 [[ [lng,lat], ... ], ...] */
export function extractRings (geoJson) {
  const rings = []
  if (!geoJson) {
    return rings
  }
  let geometry = geoJson
  // 允许直接传 Feature / FeatureCollection
  if (geometry.type === 'Feature') {
    geometry = geometry.geometry
  }
  if (!geometry) {
    return rings
  }
  if (geometry.type === 'FeatureCollection' && Array.isArray(geometry.features)) {
    geometry.features.forEach(feature => {
      extractRings(feature).forEach(ring => rings.push(ring))
    })
    return rings
  }
  if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates)) {
    // 只取外环，内环（洞）在展示上单独处理
    if (Array.isArray(geometry.coordinates[0])) {
      rings.push(geometry.coordinates[0])
    }
    return rings
  }
  if (geometry.type === 'MultiPolygon' && Array.isArray(geometry.coordinates)) {
    geometry.coordinates.forEach(polygon => {
      if (Array.isArray(polygon) && Array.isArray(polygon[0])) {
        rings.push(polygon[0])
      }
    })
    return rings
  }
  if (geometry.type === 'LineString' && Array.isArray(geometry.coordinates)) {
    rings.push(geometry.coordinates)
    return rings
  }
  return rings
}

/** 取出 GeoJSON 的所有内环（洞），展示时可用于区分「不采样区」 */
export function extractHoles (geoJson) {
  const holes = []
  if (!geoJson) {
    return holes
  }
  let geometry = geoJson
  if (geometry.type === 'Feature') {
    geometry = geometry.geometry
  }
  if (!geometry) {
    return holes
  }
  const collect = (polygon) => {
    if (!Array.isArray(polygon)) {
      return
    }
    for (let i = 1; i < polygon.length; i++) {
      if (Array.isArray(polygon[i])) {
        holes.push(polygon[i])
      }
    }
  }
  if (geometry.type === 'Polygon') {
    collect(geometry.coordinates)
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach(collect)
  }
  return holes
}

/**
 * 射线法判断点是否在多边形环内（支持凹多边形）
 * @param {number} lng
 * @param {number} lat
 * @param {Array} ring [[lng,lat], ...]
 * @returns {boolean}
 */
export function pointInRing (lng, lat, ring) {
  if (!Array.isArray(ring) || ring.length < 3) {
    return false
  }
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = Number(ring[i][0])
    const yi = Number(ring[i][1])
    const xj = Number(ring[j][0])
    const yj = Number(ring[j][1])
    if (!isFinite(xi) || !isFinite(yi) || !isFinite(xj) || !isFinite(yj)) {
      continue
    }
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)
    if (intersect) {
      inside = !inside
    }
  }
  return inside
}

/**
 * 判断点是否在 GeoJSON 面内（外环内且不在任何内环/洞内）
 * @param {number} lng
 * @param {number} lat
 * @param {object} geoJson Polygon / MultiPolygon / Feature
 */
export function pointInGeoJson (lng, lat, geoJson) {
  const rings = extractRings(geoJson)
  if (rings.length === 0) {
    return false
  }
  let hit = false
  for (let i = 0; i < rings.length; i++) {
    if (pointInRing(lng, lat, rings[i])) {
      hit = true
      break
    }
  }
  if (!hit) {
    return false
  }
  const holes = extractHoles(geoJson)
  for (let i = 0; i < holes.length; i++) {
    if (pointInRing(lng, lat, holes[i])) {
      return false
    }
  }
  return true
}

/**
 * 用业务坐标对象（含 coordinateSystem）做 PIP 校验。
 * 边界坐标会先统一到地图坐标系（GCJ02）后再判定，避免坐标系混用导致误判。
 * @param {{longitude:number, latitude:number, coordinateSystem:string}} point
 * @param {object} boundaryGeoJson
 * @returns {{inside:boolean, message:string}}
 */
export function validatePointInBoundary (point, boundaryGeoJson) {
  if (!boundaryGeoJson) {
    return { inside: false, message: '农田边界为空，无法校验点位' }
  }
  const rings = extractRings(boundaryGeoJson)
  if (rings.length === 0) {
    return { inside: false, message: '农田边界不是合法的 Polygon/MultiPolygon' }
  }
  let lng
  let lat
  try {
    const converted = toMapCoordinate(point)
    lng = converted[0]
    lat = converted[1]
  } catch (e) {
    return { inside: false, message: e.message }
  }
  // 边界 GeoJSON 约定与地图同坐标系；若几何本身不落在合理范围则提示数据问题
  const inside = pointInGeoJson(lng, lat, boundaryGeoJson)
  return {
    inside,
    message: inside ? '点位位于农田边界内' : '点位落在农田边界外，已拒绝添加'
  }
}

/** 两点球面距离（米） */
export function haversine (lng1, lat1, lng2, lat2) {
  const rad = Math.PI / 180
  const dLat = (Number(lat2) - Number(lat1)) * rad
  const dLng = (Number(lng2) - Number(lng1)) * rad
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(Number(lat1) * rad) * Math.cos(Number(lat2) * rad) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return 2 * EARTH_RADIUS * Math.asin(Math.min(1, Math.sqrt(a)))
}

/** 方位角（度，正北为0，顺时针） */
export function bearing (lng1, lat1, lng2, lat2) {
  const rad = Math.PI / 180
  const y = Math.sin((Number(lng2) - Number(lng1)) * rad) * Math.cos(Number(lat2) * rad)
  const x = Math.cos(Number(lat1) * rad) * Math.sin(Number(lat2) * rad) -
    Math.sin(Number(lat1) * rad) * Math.cos(Number(lat2) * rad) * Math.cos((Number(lng2) - Number(lng1)) * rad)
  const deg = (Math.atan2(y, x) * 180) / Math.PI
  return (deg + 360) % 360
}

/** 折线总长度（米） */
export function polylineLength (coordinates) {
  let total = 0
  if (!Array.isArray(coordinates)) {
    return total
  }
  for (let i = 1; i < coordinates.length; i++) {
    total += haversine(coordinates[i - 1][0], coordinates[i - 1][1], coordinates[i][0], coordinates[i][1])
  }
  return total
}

/** 计算坐标数组的包围盒 */
export function boundsOf (coordinates) {
  const valid = (coordinates || []).filter(c =>
    Array.isArray(c) && isFinite(Number(c[0])) && isFinite(Number(c[1])))
  if (valid.length === 0) {
    return null
  }
  let minLng = Infinity
  let minLat = Infinity
  let maxLng = -Infinity
  let maxLat = -Infinity
  valid.forEach(c => {
    const lng = Number(c[0])
    const lat = Number(c[1])
    if (lng < minLng) minLng = lng
    if (lat < minLat) minLat = lat
    if (lng > maxLng) maxLng = lng
    if (lat > maxLat) maxLat = lat
  })
  return { minLng, minLat, maxLng, maxLat }
}

/** 合并多个包围盒 */
export function mergeBounds (list) {
  const valid = (list || []).filter(Boolean)
  if (valid.length === 0) {
    return null
  }
  return valid.reduce((acc, b) => ({
    minLng: Math.min(acc.minLng, b.minLng),
    minLat: Math.min(acc.minLat, b.minLat),
    maxLng: Math.max(acc.maxLng, b.maxLng),
    maxLat: Math.max(acc.maxLat, b.maxLat)
  }))
}

const SAMPLED_STATUS = ['sampled', 'done', 'finished', 'completed', '2']

/** 采样点是否已完成采样（status 为字典 code，这里只做 code 归一化判断） */
export function isSampled (status) {
  if (status === undefined || status === null) {
    return false
  }
  return SAMPLED_STATUS.indexOf(String(status).toLowerCase()) !== -1
}

/**
 * 从当前位置找出最近的未采样点 —— 用于「指引采样员前往下一个最近的未采样点」的展示提示。
 * 说明：正式路线的生成属于 3号 算法职责，前端这里只做界面提示；
 * 若 5号 后续在 NavigationRouteDTO 中直接下发 nextPoint，则优先使用后端结果。
 * @param {{longitude:number, latitude:number, coordinateSystem:string}} current
 * @param {Array} points 采样点列表（含 longitude/latitude/coordinateSystem/status/samplingPointId）
 * @returns {{point:object, distance:number}|null}
 */
export function findNearestUnsampledPoint (current, points) {
  if (!current || !Array.isArray(points) || points.length === 0) {
    return null
  }
  let currentLng
  let currentLat
  try {
    const converted = toMapCoordinate(current)
    currentLng = converted[0]
    currentLat = converted[1]
  } catch (e) {
    return null
  }
  let best = null
  points.forEach(point => {
    if (isSampled(point.status)) {
      return
    }
    let lng
    let lat
    try {
      const converted = toMapCoordinate(point)
      lng = converted[0]
      lat = converted[1]
    } catch (e) {
      return
    }
    const distance = haversine(currentLng, currentLat, lng, lat)
    if (!best || distance < best.distance) {
      best = { point, distance }
    }
  })
  return best
}

/** 距离格式化：<1000m 用米，否则用公里 */
export function formatDistance (meters) {
  const value = Number(meters)
  if (!isFinite(value)) {
    return '--'
  }
  if (value < 1000) {
    return `${value.toFixed(1)} m`
  }
  return `${(value / 1000).toFixed(2)} km`
}

/** 距离（米）转换为「米制采样间隔」描述，用于界面提示 */
export function describeSpacing (meters) {
  return `${Number(meters).toFixed(1)} m`
}

export { MAP_COORDINATE_SYSTEM }
