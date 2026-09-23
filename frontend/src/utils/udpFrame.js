/**
 * 北斗/GIS 农田采样回传帧 编解码器
 *
 * 严格按任务书 §2「作业数据回传帧建议结构」实现（共 **19 字节**，大端序）：
 *
 *   偏移  长度  字段        编码说明
 *   ----  ----  ----------  --------------------------------------------------
 *   0     2B    帧头        0xFF 0x55（固定）
 *   2     2B    采样点ID    无符号整数，取值 0~65535（任务书 M1 要求唯一编号）
 *   4     4B    纬度 LAT    放大 1e7 的**有符号**整数（度），大端
 *   8     4B    经度 LON    放大 1e7 的**有符号**整数（度），大端
 *   12    1B    土壤温度    int8，°C
 *   13    1B    土壤湿度    uint8，%
 *   14    1B    空气温度    int8，°C
 *   15    1B    空气湿度    uint8，%
 *   16    1B    土壤深度    uint8，cm
 *   17    2B    CRC         CRC-16/MODBUS，覆盖前 17 字节
 *
 * ── 两处任务书未写明、需要和 2号/5号 对齐的地方（本实现的选择已显式标注）──
 *   1. **CRC 字节序**：按 Modbus 常规「低字节在前」存放；`CRC_BYTE_ORDER` 常量
 *      可用于切换，两边必须一致，否则校验永远失败。
 *   2. **1 字节温度的负值表示**：任务书只说「1B，°C」。温度可能为负，
 *      因此按 **int8 二进制补码** 解释（-40~127 可表达，覆盖农田全场景）；
 *      湿度/深度物理上非负，按 uint8 解释。若 2号 用的是「加 40 偏移」方案，
 *      改 `TEMP_ENCODING` 一处即可。
 *
 * 这个文件是**真实可用的编解码逻辑**，不是演示占位：
 *   编码 → 解码 必须字节级还原，`frontend/tests/monitor/run.mjs` 里有往返断言。
 */

/* ───────────────────────── 常量 ───────────────────────── */

export const FRAME_HEADER = [0xFF, 0x55]
export const FRAME_LENGTH = 19
export const CRC_OFFSET = 17
export const COORD_SCALE = 1e7
export const POINT_ID_MAX = 65535

/** CRC 字节序：'little' = 低字节在前（Modbus 常规，默认）；'big' = 高字节在前 */
export const CRC_BYTE_ORDER = 'little'

/** 温度编码：'int8' = 二进制补码（默认）；'offset40' = 原始值 + 40 存 uint8 */
export const TEMP_ENCODING = 'int8'

/**
 * 5 项采样指标的顺序 = 帧内出现顺序（不可调换，改了就对不上）。
 * 字段名使用团队冻结的公共字段（驼峰），与后端 DTO 完全一致，不另起别名。
 */
export const METRIC_ORDER = [
  { key: 'soilTemperature', label: '土壤温度', unit: '°C', bytes: 1, type: 'temp' },
  { key: 'soilMoisture', label: '土壤湿度', unit: '%', bytes: 1, type: 'uint8' },
  { key: 'airTemperature', label: '空气温度', unit: '°C', bytes: 1, type: 'temp' },
  { key: 'airHumidity', label: '空气湿度', unit: '%', bytes: 1, type: 'uint8' },
  { key: 'soilDepth', label: '土壤深度', unit: 'cm', bytes: 1, type: 'uint8' }
]

/* ───────────────────────── CRC-16/MODBUS ───────────────────────── */

/**
 * CRC-16/MODBUS：多项式 0x8005 反射形式 0xA001，初值 0xFFFF，无最终异或。
 * 校验值 "123456789" 应为 0x4B37（标准自测向量，测试里会断言）。
 */
export function crc16Modbus (bytes, start = 0, end = bytes.length) {
  let crc = 0xFFFF
  for (let i = start; i < end; i++) {
    crc ^= bytes[i] & 0xFF
    for (let b = 0; b < 8; b++) {
      crc = (crc & 1) ? ((crc >>> 1) ^ 0xA001) : (crc >>> 1)
    }
  }
  return crc & 0xFFFF
}

