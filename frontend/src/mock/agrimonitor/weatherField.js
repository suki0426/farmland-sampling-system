/**
 * 天气 / 环境 / 业务 图层的数据场（前端生成，用于大屏栅格热力图）
 *
 * ── 为什么用"场"而不是按行政区填色 ────────────────────────────────────
 *   天气 App（以及空气质量地图）的观感来自**连续的栅格色彩**，而不是行政边界填色。
 *   所以本模块把每个指标建模成一个**连续标量场**：
 *       值(经度, 纬度, 时间) = 基础地理梯度 + 若干高斯"影响中心"
 *   影响中心会**随时间帧缓慢移动**，于是播放时间轴时就能看到降水/污染团在飘 ——
 *   这就是需求里的「降水地图实时变化图」。
 *
 * ── 与任务书的关系 ──────────────────────────────────────────────────
 *   除了环境类图层，还提供**业务图层**（采样点密度 / 终端在线率 / 预警密度），
 *   这些直接对应任务书的 M1（采样点选取）、M3（设备到达）、M4（数据回传与预警）。
 *
 * ⚠️ 全部为前端演示数据，固定种子确定性生成，可复现；不连数据库、不调接口。
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

/** 时间帧设置：过去 9 小时 ~ 未来 15 小时，每小时一帧，共 25 帧 */
export const FRAME_COUNT = 25
export const FRAME_START_HOUR = -9
export const FRAME_STEP_HOURS = 1
const BASE_TIME = new Date('2026-09-17T15:00:00')

/** 第 i 帧对应的时间 */
export function frameTime (index) {
  const h = FRAME_START_HOUR + index * FRAME_STEP_HOURS
  const d = new Date(BASE_TIME.getTime() + h * 3600000)
  const pad = n => String(n).padStart(2, '0')
  return {
    hour: h,
    label: `${pad(d.getHours())}:00`,
    full: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:00`,
    dayOffset: Math.floor(h / 24),
    date: `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }
}

/**
 * 图层定义。
 *
 * colors 采用行业惯用配色：
 *   - 降水 / 气温 / 风速：气象部门常见色阶（蓝→绿→黄→橙→红→紫）
 *   - 空气质量 AQI：中国《环境空气质量指数技术规定》六级配色（绿黄橙红紫褐红）
 */
