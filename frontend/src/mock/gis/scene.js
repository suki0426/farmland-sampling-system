/**
 * GIS 演示场景 mock（1号 前端GIS 岗位）
 *
 * 约束来源：字段与公共接口约束 V2.1
 *  「接口未完成时使用字段完全一致的 mock JSON；只替换 API Service 的调用实现，不重写页面字段。」
 *
 * 因此这里返回的对象字段与后端 DTO 完全一致：
 *   FarmlandBriefDTO   : farmlandId, farmlandName, farmlandCode, boundaryGeoJson, status
 *   SamplingPointMapDTO: samplingPointId, farmlandId, pointCode, pointName,
 *                        longitude, latitude, coordinateSystem, status
 *   NavigationRouteDTO : taskId, routeGeoJson, distance, durationSeconds, coordinateSystem
 *   MonitorLatestDTO   : samplingPointId, metricCode, metricValue, metricUnit, collectTime
 *   ChartDataDTO       : columns, rows
 *
 * 场景刻意设计成「凹多边形 + 内部禁入区（洞）」，用于验证：
 *   - 布点与 PIP 判定在凹地块上依然正确（对应测试要点 T5）
 *   - 禁入区/不采样区可视化（对应扩展任务 E3）
 */

// 路线距离直接复用前端的球面距离实现，避免 mock 里再写一套距离公式导致口径不一致
import { haversine, polylineLength } from '@/utils/gis/geometry'

export const MOCK_COORDINATE_SYSTEM = 'GCJ02'

export const MOCK_FARMLAND_ID = 'FL20260917001'
export const MOCK_TASK_ID = 'TK20260917001'

const FARMLAND_DEF = {
  farmlandId: MOCK_FARMLAND_ID,
  farmlandName: '中北大学试验田A区',
  farmlandCode: 'ZB-TA-001',
  status: '1',
  coordinateSystem: MOCK_COORDINATE_SYSTEM,
  // 外环：右侧中部有一处凹口（凹多边形）
  outerRing: [
    [112.43400, 38.01060],
    [112.43750, 38.01060],
    [112.43750, 38.01220],
    [112.43580, 38.01220],
    [112.43580, 38.01280],
    [112.43750, 38.01280],
    [112.43750, 38.01400],
    [112.43400, 38.01400],
    [112.43400, 38.01060]
  ],
  // 内环：水塘/禁入区，布点与路线都应避让
  holeRing: [
    [112.43450, 38.01330],
    [112.43510, 38.01330],
    [112.43510, 38.01370],
    [112.43450, 38.01370],
    [112.43450, 38.01330]
  ]
}

/** 农田简要信息（boundaryGeoJson 为字符串，与后端 DTO 一致） */
export function mockFarmlandBrief (overrides = {}) {
  const boundary = {
    type: 'Polygon',
    coordinates: [FARMLAND_DEF.outerRing, FARMLAND_DEF.holeRing]
  }
  return Object.assign({
    farmlandId: FARMLAND_DEF.farmlandId,
    farmlandName: FARMLAND_DEF.farmlandName,
    farmlandCode: FARMLAND_DEF.farmlandCode,
    boundaryGeoJson: JSON.stringify(boundary),
    status: FARMLAND_DEF.status,
    coordinateSystem: FARMLAND_DEF.coordinateSystem
  }, overrides)
}

export function mockFarmlandList () {
  return [mockFarmlandBrief()]
}

/** 手动选点用的 4 个采样点（前 1 个已采样，便于演示状态样式差异） */
export function mockSamplingPoints () {
  const points = [
    { samplingPointId: 'SP0001', pointCode: 'P1', pointName: '1号采样点', longitude: 112.43460, latitude: 38.01120, status: 'sampled' },
    { samplingPointId: 'SP0002', pointCode: 'P2', pointName: '2号采样点', longitude: 112.43660, latitude: 38.01140, status: 'pending' },
    { samplingPointId: 'SP0003', pointCode: 'P3', pointName: '3号采样点', longitude: 112.43670, latitude: 38.01330, status: 'pending' },
    { samplingPointId: 'SP0004', pointCode: 'P4', pointName: '4号采样点', longitude: 112.43480, latitude: 38.01250, status: 'pending' }
  ]
  return points.map(p => Object.assign({
    farmlandId: MOCK_FARMLAND_ID,
    coordinateSystem: MOCK_COORDINATE_SYSTEM
  }, p))
}