/* ───────────────────────── 编码 ───────────────────────── */

/** 经纬度 → int32（度 ×1e7）。非有限数或超范围**直接抛错**，不静默截断 */
function encodeCoord (value, name) {
  if (typeof value !== 'number' || !isFinite(value)) {
    throw new Error(`${name} 不是有效数字（收到 ${JSON.stringify(value)}）`)
  }
  const scaled = Math.round(value * COORD_SCALE)
  if (scaled < -2147483648 || scaled > 2147483647) {
    throw new Error(`${name}=${value} 超出 int32 可表达范围`)
  }
  return scaled
}

function encodeTemp (value, name) {
  if (typeof value !== 'number' || !isFinite(value)) {
    throw new Error(`${name} 不是有效数字（收到 ${JSON.stringify(value)}）`)
  }
  if (TEMP_ENCODING === 'offset40') {
    const v = Math.round(value) + 40
    if (v < 0 || v > 255) {
      throw new Error(`${name}=${value} 超出 offset40 可表达范围（-40~215°C）`)
    }
    return v
  }
  const v = Math.round(value)
  if (v < -128 || v > 127) {
    throw new Error(`${name}=${value} 超出 int8 可表达范围（-128~127°C）`)
  }
  return v < 0 ? v + 256 : v
}

function encodeUint8 (value, name, max = 255) {
  if (typeof value !== 'number' || !isFinite(value)) {
    throw new Error(`${name} 不是有效数字（收到 ${JSON.stringify(value)}）`)
  }
  const v = Math.round(value)
  if (v < 0 || v > max) {
    throw new Error(`${name}=${value} 超出 0~${max} 范围`)
  }
  return v
}

/**
 * 把一条采样记录编码成 19 字节回传帧
 * @param {object} sample
 * @param {number} sample.samplingPointId 采样点 ID，0~65535
 * @param {number} sample.latitude  纬度（度）
 * @param {number} sample.longitude 经度（度）
 * @param {number} sample.soilTemperature / soilMoisture / airTemperature / airHumidity / soilDepth
 * @returns {Uint8Array} 19 字节
 */
export function encodeFrame (sample) {
  if (!sample || typeof sample !== 'object') {
    throw new Error('encodeFrame 需要一个采样记录对象')
  }
  const pid = sample.samplingPointId
  if (typeof pid !== 'number' || !isFinite(pid) || pid < 0 || pid > POINT_ID_MAX || pid !== Math.round(pid)) {
    throw new Error(`samplingPointId=${JSON.stringify(pid)} 不是 0~${POINT_ID_MAX} 内的整数`)
  }

  const lat = encodeCoord(sample.latitude, 'latitude')
  const lon = encodeCoord(sample.longitude, 'longitude')

  const buf = new Uint8Array(FRAME_LENGTH)
  const view = new DataView(buf.buffer)
  buf[0] = FRAME_HEADER[0]
  buf[1] = FRAME_HEADER[1]
  view.setUint16(2, pid, false)                      // 大端
  view.setInt32(4, lat, false)
  view.setInt32(8, lon, false)

  let off = 12
  for (const m of METRIC_ORDER) {
    const raw = m.type === 'temp'
      ? encodeTemp(sample[m.key], m.key)
      : encodeUint8(sample[m.key], m.key, m.key === 'soilDepth' ? 255 : 100)
    buf[off++] = raw
  }

  const crc = crc16Modbus(buf, 0, CRC_OFFSET)
  if (CRC_BYTE_ORDER === 'little') {
    buf[17] = crc & 0xFF
    buf[18] = (crc >>> 8) & 0xFF
  } else {
    buf[17] = (crc >>> 8) & 0xFF
    buf[18] = crc & 0xFF
  }
  return buf
}

/* ───────────────────────── 解码 ───────────────────────── */

function decodeTemp (raw) {
  if (TEMP_ENCODING === 'offset40') {
    return raw - 40
  }
  return raw > 127 ? raw - 256 : raw
}

/**
 * 解析回传帧。**任何一步不合法都抛错并说明原因**，绝不返回"猜"出来的值。
 * @param {Uint8Array|number[]} bytes
 * @returns {object} 解析结果 + 校验信息
 */
