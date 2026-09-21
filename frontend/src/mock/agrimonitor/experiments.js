/**
 * E1 / E2 扩展任务的**真实复现实验**（纯前端计算，非演示假数据）
 *
 * ── 为什么放在前端 ─────────────────────────────────────────────
 *   任务书的 E1/E2 是「效果评估实验」，需要一张能当场看结果的表格与曲线。
 *   生产用的布点/路径算法是 3号 的岗位职责，本模块**不参与业务链路**，
 *   只在「首页大屏 → 任务书指标区」里用于**答辩时对比展示**，
 *   所有数字都是这里现算出来的（固定种子，可复现），不是写死的常量。
 *
 * ── E1 布点策略效果评估 ────────────────────────────────────────
 *   人为定义「真实土壤养分分布场」= 两个高斯高值区 + 缓变背景，
 *   三种布点策略各取 20 点，用 **IDW 反距离权重** 插值估计整块田均值，
 *   与真值比较，给出绝对误差 / 相对误差 / 点间距统计。
 *
 * ── E2 路线优化算法对比 ────────────────────────────────────────
 *   同一组点集上跑 最近邻 / 2-opt / 模拟退火 / 遗传算法，
 *   记录**最终距离**与**收敛曲线**，并给出复杂度说明。
 *   为了可比，距离按米制欧氏距离（本地平面坐标，田块尺度 < 1km 可接受）。
 */

import { mulberry32 } from './geoData'

/* ═══════════════════════ 田块与真实分布场 ═══════════════════════ */

/** 田块以本地米制坐标表示（原点在西南角），300m × 200m，右上角带凹口 */
export const FIELD = {
  width: 300,
  height: 200,
  /** 凹口：从 (200,120) 到 (300,200) 的区域不属于田块（对应 T5「带凹口的地块」） */
  notch: { x0: 200, y0: 120, x1: 300, y1: 200 },
  /** 禁入区（池塘），对应 E3「采样区域约束」 */
  pond: { cx: 88, cy: 62, r: 27 }
}

/**
 * 点是否在田块内（含凹口扣除 + 禁入区扣除）
 * @returns {'inside'|'notch'|'pond'|'outside'}
 */
export function fieldTest (x, y) {
  if (x < 0 || y < 0 || x > FIELD.width || y > FIELD.height) {
    return 'outside'
  }
  const n = FIELD.notch
  if (x >= n.x0 && y >= n.y0) {
    return 'notch'
  }
  const p = FIELD.pond
  if ((x - p.cx) * (x - p.cx) + (y - p.cy) * (y - p.cy) <= p.r * p.r) {
    return 'pond'
  }
  return 'inside'
}

export function isInside (x, y) {
  return fieldTest(x, y) === 'inside'
}

/**
 * 「真实土壤养分分布场」—— 两个高值区（任务书原文举例）
 * 值域大致 18 ~ 62（mg/kg 量纲，演示用）
 */
export function truthField (x, y) {
  const g1 = 30 * Math.exp(-(((x - 78) ** 2 + (y - 146) ** 2) / (2 * 26 * 26)))
  const g2 = 24 * Math.exp(-(((x - 224) ** 2 + (y - 62) ** 2) / (2 * 20 * 20)))
  const bg = 19 + 6 * Math.sin(x / 61) * Math.cos(y / 47) + 0.03 * x
  return bg + g1 + g2
}

/** 在田块内生成密网格（用于计算"真值均值"与 IDW 估计的共同底板） */
function denseGrid (step = 5) {
  const pts = []
  for (let x = step / 2; x < FIELD.width; x += step) {
    for (let y = step / 2; y < FIELD.height; y += step) {
      if (isInside(x, y)) {
        pts.push([x, y])
      }
    }
  }
  return pts
}

/** 真值均值（作为 E1 的比较基准） */
export function truthMean () {
  const g = denseGrid(5)
  let s = 0
  for (const p of g) {
    s += truthField(p[0], p[1])
  }
  return s / g.length
}