/** 算法路线结果（由 3号 生成、5号 下发；前端只展示） */
export function mockNavigationRoute () {
  const all = mockSamplingPoints()

  // 初始路线：按点位编号顺序（朴素顺序）
  const naiveOrder = all.slice()
  // 优化路线：从 1 号点出发的最近邻顺序
  const nnOrder = nearestNeighborOrder(all, all[0])

  const naiveCoordinates = naiveOrder.map(p => [p.longitude, p.latitude])
  const nnCoordinates = nnOrder.map(p => [p.longitude, p.latitude])
  const naiveDistance = polylineLength(naiveCoordinates)
  const nnDistance = polylineLength(nnCoordinates)

  // 取更短的那条作为「优化后」路线，保证 diagnostics 里的对比是真实的而不是编造的
  const nnIsBetter = nnDistance <= naiveDistance
  const optimizedOrder = nnIsBetter ? nnOrder : naiveOrder
  const initialOrder = nnIsBetter ? naiveOrder : nnOrder

  const coordinates = optimizedOrder.map(p => [p.longitude, p.latitude])
  const initialCoordinates = initialOrder.map(p => [p.longitude, p.latitude])

  // 距离全部由坐标真实算出，保证 mock 自身自洽（不能出现「下发距离与几何不符」的假数据）
  const distance = Number(polylineLength(coordinates).toFixed(1))
  const initialDistance = Number(polylineLength(initialCoordinates).toFixed(1))

  return {
    taskId: MOCK_TASK_ID,
    farmlandId: MOCK_FARMLAND_ID,
    method: '2opt',
    coordinateSystem: MOCK_COORDINATE_SYSTEM,
    orderedPoints: optimizedOrder.map(p => ({
      samplingPointId: p.samplingPointId,
      pointCode: p.pointCode,
      longitude: p.longitude,
      latitude: p.latitude,
      coordinateSystem: p.coordinateSystem
    })),
    routeGeoJson: JSON.stringify({ type: 'LineString', coordinates }),
    distance,
    // 采样员步行速度按 1.2 m/s 估算
    durationSeconds: Math.round(distance / 1.2),
    diagnostics: {
      initialDistance,
      optimizedDistance: distance
    }
  }
}

/** 最近邻顺序（仅用于生成 mock 的「优化前」对比基线） */
function nearestNeighborOrder (points, start) {
  const remaining = points.slice()
  const order = []
  let current = start || remaining[0]
  if (current) {
    order.push(current)
    remaining.splice(remaining.indexOf(current), 1)
  }
  while (remaining.length) {
    let bestIndex = 0
    let bestDistance = Infinity
    remaining.forEach((point, index) => {
      const d = haversine(current.longitude, current.latitude, point.longitude, point.latitude)
      if (d < bestDistance) {
        bestDistance = d
        bestIndex = index
      }
    })
    current = remaining[bestIndex]
    order.push(current)
    remaining.splice(bestIndex, 1)
  }
  return order
}

const METRIC_UNITS = {
  soilTemperature: '°C',
  soilMoisture: '%',
  airTemperature: '°C',
  airHumidity: '%',
  soilDepth: 'cm'
}

/**
 * 点位最新监测（每个指标一行，与 monitor_record 的 metric_code/metric_value 结构一致）
 * 同时把 5 项指标平铺一份到 valueMap 上，避免后端若改成平铺 DTO 时前端还要改页面。
 */
export function mockLatestByPoint (samplingPointId) {
  const seed = samplingPointId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  const base = {
    soilTemperature: 21 + (seed % 5),
    soilMoisture: 28 + (seed % 9),
    airTemperature: 24 + (seed % 4),
    airHumidity: 52 + (seed % 12),
    soilDepth: 15
  }
  const collectTime = '2026-09-17 10:30:00'
  return Object.keys(base).map(metricCode => ({
    samplingPointId,
    metricCode,
    metricValue: base[metricCode],
    metricUnit: METRIC_UNITS[metricCode],
    collectTime,
    coordinateSystem: MOCK_COORDINATE_SYSTEM
  }))
}

