/**
 * 农业监测大屏 —— 地理与区域演示数据（纯前端 mock）
 *
 * ⚠️ 说明：
 *   - 本文件**不访问任何数据库**，也不调用任何后端接口，全部为前端演示数据；
 *   - 数值由**固定种子**的伪随机数生成，同一份代码每次结果完全一致，便于复现与答辩；
 *   - 省/市名称尽量使用真实名称；区县在真实列表中优先使用真实名称，缺失时按规则生成演示名，
 *     并在 `demoGenerated` 字段上标明，避免被误当作真实行政区划数据。
 */

/** mulberry32：确定性伪随机数发生器 */
export function mulberry32 (seed) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), 1 | t)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashSeed (text) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** 34 个省级行政区：名称 + 近似中心经纬度（用于 3D 地图上的点位/热力） */
export const PROVINCE_CENTERS = [
  { name: '北京', lng: 116.41, lat: 39.90 },
  { name: '天津', lng: 117.19, lat: 39.12 },
  { name: '河北', lng: 114.50, lat: 38.05 },
  { name: '山西', lng: 112.55, lat: 37.87 },
  { name: '内蒙古', lng: 111.75, lat: 40.84 },
  { name: '辽宁', lng: 123.43, lat: 41.80 },
  { name: '吉林', lng: 125.32, lat: 43.90 },
  { name: '黑龙江', lng: 126.64, lat: 45.76 },
  { name: '上海', lng: 121.47, lat: 31.23 },
  { name: '江苏', lng: 118.78, lat: 32.06 },
  { name: '浙江', lng: 120.15, lat: 30.27 },
  { name: '安徽', lng: 117.28, lat: 31.86 },
  { name: '福建', lng: 119.30, lat: 26.08 },
  { name: '江西', lng: 115.89, lat: 28.68 },
  { name: '山东', lng: 117.02, lat: 36.67 },
  { name: '河南', lng: 113.65, lat: 34.76 },
  { name: '湖北', lng: 114.30, lat: 30.59 },
  { name: '湖南', lng: 112.98, lat: 28.19 },
  { name: '广东', lng: 113.28, lat: 23.13 },
  { name: '广西', lng: 108.32, lat: 22.82 },
  { name: '海南', lng: 110.33, lat: 20.03 },
  { name: '重庆', lng: 106.55, lat: 29.56 },
  { name: '四川', lng: 104.07, lat: 30.65 },
  { name: '贵州', lng: 106.71, lat: 26.57 },
  { name: '云南', lng: 102.71, lat: 25.04 },
  { name: '西藏', lng: 91.13, lat: 29.65 },
  { name: '陕西', lng: 108.95, lat: 34.26 },
  { name: '甘肃', lng: 103.82, lat: 36.06 },
  { name: '青海', lng: 101.78, lat: 36.62 },
  { name: '宁夏', lng: 106.28, lat: 38.47 },
  { name: '新疆', lng: 87.62, lat: 43.79 },
  { name: '台湾', lng: 121.03, lat: 23.70 },
  { name: '香港', lng: 114.17, lat: 22.32 },
  { name: '澳门', lng: 113.55, lat: 22.20 }
]

/**
 * 大屏指标定义。
 * 每个指标对应一种"图层"，在地图上用不同颜色渲染，这正是需求里的「云 / 雨 / 二氧化碳」。
 */
export const METRICS = [
  {
    key: 'cloud',
    label: '云量',
    unit: '%',
    desc: '卫星反演总云量，反映区域光照与蒸散条件',
    min: 0,
    max: 100,
    colors: ['#0b3d91', '#1976d2', '#4fc3f7', '#e0e0e0', '#ffffff']
  },
  {
    key: 'rain',
    label: '降雨量',
    unit: 'mm',
    desc: '近 24 小时累计降水，用于旱涝与灌溉决策',
    min: 0,
    max: 120,
    colors: ['#e8f5e9', '#a5d6a7', '#4caf50', '#1565c0', '#4a148c']
  },
  {
    key: 'co2',
    label: '二氧化碳',
    unit: 'ppm',
    desc: '近地面 CO₂ 体积分数，反映土壤呼吸与碳通量',
    min: 380,
    max: 460,
    colors: ['#1b5e20', '#7cb342', '#ffee58', '#ef6c00', '#b71c1c']
  },
  {
    key: 'soilMoisture',
    label: '土壤湿度',
    unit: '%',
    desc: '表层 10cm 体积含水率，直接决定采样与灌溉窗口',
    min: 0,
    max: 60,
    colors: ['#8d6e63', '#d7ccc8', '#b2dfdb', '#26a69a', '#00695c']
  },
  {
    key: 'deviceCount',
    label: '终端数量',
    unit: '台',
    desc: '该省已接入的采样终端总数（含在线/离线）',
    min: 0,
    max: 400,
    colors: ['#eceff1', '#90a4ae', '#42a5f5', '#1565c0', '#0d47a1']
  },
  {
    key: 'warningCount',
    label: '预警数量',
    unit: '条',
    desc: '当前未关闭的预警条数，颜色越暖表示越需要关注',
    min: 0,
    max: 40,
    colors: ['#e8f5e9', '#fff59d', '#ffb74d', '#e64a19', '#b71c1c']
  }
]

