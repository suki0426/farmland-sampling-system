/**
 * 农业监测大屏 —— mock 数据统一出口
 *
 * ⚠️ 全部为**纯前端演示数据**：
 *   - 不访问数据库、不执行任何 SQL、不调用任何写接口；
 *   - 「数据库管理」页面只做界面，按钮不会对数据库产生任何影响；
 *   - 所有数值由固定种子确定性生成，同一份代码每次结果一致。
 *
 * 其中 `experiments` 与 `frameStream` 里的数字不是写死的常量，
 * 而是**每次现算**的（布点误差评估、路线算法对比、回传帧真实编解码），
 * 可复现且与界面展示自洽。
 */

export * from './geoData'
export * from './monitorData'
export * from './opsData'
export * from './satelliteData'
export * from './weatherField'
export * from './experiments'
export * from './frameStream'
export * from './taskData'

import geoData from './geoData'
import monitorData from './monitorData'
import opsData from './opsData'
import satelliteData from './satelliteData'
import weatherField from './weatherField'
import experiments from './experiments'
import frameStream from './frameStream'
import taskData from './taskData'

export default Object.assign(
  {},
  geoData, monitorData, opsData, satelliteData,
  weatherField, experiments, frameStream, taskData
)
