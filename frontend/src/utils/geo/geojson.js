/**
 * GeoJSON 工具：解码 echarts 旧版压缩坐标 + 生成栅格"内外掩膜"
 *
 * ── 为什么需要这个文件 ──────────────────────────────────────────────
 *   `public/geo/china.json` 是 **echarts 4.x 官方 china.json 的旧版压缩格式**：
 *   `geometry.coordinates` 存的不是 `[lng, lat]` 数组，而是一串 **编码字符串**，
 *   真正的原点在 `geometry.encodeOffsets` 里，坐标要靠「字符码 − 64 → ZigZag → 差分 → /1024」还原。
 *
 *   `echarts.registerMap()` 内部会自己解码，所以**画底图没问题**；
 *   但只要我们自己拿 `geometry.coordinates` 去做点在多边形内判定（PIP），
 *   拿到的就是字符串。字符串的 `.length` 通常大于 4，能骗过"环是否合法"的长度检查，
 *   然后逐字符当坐标用 —— `c[0]` 变成单个字符，所有比较都是 NaN，
 *   **结果是任何点都判为"在外部"，且不报任何错**。
 *
 *   这正是"全国视图悬浮省份没有反应"的根因（下钻后的 DataV 边界是普通 GeoJSON，所以是好的）。
 *   因此这里提供 `ensurePlainGeoJson()`，把压缩格式还原成普通坐标；
 *   对本来就是普通坐标的数据是**零成本直通**（不复制、不改动入参）。
 *
 * ── 栅格掩膜 ────────────────────────────────────────────────────────
 *   要把"连续色彩场"画成一张贴在地图上的栅格图（而不是会糊成一团的散点热力），
 *   就需要知道**每个栅格像素是否落在国境/省境之内**，否则颜色会溢出到海上。
 *   `buildInsideMask()` 用 bbox 预筛 + 射线法一次性算出二值掩膜。
 *
 * 本文件是纯计算，不依赖 DOM、不依赖 echarts，可在 Node 里直接单测。
 */

/** echarts 压缩格式的量化比例 */
const ENCODE_SCALE = 1024

/* ───────────────────────── 压缩坐标解码 ───────────────────────── */

/** 单个环：编码字符串 → [[lng, lat], ...] */
function decodeRing (encoded, offsets) {
  const out = []
  let prevX = offsets[0]
  let prevY = offsets[1]
  for (let i = 0; i < encoded.length; i += 2) {
    let x = encoded.charCodeAt(i) - 64
    let y = encoded.charCodeAt(i + 1) - 64
    // ZigZag 反变换
    x = (x >> 1) ^ (-(x & 1))
    y = (y >> 1) ^ (-(y & 1))
    // 差分还原
    x += prevX
    y += prevY
    prevX = x
    prevY = y
    out.push([x / ENCODE_SCALE, y / ENCODE_SCALE])
  }
  return out
}

/** 该几何体是否是 echarts 压缩格式 */
export function isEncodedGeometry (geometry) {
  if (!geometry || !geometry.encodeOffsets || !Array.isArray(geometry.coordinates)) {
    return false
  }
  // ECharts 4 会原地解码传给 registerMap() 的 GeoJSON：coordinates 已经
  // 变成数组，但 encodeOffsets 仍保留。仅凭 encodeOffsets 判断会导致二次
  // 解码，并在数组上调用 charCodeAt。必须以实际坐标类型作为最终依据。
  if (geometry.type === 'Polygon') {
    return geometry.coordinates.some(ring => typeof ring === 'string')
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some(poly => (
      Array.isArray(poly) && poly.some(ring => typeof ring === 'string')
    ))
  }
  return false
}

/** 解码单个几何体；已经是普通坐标时**原样返回** */
export function decodeGeometry (geometry) {
  if (!isEncodedGeometry(geometry)) {
    return geometry
  }
  const offs = geometry.encodeOffsets
  const coords = geometry.coordinates
  if (geometry.type === 'Polygon') {
    return {
      type: 'Polygon',
      coordinates: coords.map((ring, i) => (
        typeof ring === 'string' ? decodeRing(ring, offs[i]) : ring
      ))
    }
  }
  if (geometry.type === 'MultiPolygon') {
    return {
      type: 'MultiPolygon',
      coordinates: coords.map((poly, i) => poly.map((ring, j) => (
        typeof ring === 'string' ? decodeRing(ring, offs[i][j]) : ring
      )))
    }
  }
  return geometry
}

/**
 * 把 FeatureCollection 里的压缩坐标全部还原成普通坐标。
 * 已经是普通坐标时**返回同一个对象**（零拷贝），避免每次调用都重建 220KB 的树。
 */
export function ensurePlainGeoJson (geoJson) {
  if (!geoJson || !Array.isArray(geoJson.features)) {
    return geoJson
  }
  let needDecode = false
  for (const f of geoJson.features) {
    if (isEncodedGeometry(f && f.geometry)) {
      needDecode = true
      break
    }
  }
  if (!needDecode) {
    return geoJson
  }
  return {
    type: geoJson.type || 'FeatureCollection',
    features: geoJson.features.map(f => {
      if (!f || !isEncodedGeometry(f.geometry)) {
        return f
      }
      return {
        type: 'Feature',
        properties: f.properties,
        geometry: decodeGeometry(f.geometry)
      }
    })
  }
}