/**
 * 生成某个省在某指标下的值。
 * 用「区域特征 + 指标特征 + 确定性抖动」组合，保证数值看起来有地理规律（比如西北降水少、东部 CO₂ 高）
 * 而不是纯随机噪声。
 */
function provinceValue (province, metricKey) {
  const rnd = mulberry32(hashSeed(province.name + '|' + metricKey))
  const base = rnd()
  const lngFactor = (province.lng - 100) / 30   // 东部 → 1，西部 → 0
  const latFactor = (province.lat - 20) / 30    // 南方 → 0，北方 → 1

  switch (metricKey) {
    case 'cloud':
      // 南方与沿海云量偏高
      return Math.round(clamp(28 + (1 - latFactor) * 45 + base * 25, 2, 98))
    case 'rain':
      // 东南沿海降水多，西北少
      return Math.round(clamp((1 - latFactor) * 70 + lngFactor * 35 + base * 30 - 15, 0, 118) * 10) / 10
    case 'co2':
      // 工业与人口密集区偏高
      return Math.round(clamp(398 + lngFactor * 28 + latFactor * 14 + base * 16, 385, 458) * 10) / 10
    case 'soilMoisture':
      return Math.round(clamp(12 + (1 - latFactor) * 26 + base * 18, 5, 58) * 10) / 10
    case 'deviceCount':
      return Math.round(18 + lngFactor * 210 + base * 150)
    case 'warningCount':
      return Math.round(base * 22 + (lngFactor > 0.6 ? 8 : 0))
    default:
      return 0
  }
}

function clamp (v, min, max) {
  return Math.min(max, Math.max(min, v))
}

/**
 * 全部省份的大屏数据
 * @returns {Array<{name, lng, lat, cloud, rain, co2, soilMoisture, deviceCount, onlineCount, warningCount, farmlandArea, sampleCount}>}
 */
export function mockProvinceStats () {
  return PROVINCE_CENTERS.map(province => {
    const rnd = mulberry32(hashSeed(province.name + '|misc'))
    const deviceCount = provinceValue(province, 'deviceCount')
    const onlineRate = 0.72 + rnd() * 0.26
    return {
      name: province.name,
      lng: province.lng,
      lat: province.lat,
      cloud: provinceValue(province, 'cloud'),
      rain: provinceValue(province, 'rain'),
      co2: provinceValue(province, 'co2'),
      soilMoisture: provinceValue(province, 'soilMoisture'),
      deviceCount,
      onlineCount: Math.round(deviceCount * onlineRate),
      offlineCount: deviceCount - Math.round(deviceCount * onlineRate),
      warningCount: provinceValue(province, 'warningCount'),
      farmlandArea: Math.round((2000 + rnd() * 42000)),          // 公顷（演示值）
      sampleCount: Math.round(300 + rnd() * 5200),               // 累计采样次数（演示值）
      taskCount: Math.round(6 + rnd() * 90)                      // 进行中任务数（演示值）
    }
  })
}

/** 全国汇总 */
export function mockNationSummary (stats) {
  const list = stats || mockProvinceStats()
  const sum = key => list.reduce((acc, p) => acc + (Number(p[key]) || 0), 0)
  const avg = key => Math.round((sum(key) / Math.max(list.length, 1)) * 10) / 10
  return {
    provinceCount: list.length,
    deviceCount: sum('deviceCount'),
    onlineCount: sum('onlineCount'),
    offlineCount: sum('offlineCount'),
    warningCount: sum('warningCount'),
    farmlandArea: sum('farmlandArea'),
    sampleCount: sum('sampleCount'),
    taskCount: sum('taskCount'),
    avgCloud: avg('cloud'),
    avgRain: avg('rain'),
    avgCo2: avg('co2')
  }
}

/**
 * 省 → 市 → 区县 三级树（演示数据）
 * 有把握的省市使用真实名称；区县不足时按规则生成，并标记 demoGenerated。
 */
