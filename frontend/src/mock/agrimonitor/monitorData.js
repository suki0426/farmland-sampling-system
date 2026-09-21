/**
 * 农业监测 —— 传感器 / 实时曲线 / 预警 / 报表 演示数据（纯前端 mock）
 *
 * ⚠️ 不访问数据库、不调用后端；数值由固定种子确定性生成。
 *
 * ── YOLO 接入契约（需求 2-(3)：实时监控 + yolo）─────────────────────────
 * 前端**不实现任何检测算法**，只负责"播流 + 叠加框"。要接入已有成果，只需满足下面两点：
 *
 *  1) 视频流：给一个可直接播放的地址，前端用项目已依赖的 xgplayer / flv.js / hls.js 播放。
 *     - HLS：  https://<host>/live/<deviceCode>.m3u8
 *     - FLV：  https://<host>/live/<deviceCode>.flv
 *     在 `sensor.videoUrl` 里返回即可（见本文件的 mockDevices）。
 *
 *  2) 检测结果：一帧一组框，坐标用**归一化 0~1**（相对视频画面宽高），
 *     这样前端不需要知道原始分辨率，换分辨率也不用改代码：
 *     {
 *       "deviceCode": "CAM001",
 *       "frameTime": "2026-09-17 10:30:00",
 *       "frameWidth": 1920, "frameHeight": 1080,   // 可选，仅用于展示
 *       "detections": [
 *         { "label": "pest",   "labelName": "蚜虫",   "confidence": 0.93,
 *           "bbox": [0.12, 0.30, 0.18, 0.22] },      // [x, y, w, h] 归一化
 *         { "label": "disease","labelName": "叶斑病", "confidence": 0.81,
 *           "bbox": [0.55, 0.42, 0.20, 0.25] }
 *       ]
 *     }
 *     推送方式二选一（前端两种都已支持，见 DeviceOverviewPanel 的注释）：
 *       - WebSocket：ws://<host>/ws/detect/<deviceCode>   （推荐，低延迟）
 *       - HTTP 轮询：GET /api/detect/latest?deviceCode=xx  （兜底）
 *
 *   前端只做三件事：把框按归一化坐标画在视频上、按 label 上色、把置信度显示出来。
 *   算法侧（模型、推理、告警联动）完全由你们已有的模块负责，前端不碰。
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

/** 传感器类型字典（前端展示用，真实项目应改为平台字典） */
export const SENSOR_TYPES = [
  { code: 'soil', label: '土壤墒情站', icon: 'el-icon-odometer', metrics: ['soilMoisture', 'soilTemperature', 'soilDepth'] },
  { code: 'weather', label: '小型气象站', icon: 'el-icon-cloudy', metrics: ['airTemperature', 'airHumidity', 'rain', 'cloud'] },
  { code: 'gas', label: 'CO₂ 通量仪', icon: 'el-icon-coffee', metrics: ['co2'] },
  { code: 'camera', label: '虫情/长势摄像头', icon: 'el-icon-video-camera', metrics: ['aiDetect'] },
  { code: 'sampler', label: '采样终端', icon: 'el-icon-truck', metrics: ['soilMoisture', 'soilTemperature', 'airTemperature', 'airHumidity', 'soilDepth'] }
]

export const DEVICE_STATUS_LABELS = {
  online: '在线',
  offline: '离线',
  fault: '故障',
  delay: '延迟'
}

/** 生成某地区下的传感器设备列表 */
export function mockDevices (regionKey = '山西/太原市/小店区') {
  const rnd = mulberry32(hashSeed('devices|' + regionKey))
  const count = 8 + Math.floor(rnd() * 6)
  const list = []
  for (let i = 0; i < count; i++) {
    const type = SENSOR_TYPES[Math.floor(rnd() * SENSOR_TYPES.length)]
    const isCamera = type.code === 'camera'
    const serial = String(i + 1).padStart(3, '0')
    const prefix = { soil: 'SOIL', weather: 'WEA', gas: 'GAS', camera: 'CAM', sampler: 'DEV' }[type.code]
    const statusRoll = rnd()
    const status = statusRoll > 0.92 ? 'fault' : (statusRoll > 0.82 ? 'offline' : (statusRoll > 0.76 ? 'delay' : 'online'))
    list.push({
      deviceId: `${prefix}${serial}`,
      deviceCode: `${prefix}-${serial}`,
      deviceName: `${type.label}${serial}`,
      type: type.code,
      typeLabel: type.label,
      status,
      regionKey,
      longitude: Number((112.3 + rnd() * 0.6).toFixed(6)),
      latitude: Number((37.6 + rnd() * 0.5).toFixed(6)),
      coordinateSystem: 'GCJ02',
      collectTime: `2026-09-17 ${String(9 + Math.floor(rnd() * 8)).padStart(2, '0')}:${String(Math.floor(rnd() * 60)).padStart(2, '0')}:00`,
      battery: Math.round(28 + rnd() * 70),
      signal: Math.round(45 + rnd() * 54),
      // 摄像头才有视频流；真实接入时这里换成你们的流地址
      videoUrl: isCamera ? mockVideoUrl(serial) : '',
      // 摄像头才会带 AI 检测能力
      aiEnabled: isCamera,
      metrics: readingsFor(type.code, rnd)
    })
  }
  return list
}

