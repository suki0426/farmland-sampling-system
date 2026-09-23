/**
 * 路线算法适配层（农业监测模块用）
 *
 * ── 设计原则（和 1号 在 GIS 模块的做法一致）────────────────────────────
 *   前端**不实现**任何路径优化算法。算法是 3号 的交付物（Python 模块），
 *   由 5号 通过 adapter 调用并做成 REST 接口。前端只负责：传参 → 拿结果 → 画出来。
 *
 * ── 3号 的稳定函数签名（任务书 V2.1 §5.1 冻结）──────────────────────
 *   generate_sampling_points(boundary_geojson, count=None, spacing=None) -> list[Point]
 *   plan_route(points, start_point=None, method="2opt") -> RouteResult
 *
 *   Point       = { longitude, latitude, coordinateSystem }
 *   RouteResult = { orderedPoints, routeGeoJson, distance, method, diagnostics }
 *
 * ── 5号 需要暴露的 REST（建议，尚未冻结）──────────────────────────────
 *   POST /navigation/route/plan      { boundaryGeoJson, points, startPoint, method } -> RouteResult
 *   POST /navigation/route/generate  { boundaryGeoJson, count, spacing }             -> List<Point>
 *
 * ⚠️ 以上接口**尚未冻结**，所以本适配层当前一律返回 mock 数据，并在结果上标记
 *   `source: 'mock'`，页面据此给出明确提示。不向未约定端点发请求、不伪造成"算法已接入"。
 *
 * ── 接入方式（等 5号 冻结接口后）──────────────────────────────────────
 *   把下面两个函数体换成对 REST 的调用即可，页面与数据结构完全不用改。
 */

import { mockProvinceStats, mulberry32 } from '@/mock/agrimonitor'

/** 支持的算法（与 3号 的 method 约定对应） */
export const ROUTE_METHODS = [
  { code: 'nearest', label: '最近邻（贪心）', desc: '实现简单、可解释，作为初始路线' },
  { code: '2opt', label: '2-opt 优化', desc: '在最近邻基础上做边交换，距离更短' },
  { code: 'snake', label: '蛇形（S 形）', desc: '按行扫过地块，可解释性最好' },
  { code: 'annealing', label: '模拟退火', desc: '跳出局部最优，耗时更长' },
  { code: 'genetic', label: '遗传算法', desc: '适合点数多的场景，参数敏感' }
]

/** 布点策略（与 3号 的自动布点对应） */
export const POINT_STRATEGIES = [
  { code: 'grid', label: '规则网格布点' },
  { code: 'random', label: '随机布点（种子可复现）' },
  { code: 'serpentine', label: '蛇形布点' }
]

function hashSeed (text) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * 自动布点
 * @param {object} params { regionKey, count, strategy }
 * @returns {Promise<{points:Array, source:string}>}
 */
export function generateSamplingPoints (params = {}) {
  const { regionKey = '', count = 8, strategy = 'grid' } = params
  const rnd = mulberry32(hashSeed('point|' + regionKey + '|' + strategy + '|' + count))
  // 以一个省的中心为基准，生成 count 个点（演示坐标；真实接入时应由后端按农田边界生成）
  const center = mockProvinceStats().filter(p => regionKey.indexOf(p.name) === 0)[0] ||
    mockProvinceStats()[0]
  const points = []
  for (let i = 0; i < count; i++) {
    let dx
    let dy
    if (strategy === 'grid') {
      // 规则网格：按开方排布
      const cols = Math.ceil(Math.sqrt(count))
      dx = ((i % cols) / Math.max(cols - 1, 1) - 0.5) * 0.16
      dy = (Math.floor(i / cols) / Math.max(Math.ceil(count / cols) - 1, 1) - 0.5) * 0.16
    } else if (strategy === 'serpentine') {
      const cols = Math.ceil(Math.sqrt(count))
      const row = Math.floor(i / cols)
      const col = row % 2 === 0 ? i % cols : cols - 1 - (i % cols)
      dx = ((col / Math.max(cols - 1, 1)) - 0.5) * 0.16
      dy = ((row / Math.max(Math.ceil(count / cols) - 1, 1)) - 0.5) * 0.16
    } else {
      dx = (rnd() - 0.5) * 0.16
      dy = (rnd() - 0.5) * 0.16
    }
    points.push({
      samplingPointId: 'P' + String(i + 1).padStart(2, '0'),
      pointCode: 'P' + (i + 1),
      longitude: Number((center.lng + dx).toFixed(6)),
      latitude: Number((center.lat + dy).toFixed(6)),
      coordinateSystem: 'GCJ02',
      status: 'pending'
    })
  }
  return Promise.resolve({ points, source: 'mock' })
}

/** 球面距离（米）—— 仅用于 mock 结果的自洽计算与"距离"字段兜底展示 */
function haversine (lng1, lat1, lng2, lat2) {
  const R = 6371008.8
  const rad = Math.PI / 180
  const dLat = (lat2 - lat1) * rad
  const dLng = (lng2 - lng1) * rad
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)))
}

function pathLength (points) {
  let total = 0
  for (let i = 1; i < points.length; i++) {
    total += haversine(points[i - 1].longitude, points[i - 1].latitude, points[i].longitude, points[i].latitude)
  }
  return total
}

/** 贪心顺序（只用于生成 mock 的"初始/优化后"对照，不代表前端实现了算法） */
function greedyOrder (points, startIndex) {
  const remaining = points.slice()
  const order = []
  let current = remaining.splice(startIndex || 0, 1)[0]
  if (current) {
    order.push(current)
  }
  while (remaining.length) {
    let bestIndex = 0
    let best = Infinity
    remaining.forEach((p, i) => {
      const d = haversine(current.longitude, current.latitude, p.longitude, p.latitude)
      if (d < best) { best = d; bestIndex = i }
    })
    current = remaining.splice(bestIndex, 1)[0]
    order.push(current)
  }
  return order
}

/**
 * 规划路线
 * @param {object} params { points, method, startPoint }
 * @returns {Promise<{orderedPoints, routeGeoJson, distance, method, diagnostics, source}>}
 */
export function planRoute (params = {}) {
  const { points = [], method = '2opt' } = params
  if (!Array.isArray(points) || points.length < 2) {
    return Promise.reject(new Error('路线规划至少需要 2 个采样点'))
  }
  // mock：用「原始顺序」与「贪心顺序」中较短的一条作为"优化后"，保证 diagnostics 自洽
  const naive = points.slice()
  const greedy = greedyOrder(points, 0)
  const naiveLen = pathLength(naive)
  const greedyLen = pathLength(greedy)
  const optimized = greedyLen <= naiveLen ? greedy : naive
  const initial = greedyLen <= naiveLen ? naive : greedy

  const distance = Number(pathLength(optimized).toFixed(1))
  const initialDistance = Number(pathLength(initial).toFixed(1))

  return Promise.resolve({
    orderedPoints: optimized,
    routeGeoJson: JSON.stringify({
      type: 'LineString',
      coordinates: optimized.map(p => [p.longitude, p.latitude])
    }),
    distance,
    durationSeconds: Math.round(distance / 1.2),
    method,
    coordinateSystem: 'GCJ02',
    diagnostics: {
      initialDistance,
      optimizedDistance: distance,
      improvementPercent: initialDistance > 0
        ? Number((((initialDistance - distance) / initialDistance) * 100).toFixed(1))
        : 0
    },
    source: 'mock'
  })
}

export default { ROUTE_METHODS, POINT_STRATEGIES, generateSamplingPoints, planRoute }
