/**
 * 遥感分析 / 卫星星历 —— 演示数据（纯前端 mock）
 *
 * ⚠️ 说明（需求 4：「这个界面还待商榷，可以简单做一下」）：
 *   本页做的是**星历与过境的展示**：天空视图（方位角/仰角）、信噪比、过境预报、开普勒轨道根数。
 *   数值由固定种子生成，用于表达界面与数据结构，**不是真实星历**。
 *   真实接入方式：
 *     - 导航星座星历：解析 RINEX/广播星历文件，或用 2号 模拟器输出的 NMEA(GGA/RMC/GSV) 换算方位角仰角；
 *     - 遥感卫星：对接 高分/哨兵 的轨道 TLE，用 SGP4 预报过境（后端的活）。
 *   前端只负责画图与展示，不做轨道计算。
 */

import { mulberry32 } from './geoData'

function hashSeed (text) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** 星座分组 */
export const CONSTELLATIONS = [
  { code: 'BDS', label: '北斗', color: '#e53935', kind: 'navigation', country: '中国' },
  { code: 'GPS', label: 'GPS', color: '#1e88e5', kind: 'navigation', country: '美国' },
  { code: 'GLONASS', label: 'GLONASS', color: '#43a047', kind: 'navigation', country: '俄罗斯' },
  { code: 'GALILEO', label: 'Galileo', color: '#8e24aa', kind: 'navigation', country: '欧盟' },
  { code: 'FY', label: '风云', color: '#fb8c00', kind: 'remote', country: '中国' },
  { code: 'GF', label: '高分', color: '#00897b', kind: 'remote', country: '中国' },
  { code: 'SENTINEL', label: 'Sentinel', color: '#5e35b1', kind: 'remote', country: '欧盟' }
]

/** 各星座的卫星清单（编号为演示值） */
const SATELLITE_DEFS = {
  BDS: ['C01', 'C02', 'C03', 'C04', 'C05', 'C06', 'C07', 'C08', 'C09', 'C10', 'C11', 'C12', 'C13', 'C14'],
  GPS: ['G01', 'G02', 'G03', 'G04', 'G05', 'G06', 'G07', 'G08', 'G09', 'G10'],
  GLONASS: ['R01', 'R02', 'R03', 'R04', 'R05', 'R06', 'R07', 'R08'],
  GALILEO: ['E01', 'E02', 'E03', 'E04', 'E05', 'E06', 'E07', 'E08'],
  FY: ['FY-3D', 'FY-3E', 'FY-4A', 'FY-4B'],
  GF: ['GF-1', 'GF-2', 'GF-3', 'GF-6', 'GF-7'],
  SENTINEL: ['S2A', 'S2B', 'S1A', 'S1B']
}

/**
 * 当前可见卫星（方位角/仰角/信噪比）
 * 方位角 0° = 正北，顺时针；仰角 0° = 地平线，90° = 天顶。
 */
export function mockVisibleSatellites () {
  const list = []
  Object.keys(SATELLITE_DEFS).forEach(code => {
    const constellation = CONSTELLATIONS.filter(c => c.code === code)[0]
    SATELLITE_DEFS[code].forEach(id => {
      const rnd = mulberry32(hashSeed('sat|' + id))
      const azimuth = Math.round(rnd() * 360)
      const elevation = Math.round(rnd() * 88)
      const snr = Math.round(28 + (elevation / 88) * 22 + rnd() * 10)
      const visible = elevation > 5
      list.push({
        id,
        constellation: code,
        constellationLabel: constellation.label,
        color: constellation.color,
        kind: constellation.kind,
        country: constellation.country,
        azimuth,
        elevation,
        snr: visible ? snr : 0,
        visible,
        // 仰角越高通常信号越好；这里给一个可读的质量分级
        quality: elevation > 55 ? 'excellent' : (elevation > 30 ? 'good' : (elevation > 5 ? 'fair' : 'below-horizon')),
        used: visible && elevation > 20 && rnd() > 0.35,
        fix: visible && elevation > 15
      })
    })
  })
  return list.sort((a, b) => b.elevation - a.elevation)
}

/** 当前定位解算质量（顶部卡片） */
export function mockPositionQuality () {
  return {
    fixType: 'RTK 固定解',
    coordinateSystem: 'WGS84',
    longitude: 112.435712,
    latitude: 38.013486,
    altitude: 785.4,
    satellitesUsed: 23,
    satellitesVisible: 37,
    hdop: 0.7,
    vdop: 1.1,
    pdop: 1.3,
    accuracyH: 0.012,
    accuracyV: 0.021,
    updateTime: '2026-09-17 10:30:00'
  }
}

/**
 * 过境预报（遥感卫星）
 */