const REGION_TREE_RAW = {
  北京: ['北京市'],
  天津: ['天津市'],
  河北: ['石家庄市', '唐山市', '保定市', '邯郸市', '邢台市'],
  山西: ['太原市', '大同市', '阳泉市', '长治市', '晋中市', '运城市', '临汾市'],
  内蒙古: ['呼和浩特市', '包头市', '赤峰市', '通辽市'],
  辽宁: ['沈阳市', '大连市', '鞍山市', '锦州市'],
  吉林: ['长春市', '吉林市', '四平市', '松原市'],
  黑龙江: ['哈尔滨市', '齐齐哈尔市', '大庆市', '佳木斯市'],
  上海: ['上海市'],
  江苏: ['南京市', '无锡市', '徐州市', '苏州市', '南通市', '盐城市'],
  浙江: ['杭州市', '宁波市', '温州市', '嘉兴市', '绍兴市', '金华市'],
  安徽: ['合肥市', '芜湖市', '蚌埠市', '阜阳市', '宿州市'],
  福建: ['福州市', '厦门市', '泉州市', '漳州市', '南平市'],
  江西: ['南昌市', '九江市', '赣州市', '宜春市', '上饶市'],
  山东: ['济南市', '青岛市', '淄博市', '潍坊市', '济宁市', '临沂市', '德州市'],
  河南: ['郑州市', '开封市', '洛阳市', '新乡市', '南阳市', '周口市', '商丘市'],
  湖北: ['武汉市', '黄石市', '襄阳市', '荆州市', '宜昌市'],
  湖南: ['长沙市', '株洲市', '湘潭市', '衡阳市', '常德市', '岳阳市'],
  广东: ['广州市', '深圳市', '珠海市', '佛山市', '东莞市', '湛江市', '茂名市'],
  广西: ['南宁市', '柳州市', '桂林市', '玉林市', '百色市'],
  海南: ['海口市', '三亚市', '儋州市'],
  重庆: ['重庆市'],
  四川: ['成都市', '绵阳市', '德阳市', '宜宾市', '南充市', '达州市'],
  贵州: ['贵阳市', '遵义市', '六盘水市', '安顺市'],
  云南: ['昆明市', '曲靖市', '玉溪市', '大理市', '红河市'],
  西藏: ['拉萨市', '日喀则市', '林芝市'],
  陕西: ['西安市', '宝鸡市', '咸阳市', '渭南市', '榆林市', '汉中市'],
  甘肃: ['兰州市', '天水市', '武威市', '张掖市', '酒泉市'],
  青海: ['西宁市', '海东市', '格尔木市'],
  宁夏: ['银川市', '石嘴山市', '吴忠市', '固原市'],
  新疆: ['乌鲁木齐市', '克拉玛依市', '喀什市', '伊宁市', '阿克苏市'],
  台湾: ['台北市', '台中市', '高雄市', '台南市'],
  香港: ['香港特别行政区'],
  澳门: ['澳门特别行政区']
}

/** 真实区县名（有把握的少量城市；其余按规则生成） */
const REAL_DISTRICTS = {
  太原市: ['小店区', '迎泽区', '杏花岭区', '尖草坪区', '万柏林区', '晋源区', '清徐县', '阳曲县'],
  石家庄市: ['长安区', '桥西区', '新华区', '裕华区', '正定县', '鹿泉区'],
  济南市: ['历下区', '市中区', '槐荫区', '天桥区', '历城区', '长清区', '章丘区'],
  郑州市: ['中原区', '二七区', '金水区', '惠济区', '中牟县', '新郑市'],
  南京市: ['玄武区', '秦淮区', '建邺区', '鼓楼区', '江宁区', '浦口区'],
  杭州市: ['上城区', '拱墅区', '西湖区', '滨江区', '余杭区', '萧山区'],
  广州市: ['越秀区', '海珠区', '荔湾区', '天河区', '白云区', '番禺区'],
  成都市: ['锦江区', '青羊区', '金牛区', '武侯区', '成华区', '龙泉驿区'],
  西安市: ['新城区', '碑林区', '莲湖区', '雁塔区', '未央区', '长安区'],
  武汉市: ['江岸区', '江汉区', '硚口区', '汉阳区', '武昌区', '洪山区']
}

const DISTRICT_SUFFIX = ['城区', '新区', '开发区', '城关区', '郊区', '高新区']

