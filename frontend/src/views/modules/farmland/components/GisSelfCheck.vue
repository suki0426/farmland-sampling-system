<template>
  <div class="gis-self-check" :data-selfcheck-summary="summaryAttr">
    <div class="gis-self-check__toolbar">
      <el-button size="mini" type="primary" icon="el-icon-caret-right" :loading="running" @click="run">运行自检</el-button>
      <span v-if="summary" class="gis-self-check__summary">
        共 {{ summary.total }} 项，通过 {{ summary.passed }} 项，失败 {{ summary.failed }} 项
      </span>
    </div>

    <el-table :data="rows" size="mini" border max-height="300" empty-text="点击「运行自检」执行前端几何与坐标自检">
      <el-table-column label="结果" width="64" align="center">
        <template slot-scope="scope">
          <i v-if="scope.row.pass" class="el-icon-success gis-self-check__pass"></i>
          <i v-else class="el-icon-error gis-self-check__fail"></i>
        </template>
      </el-table-column>
      <el-table-column label="用例" prop="name" min-width="170" />
      <el-table-column label="详情" prop="detail" min-width="260" show-overflow-tooltip />
    </el-table>
  </div>
</template>

<script>
/**
 * 前端自检面板（1号 前端GIS 岗位）
 *
 * 用途：把「点位是否真的落在多边形内」「坐标系转换是否可逆」「凹口与禁入区是否被正确排除」
 * 「轨迹是否连续」这些前端必须自己保证的正确性，做成可一键复现的检查项，
 * 直接产出可写进 PR / 答辩记录的测试结果。
 *
 * 覆盖的验收要点：
 *  - T1 布点有效性：所有点落在多边形内部，无界外点
 *  - T5 凹多边形地块：带凹口的地块，凹口内的点必须判为界外
 *  - 扩展任务 E3：禁入区（内环/洞）内的点必须判为界外
 */

import { pointInGeoJson, validatePointInBoundary, findNearestUnsampledPoint, haversine } from '@/utils/gis/geometry'
import { wgs84ToGcj02, gcj02ToWgs84, normalizeCoordinateSystem, isValidCoordinateSystem } from '@/utils/gis/coordinate'
import {
  buildBoundaryModel, buildSamplingPointModels, buildDeviceModels, buildRouteModel, buildTrackModel, parseGeoJson
} from '@/utils/gis/sceneModel'
import gisMock from '@/mock/gis'
import { mockFarmlandBrief, mockSamplingPoints, mockNavigationRoute, mockChartData } from '@/mock/gis/scene'
import { mockTrack, mockDevices } from '@/mock/gis/devices'

