/**
 * 全国行政区划与栅格掩膜加载器（农业监测大屏用）
 *
 * 数据来源与生成方式（都在 `public/geo/` 下，**本地内置、不依赖运行时 CDN**）：
 *
 *   china.json         34 个省级 GeoJSON（echarts 4.9 官方格式），用于注册底图
 *   cn-divisions.json  **全国三级行政区划树**：33 省 / 475 市 / 2728 区县，含中心坐标
 *                      由构建期脚本从 DataV 公开区划数据抓取并紧凑序列化（字段名缩写）
 *   cn-grid-mask.json  栅格掩膜位图：把中国范围切成 0.35° 网格（181×107），
 *                      用 PIP 预计算哪些格点落在境内（7871 个），base64 存位图 —— 仅 3 KB
 *
 * 为什么这么做：
 *   1. 天气类热力图需要**均匀格点**而不是行政边界，位图掩膜让运行时不用做 PIP，秒开；
 *   2. 三级区划树让「精确到第三级」的**数据与站点**完全离线可用，
 *      不依赖下钻时才去联网拿边界；
 *   3. 下钻用的市级/区县级**边界**体积太大（全国约 15 MB），改为按需从 DataV 拉取并缓存，
 *      拉取失败时给出明确提示并保留当前层级，不会空白。
 */

const BASE = process.env.BASE_URL || '/'

/** 三级区划紧凑字段说明（对应 cn-divisions.json 的 _schema） */
export const DIVISION_SCHEMA = {
  provinces: '{n:名称, a:adcode}',
  cities: '{n:名称, s:短名, a:adcode, p:所属省, c:[lng,lat]}',
  districts: '{n:名称, a:adcode, ct:所属市短名, c:[lng,lat]}'
}

const cache = {
  divisions: null,
  grid: null,
  provincesMeta: null,
  drillMaps: {},
  pending: {}
}

function fetchJson (url) {
  return fetch(url).then(res => {
    if (!res.ok) {
      throw new Error(`${url} 返回 ${res.status}`)
    }
    return res.json()
  })
}

/* ────────────────────────── 行政区划 ────────────────────────── */

/** 加载全国三级行政区划树 */
export function loadDivisions () {
  if (cache.divisions) {
    return Promise.resolve(cache.divisions)
  }
  if (!cache.pending.divisions) {
    cache.pending.divisions = fetchJson(`${BASE}geo/cn-divisions.json`).then(data => {
      cache.divisions = data
      cache.pending.divisions = null
      return data
    }).catch(e => {
      cache.pending.divisions = null
      throw new Error(`加载行政区划数据失败：${(e && e.message) || e}`)
    })
  }
  return cache.pending.divisions
}

/** 取某个省下的市（直辖市返回的是区，因为 DataV 在省级下直接给区） */
export function citiesOf (divisions, provinceName) {
  if (!divisions) {
    return []
  }
  return divisions.cities.filter(c => c.p === provinceName)
}

/** 取某个市下的区县（按市短名匹配） */
export function districtsOf (divisions, cityShortName) {
  if (!divisions) {
    return []
  }
  return divisions.districts.filter(d => d.ct === cityShortName)
}

/* ────────────────────────── 栅格掩膜 ────────────────────────── */

/**
 * 加载并展开栅格掩膜
 * @returns {Promise<{points:Array<[number,number]>, cols:number, rows:number, step:number, lngMin:number, latMin:number, count:number}>}
 */
export function loadGrid () {
  if (cache.grid) {
    return Promise.resolve(cache.grid)
  }
  if (!cache.pending.grid) {
    cache.pending.grid = Promise.all([
      fetchJson(`${BASE}geo/cn-grid-mask.json`),
      // 省中心点（用于业务图层按省聚合），从 china.json 里顺带取
      fetchJson(`${BASE}geo/china.json`)
    ]).then(([mask, provincesGeo]) => {
      const binary = atob(mask.mask)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      const points = []
      for (let r = 0; r < mask.rows; r++) {
        for (let c = 0; c < mask.cols; c++) {
          const idx = r * mask.cols + c
          if (bytes[idx >> 3] & (1 << (idx & 7))) {
            points.push([
              Number((mask.lngMin + c * mask.step).toFixed(3)),
              Number((mask.latMin + r * mask.step).toFixed(3))
            ])
          }
        }
      }
      const meta = (provincesGeo.features || []).map(f => ({
        name: (f.properties && f.properties.name) || '',
        cp: (f.properties && f.properties.cp) || null
      })).filter(p => p.name && p.cp)

      cache.provincesMeta = meta
      cache.grid = {
        points,
        cols: mask.cols,
        rows: mask.rows,
        step: mask.step,
        lngMin: mask.lngMin,
        latMin: mask.latMin,
        count: mask.count
      }
      cache.pending.grid = null
      return cache.grid
    }).catch(e => {
      cache.pending.grid = null
      throw new Error(`加载栅格掩膜失败：${(e && e.message) || e}`)
    })
  }
  return cache.pending.grid
}

/** 省名 → 中心坐标（业务图层按省打点时用） */
export function provinceCenters () {
  return cache.provincesMeta || []
}

/* ────────────────────────── 下钻边界（按需拉取 + 缓存）────────────────────────── */

const DATAV = 'https://geo.datav.aliyun.com/areas_v3/bound'

/**
 * 拉取某一级的下级边界 GeoJSON
 * @param {string} adcode 省或市的 adcode
 * @returns {Promise<object>} 标准 GeoJSON FeatureCollection
 */
export function fetchSubMap (adcode) {
  if (!adcode) {
    return Promise.reject(new Error('缺少 adcode，无法下钻'))
  }
  if (cache.drillMaps[adcode]) {
    return Promise.resolve(cache.drillMaps[adcode])
  }
  if (!cache.pending[adcode]) {
    cache.pending[adcode] = fetchJson(`${DATAV}/${adcode}_full.json`)
      .then(geo => {
        // 只保留名称/中心，减小内存占用
        const features = (geo.features || []).map(f => {
          const p = f.properties || {}
          return {
            type: 'Feature',
            properties: {
              name: p.name,
              adcode: p.adcode ? String(p.adcode) : undefined,
              cp: p.centroid || p.center || p.cp || undefined
            },
            geometry: f.geometry
          }
        }).filter(f => f.geometry)
        const slim = { type: 'FeatureCollection', features }
        cache.drillMaps[adcode] = slim
        cache.pending[adcode] = null
        return slim
      })
      .catch(e => {
        cache.pending[adcode] = null
        throw new Error(`下钻边界加载失败（可能是网络不可达或数据源限流）：${(e && e.message) || e}`)
      })
  }
  return cache.pending[adcode]
}

/** 已缓存的 adcode 数量（用于界面提示） */
export function drillCacheSize () {
  return Object.keys(cache.drillMaps).length
}

export default {
  DIVISION_SCHEMA,
  loadDivisions,
  loadGrid,
  citiesOf,
  districtsOf,
  provinceCenters,
  fetchSubMap,
  drillCacheSize
}