/** IDW 反距离权重插值：用若干采样点估计任意位置的养分值 */
export function idw (samples, x, y, power = 2) {
  let num = 0
  let den = 0
  for (const s of samples) {
    const d2 = (x - s.x) ** 2 + (y - s.y) ** 2
    if (d2 < 1e-9) {
      return s.v
    }
    const w = 1 / Math.pow(d2, power / 2)
    num += w * s.v
    den += w
  }
  return num / den
}

/* ═══════════════════════ 三种布点策略（各 20 点） ═══════════════════════ */

export const PLACEMENT_STRATEGIES = [
  {
    key: 'random',
    label: '随机布点',
    note: '固定随机种子，落在田块外/凹口/禁入区的点重新抽取（对应 T1 的可复现性要求）'
  },
  {
    key: 'grid',
    label: '规则网格',
    note: '5×4 网格，格心落入凹口或禁入区时在格内贴边避让，整格不可用的由最远点补齐'
  },
  {
    key: 'sShape',
    label: 'S 形（蛇形）布点',
    note: '沿田块走向蛇形推进、贴合农机行走方向，被遮挡的点由最远点补齐'
  }
]

const TARGET_POINTS = 20
const RANDOM_SEED = 20260917

/** 随机布点：界外/凹口/禁入区的点**重新抽取**，保证 20 个点全部合法 */
function placeRandom (count = TARGET_POINTS) {
  const rnd = mulberry32(RANDOM_SEED)
  const pts = []
  let rejected = 0
  let guard = 0
  while (pts.length < count && guard < count * 400) {
    guard++
    const x = rnd() * FIELD.width
    const y = rnd() * FIELD.height
    if (isInside(x, y)) {
      pts.push([Math.round(x * 100) / 100, Math.round(y * 100) / 100])
    } else {
      rejected++
    }
  }
  return { points: pts, avoided: rejected, filled: 0 }
}

/** 规则网格：5×4 单元格，格心落在凹口/禁入区时**在格内贴边避让**；实在放不下的格子空出 */
function placeGrid (count = TARGET_POINTS) {
  const cols = 5
  const rows = 4
  const cw = FIELD.width / cols
  const ch = FIELD.height / rows
  const out = []
  let avoided = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x0 = c * cw
      const y0 = r * ch
      const cx = x0 + cw / 2
      const cy = y0 + ch / 2
      if (isInside(cx, cy)) {
        out.push([round2(cx), round2(cy)])
        continue
      }
      // 格内螺旋搜索最接近格心的合法位置
      let best = null
      let bestD = Infinity
      for (let sx = 2; sx <= cw - 2; sx += 2.5) {
        for (let sy = 2; sy <= ch - 2; sy += 2.5) {
          const px = x0 + sx
          const py = y0 + sy
          if (!isInside(px, py)) {
            continue
          }
          const d = (px - cx) ** 2 + (py - cy) ** 2
          if (d < bestD) {
            bestD = d
            best = [round2(px), round2(py)]
          }
        }
      }
      if (best) {
        out.push(best)
        avoided++
      } else {
        // 整格都在凹口里：这一格放弃，最后由最远点补足
        avoided++
      }
    }
  }
  const filled = fillFarthest(out, count)
  return { points: out, avoided, filled }
}

/** S 形：偶数行自西向东、奇数行自东向西，行距均匀；被凹口/禁入区遮挡的点用最远点补足 */
function placeSShape (count = TARGET_POINTS) {
  const rows = 5
  const perRow = Math.ceil(count / rows)
  const out = []
  let avoided = 0
  for (let r = 0; r < rows; r++) {
    const y = ((r + 0.5) / rows) * FIELD.height
    const xs = []
    for (let i = 0; i < perRow; i++) {
      xs.push(((i + 0.5) / perRow) * FIELD.width)
    }
    if (r % 2 === 1) {
      xs.reverse()
    }
    for (const x of xs) {
      if (isInside(x, y)) {
        out.push([round2(x), round2(y)])
      } else {
        avoided++
      }
    }
  }
  const filled = fillFarthest(out, count)
  return { points: out, avoided, filled }
}