export const WEATHER_LAYERS = [
  {
    key: 'precip',
    group: 'weather',
    label: '降水',
    unit: 'mm/h',
    icon: 'el-icon-heavy-rain',
    desc: '逐小时降水强度，色阶越暖表示雨越大',
    min: 0,
    max: 40,
    decimals: 1,
    colors: ['#e8f5e9', '#a5d6a7', '#66bb6a', '#26c6da', '#29b6f6', '#ffee58', '#ffa726', '#ef5350', '#ab47bc']
  },
  {
    key: 'temp',
    group: 'weather',
    label: '气温',
    unit: '°C',
    icon: 'el-icon-sunny',
    desc: '近地面气温，蓝冷红热',
    // 色阶按实际分布取 -5~40：取 -10~38 会让一半以上格点挤在色阶下半段
    min: -5,
    max: 40,
    decimals: 1,
    colors: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
  },
  {
    key: 'aqi',
    group: 'weather',
    label: '空气质量',
    unit: 'AQI',
    icon: 'el-icon-cloudy',
    desc: '空气质量指数，六级配色：优 / 良 / 轻度 / 中度 / 重度 / 严重',
    min: 0,
    max: 300,
    decimals: 0,
    colors: ['#00e400', '#ffff00', '#ff7e00', '#ff0000', '#99004c', '#7e0023']
  },
  {
    key: 'pm25',
    group: 'weather',
    label: 'PM2.5',
    unit: 'µg/m³',
    icon: 'el-icon-wind-power',
    desc: '细颗粒物浓度，供暖季与工业区偏高',
    min: 0,
    max: 200,
    decimals: 0,
    colors: ['#00e400', '#a8e05f', '#ffff00', '#ff7e00', '#ff0000', '#99004c', '#7e0023']
  },
  {
    key: 'cloud',
    group: 'weather',
    label: '云量',
    unit: '%',
    icon: 'el-icon-cloudy',
    desc: '卫星反演总云量，影响光照与蒸散',
    min: 0,
    max: 100,
    decimals: 0,
    colors: ['#0b3d91', '#1976d2', '#4fc3f7', '#e0e0e0', '#ffffff']
  },
  {
    key: 'wind',
    group: 'weather',
    label: '风速',
    unit: 'm/s',
    icon: 'el-icon-wind-power',
    desc: '10m 风速，沿海与高海拔地区偏大',
    min: 0,
    max: 20,
    decimals: 1,
    colors: ['#e0f7fa', '#b2ebf2', '#80deea', '#4dd0e1', '#26c6da', '#00acc1', '#00838f']
  },
  {
    key: 'soilMoisture',
    group: 'weather',
    label: '土壤湿度',
    unit: '%',
    icon: 'el-icon-odometer',
    desc: '表层 10cm 体积含水率，直接决定采样与灌溉窗口',
    min: 5,
    max: 60,
    decimals: 1,
    colors: ['#8d6e63', '#d7ccc8', '#b2dfdb', '#26a69a', '#00695c']
  },
  {
    key: 'sampleDensity',
    group: 'business',
    label: '采样点密度',
    unit: '个/万公顷',
    icon: 'el-icon-place',
    desc: '任务书 M1：单位面积采样点数量，反映布点密度是否合理',
    min: 0,
    max: 60,
    decimals: 1,
    colors: ['#eceff1', '#b0bec5', '#90caf9', '#42a5f5', '#1565c0', '#0d47a1']
  },
  {
    key: 'deviceOnline',
    group: 'business',
    label: '终端在线率',
    unit: '%',
    icon: 'el-icon-truck',
    desc: '任务书 M3：采样终端在线比例，低值区域需要现场排查',
    // 色阶下限取 70 而不是 40：实际在线率的分布是 77%~100%，
    // 下限取 40 会让整张图挤在色阶顶端、看不出差异。
    min: 70,
    max: 100,
    decimals: 1,
    colors: ['#ffcdd2', '#ef9a9a', '#fff59d', '#aed581', '#66bb6a', '#2e7d32']
  },
  {
    key: 'warningDensity',
    group: 'business',
    label: '预警密度',
    unit: '条/万公顷',
    icon: 'el-icon-warning-outline',
    desc: '任务书 M4：未关闭预警的分布密度，色阶越暖越需要关注',
    min: 0,
    max: 20,
    decimals: 1,
    colors: ['#e8f5e9', '#fff59d', '#ffb74d', '#e64a19', '#b71c1c']
  }
]

export const LAYER_GROUPS = [
  { key: 'weather', label: '环境图层', hint: '降水 / 气温 / 空气质量 / 云量 / 风速' },
  { key: 'business', label: '业务图层', hint: '采样点密度 / 终端在线率 / 预警密度' }
]

/**
 * 每个图层对应的「农事结论」——把图上的颜色翻译成一线人员能直接执行的动作。
 * 大屏左侧的图层说明卡与地图悬浮卡都引用这里，避免两处口径不一致。
 */
export const HOOK_TEXT = {
  precip: '降水 > 25mm/h：暂停采样，注意田间排水',
  temp: '气温 > 33°C：避开正午采样，防止样本变质',
  aqi: 'AQI > 150：建议缩短户外采样时长并佩戴防护',
  pm25: 'PM2.5 > 115µg/m³：轻度以上污染，注意防护',
  cloud: '云量 > 80%：光学遥感成像质量差，改用雷达或人工',
  wind: '风速 > 10m/s：无人机采样窗口关闭，改地面终端',
  soilMoisture: '土壤湿度 20%~35%：最佳采样窗口',
  sampleDensity: '密度 < 20 个/万公顷：建议按网格加密布点',
  deviceOnline: '在线率 < 85%：需现场排查离线终端',
  warningDensity: '预警密度偏高：优先复核该区域回传数据'
}

/** 采样/农事阈值（用于界面提示，数值口径与任务书的 5 项指标一致） */
export const AGRI_THRESHOLDS = {
  soilTemperature: { min: 5, max: 30, unit: '°C', label: '土壤温度' },
  soilMoisture: { min: 20, max: 35, unit: '%', label: '土壤湿度' },
  airTemperature: { min: 5, max: 35, unit: '°C', label: '空气温度' },
  airHumidity: { min: 30, max: 80, unit: '%', label: '空气湿度' },
  soilDepth: { min: 5, max: 30, unit: 'cm', label: '土壤深度' }
}

export function layerByKey (key) {
  return WEATHER_LAYERS.filter(l => l.key === key)[0] || WEATHER_LAYERS[0]
}

/* ─────────────────────── 场函数：基础梯度 + 会漂移的高斯中心 ─────────────────────── */

