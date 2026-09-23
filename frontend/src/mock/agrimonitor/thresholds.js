/**
 * 5 项采样指标的农事阈值（叶子模块，零 import）
 *
 * 数值口径与任务书 §2 的 5 项指标一致：土壤温度 / 土壤湿度 / 空气温度 / 空气湿度 / 土壤深度。
 * `min`~`max` 是**农事适宜区间**（不是物理极限），用于「采样数据录入」页的逐项判定；
 * 物理可编码范围另算 —— 这 5 项在回传帧里各占 1 字节（0~255）。
 *
 * 为什么单独抽一个文件：`weatherField.js`（数据场）与 `samplingRule.js`（录入规则）
 * 都要用它，抽成叶子模块可以避免两者互相依赖。
 */

export const AGRI_THRESHOLDS = {
  soilTemperature: { label: '土壤温度', unit: '°C', min: 5, max: 30, decimals: 1 },
  soilMoisture: { label: '土壤湿度', unit: '%', min: 20, max: 35, decimals: 1 },
  airTemperature: { label: '空气温度', unit: '°C', min: 5, max: 35, decimals: 1 },
  airHumidity: { label: '空气湿度', unit: '%', min: 30, max: 80, decimals: 1 },
  soilDepth: { label: '土壤深度', unit: 'cm', min: 5, max: 30, decimals: 0 }
}

/** 固定顺序：与任务书 §2 帧内顺序一致，不可调换 */
export const AGRI_THRESHOLD_KEYS = [
  'soilTemperature',
  'soilMoisture',
  'airTemperature',
  'airHumidity',
  'soilDepth'
]

/** 每项在回传帧里占 1 字节，物理可编码范围 0~255 */
export const ONE_BYTE_RANGE = { min: 0, max: 255 }

export default { AGRI_THRESHOLDS, AGRI_THRESHOLD_KEYS, ONE_BYTE_RANGE }