export function mockPassPredictions () {
  const rnd = mulberry32(hashSeed('pass'))
  const base = new Date('2026-09-17T10:30:00')
  const list = []
  SATELLITE_DEFS.FY.concat(SATELLITE_DEFS.GF, SATELLITE_DEFS.SENTINEL).forEach((id, index) => {
    for (let k = 0; k < 2; k++) {
      const rise = new Date(base.getTime() + (index * 47 + k * 260) * 60000)
      const duration = 4 + rnd() * 8
      const culminate = new Date(rise.getTime() + (duration / 2) * 60000)
      const set = new Date(rise.getTime() + duration * 60000)
      list.push({
        satellite: id,
        riseTime: fmt(rise),
        culminateTime: fmt(culminate),
        setTime: fmt(set),
        maxElevation: Math.round(35 + rnd() * 55),
        durationMin: Number(duration.toFixed(1)),
        direction: ['东北 → 西南', '西北 → 东南', '东南 → 西北', '西南 → 东北'][Math.floor(rnd() * 4)],
        quality: rnd() > 0.6 ? '优' : '良',
        mission: id.startsWith('FY') ? '气象观测' : (id.startsWith('GF') ? '对地成像' : '多光谱成像')
      })
    }
  })
  return list.sort((a, b) => (a.riseTime < b.riseTime ? -1 : 1)).slice(0, 12)
}

function fmt (d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ` +
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

/**
 * 开普勒轨道根数（选一颗卫星看星历详情）
 */
export function mockEphemeris (satelliteId = 'C01') {
  const rnd = mulberry32(hashSeed('eph|' + satelliteId))
  const isNavigation = !/^(FY|GF|S2|S1)/.test(satelliteId)
  return {
    satelliteId,
    epoch: '2026-09-17 10:00:00 UTC+8',
    coordinateSystem: 'WGS84',
    // 导航卫星用广播星历常见量
    semiMajorAxis: Number((isNavigation ? 42164 : 7000 + rnd() * 1000).toFixed(2)),   // km
    eccentricity: Number((isNavigation ? 0.0001 + rnd() * 0.001 : 0.0008 + rnd() * 0.002).toFixed(7)),
    inclination: Number((isNavigation ? 55 + rnd() * 3 : 97 + rnd() * 3).toFixed(4)),  // 度
    raan: Number((rnd() * 360).toFixed(4)),                                            // 升交点赤经 Ω
    argumentOfPerigee: Number((rnd() * 360).toFixed(4)),                               // 近地点角距 ω
    meanAnomaly: Number((rnd() * 360).toFixed(4)),                                     // 平近点角 M
    meanMotion: Number((isNavigation ? 1.0027 : 14.5 + rnd()).toFixed(6)),             // 圈/天
    orbitPeriodMin: Number((isNavigation ? 1436 : 100 + rnd() * 10).toFixed(2)),
    clockBias: Number((rnd() * 1e-4).toFixed(9)),
    clockDrift: Number((rnd() * 1e-12).toFixed(15)),
    groupDelay: Number((rnd() * 1e-9).toFixed(12)),
    health: '正常',
    source: isNavigation ? '广播星历（BRDC）' : 'TLE（两行轨道根数）'
  }
}

/** 信噪比时间序列（信号强度曲线） */
export function mockSnrSeries (satelliteId = 'C01', points = 40) {
  const rnd = mulberry32(hashSeed('snr|' + satelliteId))
  const now = new Date('2026-09-17T10:30:00')
  const rows = []
  for (let i = points - 1; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 30000)
    const trend = Math.sin((points - i) / 7) * 6
    rows.push({
      time: `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}:${String(t.getSeconds()).padStart(2, '0')}`,
      snr: Number((38 + trend + (rnd() - 0.5) * 4).toFixed(1)),
      elevation: Number((42 + Math.sin((points - i) / 9) * 22).toFixed(1))
    })
  }
  return rows
}

/**
 * 遥感影像条目（用于"遥感分析"里的影像列表/任务）
 */
export function mockImageryList () {
  const rnd = mulberry32(hashSeed('imagery'))
  const base = new Date('2026-09-17T06:00:00')
  const sats = ['GF-1', 'GF-6', 'FY-3D', 'S2A', 'S2B']
  const products = ['真彩色合成', 'NDVI 植被指数', 'NDWI 水体指数', '地表温度', '土壤湿度反演']
  const list = []
  for (let i = 0; i < 12; i++) {
    const t = new Date(base.getTime() - i * 3600000 * 3)
    list.push({
      imageId: 'IMG' + String(2026091700 + i),
      satellite: sats[Math.floor(rnd() * sats.length)],
      product: products[Math.floor(rnd() * products.length)],
      regionKey: ['山西/太原市', '河北/石家庄市', '山东/济南市', '河南/郑州市'][Math.floor(rnd() * 4)],
      acquireTime: fmt(t),
      cloudPercent: Math.round(rnd() * 35),
      resolution: rnd() > 0.5 ? '2 m' : '16 m',
      swathKm: Math.round(60 + rnd() * 240),
      status: rnd() > 0.25 ? 'ready' : 'processing',
      sizeText: `${Math.round(120 + rnd() * 800)} MB`
    })
  }
  return list
}

export default {
  CONSTELLATIONS,
  mockVisibleSatellites,
  mockPositionQuality,
  mockPassPredictions,
  mockEphemeris,
  mockSnrSeries,
  mockImageryList
}