/**
 * 最远点补足（farthest-point insertion）：就地往 pts 里补到 count 个，
 * 每次挑"离已有点最远"的候选点。比"再随机撒几个"更能保证覆盖均匀，
 * 也让 E1 的三种策略对比更公平。
 * @returns {number} 实际补进去的点数
 */
function fillFarthest (pts, count) {
  if (pts.length >= count) {
    return 0
  }
  const cand = []
  for (let x = 5; x < FIELD.width; x += 5) {
    for (let y = 5; y < FIELD.height; y += 5) {
      if (isInside(x, y)) {
        cand.push([x, y])
      }
    }
  }
  let added = 0
  while (pts.length < count && cand.length) {
    let bestIdx = -1
    let bestScore = -Infinity
    for (let i = 0; i < cand.length; i++) {
      let minD = Infinity
      for (const p of pts) {
        const d = (cand[i][0] - p[0]) ** 2 + (cand[i][1] - p[1]) ** 2
        if (d < minD) {
          minD = d
        }
      }
      if (minD > bestScore) {
        bestScore = minD
        bestIdx = i
      }
    }
    pts.push(cand[bestIdx])
    cand.splice(bestIdx, 1)
    added++
  }
  return added
}

function round2 (v) {
  return Math.round(v * 100) / 100
}

/* ═══════════════════════ E1 实验 ═══════════════════════ */

/**
 * 跑一次 E1：三种策略各 20 点 → IDW 估计田块均值 → 与真值比较
 * @returns {{truth:number, gridPoints:number, rows:Array, field:object}}
 */
export function runPlacementExperiment () {
  const truth = truthMean()
  const board = denseGrid(5)
  const rows = PLACEMENT_STRATEGIES.map(strategy => {
    const placed = strategy.key === 'random'
      ? placeRandom()
      : (strategy.key === 'grid' ? placeGrid() : placeSShape())
    const pts = placed.points

    const samples = pts.map((p, i) => ({
      id: i + 1,
      x: p[0],
      y: p[1],
      v: truthField(p[0], p[1])
    }))

    // IDW 估计整块田均值
    let est = 0
    for (const b of board) {
      est += idw(samples, b[0], b[1])
    }
    est /= board.length

    const absErr = Math.abs(est - truth)
    const relErr = (absErr / truth) * 100

    // 点间距统计（对应 T1「点间距符合设定」）
    let minD = Infinity
    let sumD = 0
    let n = 0
    for (let i = 0; i < samples.length; i++) {
      for (let j = i + 1; j < samples.length; j++) {
        const d = Math.hypot(samples[i].x - samples[j].x, samples[i].y - samples[j].y)
        if (d < minD) {
          minD = d
        }
        sumD += d
        n++
      }
    }

    // 合法性统计（对应 T1「所有点落在多边形内部」）
    const illegal = samples.filter(s => !isInside(s.x, s.y)).length

    return {
      key: strategy.key,
      label: strategy.label,
      note: strategy.note,
      count: samples.length,
      samples,
      estimate: round2(est),
      truth: round2(truth),
      absErr: round2(absErr),
      relErr: Math.round(relErr * 100) / 100,
      minDistance: round2(minD),
      avgDistance: round2(sumD / n),
      illegal,
      // 因凹口/禁入区被避让掉的候选位置数，以及用最远点补足的个数
      avoided: placed.avoided,
      filled: placed.filled,
      // 误差越小越好，用于排序评价
      rank: 0
    }
  })

  const sorted = rows.slice().sort((a, b) => a.relErr - b.relErr)
  sorted.forEach((r, i) => { r.rank = i + 1 })

  return {
    truth: round2(truth),
    boardSize: board.length,
    targetPoints: TARGET_POINTS,
    seed: RANDOM_SEED,
    rows,
    best: sorted[0] ? sorted[0].key : ''
  }
}

/* ═══════════════════════ E2 实验 ═══════════════════════ */

/** 两点欧氏距离（米，本地平面坐标） */
function dist (a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}

