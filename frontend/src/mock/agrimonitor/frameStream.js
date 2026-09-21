/**
 * 回传帧采集流（首页大屏「任务书指标区」用）
 *
 * 这里生成的是**真实的 19 字节回传帧**：
 *   先用确定性伪随机数造出采样记录 → 用 `@/utils/udpFrame` 真编码成字节 →
 *   再真解码回来做展示。所以页面上看到的十六进制、CRC、解析值三者是自洽的，
 *   任何一处编码改动都会立刻在页面上暴露。
 *
 * ⚠️ 本模块**不发送任何 UDP 报文、不连数据库**：只做"编—解"演示，
 *    真正的 UDP 发送是 2号（模拟器）与 5号（接收端）的职责。
 */

import { mulberry32 } from './geoData'
import { encodeFrame, decodeFrame, toHex, hexFields, METRIC_ORDER, FRAME_LENGTH } from '@/utils/udpFrame'

/** 采样点（与 M1 要求一致：3~4 个点，唯一采样点 ID，0~65535） */
export const SAMPLE_POINTS = [
  { samplingPointId: 1001, pointCode: 'P1', pointName: '东北角采样点', longitude: 112.5489012, latitude: 37.8712456 },
  { samplingPointId: 1002, pointCode: 'P2', pointName: '西南角采样点', longitude: 112.5442871, latitude: 37.8657412 },
  { samplingPointId: 1003, pointCode: 'P3', pointName: '中部采样点', longitude: 112.5465203, latitude: 37.8684907 },
  { samplingPointId: 1004, pointCode: 'P4', pointName: '东南角采样点', longitude: 112.5498330, latitude: 37.8663120 }
]

/** 采样点 ID 到编号的映射（展示用） */
const CODE_BY_ID = SAMPLE_POINTS.reduce((m, p) => {
  m[p.samplingPointId] = p.pointCode
  return m
}, {})

/**
 * 生成 n 条"采样记录"（尚未编码）
 * 数值范围贴合农田实际：土壤温度 8~26°C、土壤湿度 35~85%、空气温度 5~33°C、
 * 空气湿度 30~95%、土壤深度 5~30cm
 */
export function mockSamples (count = 12, seed = 20260917) {
  const rnd = mulberry32(seed)
  const out = []
  const base = Date.parse('2026-09-17T15:00:00')
  for (let i = 0; i < count; i++) {
    const p = SAMPLE_POINTS[i % SAMPLE_POINTS.length]
    const jitter = () => (rnd() - 0.5)
    out.push({
      seq: i + 1,
      samplingPointId: p.samplingPointId,
      pointCode: CODE_BY_ID[p.samplingPointId] || p.pointCode,
      // 同一点位的重复上报会有厘米级抖动，用来演示"轨迹不跳点"
      longitude: round7(p.longitude + jitter() * 0.00002),
      latitude: round7(p.latitude + jitter() * 0.00002),
      soilTemperature: round1(16 + jitter() * 9),
      soilMoisture: round1(58 + jitter() * 22),
      airTemperature: round1(21 + jitter() * 11),
      airHumidity: round1(62 + jitter() * 24),
      soilDepth: Math.round(15 + jitter() * 12),
      collectTime: new Date(base + i * 47000).toISOString().replace('T', ' ').slice(0, 19)
    })
  }
  return out
}

function round1 (v) {
  return Math.round(v * 10) / 10
}

function round7 (v) {
  return Math.round(v * 1e7) / 1e7
}

/**
 * 生成一批**已编码并已回解**的回传帧
 * @param {number} count
 * @param {number} seed
 * @returns {Array<{sample, bytes:Uint8Array, hex:string, fields:Array, decoded:object, ok:boolean, error:string}>}
 */
export function mockFrameStream (count = 12, seed = 20260917) {
  return mockSamples(count, seed).map(sample => {
    try {
      const bytes = encodeFrame(sample)
      const decoded = decodeFrame(bytes)
      return {
        sample,
        bytes,
        hex: toHex(bytes),
        fields: hexFields(bytes),
        decoded,
        ok: decoded.crcOk,
        error: ''
      }
    } catch (e) {
      return { sample, bytes: null, hex: '', fields: [], decoded: null, ok: false, error: (e && e.message) || String(e) }
    }
  })
}

/**
 * 故意损坏一帧，用来演示"CRC 校验失败会被拒绝"
 * 答辩时很有用：证明接收端不是"收到就当有效"。
 */
export function mockCorruptedFrame (seed = 20260917) {
  const frames = mockFrameStream(1, seed)
  const base = frames[0]
  if (!base || !base.bytes) {
    return null
  }
  const broken = base.bytes.slice()
  broken[13] = (broken[13] + 7) & 0xFF   // 篡改土壤湿度字节，CRC 不再匹配
  let decoded = null
  let error = ''
  try {
    decoded = decodeFrame(broken)
  } catch (e) {
    error = (e && e.message) || String(e)
  }
  return {
    hex: toHex(broken),
    decoded,
    error,
    tamperedField: '土壤湿度（偏移 13）',
    originalHex: base.hex
  }
}

export const FRAME_META = {
  length: FRAME_LENGTH,
  metrics: METRIC_ORDER,
  pointIdRange: '0 ~ 65535'
}

export default {
  SAMPLE_POINTS,
  FRAME_META,
  mockSamples,
  mockFrameStream,
  mockCorruptedFrame
}
