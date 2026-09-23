/**
 * 采样数据录入 —— 规则与计算引擎
 *
 * 需求原文：「采集者可以填入信息，然后按照一些赋权规则、算法最终计算得出结果，
 *            要么就是单独分他一个子页面专门用来录入信息功能」
 *
 * 所以本模块负责把**一行录入数据**变成**一个判定结果**，具体做 4 件事：
 *
 *   ① 逐项阈值判定 —— 5 项采样指标各自与农事适宜区间比较，给出 偏低/正常/偏高；
 *   ② 硬性合法性 —— 坐标、采样点 ID、以及"能不能装进 1 字节"这类**编码约束**，
 *      不合法直接判定为「不可提交」并说明原因（不静默兜底）；
 *   ③ 综合结论 —— 有效项占比 → 评分 → 结论文案 + 预警等级；
 *   ④ 回传帧封装 —— 用**真实的编解码器**把这条记录封成帧，给出十六进制与 CRC，
 *      让"录入"和"回传"这两件事在同一个界面上闭环。
 *
 * ⚠️ 全部为纯函数，不碰 DOM、不调接口、**不写数据库**；
 *    阈值口径与任务书的 5 项指标一致，落在 weatherField.js 的 AGRI_THRESHOLDS 里。
 */

import { AGRI_THRESHOLDS, AGRI_THRESHOLD_KEYS } from './thresholds'
import { encodeFrame, decodeFrame, toHex, FRAME_LENGTH } from '@/utils/udpFrame'
import { WARNING_LEVELS } from './monitorData'

/** 录入表单字段（顺序即 UI 顺序，与任务书 §2 帧内顺序一致） */
export const SAMPLE_FIELDS = AGRI_THRESHOLD_KEYS.map(key => {
  const t = AGRI_THRESHOLDS[key]
  return { key, label: t.label, unit: t.unit, min: t.min, max: t.max, decimals: t.decimals }
})

/** 判定状态 */
export const SAMPLE_STATUS = {
  ok: { key: 'ok', label: '正常', color: '#66bb6a', level: 0 },
  low: { key: 'low', label: '偏低', color: '#4fc3f7', level: 1 },
  high: { key: 'high', label: '偏高', color: '#ffa726', level: 2 },
  bad: { key: 'bad', label: '不可编码', color: '#ef5350', level: 3 }
}

/** 表单默认值（一个"正常"的样本，方便演示时直接点计算） */
export const DEFAULT_SAMPLE = {
  samplingPointId: 1001,
  pointCode: 'P1',
  longitude: 112.5465203,
  latitude: 37.8684907,
  soilTemperature: 18,
  soilMoisture: 28,
  airTemperature: 24,
  airHumidity: 55,
  soilDepth: 15
}

/** 数值容错解析：空串 / null / undefined / 非数字 → null（**不当作 0**） */
export function toNumberOrNull (v) {
  if (v === '' || v === null || v === undefined) {
    return null
  }
  const n = Number(v)
  return isFinite(n) ? n : null
}

/**
 * 逐项阈值判定
 * @returns {{key,label,unit,value,min,max,status,advice}[]}
 */
export function evaluateIndicators (input) {
  return SAMPLE_FIELDS.map(field => {
    const raw = toNumberOrNull(input[field.key])
    if (raw === null) {
      return {
        ...field,
        value: null,
        status: SAMPLE_STATUS.bad,
        advice: '未填写或不是数字'
      }
    }
    // 能不能装进 1 字节（任务书规定这 5 项各占 1B）
    if (raw < 0 || raw > 255) {
      return {
        ...field,
        value: raw,
        status: SAMPLE_STATUS.bad,
        advice: `超出 1 字节可编码范围（0~255）`
      }
    }
    let status = SAMPLE_STATUS.ok
    let advice = '处于适宜区间'
    if (raw < field.min) {
      status = SAMPLE_STATUS.low
      advice = `低于适宜下限 ${field.min}${field.unit}`
    } else if (raw > field.max) {
      status = SAMPLE_STATUS.high
      advice = `高于适宜上限 ${field.max}${field.unit}`
    }
    return { ...field, value: raw, status, advice }
  })
}

/**
 * 硬性合法性校验（坐标 / 采样点 ID / 编码约束）
 * @returns {{ok:boolean, errors:string[], warnings:string[]}}
 */