/** 一条路线的总长度（闭合回路） */
export function routeLength (route, points) {
  let s = 0
  for (let i = 0; i < route.length; i++) {
    s += dist(points[route[i]], points[route[(i + 1) % route.length]])
  }
  return s
}

/** 最近邻（贪心）构造初始解 */
function nearestNeighbor (points, start = 0) {
  const n = points.length
  const used = new Array(n).fill(false)
  const route = [start]
  used[start] = true
  for (let k = 1; k < n; k++) {
    const cur = points[route[route.length - 1]]
    let best = -1
    let bestD = Infinity
    for (let i = 0; i < n; i++) {
      if (used[i]) {
        continue
      }
      const d = dist(cur, points[i])
      if (d < bestD) {
        bestD = d
        best = i
      }
    }
    route.push(best)
    used[best] = true
  }
  return route
}

/** 2-opt 局部搜索；返回最终路线与"每轮改进后的长度"曲线 */
function twoOpt (points, initRoute) {
  let route = initRoute.slice()
  let best = routeLength(route, points)
  const curve = [Math.round(best * 100) / 100]
  let improved = true
  let guard = 0
  while (improved && guard < 200) {
    improved = false
    guard++
    for (let i = 1; i < route.length - 1; i++) {
      for (let j = i + 1; j < route.length; j++) {
        const cand = route.slice(0, i).concat(route.slice(i, j + 1).reverse(), route.slice(j + 1))
        const len = routeLength(cand, points)
        if (len < best - 1e-9) {
          route = cand
          best = len
          curve.push(Math.round(best * 100) / 100)
          improved = true
        }
      }
    }
  }
  return { route, length: best, curve }
}

/** 模拟退火：随机 2-opt 邻域 + 指数降温 */
function simulatedAnnealing (points, seedRoute, seed = 7) {
  const rnd = mulberry32(seed)
  let cur = seedRoute.slice()
  let curLen = routeLength(cur, points)
  let best = cur.slice()
  let bestLen = curLen
  const curve = [Math.round(bestLen * 100) / 100]
  const n = cur.length
  let T = 60
  const TMin = 0.05
  const alpha = 0.995
  let iter = 0
  while (T > TMin && iter < 20000) {
    iter++
    const i = 1 + Math.floor(rnd() * (n - 2))
    const j = i + Math.floor(rnd() * (n - i))
    const cand = cur.slice(0, i).concat(cur.slice(i, j + 1).reverse(), cur.slice(j + 1))
    const candLen = routeLength(cand, points)
    const dE = candLen - curLen
    if (dE < 0 || rnd() < Math.exp(-dE / T)) {
      cur = cand
      curLen = candLen
      if (curLen < bestLen - 1e-9) {
        best = cur.slice()
        bestLen = curLen
        curve.push(Math.round(bestLen * 100) / 100)
      }
    }
    T *= alpha
  }
  return { route: best, length: bestLen, curve, iterations: iter }
}

