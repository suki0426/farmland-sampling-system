/**
 * 坐标系工具（1号 前端GIS 岗位）
 *
 * 约束来源：第12课题五人岗位字段与公共接口约束 V2.1
 *  - coordinateSystem 只允许 GCJ02 / WGS84 / BD09 三个枚举值
 *  - 「不得自行猜坐标系」：未知或缺失时直接失败，不做默认假设
 *  - 所有坐标对象必须同时具备 longitude / latitude
 *
 * 地图底图为高德，显示坐标系为 GCJ02，因此任何展示到地图上的坐标
 * 都必须显式声明来源坐标系后再转换。
 */

export const COORDINATE_SYSTEM = {
  GCJ02: 'GCJ02',
  WGS84: 'WGS84',
  BD09: 'BD09'
}

// 高德地图（AMap）显示坐标系
export const MAP_COORDINATE_SYSTEM = COORDINATE_SYSTEM.GCJ02

// 允许的坐标系白名单
const ALLOWED = [COORDINATE_SYSTEM.GCJ02, COORDINATE_SYSTEM.WGS84, COORDINATE_SYSTEM.BD09]

const PI = Math.PI
const X_PI = (PI * 3000.0) / 180.0
const A = 6378245.0
const EE = 0.00669342162296594323

/**
 * 规范化坐标系名称：大小写不敏感，但必须是白名单内的值。
 * @param {string} coordinateSystem
 * @returns {string} 规范化后的枚举值
 * @throws {Error} 坐标系缺失或不在白名单内
 */
export function normalizeCoordinateSystem (coordinateSystem) {
  if (coordinateSystem === undefined || coordinateSystem === null || String(coordinateSystem).trim() === '') {
    throw new Error('坐标对象缺少 coordinateSystem 字段，拒绝按默认坐标系处理')
  }
  const value = String(coordinateSystem).trim().toUpperCase()
  if (ALLOWED.indexOf(value) === -1) {
    throw new Error(`不支持的 coordinateSystem: ${coordinateSystem}，只允许 GCJ02 / WGS84 / BD09`)
  }
  return value
}

/** 坐标系是否合法（不抛异常的版本，用于表单校验） */
export function isValidCoordinateSystem (coordinateSystem) {
  if (!coordinateSystem) {
    return false
  }
  return ALLOWED.indexOf(String(coordinateSystem).trim().toUpperCase()) !== -1
}

/**
 * 严格数值转换。
 * 注意：Number(null) === 0、Number('') === 0，直接用 Number() 会把「缺失的经纬度」
 * 静默变成 (0, 0)（几内亚湾），地图上表现为「设备跑到了非洲」。这里显式排除
 * null / undefined / 空串 / 空白串，让缺失坐标变成一个明确的错误。
 */
export function toFiniteNumber (value) {
  if (value === null || value === undefined) {
    return NaN
  }
  if (typeof value === 'string' && value.trim() === '') {
    return NaN
  }
  const num = Number(value)
  return isFinite(num) ? num : NaN
}

/** 经纬度数值是否在合法范围内 */
export function isValidLngLat (longitude, latitude) {
  const lng = toFiniteNumber(longitude)
  const lat = toFiniteNumber(latitude)
  if (!isFinite(lng) || !isFinite(lat)) {
    return false
  }
  return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90
}

/** 粗略判断是否在中国大陆范围外（GCJ02 偏移算法只在国内有效） */
function outOfChina (lng, lat) {
  return !(lng > 73.66 && lng < 135.05 && lat > 3.86 && lat < 53.55)
}

function transformLat (x, y) {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
  ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0
  ret += ((20.0 * Math.sin(y * PI) + 40.0 * Math.sin((y / 3.0) * PI)) * 2.0) / 3.0
  ret += ((160.0 * Math.sin((y / 12.0) * PI) + 320 * Math.sin((y * PI) / 30.0)) * 2.0) / 3.0
  return ret
}

function transformLng (x, y) {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
  ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0
  ret += ((20.0 * Math.sin(x * PI) + 40.0 * Math.sin((x / 3.0) * PI)) * 2.0) / 3.0
  ret += ((150.0 * Math.sin((x / 12.0) * PI) + 300.0 * Math.sin((x / 30.0) * PI)) * 2.0) / 3.0
  return ret
}

/**
 * WGS84 -> GCJ02
 * @returns {number[]} [longitude, latitude]
 */