/** 演示用视频地址（占位，接入时替换为真实 HLS/FLV 地址） */
function mockVideoUrl (serial) {
  // 用公开的测试 HLS 流做占位，证明"播放器链路是通的"
  const samples = [
    'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    'https://test-streams.mux.dev/pts_shift/master.m3u8'
  ]
  return samples[Number(serial) % samples.length]
}

function readingsFor (typeCode, rnd) {
  const base = {
    soilMoisture: Number((22 + rnd() * 22).toFixed(1)),
    soilTemperature: Number((17 + rnd() * 9).toFixed(1)),
    soilDepth: 10 + Math.floor(rnd() * 30),
    airTemperature: Number((19 + rnd() * 12).toFixed(1)),
    airHumidity: Number((42 + rnd() * 40).toFixed(1)),
    rain: Number((rnd() * 18).toFixed(1)),
    cloud: Math.round(20 + rnd() * 70),
    co2: Number((398 + rnd() * 42).toFixed(1))
  }
  return base
}

/**
 * 设备指标趋势（实时曲线用）：返回最近 N 个点
 */
export function mockDeviceSeries (deviceCode, metricKey, points = 40) {
  const rnd = mulberry32(hashSeed('series|' + deviceCode + '|' + metricKey))
  const seedVal = mulberry32(hashSeed(deviceCode + metricKey))()
  const base = {
    soilMoisture: 30, soilTemperature: 21, airTemperature: 25,
    airHumidity: 60, rain: 4, cloud: 55, co2: 415, soilDepth: 20
  }[metricKey] || 50
  const amplitude = { soilMoisture: 8, soilTemperature: 4, airTemperature: 6, airHumidity: 12, rain: 6, cloud: 25, co2: 18, soilDepth: 2 }[metricKey] || 5

  const now = Date.now()
  const rows = []
  for (let i = points - 1; i >= 0; i--) {
    const t = new Date(now - i * 60000)
    const wave = Math.sin((points - i) / 5 + seedVal * 6) * amplitude * 0.6
    const noise = (rnd() - 0.5) * amplitude * 0.35
    rows.push({
      time: `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`,
      value: Number((base + wave + noise).toFixed(1))
    })
  }
  return rows
}

/**
 * 历史数据（按粒度聚合），供"数据报表 - 历史数据"页签使用
 */
