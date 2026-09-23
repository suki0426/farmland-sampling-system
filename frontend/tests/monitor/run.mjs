/**
 * 农业监测大屏（agrimonitor）—— 纯逻辑回归测试（Node 运行，不需要浏览器）
 *
 * 运行：node tests/monitor/run.mjs
 *      （或在 frontend 目录执行 npm run test:monitor）
 *
 * 覆盖内容：
 *   A. 回传帧编解码（任务书 §2 的 19 字节结构）
 *      - CRC-16/MODBUS 标准自测向量（"123456789" → 0x4B37）
 *      - 帧长 / 帧头 / 字段偏移
 *      - 编码 → 解码 字节级与数值级往返一致
 *      - **非法输入必须抛错而不是静默兜底**：帧头错、长度错、CRC 错、
 *        采样点 ID 越界、坐标缺失、1 字节指标越界
 *      - 篡改一个字节必须被 CRC 拦下
 *   B. E1 布点策略效果评估
 *      - 三种策略各 20 点、全部落在田块内、不落禁入区
 *      - 固定种子可复现（同种子两次结果完全一致）——对应 T1
 *      - IDW 估计误差在合理区间
 *   C. E2 路线优化算法对比
 *      - 4 种算法都在同一组点集上，2-opt/SA/GA 不劣于最近邻
 *      - 收敛曲线单调不增；结果可复现
 *   D. 任务书条目对照表完整性
 *
 * 实现说明（沿用 tests/gis/run.mjs 的做法）：
 *   被测源码使用 webpack 的 `@/` 别名和省略扩展名的相对导入，Node ESM 不接受。
 *   因此先把被测文件复制到系统临时目录、补扩展名、写一个 {"type":"module"} 的
 *   package.json，再动态 import。被测的是**源码本身**。
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const frontendRoot = path.resolve(here, '..', '..')
const srcRoot = path.join(frontendRoot, 'src')

const FILE_MAP = [
  ['utils/udpFrame.js', 'udpFrame.js'],
  ['utils/geo/geojson.js', 'geojson.js'],
  ['mock/agrimonitor/geoData.js', 'geoData.js'],
  ['mock/agrimonitor/weatherField.js', 'weatherField.js'],
  ['mock/agrimonitor/experiments.js', 'experiments.js'],
  ['mock/agrimonitor/frameStream.js', 'frameStream.js'],
  ['mock/agrimonitor/taskData.js', 'taskData.js']
]

/** 被测的静态数据（真实仓库里的文件，不是副本） */
const GEO_DIR = path.join(frontendRoot, 'public', 'geo')

const workDir = path.join(os.tmpdir(), `monitor-check-${process.pid}`)

function prepareSources () {
  fs.rmSync(workDir, { recursive: true, force: true })
  fs.mkdirSync(workDir, { recursive: true })
  fs.writeFileSync(path.join(workDir, 'package.json'), '{ "type": "module" }\n')

  FILE_MAP.forEach(([relative, flat]) => {
    const source = path.join(srcRoot, relative)
    if (!fs.existsSync(source)) {
      throw new Error(`找不到被测源文件：${source}`)
    }
    let text = fs.readFileSync(source, 'utf8')
    // 省略扩展名的相对导入 → 补 .js
    text = text.replace(/from '\.\/(geoData|udpFrame|experiments|frameStream|taskData)'/g, "from './$1.js'")
    // webpack 别名
    text = text.replace(/from '@\/utils\/udpFrame'/g, "from './udpFrame.js'")
    fs.writeFileSync(path.join(workDir, flat), text)
  })
}

const importFrom = name => import(pathToFileURL(path.join(workDir, name)).href)

function cleanup () {
  try {
    fs.rmSync(workDir, { recursive: true, force: true })
  } catch (e) {
    // 清理失败不影响测试结论
  }
}