export function validateSample (input) {
  const errors = []
  const warnings = []

  const pid = toNumberOrNull(input.samplingPointId)
  if (pid === null) {
    errors.push('采样点 ID 必须是数字')
  } else if (!Number.isInteger(pid) || pid < 0 || pid > 65535) {
    errors.push('采样点 ID 必须是 0~65535 的整数（对应回传帧里的 2 字节）')
  }

  const lng = toNumberOrNull(input.longitude)
  const lat = toNumberOrNull(input.latitude)
  if (lng === null || lat === null) {
    errors.push('经纬度必须都填写（缺失时不允许猜测默认值）')
  } else {
    if (lng < -180 || lng > 180) {
      errors.push('经度必须在 -180~180 之间')
    }
    if (lat < -90 || lat > 90) {
      errors.push('纬度必须在 -90~90 之间')
    }
    // 本项目场景在中国境内，超范围只提示不拦（可能是演示数据）
    if (lng < 73 || lng > 136 || lat < 3 || lat > 54) {
      warnings.push('坐标不在中国境内范围（经 73~136、纬 3~54），请确认是否填错')
    }
  }

  for (const item of evaluateIndicators(input)) {
    if (item.status.key === 'bad') {
      errors.push(`${item.label}：${item.advice}`)
    }
  }

  return { ok: errors.length === 0, errors, warnings }
}

/** 按 code 取预警等级（`WARNING_LEVELS` 的 code 是 high / medium / low） */
function levelByCode (code) {
  return WARNING_LEVELS.filter(l => l.code === code)[0] || WARNING_LEVELS[WARNING_LEVELS.length - 1]
}

/**
 * 综合结论：有效项占比 → 评分 → 结论文案 + 预警等级
 *
 * 等级口径（与平台的 WARNING_LEVELS 对齐）：
 *   全部落在适宜区间        → low（提示级）
 *   1~2 项偏离              → medium（重要）
 *   ≥3 项偏离               → high（紧急）
 *   存在硬性错误            → high，且标题为「不可提交」
 */
export function buildConclusion (indicators, validation) {
  if (!validation.ok) {
    return {
      score: 0,
      tone: 'bad',
      color: '#ef5350',
      level: levelByCode('high'),
      title: '不可提交',
      detail: '存在硬性错误，请先修正下方列出的问题。'
    }
  }
  const abnormal = indicators.filter(i => i.status.key !== 'ok')
  const score = Math.round(((indicators.length - abnormal.length) / indicators.length) * 100)

  if (abnormal.length === 0) {
    return {
      score,
      tone: 'ok',
      color: '#66bb6a',
      level: levelByCode('low'),
      title: '样本有效，可直接提交',
      detail: '5 项指标全部落在农事适宜区间内，符合采样窗口要求。'
    }
  }

  const severe = abnormal.length >= 3
  return {
    score,
    tone: severe ? 'bad' : 'warn',
    color: severe ? '#ef5350' : '#ffa726',
    level: levelByCode(severe ? 'high' : 'medium'),
    title: `样本可提交，但有 ${abnormal.length} 项偏离适宜区间`,
    detail: abnormal.map(i => `${i.label} ${i.value}${i.unit} ${i.status.label}（${i.advice}）`).join('；')
  }
}

/**
 * 回传帧封装（真实编码，失败时把原因原样返回而不是吞掉）
 */
export function buildFrame (input) {
  try {
    const bytes = encodeFrame({
      samplingPointId: toNumberOrNull(input.samplingPointId),
      latitude: toNumberOrNull(input.latitude),
      longitude: toNumberOrNull(input.longitude),
      soilTemperature: toNumberOrNull(input.soilTemperature),
      soilMoisture: toNumberOrNull(input.soilMoisture),
      airTemperature: toNumberOrNull(input.airTemperature),
      airHumidity: toNumberOrNull(input.airHumidity),
      soilDepth: toNumberOrNull(input.soilDepth)
    })
    const decoded = decodeFrame(bytes)
    return {
      ok: true,
      hex: toHex(bytes),
      length: bytes.length,
      expectedLength: FRAME_LENGTH,
      crc: decoded.crc,
      decoded,
      error: ''
    }
  } catch (e) {
    return {
      ok: false,
      hex: '',
      length: 0,
      expectedLength: FRAME_LENGTH,
      crc: 0,
      decoded: null,
      error: (e && e.message) || String(e)
    }
  }
}

/**
 * 一次完整评估：录入 → 规则 → 结论 → 封装
 * @returns {{indicators, validation, conclusion, frame, submittedAt}}
 */
export function evaluateSample (input) {
  const indicators = evaluateIndicators(input)
  const validation = validateSample(input)
  const conclusion = buildConclusion(indicators, validation)
  const frame = buildFrame(input)
  // 编码失败也算硬性错误
  if (!frame.ok) {
    validation.ok = false
    if (validation.errors.indexOf(frame.error) < 0) {
      validation.errors.push(`回传帧封装失败：${frame.error}`)
    }
    conclusion.title = '不可提交'
    conclusion.score = 0
    conclusion.detail = validation.errors.join('；')
  }
  return { indicators, validation, conclusion, frame }
}

export default {
  SAMPLE_FIELDS,
  SAMPLE_STATUS,
  DEFAULT_SAMPLE,
  toNumberOrNull,
  evaluateIndicators,
  validateSample,
  buildConclusion,
  buildFrame,
  evaluateSample
}
