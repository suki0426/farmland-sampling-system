/**
 * 中国地图 GeoJSON 加载器（本地内置，不依赖运行时网络）
 *
 * 为什么这么做：
 *   ECharts 从 5.x 起不再内置中国地图（合规原因），4.9 的 `map/json/china.json`
 *   虽然仍在 npm 包里，但项目已把 echarts 作为依赖安装、并不暴露该文件路径。
 *   因此这里把 **34 个省级要素的 GeoJSON 直接放进 `public/geo/china.json`**，
 *   通过同源静态资源加载 —— 既不依赖 CDN 可用性，也不需要把 60KB 的 JSON
 *   打进业务 bundle（放在 public 里由 webpack 原样拷贝）。
 *
 * 用法：
 *   const geoJson = await loadChinaGeoJson()      // { type:'FeatureCollection', features:[...] }
 *   registerChinaMap(echarts)                     // 注册为名为 'china' 的地图，之后可用 map/map3D 系列
 */

import * as echarts from 'echarts'

export const CHINA_MAP_NAME = 'china'

const GEO_URL = `${process.env.BASE_URL || '/'}geo/china.json`

let cache = null
let pending = null

/** 省级名称（短名，与 GeoJSON 的 properties.name 一致） */
export const PROVINCE_NAMES = [
  '北京', '天津', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江',
  '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南',
  '湖北', '湖南', '广东', '广西', '海南', '重庆', '四川', '贵州',
  '云南', '西藏', '陕西', '甘肃', '青海', '宁夏', '新疆', '台湾',
  '香港', '澳门'
]

/**
 * 加载中国 GeoJSON（带内存缓存 + 并发去重）
 * @returns {Promise<object>} FeatureCollection
 */
export function loadChinaGeoJson () {
  if (cache) {
    return Promise.resolve(cache)
  }
  if (pending) {
    return pending
  }
  pending = fetch(GEO_URL)
    .then(res => {
      if (!res.ok) {
        throw new Error(`加载地图数据失败：${GEO_URL} 返回 ${res.status}`)
      }
      return res.json()
    })
    .then(json => {
      if (!json || json.type !== 'FeatureCollection' || !Array.isArray(json.features)) {
        throw new Error('地图数据格式不正确：需要 GeoJSON FeatureCollection')
      }
      cache = json
      pending = null
      return json
    })
    .catch(error => {
      pending = null
      throw error
    })
  return pending
}

let registered = false

/**
 * 把中国地图注册进 echarts（map / geo / map3D 系列都依赖这一步）
 * @param {object} [echartsInstance] 可选，默认用项目已安装的 echarts
 * @returns {Promise<string>} 注册后的地图名
 */
export async function registerChinaMap (echartsInstance) {
  const ec = echartsInstance || echarts
  if (registered) {
    return CHINA_MAP_NAME
  }
  const geoJson = await loadChinaGeoJson()
  ec.registerMap(CHINA_MAP_NAME, geoJson)
  registered = true
  return CHINA_MAP_NAME
}

/** 省级要素列表（带名称与几何），用于需要遍历省份的场景 */
export async function listProvinces () {
  const geoJson = await loadChinaGeoJson()
  return geoJson.features.map(feature => ({
    name: (feature.properties && feature.properties.name) || '',
    feature
  })).filter(item => item.name)
}

export default { CHINA_MAP_NAME, PROVINCE_NAMES, loadChinaGeoJson, registerChinaMap, listProvinces }