/** 每个图层的高斯"影响中心"（确定性生成，随帧相位漂移） */
const blobCache = {}
function blobsOf (layerKey) {
  if (blobCache[layerKey]) {
    return blobCache[layerKey]
  }
  const rnd = mulberry32(hashSeed('blob|' + layerKey))
  const count = 6 + Math.floor(rnd() * 4)
  const list = []
  for (let i = 0; i < count; i++) {
    list.push({
      lng: 78 + rnd() * 52,            // 78~130
      lat: 20 + rnd() * 28,            // 20~48
      radius: 2.2 + rnd() * 4.5,       // 度
      amplitude: 0.35 + rnd() * 0.85,  // 相对强度
      driftLng: (rnd() - 0.5) * 3.2,   // 一整个时间轴上的位移
      driftLat: (rnd() - 0.5) * 2.2,
      phase: rnd() * Math.PI * 2
    })
  }
  blobCache[layerKey] = list
  return list
}

/**
 * 每个图层的「高斯中心强度系数」。
 *
 * 存在的意义：`field01` 是通用场函数，若所有图层都用同一套高斯中心，
 * 半径 2~7° 的 6~9 个高值区会把全国**铺满并顶到上限**，结果是
 *   ① 图例上出现"全国均值 19mm/h 降水""全国 AQI 均值 156"这类明显不合理的数字；
 *   ② 大片区域被钳在色阶顶端，图上反而看不出差异（在线率那一层会整片全绿）。
 * 所以按图层的物理量纲逐层收口，让"全帧均值"落在现实区间里。
 *
 * 校验方式：用 `frontend/public/geo/cn-grid-mask.json` 的 7871 个格点 × 25 帧
 * 复算每个图层的均值与实际区间（见 docs/MONITOR_TASKBOOK.md 的数值口径表）。
 */
const BLOB_SCALE = {
  precip: 0.30,
  temp: 0.35,
  aqi: 0.40,
  pm25: 0.25,
  cloud: 0.60,
  wind: 0.40,
  soilMoisture: 0.35,
  sampleDensity: 0.70,
  deviceOnline: 0.06,
  warningDensity: 0.55
}

/** 地理基础梯度：让场的分布看起来"有地理规律"而不是纯噪声 */
function baseGradient (layerKey, lng, lat) {
  const east = (lng - 100) / 32      // 西 0 → 东 1
  const south = (54 - lat) / 34      // 北 0 → 南 1
  const coastal = Math.max(0, 1 - Math.abs(lng - 120) / 16) * Math.max(0, 1 - Math.abs(lat - 30) / 12)

  switch (layerKey) {
    // 降水的"背景雨量"要低：全国均值落在几 mm/h 才符合实际，
    // 强降水全部由会漂移的高斯中心制造，这样图上才有"雨团"而不是整片下雨。
    case 'precip': return 0.03 + south * 0.13 + coastal * 0.11
    case 'temp': return 0.16 + south * 0.52 - Math.max(0, (lat - 40) / 14) * 0.30
    // AQI / PM2.5 的背景值压低，否则全国都是"轻度污染"以上
    case 'aqi': return 0.05 + east * 0.22 + Math.max(0, (lat - 32) / 16) * 0.26
    case 'pm25': return 0.05 + east * 0.20 + Math.max(0, (lat - 33) / 15) * 0.26
    case 'cloud': return 0.16 + south * 0.46 + coastal * 0.24
    // 风速背景压到 2~5 m/s（内陆常态），大风区由高斯中心制造
    case 'wind': return 0.12 + coastal * 0.24 + Math.max(0, (lng - 118) / 18) * 0.16
    case 'soilMoisture': return 0.14 + south * 0.60 + coastal * 0.18
    case 'sampleDensity': return 0.18 + east * 0.52 + Math.max(0, (lat - 30) / 18) * 0.20
    case 'deviceOnline': return 0.48 + (1 - east) * 0.24 + south * 0.14
    case 'warningDensity': return 0.12 + east * 0.44 + south * 0.18
    default: return 0.4
  }
}

/** 帧序号 → 0~1 时间相位 */
export function framePhase (frameIndex) {
  return FRAME_COUNT > 1 ? frameIndex / (FRAME_COUNT - 1) : 0
}

