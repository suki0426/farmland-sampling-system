/**
 * 3 台采样终端的演示轨迹 mock（1号 前端GIS 岗位）
 *
 * 字段与后端 DeviceBriefDTO / 轨迹点 完全一致：
 *   deviceId, deviceCode, deviceName, category, status,
 *   longitude, latitude, coordinateSystem, collectTime, heading
 *
 * 轨迹特点：
 *   - 每台设备一条独立、连续、不跳点的行走轨迹（对应「轨迹在地图上看起来连续」的验收要求）
 *   - 用固定种子的伪随机数生成，同一份代码每次生成结果完全一致，便于复现（对应 T1 可复现要求）
 *   - 采集时间单调递增，间隔约 8 秒，共约 100 个点
 *   - 避开水塘/禁入区（内环）
 */

import { MOCK_COORDINATE_SYSTEM } from './scene'

/** mulberry32：轻量确定性伪随机数发生器 */
function mulberry32 (seed) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), 1 | t)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const METERS_PER_DEG_LAT = 110540
const METERS_PER_DEG_LNG = 111320

function metersToLng (meters, lat) {
  return meters / (METERS_PER_DEG_LNG * Math.cos((lat * Math.PI) / 180))
}

function metersToLat (meters) {
  return meters / METERS_PER_DEG_LAT
}

function formatTime (date) {
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

/** 设备定义：waypoints 为田间行走的关键点（GCJ02），可以走折返路线 */
const DEVICE_DEFS = [
  {
    deviceId: 'DV20260917001',
    deviceCode: 'DEV001',
    deviceName: '采样终端一号',
    category: 'sampler',
    seed: 1001,
    waypoints: [
      [112.43430, 38.01090],
      [112.43720, 38.01110],
      [112.43730, 38.01200],
      [112.43420, 38.01230],
      [112.43420, 38.01390],
      [112.43690, 38.01390]
    ]
  },
  {
    deviceId: 'DV20260917002',
    deviceCode: 'DEV002',
    deviceName: '采样终端二号',
    category: 'sampler',
    seed: 2002,
    waypoints: [
      [112.43680, 38.01130],
      [112.43690, 38.01390],
      [112.43620, 38.01320],
      [112.43620, 38.01160],
      [112.43440, 38.01160],
      [112.43440, 38.01300]
    ]
  },
  {
    deviceId: 'DV20260917003',
    deviceCode: 'DEV003',
    deviceName: '采样终端三号',
    category: 'sampler',
    seed: 3003,
    waypoints: [
      [112.43440, 38.01380],
      [112.43560, 38.01380],
      [112.43540, 38.01240],
      [112.43430, 38.01240],
      [112.43430, 38.01130],
      [112.43730, 38.01120],
      [112.43730, 38.01250]
    ]
  }
]

const POINT_INTERVAL_METERS = 4.2
const SAMPLE_INTERVAL_SECONDS = 8

/**
 * 生成一台设备的连续轨迹
 * @returns {Array} 轨迹点数组（含 coordinateSystem 与 collectTime）
 */
function buildTrack (def) {
  const random = mulberry32(def.seed)
  const baseTime = new Date('2026-09-17T10:15:00')
  const points = []
  let elapsed = 0

  for (let i = 1; i < def.waypoints.length; i++) {
    const from = def.waypoints[i - 1]
    const to = def.waypoints[i]
    const segmentMeters = Math.hypot(
      (to[0] - from[0]) * METERS_PER_DEG_LNG * Math.cos((from[1] * Math.PI) / 180),
      (to[1] - from[1]) * METERS_PER_DEG_LAT
    )
    const steps = Math.max(1, Math.round(segmentMeters / POINT_INTERVAL_METERS))
    for (let s = 0; s <= steps; s++) {
      if (i > 1 && s === 0) {
        continue // 段与段之间不重复记录拐点
      }
      const ratio = s / steps
      const lat = from[1] + (to[1] - from[1]) * ratio
      // 加入小幅横向抖动，模拟真实 GNSS 轨迹（确定性，可复现）
      const jitterLng = (random() - 0.5) * metersToLng(1.6, lat)
      const jitterLat = (random() - 0.5) * metersToLat(1.6)
      const collectTime = new Date(baseTime.getTime() + elapsed * 1000)
      points.push({
        deviceId: def.deviceId,
        deviceCode: def.deviceCode,
        longitude: Number((from[0] + (to[0] - from[0]) * ratio + jitterLng).toFixed(7)),
        latitude: Number((lat + jitterLat).toFixed(7)),
        coordinateSystem: MOCK_COORDINATE_SYSTEM,
        collectTime: formatTime(collectTime),
        seq: points.length + 1
      })
      elapsed += SAMPLE_INTERVAL_SECONDS
    }
  }
  return points
}

const TRACKS = {}
DEVICE_DEFS.forEach(def => {
  TRACKS[def.deviceId] = buildTrack(def)
})

/**
 * 3 台设备的当前状态（当前位置取轨迹最后一个点）
 * @returns {Array} DeviceBriefDTO 形态
 */
export function mockDevices (options = {}) {
  const statuses = options.statuses || {}
  return DEVICE_DEFS.map(def => {
    const track = TRACKS[def.deviceId]
    const last = track[track.length - 1]
    const prev = track[track.length - 2] || last
    return {
      deviceId: def.deviceId,
      deviceCode: def.deviceCode,
      deviceName: def.deviceName,
      category: def.category,
      status: statuses[def.deviceId] || 'online',
      longitude: last.longitude,
      latitude: last.latitude,
      coordinateSystem: last.coordinateSystem,
      collectTime: last.collectTime,
      heading: headingBetween(prev, last)
    }
  })
}

/** 设备历史轨迹（返回的是数组副本，避免调用方意外修改 mock 源数据） */
export function mockTrack (deviceId) {
  const track = TRACKS[deviceId]
  if (!track) {
    return []
  }
  return track.map(p => Object.assign({}, p))
}

/** 全部设备轨迹 */
export function mockAllTracks () {
  const result = {}
  Object.keys(TRACKS).forEach(id => {
    result[id] = mockTrack(id)
  })
  return result
}

function headingBetween (from, to) {
  const dx = (to.longitude - from.longitude) * METERS_PER_DEG_LNG * Math.cos((from.latitude * Math.PI) / 180)
  const dy = (to.latitude - from.latitude) * METERS_PER_DEG_LAT
  const deg = (Math.atan2(dx, dy) * 180) / Math.PI
  return Number(((deg + 360) % 360).toFixed(1))
}

export { DEVICE_DEFS }