/** 简单遗传算法：顺序交叉 OX + 交换变异 + 精英保留 */
function genetic (points, seed = 11, popSize = 60, generations = 200) {
  const rnd = mulberry32(seed)
  const n = points.length
  const randRoute = () => {
    const arr = Array.from({ length: n }, (_, i) => i)
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1))
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t
    }
    return arr
  }
  let pop = Array.from({ length: popSize }, randRoute)
  let popLen = pop.map(r => routeLength(r, points))
  let bestIdx = popLen.indexOf(Math.min.apply(null, popLen))
  let best = pop[bestIdx].slice()
  let bestLen = popLen[bestIdx]
  const curve = [Math.round(bestLen * 100) / 100]

  for (let g = 0; g < generations; g++) {
    // 锦标赛选择
    const pick = () => {
      const a = Math.floor(rnd() * popSize)
      const b = Math.floor(rnd() * popSize)
      return popLen[a] < popLen[b] ? pop[a] : pop[b]
    }
    const next = []
    // 精英
    const order = popLen.map((v, i) => i).sort((x, y) => popLen[x] - popLen[y])
    next.push(pop[order[0]].slice(), pop[order[1]].slice())
    while (next.length < popSize) {
      const p1 = pick()
      const p2 = pick()
      // OX 交叉
      const i = Math.floor(rnd() * n)
      const j = i + Math.floor(rnd() * (n - i))
      const child = new Array(n).fill(-1)
      for (let k = i; k <= j; k++) {
        child[k] = p1[k]
      }
      let fill = (j + 1) % n
      for (let k = 0; k < n; k++) {
        const gene = p2[(j + 1 + k) % n]
        if (child.indexOf(gene) < 0) {
          child[fill] = gene
          fill = (fill + 1) % n
        }
      }
      // 交换变异
      if (rnd() < 0.25) {
        const a = Math.floor(rnd() * n)
        const b = Math.floor(rnd() * n)
        const t = child[a]; child[a] = child[b]; child[b] = t
      }
      next.push(child)
    }
    pop = next
    popLen = pop.map(r => routeLength(r, points))
    const bi = popLen.indexOf(Math.min.apply(null, popLen))
    if (popLen[bi] < bestLen - 1e-9) {
      best = pop[bi].slice()
      bestLen = popLen[bi]
    }
    curve.push(Math.round(bestLen * 100) / 100)
  }
  return { route: best, length: bestLen, curve, generations, popSize }
}

/**
 * 跑一次 E2：同一组点集上对比 4 种算法
 * 点集用 E1 的规则网格 20 点，保证与其他实验同源、可复现。
 *
 * 「基准」取**各算法本轮的最好结果**（`refBest`）—— 这是任务书 E2 要求的
 * "最终距离对比"里最中立的参照，不做任何"某个算法一定更优"的预设。
 * @returns {{points:Array, rows:Array, refBest:number, refKey:string}}
 */
export function runRouteExperiment () {
  const pts = (() => {
    const g = placeGrid()
    return g.points.map(p => [p[0], p[1]])
  })()

  const nnRoute = nearestNeighbor(pts, 0)
  const nnLen = routeLength(nnRoute, pts)

  const twoOptRes = twoOpt(pts, nnRoute)
  const saRes = simulatedAnnealing(pts, nnRoute, 7)
  const gaRes = genetic(pts, 11, 60, 200)

  const raw = [
    {
      key: 'nn',
      label: '最近邻（贪心）',
      length: nnLen,
      effort: '一次构造，无迭代',
      complexity: 'O(n²)',
      convergeAt: 0,
      curve: []
    },
    {
      key: 'twoOpt',
      label: '2-opt 局部搜索',
      length: twoOptRes.length,
      effort: `${twoOptRes.curve.length - 1} 次改进`,
      complexity: '每轮 O(n²)，共 k 轮',
      convergeAt: twoOptRes.curve.length - 1,
      curve: twoOptRes.curve
    },
    {
      key: 'sa',
      label: '模拟退火',
      length: saRes.length,
      effort: `${saRes.iterations} 次迭代`,
      complexity: 'O(iter · n)',
      convergeAt: Math.max(0, saRes.curve.length - 1),
      curve: saRes.curve
    },
    {
      key: 'ga',
      label: '遗传算法（OX 交叉）',
      length: gaRes.length,
      effort: `${gaRes.generations} 代 × ${gaRes.popSize} 个体`,
      complexity: 'O(gen · pop · n)',
      convergeAt: Math.max(0, gaRes.curve.length - 1),
      curve: gaRes.curve
    }
  ]

  const refBest = Math.min.apply(null, raw.map(r => r.length))
  const refKey = raw.filter(r => r.length === refBest)[0].key

  const rows = raw.map(r => Object.assign({}, r, {
    length: round2(r.length),
    gap: Math.round(((r.length - refBest) / refBest) * 10000) / 100,
    isBest: r.length === refBest
  }))

  return {
    points: pts,
    pointCount: pts.length,
    refBest: round2(refBest),
    refKey,
    rows
  }
}

export default {
  FIELD,
  PLACEMENT_STRATEGIES,
  runPlacementExperiment,
  runRouteExperiment,
  truthField,
  isInside,
  fieldTest,
  idw,
  routeLength
}