async function main () {
  prepareSources()

  const frame = await importFrom('udpFrame.js')
  const experiments = await importFrom('experiments.js')
  const stream = await importFrom('frameStream.js')
  const taskData = await importFrom('taskData.js')
  const G = await importFrom('geojson.js')
  const field = await importFrom('weatherField.js')

  const rows = []
  const check = (name, pass, detail) => rows.push({ name, pass: !!pass, detail: String(detail) })
  /** 断言"必须抛错"：抛了算过，没抛算失败 */
  const checkThrows = (name, fn, expectFragment) => {
    try {
      fn()
      check(name, false, '期望抛错，但调用成功返回了')
    } catch (e) {
      const msg = (e && e.message) || String(e)
      const hit = !expectFragment || msg.indexOf(expectFragment) >= 0
      check(name, hit, hit ? msg : `抛错了但信息不含"${expectFragment}"：${msg}`)
    }
  }

  /* ══════════════════ A. 回传帧 ══════════════════ */

  {
    // A1 CRC 标准自测向量
    const ascii = Array.from('123456789').map(c => c.charCodeAt(0))
    const crc = frame.crc16Modbus(ascii)
    check('CRC-16/MODBUS 标准向量 "123456789" = 0x4B37',
      crc === 0x4B37, `计算值 0x${crc.toString(16).toUpperCase()}`)

    // A2 帧结构常量与任务书一致
    check('帧总长 = 19 字节（2+2+4+4+1+1+1+1+1+2）',
      frame.FRAME_LENGTH === 19, `FRAME_LENGTH=${frame.FRAME_LENGTH}`)
    check('帧头 = FF 55',
      frame.FRAME_HEADER[0] === 0xFF && frame.FRAME_HEADER[1] === 0x55,
      frame.FRAME_HEADER.map(v => '0x' + v.toString(16).toUpperCase()).join(' '))
    check('5 项采样指标顺序与任务书一致',
      frame.METRIC_ORDER.map(m => m.key).join(',') ===
        'soilTemperature,soilMoisture,airTemperature,airHumidity,soilDepth',
      frame.METRIC_ORDER.map(m => m.key).join(' → '))
    check('帧结构表 10 行切分后恰好覆盖 19 字节',
      frame.FRAME_LAYOUT.reduce((s, r) => s + parseInt(r.bytes, 10), 0) === 19,
      frame.FRAME_LAYOUT.map(r => `${r.field}:${r.bytes}`).join(' '))

    // A3 正常帧往返（数值级 + 字节级）
    const sample = {
      samplingPointId: 1003,
      latitude: 37.8684907,
      longitude: 112.5465203,
      soilTemperature: 17.4,
      soilMoisture: 63,
      airTemperature: 22.8,
      airHumidity: 71,
      soilDepth: 18
    }
    const bytes = frame.encodeFrame(sample)
    const back = frame.decodeFrame(bytes)
    const exact =
      back.samplingPointId === 1003 &&
      back.latitude === 37.8684907 &&
      back.longitude === 112.5465203 &&
      back.soilTemperature === 17 &&
      back.soilMoisture === 63 &&
      back.airTemperature === 23 &&
      back.airHumidity === 71 &&
      back.soilDepth === 18
    check('编码 → 解码 往返：坐标 7 位小数无损、1 字节指标四舍五入正确',
      exact, JSON.stringify(back))

    check('解码结果标记 CRC 通过', back.crcOk === true && typeof back.crc === 'number',
      `crc=0x${(back.crc || 0).toString(16).toUpperCase()}`)

    // A4 字节级还原：同参数两次编码必须逐字节相同
    const bytes2 = frame.encodeFrame(sample)
    check('同参数两次编码逐字节一致（可复现）',
      frame.toHex(bytes) === frame.toHex(bytes2), frame.toHex(bytes))

    // A5 大端序与 1e7 放大：手工核对前 12 字节
    const latScaled = Math.round(37.8684907 * 1e7)
    const lonScaled = Math.round(112.5465203 * 1e7)
    const expectHead = [
      0xFF, 0x55, 0x03, 0xEB,
      (latScaled >>> 24) & 0xFF, (latScaled >>> 16) & 0xFF, (latScaled >>> 8) & 0xFF, latScaled & 0xFF,
      (lonScaled >>> 24) & 0xFF, (lonScaled >>> 16) & 0xFF, (lonScaled >>> 8) & 0xFF, lonScaled & 0xFF
    ]
    const headOk = expectHead.every((v, i) => bytes[i] === v)
    check('坐标按大端 int32(度×1e7) 落盘，手工核对前 12 字节一致',
      headOk, `实际 ${frame.toHex(bytes.slice(0, 12))}`)

    // A6 负温度 int8 往返
    const negBytes = frame.encodeFrame(Object.assign({}, sample, { soilTemperature: -8, airTemperature: -3 }))
    const negBack = frame.decodeFrame(negBytes)
    check('负温度 int8 补码往返正确（-8 / -3）',
      negBack.soilTemperature === -8 && negBack.airTemperature === -3,
      `${negBack.soilTemperature} / ${negBack.airTemperature}`)

    // A7 hexFields 字段切分
    const fields = frame.hexFields(bytes)
    const total = fields.reduce((s, f) => s + f.len, 0)
    check('hexFields 字段切分总长度 = 19 且偏移连续',
      fields.length === 10 && total === 19 && fields[0].offset === 0 && fields[9].offset === 17,
      `${fields.length} 段 / 共 ${total} 字节`)

    /* ── A8~A13 非法输入必须抛错 ── */

    checkThrows('帧头错误必须抛错', () => {
      const bad = bytes.slice()
      bad[0] = 0xAA
      return frame.decodeFrame(bad)
    }, '帧头错误')

    checkThrows('帧长度错误必须抛错', () => frame.decodeFrame(bytes.slice(0, 12)), '帧长度错误')

    checkThrows('CRC 不匹配必须抛错（篡改 1 字节）', () => {
      const bad = bytes.slice()
      bad[13] = (bad[13] + 7) & 0xFF
      return frame.decodeFrame(bad)
    }, 'CRC 校验失败')

    checkThrows('采样点 ID 越界（65536）必须抛错',
      () => frame.encodeFrame(Object.assign({}, sample, { samplingPointId: 65536 })), '0~65535')

    checkThrows('采样点 ID 为负数必须抛错',
      () => frame.encodeFrame(Object.assign({}, sample, { samplingPointId: -1 })), '0~65535')

    checkThrows('坐标缺失（null）必须抛错，不得静默当成 0',
      () => frame.encodeFrame(Object.assign({}, sample, { latitude: null })), '不是有效数字')

    checkThrows('坐标缺失（undefined）必须抛错',
      () => frame.encodeFrame(Object.assign({}, sample, { longitude: undefined })), '不是有效数字')

    checkThrows('湿度越界（120%）必须抛错',
      () => frame.encodeFrame(Object.assign({}, sample, { soilMoisture: 120 })), '超出')

    checkThrows('温度越界（200°C）必须抛错',
      () => frame.encodeFrame(Object.assign({}, sample, { airTemperature: 200 })), '超出')

    // 边界值必须合法通过
    const edge = frame.decodeFrame(frame.encodeFrame(Object.assign({}, sample, {
      samplingPointId: 65535, soilMoisture: 100, airHumidity: 0, soilTemperature: -128, airTemperature: 127
    })))
    check('边界值可通过：ID=65535、湿度 0/100、温度 -128/127',
      edge.samplingPointId === 65535 && edge.soilMoisture === 100 &&
      edge.airHumidity === 0 && edge.soilTemperature === -128 && edge.airTemperature === 127,
      `ID=${edge.samplingPointId} T=${edge.soilTemperature}/${edge.airTemperature}`)
  }

  /* ══════════════════ A' 帧流与篡改演示 ══════════════════ */

  {
    const streamRows = stream.mockFrameStream(12)
    check('mockFrameStream 生成 12 帧且全部编解码成功',
      streamRows.length === 12 && streamRows.every(r => r.ok && r.hex.split(' ').length === 19),
      `成功 ${streamRows.filter(r => r.ok).length}/12`)

    check('帧流中的采样点 ID 都在 0~65535 且为整数',
      streamRows.every(r => Number.isInteger(r.sample.samplingPointId) &&
        r.sample.samplingPointId >= 0 && r.sample.samplingPointId <= 65535),
      streamRows.map(r => r.sample.samplingPointId).join(','))

    const again = stream.mockFrameStream(12)
    check('帧流可复现（同种子两次十六进制完全相同）',
      again.map(r => r.hex).join('|') === streamRows.map(r => r.hex).join('|'),
      '对比 12 帧十六进制')

    const bad = stream.mockCorruptedFrame()
    check('篡改帧被 CRC 拒绝，且解码结果为 null',
      bad && bad.decoded === null && /CRC/.test(bad.error),
      bad ? bad.error : '未返回结果')
  }

  /* ══════════════════ B. E1 布点策略 ══════════════════ */

  {
    const e1 = experiments.runPlacementExperiment()

    check('E1：三种布点策略各取 20 个点',
      e1.rows.length === 3 && e1.rows.every(r => r.count === 20),
      e1.rows.map(r => `${r.label}=${r.count}`).join(' / '))

    check('E1：所有采样点都落在田块内部（T1 无界外点）',
      e1.rows.every(r => r.illegal === 0),
      e1.rows.map(r => `${r.label} 界外 ${r.illegal}`).join(' / '))

    const allInside = e1.rows.every(r => r.samples.every(s => experiments.isInside(s.x, s.y)))
    check('E1：逐点复核 —— 每个点都通过 PIP，且不在禁入区内', allInside,
      `共 ${e1.rows.reduce((s, r) => s + r.samples.length, 0)} 个点`)

    const bad = e1.rows[0].samples.filter(s => experiments.fieldTest(s.x, s.y) !== 'inside')
    check('E1：fieldTest 对全部点返回 inside', bad.length === 0, `异常 ${bad.length} 个`)

    check('E1：真值均值在合理区间（18~62）',
      e1.truth > 18 && e1.truth < 62, `真值均值 ${e1.truth}`)

    check('E1：三种策略的 IDW 估计误差均 < 15%',
      e1.rows.every(r => r.relErr < 15),
      e1.rows.map(r => `${r.label} ${r.relErr}%`).join(' / '))

    check('E1：给出了最小间距与平均间距（T1 点间距）',
      e1.rows.every(r => r.minDistance > 0 && r.avgDistance > r.minDistance),
      e1.rows.map(r => `${r.label} min=${r.minDistance} avg=${r.avgDistance}`).join(' / '))

    check('E1：随机布点固定种子可复现（同种子两次结果完全一致）',
      JSON.stringify(experiments.runPlacementExperiment().rows[0].samples) ===
        JSON.stringify(e1.rows[0].samples),
      `seed=${e1.seed}`)

    check('E1：给出了排名（误差越小越靠前）',
      e1.rows.every(r => r.rank >= 1 && r.rank <= 3) &&
        new Set(e1.rows.map(r => r.rank)).size === 3,
      e1.rows.map(r => `${r.label}#${r.rank}`).join(' / '))
  }

  /* ══════════════════ C. E2 路线算法对比 ══════════════════ */

  {
    const e2 = experiments.runRouteExperiment()

    check('E2：4 种算法在同一组 20 点集上对比',
      e2.rows.length === 4 && e2.pointCount === 20,
      e2.rows.map(r => r.label).join(' / '))

    const nn = e2.rows.filter(r => r.key === 'nn')[0]
    const improved = e2.rows.filter(r => r.key !== 'nn')
    check('E2：2-opt / 模拟退火 / 遗传算法均不劣于最近邻',
      improved.every(r => r.length <= nn.length + 1e-6),
      `NN=${nn.length} → ` + improved.map(r => `${r.label}=${r.length}`).join(' / '))

    check('E2：基准值 = 各算法本轮最好结果，且不小于任何一条结果',
      e2.rows.every(r => r.length >= e2.refBest - 1e-6) &&
        e2.rows.filter(r => r.isBest).length >= 1 &&
        e2.rows.filter(r => r.isBest).every(r => r.length === e2.refBest),
      `基准 ${e2.refBest}（${e2.refKey}）`)

    const curves = e2.rows.filter(r => r.curve && r.curve.length > 1)
    const monotone = curves.every(r => r.curve.every((v, i) => i === 0 || v <= r.curve[i - 1] + 1e-9))
    check('E2：收敛曲线单调不增（严格只记录改进）', monotone,
      curves.map(r => `${r.label} ${r.curve.length} 个点`).join(' / '))

    check('E2：每条结果的相对差距 gap 都 >= 0（最优者为 0）',
      e2.rows.every(r => r.gap >= 0) && e2.rows.some(r => r.gap === 0),
      e2.rows.map(r => `${r.label} gap=${r.gap}%`).join(' / '))

    check('E2：给出了时间复杂度说明',
      e2.rows.every(r => typeof r.complexity === 'string' && r.complexity.length > 0),
      e2.rows.map(r => r.complexity).join(' | '))

    const again = experiments.runRouteExperiment()
    check('E2：结果可复现（同种子两次最终距离完全一致）',
      JSON.stringify(again.rows.map(r => [r.key, r.length])) ===
        JSON.stringify(e2.rows.map(r => [r.key, r.length])),
      again.rows.map(r => `${r.key}=${r.length}`).join(' / '))

    // 路线长度与几何自洽：手工重算一条路线的长度
    const pts = e2.points
    const manual = (() => {
      let s = 0
      for (let i = 0; i < pts.length; i++) {
        s += Math.hypot(pts[i][0] - pts[(i + 1) % pts.length][0], pts[i][1] - pts[(i + 1) % pts.length][1])
      }
      return s
    })()
    const idxOrder = Array.from({ length: pts.length }, (_, i) => i)
    check('E2：routeLength 与手工重算一致（几何自洽）',
      Math.abs(experiments.routeLength(idxOrder, pts) - manual) < 1e-6,
      `routeLength=${experiments.routeLength(idxOrder, pts).toFixed(4)} 手工=${manual.toFixed(4)}`)
  }

  /* ══════════════════ D. 任务书条目对照 ══════════════════ */

  {
    check('任务书 M1~M4 四条必做任务齐全',
      taskData.TASK_MODULES.map(t => t.key).join(',') === 'M1,M2,M3,M4',
      taskData.TASK_MODULES.map(t => t.key).join(','))

    check('扩展任务 E1~E4 四条齐全',
      taskData.EXTENDED_TASKS.map(t => t.key).join(',') === 'E1,E2,E3,E4',
      taskData.EXTENDED_TASKS.map(t => t.key).join(','))

    const tKeys = taskData.TEST_CASES.map(t => t.key)
    check('测试用例覆盖任务书的 T1/T2/T3/T5',
      ['T1', 'T2', 'T3', 'T5'].every(k => tKeys.indexOf(k) >= 0), tKeys.join(','))

    const t4 = taskData.TEST_CASES.filter(t => t.key === 'T4')[0]
    check('T4 显式标注为"任务书未定义"，避免被当成漏做',
      t4 && t4.status === 'n/a' && /未定义/.test(t4.requirement) && /未定义/.test(t4.title),
      t4 ? `${t4.title} / ${t4.requirement.slice(0, 40)}…` : '缺少 T4 占位')

    check('每条任务都标注了负责岗位与前端交付内容',
      taskData.TASK_MODULES.every(t => t.owner && t.frontend && t.evidence),
      taskData.TASK_MODULES.map(t => t.key).join(','))

    const sum = taskData.taskSummary()
    check('任务汇总统计自洽（done + pending = total）',
      sum.done + sum.pending === sum.total,
      `total=${sum.total} done=${sum.done} pending=${sum.pending} 用例通过 ${sum.testsPass}/${sum.tests}`)
  }

  /* ══════════════════ E. echarts 压缩坐标解码（真实 bug 的回归防线） ══════════════════ */

  const rawChina = JSON.parse(fs.readFileSync(path.join(GEO_DIR, 'china.json'), 'utf8'))
  const coarseMask = JSON.parse(fs.readFileSync(path.join(GEO_DIR, 'cn-grid-mask.json'), 'utf8'))

  {
    const sxRaw = rawChina.features.filter(f => f.properties.name === '山西')[0]
    check('测试数据前提：china.json 确实是 echarts 压缩坐标格式',
      G.isEncodedGeometry(sxRaw.geometry) && typeof sxRaw.geometry.coordinates[0] === 'string',
      `coordinates[0] 是 ${typeof sxRaw.geometry.coordinates[0]}`)

    const plain = G.ensurePlainGeoJson(rawChina)
    const sxPlain = plain.features.filter(f => f.properties.name === '山西')[0]
    check('解码后坐标变成数值 [lng, lat]，顶点数正常（> 100）',
      Array.isArray(sxPlain.geometry.coordinates[0][0]) &&
        typeof sxPlain.geometry.coordinates[0][0][0] === 'number' &&
        sxPlain.geometry.coordinates[0].length > 100,
      `首点 ${JSON.stringify(sxPlain.geometry.coordinates[0][0])}，顶点 ${sxPlain.geometry.coordinates[0].length} 个`)

    check('未解码时坐标是字符串 → 环收集器必须拦下（不产出错的 bbox）',
      G.ringsOfGeometry(sxRaw.geometry).length === 0,
      `未解码收集到 ${G.ringsOfGeometry(sxRaw.geometry).length} 个环`)

    check('解码后环收集器拿到 1 个外环',
      G.ringsOfGeometry(sxPlain.geometry).length === 1,
      `${G.ringsOfGeometry(sxPlain.geometry).length} 个环`)

    const ty = [112.5489, 37.8712]
    const badHit = G.ringsOfGeometry(sxRaw.geometry).some(r => G.pointInRing(ty[0], ty[1], r.ring))
    const goodHit = G.ringsOfGeometry(sxPlain.geometry).some(r => G.pointInRing(ty[0], ty[1], r.ring))
    check('★回归：太原点"未解码判为界外、解码后判为界内"（旧版种族 bug）',
      badHit === false && goodHit === true,
      `未解码 ${badHit} / 解码后 ${goodHit}`)

    let miss = 0
    for (const f of plain.features) {
      const rings = G.ringsOfGeometry(f.geometry)
      const cp = f.properties.cp
      if (!(cp && rings.some(r => G.pointInRing(cp[0], cp[1], r.ring)))) {
        miss++
      }
    }
    check('★全国 34 个省级要素的行政中心点全部判为境内（区域悬浮可用）',
      miss === 0, `未命中 ${miss} 个`)

    const alreadyPlain = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] } }] }
    check('已是普通坐标的数据不做拷贝（零开销直通）',
      G.ensurePlainGeoJson(alreadyPlain) === alreadyPlain,
      '返回同一对象')

    // ECharts 4 的 registerMap 会原地把 coordinates 解成数组，却保留
    // encodeOffsets。旧判断会把这种对象再次解码并在数组上调用 charCodeAt。
    const echartsMutated = JSON.parse(JSON.stringify(rawChina))
    echartsMutated.features.forEach((f, i) => {
      f.geometry.coordinates = plain.features[i].geometry.coordinates
    })
    echartsMutated.UTF8Encoding = false
    const reused = G.ensurePlainGeoJson(echartsMutated)
    check('★回归：ECharts 原地解码后即使残留 encodeOffsets，也不会二次解码',
      reused === echartsMutated &&
        Array.isArray(reused.features[0].geometry.coordinates[0][0]),
      '返回同一对象，坐标保持数值数组')
  }

  /* ══════════════════ F. 栅格掩膜 ══════════════════ */

  let maskInfo = null
  {
    // 用一个 1x1 度的正方形验证掩膜的方向与计数
    const sq = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: { name: 'S' },
        geometry: { type: 'Polygon', coordinates: [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]] }
      }]
    }
    const bounds = { lngMin: 0, latMin: 0, lngMax: 2, latMax: 2 }
    const m = G.buildMaskFromRings(G.collectRings(sq), bounds, 20, 20)
    check('掩膜：整个范围都是陆地时 inside = width×height',
      m.inside === 400, `inside=${m.inside}`)
    check('掩膜：第 0 行是北边（y 向下与图片行序一致）',
      m.mask[0] === 1 && m.mask[m.mask.length - 1] === 1,
      `首行 ${m.mask[0]} / 末行 ${m.mask[m.mask.length - 1]}`)

    const half = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: { name: 'H' },
        geometry: { type: 'Polygon', coordinates: [[[0, 0], [2, 0], [2, 1], [0, 1], [0, 0]]] }
      }]
    }
    const m2 = G.buildMaskFromRings(G.collectRings(half), bounds, 20, 20)
    // 南半边（lat 0~1）→ 图片的下半部分
    check('掩膜：只覆盖南半边时，下半部分为 1、上半部分为 0',
      m2.inside > 170 && m2.inside < 230 && m2.mask[0] === 0 && m2.mask[m2.mask.length - 1] === 1,
      `inside=${m2.inside}（期望约 200）`)

    // 真实全国掩膜（用 0.4 度，保持测试秒级）
    const gridBounds = {
      lngMin: coarseMask.lngMin,
      latMin: coarseMask.latMin,
      lngMax: coarseMask.lngMin + coarseMask.cols * coarseMask.step,
      latMax: coarseMask.latMin + coarseMask.rows * coarseMask.step
    }
    const size = field.rasterSize(gridBounds, 0.4)
    maskInfo = G.buildInsideMask(G.ensurePlainGeoJson(rawChina), gridBounds, size.width, size.height)
    const ratio = maskInfo.inside / (size.width * size.height)
    check('全国栅格掩膜：境内像素占比落在 30%~50%（含海南/台湾等岛屿）',
      ratio > 0.30 && ratio < 0.50,
      `${size.width}×${size.height} 境内 ${maskInfo.inside} 占比 ${(ratio * 100).toFixed(1)}%`)

    // 与预置粗掩膜逐格对照
    const bin = Buffer.from(coarseMask.mask, 'base64')
    const rings = G.collectRings(G.ensurePlainGeoJson(rawChina))
    let agree = 0
    let total = 0
    for (let r = 0; r < coarseMask.rows; r++) {
      for (let c = 0; c < coarseMask.cols; c++) {
        const idx = r * coarseMask.cols + c
        const coarse = (bin[idx >> 3] & (1 << (idx & 7))) ? 1 : 0
        const lng = coarseMask.lngMin + (c + 0.5) * coarseMask.step
        const lat = coarseMask.latMin + (r + 0.5) * coarseMask.step
        let fine = 0
        for (const rg of rings) {
          if (lng < rg.x0 || lng > rg.x1 || lat < rg.y0 || lat > rg.y1) continue
          if (G.pointInRing(lng, lat, rg.ring)) { fine = 1; break }
        }
        total++
        if (coarse === fine) agree++
      }
    }
    check('全国掩膜与预置粗掩膜逐格一致率 > 95%',
      agree / total > 0.95,
      `${agree}/${total} = ${(agree / total * 100).toFixed(1)}%`)
  }

  /* ══════════════════ G. 栅格着色（回答"颜色是不是都一样"） ══════════════════ */

  {
    // 预编译场与逐点求值必须数值一致
    const prep = field.prepareField('precip', 0.5)
    let maxDiff = 0
    for (let i = 0; i < 200; i++) {
      const lng = 75 + (i * 0.31) % 58
      const lat = 18 + (i * 0.17) % 35
      maxDiff = Math.max(maxDiff, Math.abs(field.evalPrepared(prep, lng, lat) - field.field01('precip', lng, lat, 0.5)))
    }
    check('prepareField + evalPrepared 与 field01 数值一致（误差 < 1e-12）',
      maxDiff < 1e-12, `最大差 ${maxDiff.toExponential(3)}`)

    const stops = field.gradientStops(field.layerByKey('precip').colors)
    const first = field.sampleGradient(stops, 0)
    const last = field.sampleGradient(stops, 1)
    check('色阶采样：两端等于色阶首尾色',
      Math.abs(first[0] - stops[0][0]) < 0.5 && Math.abs(last[2] - stops[stops.length - 1][2]) < 0.5,
      `t=0 → rgb(${first.map(Math.round)})   t=1 → rgb(${last.map(Math.round)})`)

    const raster = field.buildRasterRGBA('precip', 12, maskInfo)
    const stats = field.rasterStats(raster)

    check('★栅格只给境内像素上色（掩膜外 alpha 全为 0，颜色不会溢到海上）',
      raster.opaque === maskInfo.inside,
      `着色 ${raster.opaque} 像素 / 掩膜境内 ${maskInfo.inside}`)

    check('★栅格颜色确实有层次（而不是"整张图一个颜色"）',
      stats.distinctColors > 60 && stats.stdevLuma > 12,
      `不同颜色 ${stats.distinctColors} 种，亮度标准差 ${stats.stdevLuma}，亮度区间 ${stats.minLuma}~${stats.maxLuma}`)

    check('栅格可复现（同图层同帧两次像素完全一致）',
      Buffer.compare(
        Buffer.from(field.buildRasterRGBA('precip', 12, maskInfo).rgba.buffer),
        Buffer.from(field.buildRasterRGBA('precip', 12, maskInfo).rgba.buffer)
      ) === 0,
      '逐字节比较一致')

    const f0 = field.buildRasterRGBA('precip', 0, maskInfo)
    const f12 = field.buildRasterRGBA('precip', 12, maskInfo)
    const f24 = field.buildRasterRGBA('precip', 24, maskInfo)
    const diff = (a, b) => {
      let n = 0
      for (let i = 0; i < a.rgba.length; i += 4) {
        if (a.rgba[i] !== b.rgba[i] || a.rgba[i + 1] !== b.rgba[i + 1] || a.rgba[i + 2] !== b.rgba[i + 2]) {
          n++
        }
      }
      return n
    }
    // ⚠️ 这里必须比较**首帧与末帧**：最初漂移用 sin(phase·2π)，相位 0 与 1 完全相同，
    //    导致时间轴最后一帧和第一帧逐像素一致（荡出去再荡回来）。本断言就是那条 bug 的防线。
    check('★时间轴最后一帧 ≠ 第一帧（不是"荡出去又荡回来"）',
      diff(f0, f24) / (f0.width * f0.height) > 0.1,
      `首帧 vs 末帧：${diff(f0, f24)} / ${f0.width * f0.height} 像素不同`)

    check('★时间轴中途帧也与首帧明显不同（雨团确实在移动）',
      diff(f0, f12) / (f0.width * f0.height) > 0.2,
      `首帧 vs 第13帧：${diff(f0, f12)} / ${f0.width * f0.height} 像素不同`)

    // 每个图层都要有色彩层次（防止某个图层又变成一片纯色）
    const layStats = []
    let flatLayers = 0
    for (const L of field.WEATHER_LAYERS) {
      const s = field.rasterStats(field.buildRasterRGBA(L.key, 12, maskInfo))
      layStats.push(`${L.label}:${s.distinctColors}色/σ${s.stdevLuma}`)
      if (s.distinctColors < 40 || s.stdevLuma < 8) {
        flatLayers++
      }
    }
    check('★全部 10 个图层都有足够色彩层次（无一层是纯色）',
      flatLayers === 0,
      layStats.join('  '))
  }

  /* ══════════════════ 输出 ══════════════════ */

  const pass = rows.filter(r => r.pass).length
  const width = String(rows.length).length
  console.log('')
  console.log('农业监测大屏 —— 逻辑回归测试')
  console.log('='.repeat(78))
  rows.forEach((r, i) => {
    const no = String(i + 1).padStart(width, ' ')
    console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${no}. ${r.name}`)
    if (r.detail) {
      console.log(`            ${r.detail}`)
    }
  })
  console.log('='.repeat(78))
  console.log(`${pass}/${rows.length} 通过${pass === rows.length ? '' : '  ← 存在失败项'}`)
  console.log('')

  cleanup()
  process.exit(pass === rows.length ? 0 : 1)
}

main().catch(e => {
  console.error('测试脚本自身异常：', e)
  cleanup()
  process.exit(2)
})