/**
 * 监测历史 mock（M4「历史数据界面展示」的数据源）
 *
 * 结构严格对齐 §6.2 的 IPage<MonitorRecordDTO>：
 *   { records, total, current, size, pages }
 * 每条记录对应「一个指标的一次采集」（metric_code / metric_value / metric_unit / collect_time），
 * 与 4号 表设计里的 monitor_record 粒度一致，因此后端就绪后前端不需要改列。
 *
 * 同时支持 §6.2 的过滤条件：deviceId / samplingPointId / metricCode(s) / startTime / endTime / 分页。
 */
export function mockHistoryPage (params = {}) {
  const points = mockSamplingPoints()
  const deviceCodes = ['DEV001', 'DEV002', 'DEV003']
  const times = ['10:15:00', '10:20:00', '10:25:00', '10:30:00', '10:35:00', '10:40:00']
  const all = []

  points.forEach((point, pointIndex) => {
    const seedBase = pointIndex * 7 + 3
    times.forEach((time, timeIndex) => {
      const deviceCode = deviceCodes[(pointIndex + timeIndex) % deviceCodes.length]
      Object.keys(METRIC_UNITS).forEach((metricCode, metricIndex) => {
        const wave = Math.sin((timeIndex + metricIndex) / 2)
        const base = {
          soilTemperature: 22,
          soilMoisture: 30,
          airTemperature: 25,
          airHumidity: 55,
          soilDepth: 15
        }[metricCode]
        const step = metricCode === 'soilDepth' ? 0 : 1
        all.push({
          id: `MR${pointIndex}${timeIndex}${metricIndex}`,
          deviceId: `DV2026091700${(pointIndex + timeIndex) % 3 + 1}`,
          deviceCode,
          samplingPointId: point.samplingPointId,
          pointCode: point.pointCode,
          taskId: MOCK_TASK_ID,
          farmlandId: MOCK_FARMLAND_ID,
          metricCode,
          metricValue: Number((base + wave * 2 * step + seedBase * 0.1).toFixed(1)),
          metricUnit: METRIC_UNITS[metricCode],
          collectTime: `2026-09-17 ${time}`,
          longitude: point.longitude,
          latitude: point.latitude,
          coordinateSystem: MOCK_COORDINATE_SYSTEM,
          status: 'normal'
        })
      })
    })
  })

  let filtered = all
  if (params.samplingPointId) {
    filtered = filtered.filter(r => r.samplingPointId === params.samplingPointId)
  }
  if (params.deviceId) {
    filtered = filtered.filter(r => r.deviceId === params.deviceId)
  }
  if (params.metricCode) {
    filtered = filtered.filter(r => r.metricCode === params.metricCode)
  }
  if (params.startTime) {
    filtered = filtered.filter(r => r.collectTime >= params.startTime)
  }
  if (params.endTime) {
    filtered = filtered.filter(r => r.collectTime <= params.endTime)
  }

  filtered.sort((a, b) => (a.collectTime < b.collectTime ? 1 : -1))

  const current = Number(params.current) > 0 ? Number(params.current) : 1
  const size = Number(params.size) > 0 ? Number(params.size) : 20
  const start = (current - 1) * size
  return {
    records: filtered.slice(start, start + size),
    total: filtered.length,
    current,
    size,
    pages: Math.max(1, Math.ceil(filtered.length / size))
  }
}

/** ECharts 统计数据（columns 首列为维度，rows 的 key 与 columns 完全一致） */export function mockChartData () {
  const columns = ['collectTime', 'soilMoisture', 'soilTemperature', 'airTemperature', 'airHumidity']
  const rows = []
  for (let i = 0; i < 12; i++) {
    const hour = 8 + i
    rows.push({
      collectTime: `${String(hour).padStart(2, '0')}:00`,
      soilMoisture: Number((30 + Math.sin(i / 2) * 4 + i * 0.3).toFixed(1)),
      soilTemperature: Number((21 + Math.cos(i / 3) * 1.6 + i * 0.25).toFixed(1)),
      airTemperature: Number((23 + Math.cos(i / 2.5) * 2.2 + i * 0.4).toFixed(1)),
      airHumidity: Number((55 - Math.cos(i / 2) * 6).toFixed(1))
    })
  }
  return { columns, rows }
}

export { FARMLAND_DEF, METRIC_UNITS }