export function mockHistorySeries (regionKey, metricKey, granularity = 'day', points = 30) {
  const rnd = mulberry32(hashSeed('history|' + regionKey + '|' + metricKey + '|' + granularity))
  const seedVal = mulberry32(hashSeed(regionKey + metricKey))()
  const base = { soilMoisture: 31, soilTemperature: 20, airTemperature: 24, airHumidity: 58, rain: 5, cloud: 52, co2: 412 }[metricKey] || 50
  const amplitude = { soilMoisture: 9, soilTemperature: 7, airTemperature: 11, airHumidity: 16, rain: 12, cloud: 28, co2: 22 }[metricKey] || 6
  const unit = { soilMoisture: '%', soilTemperature: '°C', airTemperature: '°C', airHumidity: '%', rain: 'mm', cloud: '%', co2: 'ppm' }[metricKey] || ''

  const rows = []
  const now = new Date('2026-09-17T00:00:00')
  for (let i = points - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000)
    const season = Math.sin(((points - i) / points) * Math.PI * 2 + seedVal * 5)
    rows.push({
      time: granularity === 'month'
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        : `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      value: Number((base + season * amplitude * 0.55 + (rnd() - 0.5) * amplitude * 0.5).toFixed(1)),
      upper: Number((base + amplitude * 0.75).toFixed(1)),
      lower: Number((base - amplitude * 0.75).toFixed(1))
    })
  }
  return { unit, rows }
}

/** 报表模板（"生成报表"用） */
export const REPORT_TEMPLATES = [
  { code: 'daily', label: '采样数据日报', desc: '按天汇总采样点指标与完成情况' },
  { code: 'weekly', label: '监测数据周报', desc: '按周汇总设备在线率与指标趋势' },
  { code: 'warning', label: '预警统计报表', desc: '预警条数、类型分布、处置情况' },
  { code: 'device', label: '设备运行报表', desc: '设备在线率、故障次数、电量与信号' },
  { code: 'sample', label: '采样任务报表', desc: '任务完成率、漏采点清单、平均耗时' }
]

/**
 * 生成一份报表（演示：返回结构化的报表数据，不落库、不写文件）
 * 真实接入时把这里换成 4号/5号 的导出接口（Excel 由后端生成）。
 */
export function mockGenerateReport (params = {}) {
  const { templateCode = 'daily', regionKey = '山西/太原市/小店区', startTime = '', endTime = '' } = params
  const rnd = mulberry32(hashSeed('report|' + templateCode + '|' + regionKey))
  const template = REPORT_TEMPLATES.filter(t => t.code === templateCode)[0] || REPORT_TEMPLATES[0]
  const columns = ['指标', '均值', '最大值', '最小值', '样本数', '达标率']
  const metricNames = ['土壤湿度', '土壤温度', '空气温度', '空气湿度', '土壤深度', 'CO₂']
  const rows = metricNames.map(name => {
    const mean = Number((20 + rnd() * 40).toFixed(1))
    return {
      指标: name,
      均值: mean,
      最大值: Number((mean * (1.1 + rnd() * 0.2)).toFixed(1)),
      最小值: Number((mean * (0.8 - rnd() * 0.1)).toFixed(1)),
      样本数: Math.round(200 + rnd() * 4000),
      达标率: `${Math.round(80 + rnd() * 19)}%`
    }
  })
  return {
    reportId: 'RPT' + Date.now().toString().slice(-8),
    templateCode,
    templateLabel: template.label,
    title: `${regionKey} ${template.label}`,
    regionKey,
    startTime: startTime || '2026-08-18 00:00:00',
    endTime: endTime || '2026-09-17 23:59:59',
    generatedAt: '2026-09-17 10:30:00',
    generatedBy: '当前登录用户',
    columns,
    rows,
    summary: `${template.desc}。本次统计覆盖 ${regionKey}，共 ${rows.length} 项指标，` +
      `累计样本 ${rows.reduce((a, r) => a + r.样本数, 0)} 条，整体达标率 ${Math.round(85 + rnd() * 12)}%。`
  }
}

/** 预警类型字典 */
export const WARNING_TYPES = [
  { code: 'drought', label: '干旱风险', metric: 'soilMoisture', level: 'high' },
  { code: 'waterlog', label: '内涝风险', metric: 'rain', level: 'high' },
  { code: 'heat', label: '高温胁迫', metric: 'airTemperature', level: 'medium' },
  { code: 'cold', label: '低温冻害', metric: 'airTemperature', level: 'medium' },
  { code: 'pest', label: '虫情预警', metric: 'aiDetect', level: 'high' },
  { code: 'disease', label: '病害预警', metric: 'aiDetect', level: 'high' },
  { code: 'deviceFault', label: '设备故障', metric: 'device', level: 'medium' },
  { code: 'deviceOffline', label: '设备离线', metric: 'device', level: 'low' },
  { code: 'co2Abnormal', label: 'CO₂ 异常', metric: 'co2', level: 'medium' },
  { code: 'manual', label: '人工上报', metric: 'manual', level: 'medium' }
]

export const WARNING_LEVELS = [
  { code: 'high', label: '紧急', color: '#d32f2f' },
  { code: 'medium', label: '重要', color: '#f57c00' },
  { code: 'low', label: '提示', color: '#1976d2' }
]

/**
 * 预警列表
 * @param {object} params { regionKey }
 * @returns {Array} 含 source: 'auto' | 'manual'（自动预警 / 手动添加）
 */
export function mockWarnings (params = {}) {
  const regionKey = params.regionKey || '山西/太原市/小店区'
  const rnd = mulberry32(hashSeed('warn|' + regionKey))
  const now = new Date('2026-09-17T10:30:00')
  const list = []
  const count = 14
  for (let i = 0; i < count; i++) {
    const type = WARNING_TYPES[Math.floor(rnd() * WARNING_TYPES.length)]
    // 约 70% 自动触发、30% 手动添加，方便演示"自动 + 手动"两条来源
    const source = rnd() > 0.3 ? 'auto' : 'manual'
    const t = new Date(now.getTime() - i * (20 + Math.floor(rnd() * 90)) * 60000)
    list.push({
      warningId: 'W' + String(1000 + i),
      source,
      typeCode: type.code,
      typeLabel: type.label,
      level: type.level,
      regionKey,
      deviceCode: `${['SOIL', 'WEA', 'CAM', 'GAS'][Math.floor(rnd() * 4)]}-${String(1 + Math.floor(rnd() * 8)).padStart(3, '0')}`,
      metricValue: Number((10 + rnd() * 90).toFixed(1)),
      threshold: Number((20 + rnd() * 40).toFixed(1)),
      title: `${type.label}：监测值超出阈值`,
      content: `${regionKey} 的 ${type.label} 触发条件成立，当前监测值超出设定阈值，建议现场核查。`,
      createTime: `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')} ` +
        `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}:00`,
      status: rnd() > 0.45 ? 'open' : 'closed',
      handler: rnd() > 0.5 ? '张工' : '',
      handleTime: ''
    })
  }
  return list.sort((a, b) => (a.createTime < b.createTime ? 1 : -1))
}

