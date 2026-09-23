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
 *   E. echarts 压缩坐标解码（真实 bug 的回归防线）
 *      - china.json 确实是压缩坐标；解码后环收集/PIP 正常
 *      - ★**半解码混合状态**：echarts 就地解码后会留下 encodeOffsets，
 *        此时不能再判为"压缩格式"，否则会抛 `encoded.charCodeAt is not a function`
 *        （真实事故：切换图层/返回全国时报「图层渲染失败」）
 *      - ★`loadChinaGeoJson()` 交付的必须是普通坐标，echarts 不会就地改写我们的缓存
 *   F. 栅格掩膜  G. 栅格着色  H. 角色赋权  I. 录入规则引擎
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
  ['utils/geo/chinaMapLoader.js', 'chinaMapLoader.js'],
  ['mock/agrimonitor/geoData.js', 'geoData.js'],
  ['mock/agrimonitor/thresholds.js', 'thresholds.js'],
  ['mock/agrimonitor/monitorData.js', 'monitorData.js'],
  ['mock/agrimonitor/weatherField.js', 'weatherField.js'],
  ['mock/agrimonitor/samplingRule.js', 'samplingRule.js'],
  ['mock/agrimonitor/experiments.js', 'experiments.js'],
  ['mock/agrimonitor/frameStream.js', 'frameStream.js'],
  ['mock/agrimonitor/taskData.js', 'taskData.js'],
  ['views/modules/agrimonitor/permissions.js', 'permissions.js'],
  ['monitordemo/roles.js', 'roles.js']
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
    text = text.replace(
      /from '\.\/(geoData|geojson|udpFrame|experiments|frameStream|taskData|thresholds|samplingRule|monitorData)'/g,
      "from './$1.js'"
    )
    // webpack 别名
    text = text.replace(/from '@\/utils\/udpFrame'/g, "from './udpFrame.js'")
    text = text.replace(/from '@\/views\/modules\/agrimonitor\/permissions'/g, "from './permissions.js'")
    // 第三方依赖换成桩：本测试脚本要在"没装依赖"的机器上也能跑
    text = text.replace(/import \* as echarts from 'echarts'/g, "import * as echarts from './echarts-stub.js'")
    fs.writeFileSync(path.join(workDir, flat), text)
  })

  // echarts 桩：只复刻 registerMap 的**就地解码**行为（这正是事故的根源）
  fs.writeFileSync(path.join(workDir, 'echarts-stub.js'), `
let decodeCount = 0
export function reset () { decodeCount = 0 }
export function decodedCount () { return decodeCount }
/** 复刻 echarts/lib/coord/geo/parseGeoJson.js 的 decode() */
function decode (json) {
  if (!json || !json.UTF8Encoding) return json
  decodeCount++
  for (const f of json.features) {
    const geometry = f.geometry
    const offsets = geometry.encodeOffsets
    const coords = geometry.coordinates
    for (let c = 0; c < coords.length; c++) {
      const poly = coords[c]
      coords[c] = typeof poly === 'string' ? String(poly).split('').map(Number) : poly
    }
    void offsets
  }
  json.UTF8Encoding = false
  return json
}
export function registerMap (name, geoJson) { decode(geoJson) }
export function getMap () { return null }
export function init () { return { setOption () {}, resize () {}, dispose () {}, on () {}, getOption () { return { series: [] } } } }
export default { registerMap, getMap, init }
`, 'utf8')

  // fetch 桩：把 GEO_URL 指到仓库里真实的那份 china.json
  const rawGeo = fs.readFileSync(path.join(GEO_DIR, 'china.json'), 'utf8')
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => JSON.parse(rawGeo) })
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
  const perms = await importFrom('permissions.js')
  const demoRoles = await importFrom('roles.js')
  const rule = await importFrom('samplingRule.js')
  const thresholds = await importFrom('thresholds.js')

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
  }

  /* ── 半解码混合状态的回归（真实事故：图层渲染失败：encoded.charCodeAt is not a function）── */

  {
    // 复刻事故现场：echarts 的 parseGeoJson.decode() 会**就地**把 coordinates 换成数组、
    // 把顶层 UTF8Encoding 置 false，但**保留 geometry.encodeOffsets**。
    const half = JSON.parse(fs.readFileSync(path.join(GEO_DIR, 'china.json'), 'utf8'))
    const halfPlain = G.ensurePlainGeoJson(half)
    half.features.forEach((f, i) => {
      f.geometry.coordinates = halfPlain.features[i].geometry.coordinates
    })
    half.UTF8Encoding = false

    const halfGeo = half.features[0].geometry
    check('测试数据前提：造出"encodeOffsets 还在、坐标却已是数组"的半解码状态',
      !!halfGeo.encodeOffsets && Array.isArray(halfGeo.coordinates[0]) &&
        typeof halfGeo.coordinates[0].charCodeAt === 'undefined',
      `encodeOffsets 存在=${!!halfGeo.encodeOffsets}，坐标类型=${Object.prototype.toString.call(halfGeo.coordinates[0])}，charCodeAt=${typeof halfGeo.coordinates[0].charCodeAt}`)

    check('★回归：半解码状态不能再被判为"压缩格式"（旧版会误判 → charCodeAt 报错）',
      G.isEncodedGeometry(halfGeo) === false,
      `isEncodedGeometry=${G.isEncodedGeometry(halfGeo)}`)

    let halfErr = ''
    let halfOut = null
    try {
      halfOut = G.ensurePlainGeoJson(half)
    } catch (e) {
      halfErr = (e && e.message) || String(e)
    }
    check('★回归：对半解码数据调用 ensurePlainGeoJson 不抛异常',
      halfErr === '' && halfOut === half,
      halfErr ? `抛错：${halfErr}` : '未抛错，且零拷贝直通')

    const halfSx = half.features.filter(f => f.properties.name === '山西')[0]
    const halfRings = G.ringsOfGeometry(halfSx.geometry)
    check('★回归：半解码数据仍能收集到山西外环，且太原判为境内',
      halfRings.length === 1 && halfRings.some(r => G.pointInRing(112.5489, 37.8712, r.ring)),
      `${halfRings.length} 个环`)
  }

  /* ── 交给 echarts 的缓存必须是"普通坐标"，否则会被就地改写 ── */

  {
    const loader = await importFrom('chinaMapLoader.js')
    const stub = await importFrom('echarts-stub.js')
    stub.reset()

    const registered = await loader.registerChinaMap(stub)
    check('注册给 echarts 的地图名正确',
      registered === 'china', `返回 ${registered}`)

    const cached = await loader.loadChinaGeoJson()
    check('★回归：loadChinaGeoJson 交付的是普通坐标（无 UTF8Encoding / encodeOffsets）',
      cached.UTF8Encoding === undefined &&
        cached.features.every(f => f.geometry.encodeOffsets === undefined) &&
        Array.isArray(cached.features[0].geometry.coordinates[0]),
      `UTF8Encoding=${cached.UTF8Encoding}，feature0.encodeOffsets=${cached.features[0].geometry.encodeOffsets}`)

    check('★回归：echarts 不会就地改写我们缓存的对象（stub 复刻了它的 decode）',
      stub.decodedCount() === 0,
      `stub 尝试解码 ${stub.decodedCount()} 次（0 = 因为它没有 UTF8Encoding 标记而直接跳过）`)

    const again = await loader.loadChinaGeoJson()
    let err2 = ''
    try {
      G.collectRings(G.ensurePlainGeoJson(again))
    } catch (e) {
      err2 = (e && e.message) || String(e)
    }
    check('★回归：反复取缓存并解码不再报 encoded.charCodeAt（原先 100% 复现）',
      err2 === '' && again.features.length === 34,
      err2 ? `抛错：${err2}` : `34 个省级要素正常`)

    const sx = again.features.filter(f => f.properties.name === '山西')[0]
    check('★回归：缓存里的山西坐标仍然可用（太原判为境内）',
      G.ringsOfGeometry(sx.geometry).some(r => G.pointInRing(112.5489, 37.8712, r.ring)),
      '太原在山西境内')
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

  /* ══════════════════ H. 角色赋权（路由级权限） ══════════════════ */

  {
    // 造一个最小的 localStorage / window 环境（permissions.js 读取 localStorage.permissions）
    const store = {}
    global.window = {
      localStorage: {
        getItem: k => (k in store ? store[k] : null),
        setItem: (k, v) => { store[k] = String(v) },
        removeItem: k => { delete store[k] }
      }
    }
    const setPerms = list => { store.permissions = JSON.stringify(list) }

    check('权限码命名符合 <module>:<CamelResource>:<action> 规范',
      perms.AGRI_PERMISSIONS.length === 5 &&
        perms.AGRI_PERMISSIONS.every(p => /^agrimonitor:[a-zA-Z]+:view$/.test(p)),
      perms.AGRI_PERMISSIONS.join(', '))

    check('5 个权限码互不相同',
      new Set(perms.AGRI_PERMISSIONS).size === 5,
      perms.AGRI_PERMISSIONS.join(', '))

    // ── 严格拒绝：这是 GIS 模块合并评审里被点名的「权限默认放行」问题，必须有防线 ──
    delete store.permissions
    check('★权限列表缺失时一律拒绝（不做"取不到就放行"的兜底）',
      perms.currentPermissions().length === 0 &&
        perms.hasAgriPermission(perms.PERM_DASHBOARD) === false,
      'localStorage.permissions 不存在 → hasAgriPermission = false')

    setPerms([])
    check('★权限列表为空数组时同样拒绝',
      perms.hasAgriPermission(perms.PERM_DASHBOARD) === false,
      'permissions = [] → false')

    store.permissions = '{ 这不是合法 JSON'
    check('权限内容损坏时不抛错，按"无权限"处理',
      perms.currentPermissions().length === 0,
      '坏 JSON → []')

    store.permissions = '{"a":1}'
    check('权限内容不是数组时按"无权限"处理',
      perms.currentPermissions().length === 0,
      '对象 → []')

    // ── 正常授权 ──
    const adminPerms = [perms.PERM_DASHBOARD, perms.PERM_REGION_MONITOR,
      perms.PERM_SAMPLING_ENTRY, perms.PERM_DATABASE_MANAGE, perms.PERM_REMOTE_SENSING]
    setPerms(adminPerms)
    check('管理员权限下 5 个页面全部放行',
      perms.AGRI_PERMISSIONS.every(p => perms.hasAgriPermission(p)),
      perms.AGRI_PERMISSIONS.length + ' 个权限码全部命中')

    setPerms([perms.PERM_DASHBOARD, perms.PERM_SAMPLING_ENTRY])
    check('★采集员只有大屏 + 数据录入时，其余 3 个页面被拒绝',
      perms.hasAgriPermission(perms.PERM_DASHBOARD) === true &&
        perms.hasAgriPermission(perms.PERM_SAMPLING_ENTRY) === true &&
        perms.hasAgriPermission(perms.PERM_REGION_MONITOR) === false &&
        perms.hasAgriPermission(perms.PERM_DATABASE_MANAGE) === false &&
        perms.hasAgriPermission(perms.PERM_REMOTE_SENSING) === false,
      '只有 dashboard / samplingEntry 命中')

    void adminPerms

    // ── 守卫 next() 的行为 ──
    const runGuard = (guard, to = { path: '/agrimonitor/DatabaseManage' }) => {
      let called = null
      guard(to, {}, arg => { called = arg })
      return called
    }

    setPerms([perms.PERM_DASHBOARD])
    const denied = runGuard(perms.requirePermission(perms.PERM_DATABASE_MANAGE))
    check('★无权限时守卫跳转到「无访问权限」页，并带上被拦截路径与缺失权限码',
      denied && denied.name === 'agri-no-permission' &&
        denied.query && denied.query.from === '/agrimonitor/DatabaseManage' &&
        denied.query.need === perms.PERM_DATABASE_MANAGE,
      JSON.stringify(denied))

    setPerms([perms.PERM_DATABASE_MANAGE])
    const allowed = runGuard(perms.requirePermission(perms.PERM_DATABASE_MANAGE))
    check('有权限时守卫放行（next() 不带参数）',
      allowed === undefined, 'next() 被无参调用')

    // ── 前端不写死角色判断 ──
    const permSrc = fs.readFileSync(path.join(srcRoot, 'views/modules/agrimonitor/permissions.js'), 'utf8')
    check('★前端权限模块里没有"是不是管理员"这类写死的角色判断',
      !/管理员|isAdmin|admin\b/i.test(permSrc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '')),
      '注释以外无角色名判断')

    const routeSrc = fs.readFileSync(path.join(srcRoot, 'router/staticRoutes.js'), 'utf8')
    check('★5 条监测路由都挂了 beforeEnter 权限守卫',
      (routeSrc.match(/beforeEnter:\s*requirePermission\(/g) || []).length === 5,
      (routeSrc.match(/beforeEnter:\s*requirePermission\(/g) || []).length + ' 条')

    check('★staticRoutes.js 没有 import @/utils（避免 staticRoutes→utils→router 循环依赖白屏）',
      !/from '@\/utils'/.test(routeSrc) && !/from '@\/utils\//.test(routeSrc),
      '未引用 @/utils')

    // ── 演示用角色映射 ──
    const roleKeys = demoRoles.DEMO_ROLES.map(r => r.key)
    check('演示角色含 admin / collector，且默认是 admin',
      roleKeys.indexOf('admin') >= 0 && roleKeys.indexOf('collector') >= 0 &&
        demoRoles.DEFAULT_ROLE === 'admin',
      roleKeys.join(', '))

    const collector = demoRoles.roleByKey('collector')
    check('★演示角色「采集员」= 监控大屏 + 采样数据录入，不含管理类功能',
      demoRoles.roleHasPermission(collector, perms.PERM_DASHBOARD) === true &&
        demoRoles.roleHasPermission(collector, perms.PERM_SAMPLING_ENTRY) === true &&
        demoRoles.roleHasPermission(collector, perms.PERM_DATABASE_MANAGE) === false &&
        demoRoles.roleHasPermission(collector, perms.PERM_REMOTE_SENSING) === false &&
        collector.permissions.length === 2,
      `采集员权限数 ${collector.permissions.length}`)

    const admin = demoRoles.roleByKey('admin')
    check('演示角色「管理员」拥有全部 5 个权限',
      perms.AGRI_PERMISSIONS.every(p => demoRoles.roleHasPermission(admin, p)),
      `管理员权限数 ${admin.permissions.length}`)

    check('roleByKey 对未知 key 会退回默认角色，不会返回 undefined',
      demoRoles.roleByKey('不存在的角色') === demoRoles.roleByKey(demoRoles.DEFAULT_ROLE),
      demoRoles.roleByKey('不存在的角色').key)

    delete global.window
  }

  /* ══════════════════ I. 采样数据录入（规则引擎） ══════════════════ */

  {
    check('阈值定义齐全：5 项，顺序与回传帧内的顺序一致',
      thresholds.AGRI_THRESHOLD_KEYS.length === 5 &&
        thresholds.AGRI_THRESHOLD_KEYS.join(',') ===
          'soilTemperature,soilMoisture,airTemperature,airHumidity,soilDepth',
      thresholds.AGRI_THRESHOLD_KEYS.join(' → '))

    check('每项阈值都有 label/unit/min/max 且 min < max',
      thresholds.AGRI_THRESHOLD_KEYS.every(k => {
        const t = thresholds.AGRI_THRESHOLDS[k]
        return t && t.label && t.unit && t.min < t.max
      }),
      thresholds.AGRI_THRESHOLD_KEYS.map(k => {
        const t = thresholds.AGRI_THRESHOLDS[k]
        return `${t.label} ${t.min}~${t.max}${t.unit}`
      }).join(' / '))

    // ── 数值解析：绝不能把"没填"当成 0 ──
    check('★空串 / null / undefined 解析为 null，不当作 0',
      rule.toNumberOrNull('') === null && rule.toNumberOrNull(null) === null &&
        rule.toNumberOrNull(undefined) === null,
      '三种空值都是 null')

    check('非数字字符串解析为 null（"abc" 不会变成 NaN 到处传播）',
      rule.toNumberOrNull('abc') === null, 'abc → null')

    check('合法数字正常解析（含 0）',
      rule.toNumberOrNull('12.5') === 12.5 && rule.toNumberOrNull(0) === 0,
      '12.5 与 0 都正确')

    // ── 示例样本：应判定为全部正常 ──
    const demo = rule.evaluateSample(rule.DEFAULT_SAMPLE)
    check('示例样本 5 项全部判定为正常',
      demo.indicators.length === 5 && demo.indicators.every(i => i.status.key === 'ok'),
      demo.indicators.map(i => `${i.label}=${i.value}(${i.status.label})`).join(' '))

    check('示例样本评分 100、结论为"可直接提交"、等级为提示级',
      demo.conclusion.score === 100 && demo.conclusion.tone === 'ok' &&
        demo.conclusion.level.code === 'low',
      `${demo.conclusion.score} 分 / ${demo.conclusion.title} / ${demo.conclusion.level.label}`)

    check('★示例样本能成功封装成 19 字节回传帧，且反解值自洽',
      demo.frame.ok && demo.frame.length === 19 &&
        demo.frame.decoded.samplingPointId === rule.DEFAULT_SAMPLE.samplingPointId,
      `${demo.frame.length} 字节  hex=${demo.frame.hex}`)

    // ── 逐项判定方向 ──
    const low = rule.evaluateIndicators({ ...rule.DEFAULT_SAMPLE, soilMoisture: 5 })
    check('低于下限判为"偏低"并给出下限提示',
      low[1].status.key === 'low' && /低于适宜下限/.test(low[1].advice),
      `${low[1].label} ${low[1].value}${low[1].unit} → ${low[1].status.label}（${low[1].advice}）`)

    const high = rule.evaluateIndicators({ ...rule.DEFAULT_SAMPLE, soilTemperature: 60 })
    check('高于上限判为"偏高"并给出上限提示',
      high[0].status.key === 'high' && /高于适宜上限/.test(high[0].advice),
      `${high[0].label} ${high[0].value}${high[0].unit} → ${high[0].status.label}（${high[0].advice}）`)

    const missing = rule.evaluateIndicators({ ...rule.DEFAULT_SAMPLE, airHumidity: '' })
    check('★未填写的指标判为"不可编码"，而不是当作 0 混过去',
      missing[3].value === null && missing[3].status.key === 'bad' &&
        /未填写/.test(missing[3].advice),
      `${missing[3].label} → ${missing[3].status.label}（${missing[3].advice}）`)

    const tooBig = rule.evaluateIndicators({ ...rule.DEFAULT_SAMPLE, soilDepth: 300 })
    check('★超出 1 字节可编码范围（>255）判为"不可编码"',
      tooBig[4].status.key === 'bad' && /1 字节/.test(tooBig[4].advice),
      `${tooBig[4].label} ${tooBig[4].value} → ${tooBig[4].status.label}`)

    // ── 硬性校验 ──
    const badCoord = rule.validateSample({ ...rule.DEFAULT_SAMPLE, latitude: '' })
    check('★坐标缺失属于硬性错误（不允许猜测默认值）',
      badCoord.ok === false && badCoord.errors.some(e => /经纬度必须都填写/.test(e)),
      badCoord.errors.join('；'))

    const badId = rule.validateSample({ ...rule.DEFAULT_SAMPLE, samplingPointId: 70000 })
    check('采样点 ID 越界（>65535）属于硬性错误',
      badId.ok === false && badId.errors.some(e => /0~65535/.test(e)),
      badId.errors.join('；'))

    const outOfChina = rule.validateSample({ ...rule.DEFAULT_SAMPLE, longitude: 10, latitude: 10 })
    check('坐标不在中国境内只给"提示"而不是硬性错误',
      outOfChina.ok === true && outOfChina.warnings.some(w => /不在中国境内/.test(w)),
      outOfChina.warnings.join('；'))

    // ── 封装失败时不吞异常 ──
    const frameFail = rule.buildFrame({ ...rule.DEFAULT_SAMPLE, longitude: '' })
    check('★坐标缺失时封装失败，且把原因原样带出来（不吞异常）',
      frameFail.ok === false && frameFail.hex === '' && /不是有效数字/.test(frameFail.error),
      frameFail.error)

    const invalid = rule.evaluateSample({ ...rule.DEFAULT_SAMPLE, latitude: null })
    check('★存在硬性错误时：评分 0、结论"不可提交"、且不允许提交',
      invalid.validation.ok === false && invalid.conclusion.score === 0 &&
        invalid.conclusion.title === '不可提交' && invalid.conclusion.tone === 'bad',
      `${invalid.conclusion.score} 分 / ${invalid.conclusion.title}`)

    // ── 结论等级随偏离项数变化 ──
    const oneOff = rule.evaluateSample({ ...rule.DEFAULT_SAMPLE, soilMoisture: 5 })
    check('1 项偏离 → 等级 medium（重要）、结论里点出是哪一项',
      oneOff.conclusion.level.code === 'medium' &&
        oneOff.conclusion.score === 80 &&
        /土壤湿度/.test(oneOff.conclusion.detail),
      `${oneOff.conclusion.score} 分 / ${oneOff.conclusion.level.label} / ${oneOff.conclusion.detail}`)

    const threeOff = rule.evaluateSample({
      ...rule.DEFAULT_SAMPLE, soilMoisture: 5, airHumidity: 95, soilDepth: 60
    })
    check('≥3 项偏离 → 等级 high（紧急）',
      threeOff.conclusion.level.code === 'high' && threeOff.conclusion.score === 40 &&
        threeOff.conclusion.tone === 'bad',
      `${threeOff.conclusion.score} 分 / ${threeOff.conclusion.level.label}`)

    check('同输入两次评估结果完全一致（可复现）',
      JSON.stringify(rule.evaluateSample(rule.DEFAULT_SAMPLE)) ===
        JSON.stringify(rule.evaluateSample(rule.DEFAULT_SAMPLE)),
      '逐字段一致')

    // ── 页面接线 ──
    const entryRouteSrc = fs.readFileSync(path.join(srcRoot, 'router/staticRoutes.js'), 'utf8')
    check('★「采样数据录入」页面已接线：路由 + 权限守卫 + 权限码',
      /\/agrimonitor\/SamplingEntry/.test(entryRouteSrc) &&
        /PERM_SAMPLING_ENTRY/.test(entryRouteSrc) &&
        perms.AGRI_PERMISSIONS.indexOf(perms.PERM_SAMPLING_ENTRY) >= 0,
      'SamplingEntry 路由与权限码都在')

    const entrySrc = fs.readFileSync(
      path.join(srcRoot, 'views/modules/agrimonitor/SamplingEntry.vue'), 'utf8')
    check('★录入页不调用任何写接口、不碰数据库（只在本页内存记录）',
      !/httpRequest|axios|\$http|request\(/.test(entrySrc) &&
        /不写数据库|不调接口/.test(entrySrc),
      '无网络请求代码')
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