export default {
  name: 'GisSelfCheck',
  data () {
    return {
      running: false,
      rows: [],
      summary: null
    }
  },
  computed: {
    /** 供自动化检查/答辩截图使用的机器可读结果 */
    summaryAttr () {
      if (!this.summary) {
        return 'pending'
      }
      return `total=${this.summary.total};passed=${this.summary.passed};failed=${this.summary.failed}`
    }
  },
  mounted () {
    // 支持通过 URL 参数自动运行自检：gis.html?selfcheck=1
    // 便于 CI / 无人值守验证，也方便答辩时直接打开就出结果
    const search = `${window.location.search || ''}${window.location.hash || ''}`
    if (/selfcheck=1/.test(search)) {
      this.$nextTick(() => this.run())
    }
  },
  methods: {
    async run () {
      this.running = true
      this.rows = []
      this.summary = null
      const rows = []
      const add = (name, pass, detail) => rows.push({ name, pass: !!pass, detail: String(detail) })

      try {
        const farmland = mockFarmlandBrief()
        const boundary = parseGeoJson(farmland.boundaryGeoJson)
        const points = mockSamplingPoints()

        // ---------- 用例 1：坐标系往返转换精度 ----------
        const [glng, glat] = wgs84ToGcj02(112.4357, 38.0134)
        const [wlng, wlat] = gcj02ToWgs84(glng, glat)
        const roundTripError = Math.max(Math.abs(wlng - 112.4357), Math.abs(wlat - 38.0134))
        add('坐标系 GCJ02/WGS84 往返转换可逆',
          roundTripError < 1e-5,
          `往返最大误差 ${roundTripError.toExponential(3)} 度（阈值 1e-5）`)

        const offsetMeters = haversine(112.4357, 38.0134, glng, glat)
        add('WGS84→GCJ02 偏移量在合理区间',
          offsetMeters > 50 && offsetMeters < 1000,
          `太原地区偏移 ${offsetMeters.toFixed(1)} m（合理区间 50~1000 m）`)

        // ---------- 用例 2：非法/缺失坐标系必须被拒绝 ----------
        let rejected = false
        try {
          normalizeCoordinateSystem('')
        } catch (e) {
          rejected = true
        }
        add('缺失 coordinateSystem 时拒绝推测',
          rejected && !isValidCoordinateSystem('CGCS2000'),
          '空值与白名单外的坐标系（如 CGCS2000）均抛出可读错误')

        // ---------- 用例 3：手动选点 PIP —— 4 个正式采样点全部在边界内 ----------
        const outside = points.filter(p => !pointInGeoJson(p.longitude, p.latitude, boundary))
        add('4 个采样点全部落在农田多边形内（T1）',
          outside.length === 0,
          outside.length === 0
            ? '全部通过 PIP 判定'
            : `越界点：${outside.map(p => p.pointCode).join(',')}`)

        // ---------- 用例 4：凹多边形凹口必须判为界外（T5） ----------
        const notchLng = 112.43660
        const notchLat = 38.01250
        const notchInside = pointInGeoJson(notchLng, notchLat, boundary)
        add('凹多边形凹口内的点判为界外（T5）',
          notchInside === false,
          `凹口点 (${notchLng}, ${notchLat}) 判定结果 = ${notchInside ? '界内(错误)' : '界外(正确)'}`)

        // ---------- 用例 5：禁入区（内环/洞）内的点必须判为界外（E3） ----------
        const holeLng = 112.43480
        const holeLat = 38.01350
        const holeInside = pointInGeoJson(holeLng, holeLat, boundary)
        add('禁入区（水塘内环）内的点判为界外（E3）',
          holeInside === false,
          `水塘中心 (${holeLng}, ${holeLat}) 判定结果 = ${holeInside ? '界内(错误)' : '界外(正确)'}`)

        // ---------- 用例 6：明显界外的点必须被拒绝 ----------
        const outsideCheck = validatePointInBoundary({
          longitude: 112.43900,
          latitude: 38.01500,
          coordinateSystem: 'GCJ02'
        }, boundary)
        add('农田边界外的点被拒绝添加',
          outsideCheck.inside === false,
          outsideCheck.message)

        // ---------- 用例 7：最近未采样点不会指向已采样点 ----------
        const devices = mockDevices()
        const device = devices[0]
        const nearest = findNearestUnsampledPoint({
          longitude: device.longitude,
          latitude: device.latitude,
          coordinateSystem: device.coordinateSystem
        }, points)
        const nearestIsSampled = nearest ? ['sampled'].indexOf(String(nearest.point.status)) !== -1 : true
        add('最近未采样点计算正确（跳过已采样点）',
          !!nearest && !nearestIsSampled,
          nearest
            ? `从 ${device.deviceCode} 出发，最近未采样点 = ${nearest.point.pointCode}，直线距离 ${nearest.distance.toFixed(1)} m`
            : '未找到未采样点（异常）')

        // ---------- 用例 8：轨迹连续，无跳点 ----------
        let maxJump = 0
        let trackPoints = 0
        Object.keys(gisMock.allTracks()).forEach(id => {
          const track = mockTrack(id)
          trackPoints += track.length
          for (let i = 1; i < track.length; i++) {
            const d = haversine(track[i - 1].longitude, track[i - 1].latitude, track[i].longitude, track[i].latitude)
            if (d > maxJump) {
              maxJump = d
            }
          }
        })
        add('3 台设备轨迹连续、无随机跳点',
          maxJump < 50 && trackPoints >= 250,
          `共 ${trackPoints} 个轨迹点，相邻点最大位移 ${maxJump.toFixed(1)} m（阈值 50 m）`)

        // ---------- 用例 9：轨迹每点都带坐标系与采集时间 ----------
        const trackBad = Object.keys(gisMock.allTracks()).some(id =>
          mockTrack(id).some(p => !isValidCoordinateSystem(p.coordinateSystem) || !p.collectTime))
        add('轨迹点均含 coordinateSystem 与 collectTime',
          !trackBad,
          trackBad ? '存在缺少坐标系或采集时间的轨迹点' : '字段完整')

        // ---------- 用例 10：路线解析与距离计算 ----------
        const routeModel = buildRouteModel(mockNavigationRoute(), 'GCJ02')
        add('路线 routeGeoJson 可解析且点数正确',
          !routeModel.error && routeModel.coordinates.length >= 4 && routeModel.orderedPoints.length === 4,
          routeModel.error || `解析出 ${routeModel.coordinates.length} 个路线坐标点，${routeModel.orderedPoints.length} 个有序采样点`)

        // ---------- 用例 10b：路线不漏点、不重复（T2 导航指引正确性） ----------
        const orderedIds = (routeModel.orderedPoints || []).map(p => p.samplingPointId)
        const uniqueIds = orderedIds.filter((id, index) => orderedIds.indexOf(id) === index)
        const allPointIds = points.map(p => p.samplingPointId)
        const missing = allPointIds.filter(id => orderedIds.indexOf(id) === -1)
        add('路线不漏点、不重复（T2）',
          orderedIds.length === uniqueIds.length && missing.length === 0,
          `顺序 [${orderedIds.join(' → ')}]，重复 ${orderedIds.length - uniqueIds.length} 个，漏点 ${missing.length} 个`)

        // ---------- 用例 11：统计 ChartDataDTO 的 columns 与 rows key 完全一致 ----------
        const chart = mockChartData()
        const keyMismatch = chart.rows.some(row => {
          const rowKeys = Object.keys(row)
          return rowKeys.length !== chart.columns.length ||
            chart.columns.some(col => rowKeys.indexOf(col) === -1)
        })
        add('统计数据 columns 与 rows key 完全一致',
          !keyMismatch,
          keyMismatch ? '存在列名与行 key 不一致的记录' : `columns = [${chart.columns.join(', ')}]`)

        // ---------- 用例 12：边界视图模型可构建 ----------
        const boundaryModel = buildBoundaryModel(farmland)
        add('农田边界视图模型构建成功（边界自带 coordinateSystem）',
          !!boundaryModel.geoJson && boundaryModel.ringCount >= 1 && !boundaryModel.error,
          boundaryModel.error || `成功构建 ${boundaryModel.ringCount} 个环，估算面积 ${boundaryModel.area.toFixed(0)} m²`)

        // ---------- 用例 12b：边界缺坐标系必须拒绝渲染（评审意见 #5）----------
        const boundaryNoCs = buildBoundaryModel({ farmlandId: 'F1', boundaryGeoJson: farmland.boundaryGeoJson })
        add('边界缺 coordinateSystem 时拒绝渲染，不拿场景坐标系兜底',
          !!boundaryNoCs.error && boundaryNoCs.geoJson === null && /coordinateSystem/.test(boundaryNoCs.error),
          boundaryNoCs.error)

        // ---------- 用例 13：采样点视图模型保留全部字段 ----------
        const pointModels = buildSamplingPointModels(points, 'GCJ02')
        add('采样点视图模型字段完整',
          pointModels.points.length === points.length && pointModels.errors.length === 0,
          pointModels.errors.length ? pointModels.errors.join('; ') : `成功转换 ${pointModels.points.length} 个采样点`)

        // ---------- 用例 14：设备只有 DeviceBriefDTO 字段时不产生坐标（评审意见 #3）----------
        const briefOnly = buildDeviceModels([
          { deviceId: 'D1', deviceCode: 'DEV001', deviceName: '一号', category: 'sampler', status: 'online' }
        ])
        const briefDevice = briefOnly.devices[0] || {}
        add('设备缺位置字段时标记「位置未提供」而非画到 0,0',
          briefOnly.devices.length === 1 && briefOnly.errors.length === 1 && !isFinite(briefDevice.longitude),
          briefDevice.positionError || '（未标记）')

        // ---------- 用例 15：轨迹缺坐标字段时明确报错（评审意见 #4）----------
        const noCoord = buildTrackModel([
          { deviceId: 'DV1', metricCode: 'soilMoisture', metricValue: 31, collectTime: '2026-09-17 10:00:00' }
        ], 'GCJ02')
        add('轨迹记录缺经纬度字段时明确报错，不静默为空',
          noCoord.points.length === 0 && noCoord.missingCoordinateCount === 1 && !!noCoord.error,
          noCoord.error)
      } catch (error) {
        add('自检执行异常', false, (error && error.message) || String(error))
      }

      this.rows = rows
      this.summary = {
        total: rows.length,
        passed: rows.filter(r => r.pass).length,
        failed: rows.filter(r => !r.pass).length
      }
      this.running = false
    }
  }
}
</script>

<style lang="scss" scoped>
.gis-self-check {
  &__toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  &__summary {
    font-size: 12px;
    color: #607d8b;
  }

  &__pass {
    color: #2e7d32;
    font-size: 16px;
  }

  &__fail {
    color: #c62828;
    font-size: 16px;
  }
}
</style>