export function decodeFrame (bytes) {
  const b = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes || [])
  if (b.length !== FRAME_LENGTH) {
    throw new Error(`帧长度错误：应为 ${FRAME_LENGTH} 字节，实际 ${b.length} 字节`)
  }
  if (b[0] !== FRAME_HEADER[0] || b[1] !== FRAME_HEADER[1]) {
    throw new Error(`帧头错误：应为 FF 55，实际 ${toHex(b.slice(0, 2))}`)
  }
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength)
  const crcExpect = crc16Modbus(b, 0, CRC_OFFSET)
  const crcGot = CRC_BYTE_ORDER === 'little'
    ? (b[17] | (b[18] << 8))
    : ((b[17] << 8) | b[18])
  if (crcExpect !== crcGot) {
    throw new Error(`CRC 校验失败：计算值 0x${crcExpect.toString(16).toUpperCase()}，帧内值 0x${crcGot.toString(16).toUpperCase()}`)
  }

  const out = {
    samplingPointId: view.getUint16(2, false),
    latitude: view.getInt32(4, false) / COORD_SCALE,
    longitude: view.getInt32(8, false) / COORD_SCALE,
    crcOk: true,
    crc: crcGot,
    length: b.length
  }
  let off = 12
  for (const m of METRIC_ORDER) {
    out[m.key] = m.type === 'temp' ? decodeTemp(b[off]) : b[off]
    off++
  }
  return out
}

/* ───────────────────────── 展示辅助 ───────────────────────── */

/** 字节数组 → "FF 55 00 03 ..." */
export function toHex (bytes) {
  return Array.from(bytes).map(v => (v & 0xFF).toString(16).toUpperCase().padStart(2, '0')).join(' ')
}

/**
 * 带偏移与字段名的十六进制展开，用于大屏上展示"帧结构"
 * @returns {Array<{offset:number, hex:string, field:string, raw:number}>}
 */
export function hexFields (bytes) {
  const b = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes || [])
  const rows = []
  const push = (offset, len, field) => {
    const slice = b.slice(offset, offset + len)
    rows.push({
      offset,
      len,
      hex: toHex(slice),
      field,
      raw: Array.from(slice)
    })
  }
  push(0, 2, '帧头 0xFF55')
  push(2, 2, '采样点ID')
  push(4, 4, '纬度 LAT ×1e7')
  push(8, 4, '经度 LON ×1e7')
  push(12, 1, '土壤温度')
  push(13, 1, '土壤湿度')
  push(14, 1, '空气温度')
  push(15, 1, '空气湿度')
  push(16, 1, '土壤深度')
  push(17, 2, 'CRC-16/MODBUS')
  return rows
}

/** 帧结构表（用于界面展示"协议"，与任务书 §2 表格逐行对应） */
export const FRAME_LAYOUT = [
  { field: '帧头', bytes: '2B', desc: '0xFF 0x55', value: '0xFF55' },
  { field: '采样点ID', bytes: '2B', desc: '唯一编号，0~65535', value: 'uint16 BE' },
  { field: '纬度 LAT', bytes: '4B', desc: '放大 1e7 的有符号整数（度）', value: 'int32 BE' },
  { field: '经度 LON', bytes: '4B', desc: '放大 1e7 的有符号整数（度）', value: 'int32 BE' },
  { field: '土壤温度', bytes: '1B', desc: '°C', value: 'int8' },
  { field: '土壤湿度', bytes: '1B', desc: '%', value: 'uint8' },
  { field: '空气温度', bytes: '1B', desc: '°C', value: 'int8' },
  { field: '空气湿度', bytes: '1B', desc: '%', value: 'uint8' },
  { field: '土壤深度', bytes: '1B', desc: 'cm', value: 'uint8' },
  { field: 'CRC', bytes: '2B', desc: 'CRC-16/MODBUS', value: '低字节在前' }
]

export default {
  FRAME_HEADER,
  FRAME_LENGTH,
  METRIC_ORDER,
  FRAME_LAYOUT,
  crc16Modbus,
  encodeFrame,
  decodeFrame,
  toHex,
  hexFields
}