function districtsOf (city) {
  if (REAL_DISTRICTS[city]) {
    return REAL_DISTRICTS[city].map(name => ({ name, demoGenerated: false }))
  }
  const rnd = mulberry32(hashSeed(city))
  const short = city.replace(/[市盟州地区]$/, '')
  const count = 3 + Math.floor(rnd() * 3)
  const picked = []
  for (let i = 0; i < count; i++) {
    const suffix = DISTRICT_SUFFIX[Math.floor(rnd() * DISTRICT_SUFFIX.length)]
    picked.push({ name: short + suffix, demoGenerated: true })
  }
  return picked
}

/** 省 → 市 → 区县 树 */
export function mockRegionTree () {
  return Object.keys(REGION_TREE_RAW).map(province => ({
    name: province,
    cities: REGION_TREE_RAW[province].map(city => ({
      name: city,
      districts: districtsOf(city)
    }))
  }))
}

/**
 * 某个地点的详细介绍（省/市/区三级都能取）
 * @param {{province:string, city?:string, district?:string}} sel
 */
export function mockRegionDetail (sel = {}) {
  const provinceName = sel.province || '山西'
  const cityName = sel.city || ''
  const districtName = sel.district || ''
  const key = [provinceName, cityName, districtName].filter(Boolean).join('/')
  const rnd = mulberry32(hashSeed('detail|' + key))
  const center = PROVINCE_CENTERS.filter(p => p.name === provinceName)[0] || { lng: 112.55, lat: 37.87 }
  const jitter = cityName ? 0.9 : 0
  const detailRnd = mulberry32(hashSeed('coord|' + key))

  const title = districtName || cityName || provinceName
  const level = districtName ? '区县' : (cityName ? '地市' : '省级')

  return {
    regionKey: key,
    title,
    level,
    province: provinceName,
    city: cityName,
    district: districtName,
    center: [
      Number((center.lng + (detailRnd() - 0.5) * jitter).toFixed(4)),
      Number((center.lat + (detailRnd() - 0.5) * jitter).toFixed(4))
    ],
    // 自然条件
    climate: ['温带季风气候', '亚热带季风气候', '温带大陆性气候', '高原山地气候', '热带季风气候'][Math.floor(rnd() * 5)],
    annualRain: Math.round(420 + rnd() * 900),
    annualTemp: Math.round((8 + rnd() * 12) * 10) / 10,
    frostFreeDays: Math.round(150 + rnd() * 130),
    elevation: Math.round(30 + rnd() * 1400),
    // 生产条件
    farmlandArea: Math.round(1200 + rnd() * 42000),
    mainCrops: pick(rnd, ['小麦', '玉米', '水稻', '大豆', '马铃薯', '棉花', '油菜', '谷子'], 2, 4),
    soilType: pick(rnd, ['褐土', '潮土', '水稻土', '红壤', '黑土', '砂姜黑土', '黄绵土'], 1, 2)[0],
    irrigationRate: Math.round(38 + rnd() * 58),
    // 监测条件
    deviceCount: Math.round(8 + rnd() * 180),
    onlineRate: Math.round((78 + rnd() * 20) * 10) / 10,
    samplePointCount: Math.round(20 + rnd() * 420),
    lastSampleTime: timeText(rnd),
    // 风险
    warningCount: Math.round(rnd() * 12),
    riskLevel: rnd() > 0.72 ? 'high' : (rnd() > 0.4 ? 'medium' : 'low'),
    // 说明
    intro: `${title}位于${provinceName}${cityName && districtName ? cityName : ''}，` +
      `属于${['温带季风气候', '亚热带季风气候', '温带大陆性气候'][Math.floor(rnd() * 3)]}，` +
      `耕地面积约 ${Math.round(1200 + rnd() * 42000)} 公顷，主产${pick(rnd, ['小麦', '玉米', '水稻', '大豆'], 2, 3).join('、')}。` +
      `当前接入 ${Math.round(8 + rnd() * 180)} 台采样终端，布设 ${Math.round(20 + rnd() * 420)} 个采样点。` +
      '（本段落为演示文本）'
  }
}

function pick (rnd, pool, min, max) {
  const count = min + Math.floor(rnd() * (max - min + 1))
  const copy = pool.slice()
  const out = []
  for (let i = 0; i < count && copy.length; i++) {
    out.push(copy.splice(Math.floor(rnd() * copy.length), 1)[0])
  }
  return out
}

function timeText (rnd) {
  const day = 15 + Math.floor(rnd() * 3)
  const hh = String(Math.floor(rnd() * 24)).padStart(2, '0')
  const mm = String(Math.floor(rnd() * 60)).padStart(2, '0')
  return `2026-09-${day} ${hh}:${mm}:00`
}

export default {
  PROVINCE_CENTERS,
  METRICS,
  mockProvinceStats,
  mockNationSummary,
  mockRegionTree,
  mockRegionDetail,
  mulberry32
}
