/**
 * 1号 前端GIS —— 纯逻辑回归测试（Node 运行，不需要浏览器）
 *
 * 运行：node tests/gis/run.mjs      （或在 frontend 目录执行 npm run test:gis）
 *
 * 为什么需要它：
 *   GisSelfCheck.vue 能在页面上做同样的自检，但需要人工点按钮、肉眼比对；
 *   这个脚本把同样的断言搬到命令行，任何人都能一条命令复现，适合放进 PR 说明和答辩记录。
 *
 * 覆盖内容（老师任务书 + 岗位约束里的硬性要求）：
 *   - 坐标系白名单与 GCJ02/WGS84/BD09 互转可逆性
 *   - 「不得自行猜坐标系」：缺失/非法坐标系必须抛错而不是默认
 *   - PIP：4 个采样点全部在界内（T1）、凹多边形凹口判为界外（T5）、禁入区排除（E3）
 *   - 最近未采样点：跳过已采样点、与穷举结果一致、全采样后返回 null
 *   - 轨迹：连续无跳点、时间单调递增、可复现
 *   - 路线：routeGeoJson 可解析、距离与几何自洽、2-opt 不劣化
 *   - 视图模型：边界/点位/设备/轨迹/统计字段完整，单点异常不影响整图
 *
 * 实现说明：
 *   被测源码使用 webpack 的 `@/` 别名和省略扩展名的相对导入，Node 的 ESM 解析器不接受这两种写法。
 *   因此脚本会先把被测文件复制到系统临时目录、补上扩展名、写一个 {"type":"module"} 的 package.json，
 *   再动态 import。被测的是「源码本身」，不是复制品。
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const frontendRoot = path.resolve(here, '..', '..')
const srcRoot = path.join(frontendRoot, 'src')

const FILE_MAP = [
  ['utils/gis/coordinate.js', 'coordinate.js'],
  ['utils/gis/geometry.js', 'geometry.js'],
  ['utils/gis/sceneModel.js', 'sceneModel.js'],
  ['mock/gis/scene.js', 'scene.js'],
  ['mock/gis/devices.js', 'devices.js']
]

const workDir = path.join(os.tmpdir(), `gis-check-${process.pid}`)

function prepareSources () {
  fs.rmSync(workDir, { recursive: true, force: true })
  fs.mkdirSync(workDir, { recursive: true })
  fs.writeFileSync(path.join(workDir, 'package.json'), '{ "type": "module" }\n')

  FILE_MAP.forEach(([relative, flat]) => {
    const source = path.join(srcRoot, relative)
    if (!fs.existsSync(source)) {
      throw new Error(`找不到被测源文件：${source}`)
    }
    let text = fs.readFileSync(source, 'utf8')
    // 省略扩展名的相对导入 -> 补 .js（Node ESM 要求显式扩展名）
    text = text.replace(/from '\.\/(coordinate|geometry|scene|devices)'/g, "from './$1.js'")
    // webpack 别名 @/utils/gis/x -> 同目录 x.js
    text = text.replace(/from '@\/utils\/gis\/(coordinate|geometry|sceneModel)'/g, "from './$1.js'")
    fs.writeFileSync(path.join(workDir, flat), text)
  })
}

const importFrom = name => import(pathToFileURL(path.join(workDir, name)).href)

function cleanup () {
  try {
    fs.rmSync(workDir, { recursive: true, force: true })
  } catch (e) {
    // 清理失败不影响测试结论
  }
}

async function main () {
  prepareSources()

  const {
    wgs84ToGcj02, gcj02ToWgs84, bd09ToGcj02, gcj02ToBd09,
    convert, normalizeCoordinateSystem, isValidCoordinateSystem, toMapCoordinate
  } = await importFrom('coordinate.js')

  const {
    pointInGeoJson, validatePointInBoundary, findNearestUnsampledPoint,
    haversine, isSampled, extractRings, extractHoles, polylineLength
  } = await importFrom('geometry.js')

  const {
    buildBoundaryModel, buildSamplingPointModels, buildDeviceModels,
    buildRouteModel, buildTrackModel, renderableTrajectory, parseGeoJson, formatArea
  } = await importFrom('sceneModel.js')

  const {
    mockFarmlandBrief, mockSamplingPoints, mockNavigationRoute,
    mockChartData, mockLatestByPoint
  } = await importFrom('scene.js')

  const { mockDevices, mockTrack, mockAllTracks } = await importFrom('devices.js')

  const rows = []
  const check = (name, pass, detail) => rows.push({ name, pass: !!pass, detail: String(detail) })

  // ======================================================== 坐标系
  {
    const [glng, glat] = wgs84ToGcj02(112.4357, 38.0134)
    const [wlng, wlat] = gcj02ToWgs84(glng, glat)
    const err = Math.max(Math.abs(wlng - 112.4357), Math.abs(wlat - 38.0134))
    check('GCJ02/WGS84 往返转换可逆（误差 < 1e-5 度）', err < 1e-5, `往返最大误差 ${err.toExponential(3)} 度`)

    const offset = haversine(112.4357, 38.0134, glng, glat)
    check('WGS84→GCJ02 偏移量在合理区间', offset > 50 && offset < 1000, `太原地区偏移 ${offset.toFixed(1)} m`)

    const [blng, blat] = gcj02ToBd09(112.4357, 38.0134)
    const back = bd09ToGcj02(blng, blat)
    const bdErr = Math.max(Math.abs(back[0] - 112.4357), Math.abs(back[1] - 38.0134))
    check('GCJ02/BD09 往返转换可逆', bdErr < 1e-5, `往返最大误差 ${bdErr.toExponential(3)} 度`)

    const viaConvert = convert(112.4357, 38.0134, 'WGS84', 'GCJ02')
    check('convert() 与直接转换结果一致',
      Math.abs(viaConvert[0] - glng) < 1e-12 && Math.abs(viaConvert[1] - glat) < 1e-12,
      `convert -> (${viaConvert[0].toFixed(7)}, ${viaConvert[1].toFixed(7)})`)

    let rejected = false
    try {
      normalizeCoordinateSystem('')
    } catch (e) {
      rejected = true
    }
    check('缺失 coordinateSystem 时抛出可读错误',
      rejected && !isValidCoordinateSystem('CGCS2000'),
      '空值抛错；白名单外的 CGCS2000 被拒绝')

    let threw = false
    try {
      toMapCoordinate({ longitude: null, latitude: null, coordinateSystem: 'GCJ02' })
    } catch (e) {
      threw = true
    }
    check('经纬度为 null 时抛错（不会被静默当成 0,0）', threw,
      'Number(null) === 0 是个坑，已显式排除 null/undefined/空串')

    let normalized = false
    try {
      toMapCoordinate({ longitude: 112.4357, latitude: 38.0134, coordinateSystem: 'wgs84' })
      normalized = true
    } catch (e) {
      normalized = false
    }
    check('小写坐标系可规范化（wgs84 → WGS84）', normalized, '大小写不敏感')
  }

  // ======================================================== 几何 / PIP
  const farmland = mockFarmlandBrief()
  const boundary = parseGeoJson(farmland.boundaryGeoJson)
  const points = mockSamplingPoints()
  {
    const rings = extractRings(boundary)
    const holes = extractHoles(boundary)
    check('边界 GeoJSON 解析正确（外环 + 内环）',
      rings.length === 1 && holes.length === 1,
      `外环 ${rings.length} 个、内环（禁入区）${holes.length} 个，外环顶点 ${rings[0].length} 个`)

    const outside = points.filter(p => !pointInGeoJson(p.longitude, p.latitude, boundary))
    check('4 个采样点全部落在农田多边形内（T1）',
      outside.length === 0,
      outside.length === 0 ? '全部通过 PIP 判定' : `越界点：${outside.map(p => p.pointCode).join(',')}`)

    const notch = pointInGeoJson(112.43660, 38.01250, boundary)
    check('凹多边形凹口内的点判为界外（T5）',
      notch === false,
      `凹口点 (112.4366, 38.0125) 判定 = ${notch ? '界内(错误)' : '界外(正确)'}`)

    const hole = pointInGeoJson(112.43480, 38.01350, boundary)
    check('禁入区（水塘内环）内的点判为界外（E3）',
      hole === false,
      `水塘中心 (112.4348, 38.0135) 判定 = ${hole ? '界内(错误)' : '界外(正确)'}`)

    const far = validatePointInBoundary(
      { longitude: 112.43900, latitude: 38.01500, coordinateSystem: 'GCJ02' }, boundary)
    check('农田边界外的点被拒绝添加', far.inside === false, far.message)

    const good = validatePointInBoundary(
      { longitude: 112.43460, latitude: 38.01120, coordinateSystem: 'GCJ02' }, boundary)
    check('农田边界内的点被接受', good.inside === true, good.message)

    const badCs = validatePointInBoundary(
      { longitude: 112.43460, latitude: 38.01120, coordinateSystem: '' }, boundary)
    check('手动选点缺少坐标系时拒绝校验（不猜测）',
      badCs.inside === false && /coordinateSystem/.test(badCs.message), badCs.message)
  }

  // ======================================================== 最近未采样点
  {
    const devices = mockDevices()
    const device = devices[0]
    const from = {
      longitude: device.longitude,
      latitude: device.latitude,
      coordinateSystem: device.coordinateSystem
    }
    const nearest = findNearestUnsampledPoint(from, points)
    check('最近未采样点计算正确（跳过已采样点）',
      !!nearest && !isSampled(nearest.point.status),
      nearest
        ? `从 ${device.deviceCode} (${device.longitude.toFixed(5)}, ${device.latitude.toFixed(5)}) 出发，` +
          `最近未采样点 = ${nearest.point.pointCode}，直线距离 ${nearest.distance.toFixed(1)} m`
        : '未找到未采样点（异常）')

    const allSampled = points.map(p => Object.assign({}, p, { status: 'sampled' }))
    const none = findNearestUnsampledPoint(from, allSampled)
    check('全部采样完成后不再返回指引目标', none === null, none === null ? '返回 null（正确）' : '仍返回了目标（错误）')

    const exhaustive = points
      .filter(p => !isSampled(p.status))
      .map(p => ({ code: p.pointCode, d: haversine(device.longitude, device.latitude, p.longitude, p.latitude) }))
      .sort((a, b) => a.d - b.d)[0]
    check('最近未采样点与穷举结果一致',
      !!nearest && nearest.point.pointCode === exhaustive.code,
      `算法取 ${nearest && nearest.point.pointCode}，穷举取 ${exhaustive.code}（${exhaustive.d.toFixed(1)} m）`)
  }

  // ======================================================== 轨迹
  {
    const tracks = mockAllTracks()
    const ids = Object.keys(tracks)
    let maxJump = 0
    let total = 0
    ids.forEach(id => {
      const track = tracks[id]
      total += track.length
      for (let i = 1; i < track.length; i++) {
        const d = haversine(track[i - 1].longitude, track[i - 1].latitude, track[i].longitude, track[i].latitude)
        if (d > maxJump) {
          maxJump = d
        }
      }
    })
    check('3 台设备轨迹连续、无随机跳点',
      ids.length === 3 && maxJump < 50 && total >= 250,
      `设备 ${ids.length} 台，共 ${total} 个轨迹点，相邻点最大位移 ${maxJump.toFixed(1)} m（阈值 50 m）`)

    const bad = ids.some(id => mockTrack(id).some(p =>
      !isValidCoordinateSystem(p.coordinateSystem) || !p.collectTime || !isFinite(p.longitude)))
    check('轨迹点均含 coordinateSystem 与 collectTime', !bad, bad ? '存在字段缺失的轨迹点' : '字段完整')

    const monotonic = ids.every(id => {
      const track = mockTrack(id)
      for (let i = 1; i < track.length; i++) {
        const prev = new Date(track[i - 1].collectTime.replace(' ', 'T'))
        const curr = new Date(track[i].collectTime.replace(' ', 'T'))
        if (!(curr > prev)) {
          return false
        }
      }
      return true
    })
    check('轨迹采集时间单调递增', monotonic, monotonic ? 'collectTime 严格递增' : '存在时间倒退')

    const a = JSON.stringify(mockTrack(ids[0]))
    const b = JSON.stringify(mockTrack(ids[0]))
    check('轨迹生成可复现（同种子结果一致）', a === b, `序列化长度 ${a.length} 字符，两次完全一致`)

    const models = renderableTrajectory(ids.map(id => mockTrack(id)[0]).filter(Boolean), 'GCJ02')
    check('轨迹视图模型可转换', models.length === 3, `成功转换 ${models.length} 条轨迹首点`)

    // 评审意见 #4：既有 MonitorRecordDTO 未冻结经纬度字段，
    // 真实历史记录可能一条坐标都没有 —— 必须明确报错，不能静默返回空数组
    const noCoordRecords = [
      { deviceId: 'DV1', metricCode: 'soilMoisture', metricValue: 31, collectTime: '2026-09-17 10:00:00' },
      { deviceId: 'DV1', metricCode: 'soilMoisture', metricValue: 32, collectTime: '2026-09-17 10:01:00' }
    ]
    const noCoord = buildTrackModel(noCoordRecords, 'GCJ02')
    check('轨迹记录缺经纬度字段时明确报错（不静默为空）',
      noCoord.points.length === 0 &&
      noCoord.missingCoordinateCount === 2 &&
      /轨迹 DTO|Q2/.test(noCoord.error || ''),
      noCoord.error || '（未报错）')

    const mixedRecords = [
      { deviceId: 'DV1', longitude: 112.4342, latitude: 38.0110, coordinateSystem: 'GCJ02', collectTime: '2026-09-17 10:00:00' },
      { deviceId: 'DV1', metricCode: 'soilMoisture', metricValue: 31, collectTime: '2026-09-17 10:01:00' },
      { deviceId: 'DV1', longitude: 112.4344, latitude: 38.0112, coordinateSystem: 'GCJ02', collectTime: '2026-09-17 10:02:00' }
    ]
    const mixed = buildTrackModel(mixedRecords, 'GCJ02')
    check('轨迹部分记录缺坐标时统计跳过数并给出提示',
      mixed.points.length === 2 && mixed.missingCoordinateCount === 1 && !!mixed.error,
      mixed.error)

    const emptyTrack = buildTrackModel([], 'GCJ02')
    check('轨迹记录为空时给出可读原因',
      emptyTrack.points.length === 0 && !!emptyTrack.error, emptyTrack.error)
  }

  // ======================================================== 路线
  {
    const routeModel = buildRouteModel(mockNavigationRoute(), 'GCJ02')
    check('路线 routeGeoJson 可解析且点数正确',
      !routeModel.error && routeModel.coordinates.length === 4 && routeModel.orderedPoints.length === 4,
      routeModel.error || `解析出 ${routeModel.coordinates.length} 个路线坐标点，${routeModel.orderedPoints.length} 个有序采样点`)

    const orderedIds = (routeModel.orderedPoints || []).map(p => p.samplingPointId)
    const uniqueIds = orderedIds.filter((id, index) => orderedIds.indexOf(id) === index)
    const missing = points.map(p => p.samplingPointId).filter(id => orderedIds.indexOf(id) === -1)
    check('路线不漏点、不重复（T2 导航指引正确性）',
      orderedIds.length === uniqueIds.length && missing.length === 0,
      `顺序 [${orderedIds.join(' → ')}]，重复 ${orderedIds.length - uniqueIds.length} 个，漏点 ${missing.length} 个`)

    const computed = polylineLength(routeModel.coordinates)
    check('路线距离与后端下发值一致（误差 < 2%）',
      Math.abs(computed - routeModel.distance) / routeModel.distance < 0.02,
      `几何计算 ${computed.toFixed(1)} m vs 接口下发 ${routeModel.distance} m`)

    const noSystem = buildRouteModel(
      { routeGeoJson: JSON.stringify({ type: 'LineString', coordinates: [[0, 0], [1, 1]] }) }, '')
    check('路线缺少 coordinateSystem 时拒绝推测显示',
      !!noSystem.error && noSystem.coordinates.length === 0, noSystem.error)

    const diag = routeModel.diagnostics
    check('2-opt 结果不劣化（优化距离 ≤ 初始距离）',
      !!diag && diag.optimizedDistance <= diag.initialDistance,
      diag ? `初始 ${diag.initialDistance} m → 优化 ${diag.optimizedDistance} m` : '缺少 diagnostics')
  }

  // ======================================================== 视图模型 / 统计
  {
    const boundaryModel = buildBoundaryModel(farmland)
    check('农田边界视图模型构建成功（边界自带 coordinateSystem）',
      !!boundaryModel.geoJson && boundaryModel.ringCount === 1 && !boundaryModel.error,
      boundaryModel.error || `${boundaryModel.ringCount} 个环，估算面积 ${formatArea(boundaryModel.area)}`)

    // 评审意见 #5：边界没有自己的 coordinateSystem 时，必须拒绝渲染，
    // 绝不能拿采样点/路线的「场景坐标系」去兜底猜测
    const withoutCs = buildBoundaryModel({ farmlandId: 'F1', boundaryGeoJson: farmland.boundaryGeoJson }, 'GCJ02')
    check('边界缺 coordinateSystem 时拒绝渲染（不接受场景坐标系兜底）',
      !!withoutCs.error && withoutCs.geoJson === null && /coordinateSystem/.test(withoutCs.error),
      withoutCs.error)

    const badCs = buildBoundaryModel({
      farmlandId: 'F1',
      boundaryGeoJson: farmland.boundaryGeoJson,
      coordinateSystem: 'CGCS2000'
    })
    check('边界坐标系不在白名单内时拒绝渲染',
      !!badCs.error && badCs.geoJson === null, badCs.error)

    const pointModels = buildSamplingPointModels(points, 'GCJ02')
    check('采样点视图模型字段完整',
      pointModels.points.length === 4 && pointModels.errors.length === 0,
      pointModels.errors.length ? pointModels.errors.join('; ') : `成功转换 ${pointModels.points.length} 个采样点`)

    const deviceModels = buildDeviceModels(mockDevices())
    check('设备视图模型转换成功（mock 自带坐标）',
      deviceModels.devices.length === 3 && deviceModels.errors.length === 0,
      deviceModels.errors.length ? deviceModels.errors.join('; ') : `${deviceModels.devices.length} 台设备，坐标均有效`)

    // 评审意见 #3：DeviceBriefDTO 只承诺 deviceId/deviceCode/deviceName/category/status，
    // 不承诺坐标。缺位置字段时必须标记为「位置未提供」，不得产生 (0,0)
    const briefOnly = buildDeviceModels([
      { deviceId: 'D1', deviceCode: 'DEV001', deviceName: '一号', category: 'sampler', status: 'online' }
    ])
    const briefDevice = briefOnly.devices[0] || {}
    check('设备只有 DeviceBriefDTO 字段时不产生坐标、标记位置未提供',
      briefOnly.devices.length === 1 &&
      briefOnly.errors.length === 1 &&
      !isFinite(briefDevice.longitude) &&
      /DeviceLocationDTO/.test(briefDevice.positionError || ''),
      briefDevice.positionError || '（未标记）')

    const noCsDevice = buildDeviceModels([
      { deviceId: 'D2', deviceCode: 'DEV002', longitude: 112.43, latitude: 38.01 }
    ])
    check('设备有坐标但缺 coordinateSystem 时拒绝推测',
      !isFinite(noCsDevice.devices[0].longitude) && noCsDevice.errors.length === 1,
      noCsDevice.errors[0] || '（未标记）')

    const broken = buildDeviceModels(
      [{ deviceId: 'X', deviceCode: 'DEVX', longitude: null, latitude: null, coordinateSystem: 'GCJ02' }])
    check('单台设备位置无效时不影响整图加载',
      broken.devices.length === 1 && broken.errors.length === 1,
      broken.errors[0] || '（未记录错误）')

    const chart = mockChartData()
    const mismatch = chart.rows.some(row => {
      const keys = Object.keys(row)
      return keys.length !== chart.columns.length || chart.columns.some(c => keys.indexOf(c) === -1)
    })
    check('统计数据 columns 与 rows key 完全一致',
      !mismatch && chart.columns[0] === 'collectTime',
      mismatch ? '存在列名与行 key 不一致' : `columns = [${chart.columns.join(', ')}]，rows ${chart.rows.length} 行`)

    const latest = mockLatestByPoint('SP0001')
    const metricCodes = latest.map(r => r.metricCode).sort()
    const expected = ['airHumidity', 'airTemperature', 'soilDepth', 'soilMoisture', 'soilTemperature']
    check('最新监测返回老师规定的 5 项采样指标',
      JSON.stringify(metricCodes) === JSON.stringify(expected),
      `指标：${metricCodes.join(', ')}`)
  }

  // ======================================================== 静态契约守卫
  // 把「合并评审提出的收紧项」固化成可执行断言，防止以后被改回去。
  // 这些是源码级检查（读文件 + 断言），不依赖运行环境。
  {
    // 去掉注释再匹配，允许源码里用注释解释历史原因而不触发误报
    const stripComments = src => src
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1')
    const readSrc = rel => stripComments(fs.readFileSync(path.join(srcRoot, rel), 'utf8'))

    // 守卫 1（评审 #1）：采样点 Service 必须完全只读
    const spService = readSrc('api/samplingpoint/samplingPointService.js')
    check('守卫：采样点 Service 只读，不含任何未冻结写端点',
      !/method:\s*['"]post['"]/i.test(spService) &&
      !/saveBatch/.test(spService) &&
      !/updateStatus/.test(spService),
      '未发现 save / saveBatch / updateStatus 与任何 POST')

    // 守卫 1b：网关也不应保留写方法
    const gateway = readSrc('api/gis/gisGateway.js')
    check('守卫：GIS 网关不含 saveManualPoints 等写方法',
      !/saveManualPoints/.test(gateway),
      '未发现写方法')

    // 守卫 2（评审 #7）：高德 Key 不得从浏览器端存储读取
    const amapLoader = readSrc('utils/gis/amapLoader.js')
    check('守卫：高德配置不从浏览器本地存储读取（Key 只走环境变量/部署注入）',
      !/localStorage|sessionStorage/.test(amapLoader),
      'amapLoader 中无 localStorage / sessionStorage 引用')

    // 守卫 3（评审 #2）：权限判定不得以"权限列表为空"为放行条件
    const permission = readSrc('utils/gis/gisPermission.js')
    check('守卫：权限判定不读取浏览器权限列表，仅支持显式演示开关',
      !/localStorage|sessionStorage/.test(permission),
      'gisPermission 中无 localStorage / sessionStorage 引用')

    // 守卫 4（评审 #4）：轨迹排序字段必须是数据库列名
    const monitorService = readSrc('api/monitor/monitorGisService.js')
    check('守卫：轨迹排序用数据库列名 collect_time，而非 collectTime',
      /column:\s*['"]collect_time['"]/.test(monitorService) &&
      !/column:\s*['"]collectTime['"]/.test(monitorService),
      'orders.column = collect_time')

    // 守卫 5（评审 #3）：独立演示入口只在非生产构建产出
    const vueConfig = stripComments(fs.readFileSync(path.join(frontendRoot, 'vue.config.js'), 'utf8'))
    check('守卫：独立演示入口 gis.html 仅在非生产构建产出',
      /NODE_ENV\s*!==\s*['"]production['"]/.test(vueConfig) && /pages\.gis\s*=/.test(vueConfig),
      'vue.config.js 中 pages.gis 被 NODE_ENV !== production 包住')

    // 守卫 6（评审 #5）：边界视图模型不得接受坐标系兜底参数
    const sceneModel = readSrc('utils/gis/sceneModel.js')
    const boundaryFn = (sceneModel.match(/export function buildBoundaryModel[\s\S]{0,200}?\)\s*\{/) || [''])[0]
    check('守卫：buildBoundaryModel 不接受任何坐标系兜底参数',
      !!boundaryFn && !/fallback/i.test(boundaryFn),
      boundaryFn ? boundaryFn.split('\n')[0].trim() : '未匹配到函数签名')
  }

  // ======================================================== 输出
  const passed = rows.filter(r => r.pass).length
  const failed = rows.length - passed
  const width = rows.reduce((m, r) => Math.max(m, r.name.length), 10)

  console.log('')
  console.log('='.repeat(104))
  console.log('1号 前端GIS —— 纯逻辑回归测试（node tests/gis/run.mjs）')
  console.log('='.repeat(104))
  rows.forEach((r, i) => {
    console.log(`${String(i + 1).padStart(2)}. [${r.pass ? 'PASS' : 'FAIL'}] ${r.name.padEnd(width)}  ${r.detail}`)
  })
  console.log('-'.repeat(104))
  console.log(`合计 ${rows.length} 项：通过 ${passed} 项，失败 ${failed} 项`)
  console.log('='.repeat(104))
  console.log('')

  cleanup()
  process.exit(failed === 0 ? 0 : 1)
}

main().catch(error => {
  cleanup()
  console.error('测试执行异常：', error)
  process.exit(2)
})