/** 自动预警规则（可配置阈值） */
export function mockWarningRules () {
  return [
    { ruleId: 'R01', name: '土壤湿度过低', metricKey: 'soilMoisture', metricLabel: '土壤湿度', operator: 'lt', threshold: 18, unit: '%', level: 'high', enabled: true, source: 'auto' },
    { ruleId: 'R02', name: '24h 降雨量过大', metricKey: 'rain', metricLabel: '降雨量', operator: 'gt', threshold: 50, unit: 'mm', level: 'high', enabled: true, source: 'auto' },
    { ruleId: 'R03', name: '空气温度过高', metricKey: 'airTemperature', metricLabel: '空气温度', operator: 'gt', threshold: 36, unit: '°C', level: 'medium', enabled: true, source: 'auto' },
    { ruleId: 'R04', name: '空气温度过低', metricKey: 'airTemperature', metricLabel: '空气温度', operator: 'lt', threshold: 2, unit: '°C', level: 'medium', enabled: false, source: 'auto' },
    { ruleId: 'R05', name: 'CO₂ 浓度异常', metricKey: 'co2', metricLabel: '二氧化碳', operator: 'gt', threshold: 445, unit: 'ppm', level: 'medium', enabled: true, source: 'auto' },
    { ruleId: 'R06', name: 'AI 识别到虫情', metricKey: 'aiDetect', metricLabel: 'AI 检测', operator: 'gt', threshold: 0.85, unit: '置信度', level: 'high', enabled: true, source: 'auto' },
    { ruleId: 'R07', name: '设备连续离线', metricKey: 'device', metricLabel: '设备在线', operator: 'offline', threshold: 30, unit: '分钟', level: 'medium', enabled: true, source: 'auto' }
  ]
}

/**
 * YOLO 检测结果（演示）。
 * 真实接入见本文件顶部的「YOLO 接入契约」注释。
 */
export function mockDetections (deviceCode = 'CAM-001') {
  const rnd = mulberry32(hashSeed('detect|' + deviceCode))
  const labels = [
    { label: 'pest', labelName: '蚜虫', color: '#e53935' },
    { label: 'pest', labelName: '稻飞虱', color: '#d81b60' },
    { label: 'disease', labelName: '叶斑病', color: '#8e24aa' },
    { label: 'disease', labelName: '锈病', color: '#5e35b1' },
    { label: 'weed', labelName: '杂草', color: '#43a047' },
    { label: 'person', labelName: '人员', color: '#1e88e5' }
  ]
  const n = 2 + Math.floor(rnd() * 3)
  const detections = []
  for (let i = 0; i < n; i++) {
    const item = labels[Math.floor(rnd() * labels.length)]
    detections.push({
      label: item.label,
      labelName: item.labelName,
      color: item.color,
      confidence: Number((0.72 + rnd() * 0.27).toFixed(2)),
      // 归一化 bbox: [x, y, w, h]，取值 0~1
      bbox: [
        Number((0.08 + rnd() * 0.6).toFixed(3)),
        Number((0.12 + rnd() * 0.5).toFixed(3)),
        Number((0.12 + rnd() * 0.2).toFixed(3)),
        Number((0.14 + rnd() * 0.22).toFixed(3))
      ]
    })
  }
  return {
    deviceCode,
    frameTime: '2026-09-17 10:30:00',
    frameWidth: 1920,
    frameHeight: 1080,
    detections
  }
}

export default {
  SENSOR_TYPES,
  DEVICE_STATUS_LABELS,
  WARNING_TYPES,
  WARNING_LEVELS,
  REPORT_TEMPLATES,
  mockDevices,
  mockDeviceSeries,
  mockHistorySeries,
  mockGenerateReport,
  mockWarnings,
  mockWarningRules,
  mockDetections
}