/**
 * 预编译某一帧的场函数。
 *
 * 为什么需要：画栅格图要对**近 10 万个像素**逐点求值，而 `field01` 每次调用都会
 * 重算 6~9 个高斯中心的 `sin/cos`（中心位置与强度只跟**帧**有关，与像素无关）。
 * 把这些与像素无关的量提前算好，单帧耗时可降数倍。
 * `field01` 本身也走这条路径，保证两种调用方式**数值一致**。
 *
 * @param {string} layerKey
 * @param {number} phase 0~1
 * @returns {{layerKey:string, blobs:Array<{cx:number,cy:number,k:number,s:number}>}}
 */
export function prepareField (layerKey, phase) {
  const blobs = blobsOf(layerKey)
  const scale = BLOB_SCALE[layerKey] === undefined ? 1 : BLOB_SCALE[layerKey]
  const prepared = new Array(blobs.length)
  for (let i = 0; i < blobs.length; i++) {
    const b = blobs[i]
    // ── 中心位置：**单调平移**，不是正弦来回摆 ──
    // 最初写成 `sin(phase·2π)`，结果相位 0 与相位 1 取值完全相同，
    // 于是时间轴的最后一帧与第一帧**逐像素一模一样**（等于荡出去再荡回来）。
    // 天气系统是持续移动的，所以这里用线性平移：
    // phase 0 → 起点，phase 1 → 终点，整条时间轴有真实推进。
    const travel = (phase - 0.5) * 2
    prepared[i] = {
      cx: b.lng + b.driftLng * travel,
      cy: b.lat + b.driftLat * travel,
      k: 1 / (2 * b.radius * b.radius),
      // 强度仍随时间起伏（增强/减弱），这一项周期化不影响画面推进
      s: scale * b.amplitude * (0.62 + 0.38 * Math.sin(phase * Math.PI * 2 + b.phase * 1.3))
    }
  }
  return { layerKey, blobs: prepared }
}

/** 用预编译结果求某点的归一化场值（0~1） */
export function evalPrepared (prepared, lng, lat) {
  let v = baseGradient(prepared.layerKey, lng, lat)
  const blobs = prepared.blobs
  for (let i = 0; i < blobs.length; i++) {
    const b = blobs[i]
    const dx = lng - b.cx
    const dy = lat - b.cy
    v += b.s * Math.exp(-(dx * dx + dy * dy) * b.k)
  }
  return v < 0 ? 0 : (v > 1 ? 1 : v)
}

/**
 * 计算某点在某帧的归一化场值（0~1）
 * @param {string} layerKey
 * @param {number} lng
 * @param {number} lat
 * @param {number} phase 0~1 的时间相位（frameIndex / (FRAME_COUNT - 1)）
 * @param {number} jitter 0~1 的随机扰动幅度（生成"站点实测值"时用）
 * @param {number} seed 噪声种子
 */
export function field01 (layerKey, lng, lat, phase, jitter = 0, seed = 0) {
  let v = evalPrepared(prepareField(layerKey, phase), lng, lat)
  if (jitter > 0) {
    const rnd = mulberry32(hashSeed(`${layerKey}|${seed}|${Math.round(lng * 100)}|${Math.round(lat * 100)}`))
    v += (rnd() - 0.5) * jitter
  }
  return v < 0 ? 0 : (v > 1 ? 1 : v)
}

/** 归一化值 → 该图层的物理量值 */
export function toRealValue (layerKey, v01) {
  const layer = layerByKey(layerKey)
  const raw = layer.min + v01 * (layer.max - layer.min)
  const f = Math.pow(10, layer.decimals)
  return Math.round(raw * f) / f
}

/**
 * 生成某一帧的栅格热力数据
 * @param {Array<[number,number]>} gridPoints 境内格点
 * @param {string} layerKey
 * @param {number} frameIndex
 * @returns {Array<[number,number,number]>} [[lng, lat, value], ...]
 */
export function buildFrameData (gridPoints, layerKey, frameIndex) {
  const phase = FRAME_COUNT > 1 ? frameIndex / (FRAME_COUNT - 1) : 0
  const out = new Array(gridPoints.length)
  for (let i = 0; i < gridPoints.length; i++) {
    const p = gridPoints[i]
    out[i] = [p[0], p[1], toRealValue(layerKey, field01(layerKey, p[0], p[1], phase))]
  }
  return out
}

/**
 * 站点（城市 / 区县）在某帧的观测值
 * @param {Array} stations [{name, adcode, c:[lng,lat]}]
 */
