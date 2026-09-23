/**
 * 地图适配层工厂（1号 前端GIS 岗位）
 *
 * 为什么需要适配层：
 *  任务书要求使用高德地图；但高德 JS API 需要 Key，Key 未配置或网络不可达时页面会白屏。
 *  验收标准明确要求「地图加载失败、接口失败要有错误处理」，因此这里把「地图能力」抽象成
 *  统一接口，由两个实现提供：
 *    1. AmapAdapter   —— 高德地图 2.0（正式方案，需 Key）
 *    2. VectorAdapter —— 内置离线矢量地图（纯 Canvas，无需网络与 Key，保证任何环境都能演示）
 *  页面只依赖本接口，不关心底层是哪一个，也不需要在切换实现时改任何字段。
 *
 * 注意：基类与常量放在 ./mapBase，这里只做「工厂」，
 * 以免 mapAdapter ⇄ vectorAdapter 之间形成循环依赖（那会导致页面直接白屏）。
 */

import AmapAdapter from './amapAdapter'
import VectorAdapter from './vectorAdapter'
import { MAP_PROVIDER, LAYER, MAP_THEME, BaseMapAdapter, trajectoryColor, deviceColor } from './mapBase'

/**
 * 创建地图适配器
 * @param {string} provider MAP_PROVIDER.AMAP | MAP_PROVIDER.VECTOR
 */
export function createMapAdapter (provider) {
  if (provider === MAP_PROVIDER.AMAP) {
    return new AmapAdapter()
  }
  return new VectorAdapter()
}

export {
  MAP_PROVIDER,
  LAYER,
  MAP_THEME,
  BaseMapAdapter,
  trajectoryColor,
  deviceColor,
  AmapAdapter,
  VectorAdapter
}

export default {
  MAP_PROVIDER,
  LAYER,
  MAP_THEME,
  createMapAdapter,
  trajectoryColor,
  deviceColor
}