export function wgs84ToGcj02 (lng, lat) {
  if (outOfChina(lng, lat)) {
    return [lng, lat]
  }
  let dLat = transformLat(lng - 105.0, lat - 35.0)
  let dLng = transformLng(lng - 105.0, lat - 35.0)
  const radLat = (lat / 180.0) * PI
  let magic = Math.sin(radLat)
  magic = 1 - EE * magic * magic
  const sqrtMagic = Math.sqrt(magic)
  dLat = (dLat * 180.0) / (((A * (1 - EE)) / (magic * sqrtMagic)) * PI)
  dLng = (dLng * 180.0) / ((A / sqrtMagic) * Math.cos(radLat) * PI)
  return [lng + dLng, lat + dLat]
}

/**
 * GCJ02 -> WGS84（数值迭代，精度约 1e-7 度 ≈ 1cm）
 * @returns {number[]} [longitude, latitude]
 */
export function gcj02ToWgs84 (lng, lat) {
  if (outOfChina(lng, lat)) {
    return [lng, lat]
  }
  let wlng = lng
  let wlat = lat
  for (let i = 0; i < 30; i++) {
    const converted = wgs84ToGcj02(wlng, wlat)
    const dLng = converted[0] - lng
    const dLat = converted[1] - lat
    if (Math.abs(dLng) < 1e-7 && Math.abs(dLat) < 1e-7) {
      break
    }
    wlng -= dLng
    wlat -= dLat
  }
  return [wlng, wlat]
}

/**
 * BD09 -> GCJ02
 * @returns {number[]} [longitude, latitude]
 */
export function bd09ToGcj02 (lng, lat) {
  const x = lng - 0.0065
  const y = lat - 0.006
  const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * X_PI)
  const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * X_PI)
  return [z * Math.cos(theta), z * Math.sin(theta)]
}

/**
 * GCJ02 -> BD09
 * @returns {number[]} [longitude, latitude]
 */
export function gcj02ToBd09 (lng, lat) {
  const z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * X_PI)
  const theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * X_PI)
  return [z * Math.cos(theta) + 0.0065, z * Math.sin(theta) + 0.006]
}

/**
 * 任意坐标系之间转换
 * @param {number} lng
 * @param {number} lat
 * @param {string} from 源坐标系（必须是白名单枚举）
 * @param {string} to   目标坐标系（必须是白名单枚举）
 * @returns {number[]} [longitude, latitude]
 */
export function convert (lng, lat, from, to) {
  const source = normalizeCoordinateSystem(from)
  const target = normalizeCoordinateSystem(to)
  if (source === target) {
    return [lng, lat]
  }
  // 统一以 GCJ02 为中转
  let gcj
  if (source === COORDINATE_SYSTEM.GCJ02) {
    gcj = [lng, lat]
  } else if (source === COORDINATE_SYSTEM.WGS84) {
    gcj = wgs84ToGcj02(lng, lat)
  } else {
    gcj = bd09ToGcj02(lng, lat)
  }

  if (target === COORDINATE_SYSTEM.GCJ02) {
    return gcj
  }
  if (target === COORDINATE_SYSTEM.WGS84) {
    return gcj02ToWgs84(gcj[0], gcj[1])
  }
  return gcj02ToBd09(gcj[0], gcj[1])
}

/**
 * 把业务坐标对象转换到地图显示坐标系（GCJ02）。
 * 缺失/非法坐标系会抛错，由调用方捕获后显示可读错误，而不是静默画错位置。
 * @param {{longitude:number, latitude:number, coordinateSystem:string}} point
 * @returns {number[]} [longitude, latitude]
 */
export function toMapCoordinate (point) {
  if (!point) {
    throw new Error('坐标对象为空')
  }
  const lng = toFiniteNumber(point.longitude)
  const lat = toFiniteNumber(point.latitude)
  if (!isValidLngLat(lng, lat)) {
    throw new Error(`非法经纬度: ${point.longitude}, ${point.latitude}`)
  }
  const from = normalizeCoordinateSystem(point.coordinateSystem)
  if (from === MAP_COORDINATE_SYSTEM) {
    return [lng, lat]
  }
  return convert(lng, lat, from, MAP_COORDINATE_SYSTEM)
}

/**
 * 批量转换坐标数组，跳过非法项并收集错误（用于轨迹这种长数组，避免一个坏点导致整条轨迹丢失）
 * @param {Array} points
 * @param {Array} errorSink 可选，收集 { index, message }
 * @returns {Array} [{ longitude, latitude, raw }]
 */
export function toMapCoordinateList (points, errorSink) {
  const result = []
  if (!Array.isArray(points)) {
    return result
  }
  points.forEach((item, index) => {
    try {
      const converted = toMapCoordinate(item)
      result.push({
        longitude: converted[0],
        latitude: converted[1],
        raw: item
      })
    } catch (e) {
      if (Array.isArray(errorSink)) {
        errorSink.push({ index, message: e.message })
      }
    }
  })
  return result
}