export function buildStationData (stations, layerKey, frameIndex, jitter = 0.10) {
  const phase = FRAME_COUNT > 1 ? frameIndex / (FRAME_COUNT - 1) : 0
  const layer = layerByKey(layerKey)
  const out = new Array(stations.length)
  for (let i = 0; i < stations.length; i++) {
    const s = stations[i]
    const lng = s.c[0]
    const lat = s.c[1]
    const v = field01(layerKey, lng, lat, phase, jitter, s.adcode || s.name)
    out[i] = {
      name: s.name,
      adcode: s.adcode,
      value: toRealValue(layerKey, v),
      raw01: v,
      lng,
      lat,
      // AQI 分级（用于站点配色/标签）
      level: layerKey === 'aqi' ? aqiLevel(toRealValue(layerKey, v)) : null
    }
  }
  return out
}

/** AQI 六级分级（中国标准） */
export function aqiLevel (aqi) {
  if (aqi <= 50) return { code: 1, label: '优', color: '#00e400' }
  if (aqi <= 100) return { code: 2, label: '良', color: '#ffff00' }
  if (aqi <= 150) return { code: 3, label: '轻度污染', color: '#ff7e00' }
  if (aqi <= 200) return { code: 4, label: '中度污染', color: '#ff0000' }
  if (aqi <= 300) return { code: 5, label: '重度污染', color: '#99004c' }
  return { code: 6, label: '严重污染', color: '#7e0023' }
}

/** 某一帧的全国汇总（用于顶部指标卡） */
export function frameSummary (layerKey, gridPoints, frameIndex) {
  const layer = layerByKey(layerKey)
  const prep = prepareField(layerKey, framePhase(frameIndex))
  let sum = 0
  let max = -Infinity
  let maxPoint = null
  // 抽样统计即可，避免每帧扫全部格点
  const stride = Math.max(1, Math.floor(gridPoints.length / 1200))
  let n = 0
  for (let i = 0; i < gridPoints.length; i += stride) {
    const p = gridPoints[i]
    const v = evalPrepared(prep, p[0], p[1])
    sum += v
    n++
    if (v > max) {
      max = v
      maxPoint = p
    }
  }
  const avg01 = n ? sum / n : 0
  return {
    unit: layer.unit,
    avg: toRealValue(layerKey, avg01),
    max: toRealValue(layerKey, max),
    maxPoint,
    min: layer.min,
    maxRange: layer.max
  }
}

/* ═══════════════════ 栅格图（天气 App 的"底色"） ═══════════════════ */

/**
 * 栅格分辨率（度/像素）。
 *
 * 为什么不用 ECharts 的 `heatmap` 系列：`heatmap` 是把每个数据点画成一个
 * **带模糊半径的圆**再叠加混色。原始实现 `pointSize:11 / blurSize:18`
 * 打在 0.35° 网格上（约 5px 间距）时，一个像素会被大约 36 个点覆盖，
 * 于是颜色被平均掉 —— **整张图看起来是一个颜色**，这正是用户反馈的问题。
 *
 * 正确做法是直接生成一张**逐像素着色**的位图贴在 geo 上：
 * 颜色 = 该像素经纬度处的场值经色阶映射，边界由掩膜裁剪。
 * 0.16° ≈ 9.3 万像素，单帧约 40~70ms，可接受。
 */
export const RASTER_STEP = 0.16

/** 按步长算出栅格尺寸 */
export function rasterSize (bounds, step = RASTER_STEP) {
  return {
    width: Math.max(1, Math.round((bounds.lngMax - bounds.lngMin) / step)),
    height: Math.max(1, Math.round((bounds.latMax - bounds.latMin) / step))
  }
}