/* ───────────────────────── 几何基础 ───────────────────────── */

/**
 * 取出几何体的外环（带 bbox）。
 * 说明：只取每个多边形的**外环**，不处理洞。本项目用到的
 * china.json 与 DataV 边界都没有洞；有洞时唯一的影响是"洞内的格点会被算作境内"，
 * 属于可接受的近似（会在文档里写明）。
 */
export function ringsOfGeometry (geometry) {
  if (!geometry) {
    return []
  }
  const polys = geometry.type === 'Polygon'
    ? [geometry.coordinates]
    : (geometry.type === 'MultiPolygon' ? geometry.coordinates : [])
  const out = []
  for (const poly of polys) {
    if (!poly || !poly.length) {
      continue
    }
    const ring = poly[0]
    if (!Array.isArray(ring) || ring.length < 4 || typeof ring[0][0] !== 'number') {
      // 关键防线：坐标没解码干净（例如拿到字符串）时直接跳过，不产出错的 bbox
      continue
    }
    let x0 = Infinity
    let y0 = Infinity
    let x1 = -Infinity
    let y1 = -Infinity
    for (const c of ring) {
      if (c[0] < x0) x0 = c[0]
      if (c[0] > x1) x1 = c[0]
      if (c[1] < y0) y0 = c[1]
      if (c[1] > y1) y1 = c[1]
    }
    out.push({ ring, x0, y0, x1, y1 })
  }
  return out
}

/** 射线法：点是否在环内（支持凹多边形） */
export function pointInRing (lng, lat, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0]
    const yi = ring[i][1]
    const xj = ring[j][0]
    const yj = ring[j][1]
    if (((yi > lat) !== (yj > lat)) && (lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)) {
      inside = !inside
    }
  }
  return inside
}

/** 收集一个 FeatureCollection 的全部外环（自动解码），供 PIP 使用 */
export function collectRings (geoJson) {
  const plain = ensurePlainGeoJson(geoJson)
  const rings = []
  for (const f of (plain.features || [])) {
    rings.push(...ringsOfGeometry(f && f.geometry))
  }
  return rings
}

/** FeatureCollection 的经纬度包围盒 */
export function geoJsonBounds (geoJson, pad = 0) {
  const rings = collectRings(geoJson)
  let lngMin = Infinity
  let latMin = Infinity
  let lngMax = -Infinity
  let latMax = -Infinity
  for (const r of rings) {
    if (r.x0 < lngMin) lngMin = r.x0
    if (r.x1 > lngMax) lngMax = r.x1
    if (r.y0 < latMin) latMin = r.y0
    if (r.y1 > latMax) latMax = r.y1
  }
  if (!isFinite(lngMin)) {
    return null
  }
  return {
    lngMin: lngMin - pad,
    latMin: latMin - pad,
    lngMax: lngMax + pad,
    latMax: latMax + pad
  }
}

/* ───────────────────────── 栅格掩膜 ───────────────────────── */

/**
 * 生成二维栅格掩膜位图
 *
 * 坐标约定：第 0 行对应 **latMax**（北在上），与图片像素行序一致，
 * 这样 `ctx.putImageData` 出来的图直接正着贴到地图上，不用翻转。
 *
 * @param {Array} rings      `collectRings()` 的结果
 * @param {object} bounds    {lngMin, latMin, lngMax, latMax}
 * @param {number} width
 * @param {number} height
 * @returns {{mask: Uint8Array, width:number, height:number, bounds:object, inside:number}}
 */
export function buildMaskFromRings (rings, bounds, width, height) {
  const mask = new Uint8Array(width * height)
  const stepX = (bounds.lngMax - bounds.lngMin) / width
  const stepY = (bounds.latMax - bounds.latMin) / height
  let inside = 0
  for (let y = 0; y < height; y++) {
    const lat = bounds.latMax - (y + 0.5) * stepY
    const rowOff = y * width
    for (let x = 0; x < width; x++) {
      const lng = bounds.lngMin + (x + 0.5) * stepX
      for (let k = 0; k < rings.length; k++) {
        const r = rings[k]
        if (lng < r.x0 || lng > r.x1 || lat < r.y0 || lat > r.y1) {
          continue
        }
        if (pointInRing(lng, lat, r.ring)) {
          mask[rowOff + x] = 1
          inside++
          break
        }
      }
    }
  }
  return { mask, width, height, bounds, inside }
}

/** 便捷入口：直接给 GeoJSON */
export function buildInsideMask (geoJson, bounds, width, height) {
  return buildMaskFromRings(collectRings(geoJson), bounds, width, height)
}

export default {
  isEncodedGeometry,
  decodeGeometry,
  ensurePlainGeoJson,
  ringsOfGeometry,
  pointInRing,
  collectRings,
  geoJsonBounds,
  buildMaskFromRings,
  buildInsideMask
}