/** '#rrggbb' → [r,g,b] */
function hexToRgb (hex) {
  const h = String(hex).replace('#', '')
  const full = h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h
  const v = parseInt(full, 16)
  return [(v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF]
}

/** 图层的离散色阶 → 连续渐变色标 */
export function gradientStops (colors) {
  return colors.map(hexToRgb)
}

/**
 * 在渐变色标上取色（线性 RGB 插值）。
 * ECharts 的 visualMap 是分段取色，这里插值后过渡更接近真实雷达图的观感。
 */
export function sampleGradient (stops, t) {
  const n = stops.length
  if (n === 1) {
    return stops[0]
  }
  const u = t <= 0 ? 0 : (t >= 1 ? 1 : t)
  const pos = u * (n - 1)
  const i = Math.min(n - 2, Math.floor(pos))
  const f = pos - i
  const a = stops[i]
  const b = stops[i + 1]
  return [
    a[0] + (b[0] - a[0]) * f,
    a[1] + (b[1] - a[1]) * f,
    a[2] + (b[2] - a[2]) * f
  ]
}

/**
 * 生成一帧的栅格 RGBA 像素
 *
 * 本函数**不碰 DOM**（返回 Uint8ClampedArray，由调用方自己塞进 canvas），
 * 所以可以在 Node 里直接单测 —— 这一点很重要：栅格是不是真有色彩层次，
 * 必须能客观验证，而不是靠肉眼看截图。
 *
 * @param {string} layerKey
 * @param {number} frameIndex
 * @param {{mask:Uint8Array,width:number,height:number,bounds:object}} maskInfo
 * @param {Uint8ClampedArray} [reuse] 复用的缓冲区，避免每帧重新分配 37 万字节
 * @returns {{rgba:Uint8ClampedArray,width:number,height:number,bounds:object,opaque:number}}
 */
export function buildRasterRGBA (layerKey, frameIndex, maskInfo, reuse) {
  const mask = maskInfo.mask
  const width = maskInfo.width
  const height = maskInfo.height
  const bounds = maskInfo.bounds
  const stops = gradientStops(layerByKey(layerKey).colors)
  const prep = prepareField(layerKey, framePhase(frameIndex))

  const need = width * height * 4
  const rgba = (reuse && reuse.length === need) ? reuse : new Uint8ClampedArray(need)
  rgba.fill(0)

  const stepX = (bounds.lngMax - bounds.lngMin) / width
  const stepY = (bounds.latMax - bounds.latMin) / height
  let opaque = 0

  for (let y = 0; y < height; y++) {
    // 第 0 行在北边，和图片像素行序一致，贴到地图上不用翻转
    const lat = bounds.latMax - (y + 0.5) * stepY
    const rowOff = y * width
    for (let x = 0; x < width; x++) {
      const i = rowOff + x
      if (!mask[i]) {
        continue
      }
      const lng = bounds.lngMin + (x + 0.5) * stepX
      const c = sampleGradient(stops, evalPrepared(prep, lng, lat))
      const o = i << 2
      rgba[o] = c[0]
      rgba[o + 1] = c[1]
      rgba[o + 2] = c[2]
      rgba[o + 3] = 255
      opaque++
    }
  }
  return { rgba, width, height, bounds, opaque }
}

/**
 * 色彩层次自检：统计一帧栅格的色彩分布。
 * 用来客观回答"颜色是不是都一样"—— 如果 `distinct` 只有个位数、
 * `stdev` 接近 0，就说明图确实是糊的。
 */
export function rasterStats (raster) {
  const { rgba, width, height } = raster
  const seen = new Set()
  let n = 0
  let sumL = 0
  let sumL2 = 0
  let minL = 255
  let maxL = 0
  for (let i = 0; i < width * height; i++) {
    const o = i << 2
    if (rgba[o + 3] === 0) {
      continue
    }
    const key = (rgba[o] << 16) | (rgba[o + 1] << 8) | rgba[o + 2]
    seen.add(key)
    // 用 Rec.601 亮度来衡量"色彩是否有层次"
    const l = 0.299 * rgba[o] + 0.587 * rgba[o + 1] + 0.114 * rgba[o + 2]
    sumL += l
    sumL2 += l * l
    if (l < minL) minL = l
    if (l > maxL) maxL = l
    n++
  }
  const mean = n ? sumL / n : 0
  const variance = n ? Math.max(0, sumL2 / n - mean * mean) : 0
  return {
    pixels: n,
    distinctColors: seen.size,
    meanLuma: Math.round(mean * 10) / 10,
    stdevLuma: Math.round(Math.sqrt(variance) * 10) / 10,
    minLuma: Math.round(minL * 10) / 10,
    maxLuma: Math.round(maxL * 10) / 10
  }
}

export default {
  FRAME_COUNT,
  FRAME_START_HOUR,
  FRAME_STEP_HOURS,
  RASTER_STEP,
  WEATHER_LAYERS,
  LAYER_GROUPS,
  HOOK_TEXT,
  AGRI_THRESHOLDS,
  frameTime,
  framePhase,
  layerByKey,
  field01,
  prepareField,
  evalPrepared,
  toRealValue,
  buildFrameData,
  buildStationData,
  frameSummary,
  aqiLevel,
  rasterSize,
  gradientStops,
  sampleGradient,
  buildRasterRGBA,
  rasterStats
}
