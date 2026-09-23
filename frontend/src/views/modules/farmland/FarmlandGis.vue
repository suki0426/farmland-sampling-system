<template>
  <div class="farmland-gis">
    <!-- ===================== 顶部工具栏 ===================== -->
    <div class="farmland-gis__toolbar">
      <div class="farmland-gis__toolbar-left">
        <span class="farmland-gis__brand">
          <i class="el-icon-map-location"></i>
          农田智能采样 GIS 演示平台
        </span>
        <el-select v-model="farmlandId" size="mini" class="farmland-gis__select" placeholder="选择农田" @change="onFarmlandChange">
          <el-option
            v-for="item in farmlandList"
            :key="item.farmlandId"
            :label="`${item.farmlandName}（${item.farmlandCode}）`"
            :value="item.farmlandId" />
        </el-select>
        <el-input v-model="taskId" size="mini" class="farmland-gis__input" placeholder="taskId" />
      </div>

      <div class="farmland-gis__toolbar-right">
        <span class="farmland-gis__label">地图</span>
        <el-radio-group v-model="forceProvider" size="mini" @change="onProviderChange">
          <el-radio-button label="">自动(优先生高德)</el-radio-button>
          <el-radio-button label="amap">高德</el-radio-button>
          <el-radio-button label="vector">离线</el-radio-button>
        </el-radio-group>

        <span class="farmland-gis__label">刷新</span>
        <el-select v-model="refreshInterval" size="mini" class="farmland-gis__interval" @change="restartTimer">
          <el-option label="2 秒" :value="2000" />
          <el-option label="5 秒" :value="5000" />
          <el-option label="10 秒" :value="10000" />
          <el-option label="关闭" :value="0" />
        </el-select>

        <span class="farmland-gis__label">演示倍速</span>
        <el-select v-model="demoSpeed" size="mini" class="farmland-gis__interval">
          <el-option label="1x 步行" :value="1.4" />
          <el-option label="5x" :value="7" />
          <el-option label="10x" :value="14" />
          <el-option label="20x" :value="28" />
        </el-select>

        <span class="farmland-gis__label">定位</span>
        <el-button-group>
          <el-button size="mini" icon="el-icon-zoom-to-fit" @click="fitBounds">适配农田</el-button>
          <el-button size="mini" icon="el-icon-truck" :disabled="!selectedDeviceId" @click="locateSelectedDevice">选中设备</el-button>
          <el-button size="mini" icon="el-icon-location-outline" :loading="locating" @click="locateMe">我的位置</el-button>
        </el-button-group>

        <el-button size="mini" icon="el-icon-refresh" :loading="loading" @click="reloadAll">重新加载</el-button>
      </div>
    </div>

    <!-- ===================== 全局提示 ===================== -->
    <el-alert
      v-if="globalNotice"
      :title="globalNotice"
      :type="globalNoticeType"
      :closable="true"
      show-icon
      class="farmland-gis__notice"
      @close="globalNotice = ''" />

    <!-- ===================== 主体：地图 + 侧栏 ===================== -->
    <div class="farmland-gis__body">
      <div ref="mapWrap" class="farmland-gis__map">
        <GisMap
          ref="gisMap"
          :scene="scene"
          :scene-version="sceneVersion"
          :layers="layers"
          :pick-mode="pickMode"
          :force-provider="forceProvider"
          @ready="onMapReady"
          @provider-error="onProviderError"
          @map-click="onMapClick"
          @point-click="onPointClick"
          @device-click="onDeviceClick"
          @boundary-click="onBoundaryClick" />
      </div>

      <div class="farmland-gis__side">
        <el-tabs v-model="activeTab" class="farmland-gis__tabs">
          <el-tab-pane label="农田/图层" name="farmland">
            <FarmlandInfoPanel
              :farmland="farmland"
              :boundary="boundaryModel"
              :coordinate-system="sceneCoordinateSystem" />
            <el-divider content-position="left">图层管理</el-divider>
            <LayerControl :layers="layers" :counts="layerCounts" @update="onLayerUpdate" />
            <el-divider content-position="left">边界选中</el-divider>
            <div class="farmland-gis__hint">
              <el-switch
                v-model="boundarySelected"
                size="mini"
                active-text="高亮选中边界"
                @change="onBoundarySelectedChange" />
              <div>提示：也可以直接在地图上点击农田边界来切换高亮。</div>
            </div>
            <el-divider content-position="left">数据来源</el-divider>
            <div class="farmland-gis__hint">
              <el-tag size="mini" :type="isFallback ? 'warning' : 'success'">
                {{ isFallback ? '含模拟数据' : '全部来自后端接口' }}
              </el-tag>
              <span class="farmland-gis__hint-text">{{ dataSourceSummary }}</span>
            </div>
          </el-tab-pane>

          <el-tab-pane :label="`采样点(${points.length})`" name="point">
            <SamplingPointPanel
              :points="points"
              :pick-mode="pickMode"
              :pick-error="pickError"
              :loading="loading"
              :manual-count="manualPoints.length"
              :can-pick="canPickPoints"
              :demo-mode="isDemoMode"
              @toggle-pick="togglePickMode"
              @refresh="loadSamplingPoints"
              @select="onPointSelect"
              @view-data="onViewPointData"
              @remove-manual="removeManualPoint"
              @save-manual="onManualSaveBlocked"
              @clear-manual-preview="clearManualPreview"
              @clear-pick-error="pickError = ''" />
          </el-tab-pane>

          <el-tab-pane :label="`设备(${devices.length})`" name="device">
            <DevicePanel
              :devices="devices"
              :selected-device-id="selectedDeviceId"
              :demo-mode="demoMode"
              :loading="loading"
              :guidance="guidance"
              @refresh="reloadDevices"
              @select="onDeviceSelect"
              @toggle-demo="toggleDemo"
              @simulate-offline="simulateOffline" />
            <el-divider content-position="left">轨迹</el-divider>
            <el-button size="mini" icon="el-icon-s-marketing" :loading="trackLoading" @click="loadSelectedTrajectory">
              加载 {{ selectedDeviceCode || '选中设备' }} 历史轨迹
            </el-button>
            <el-button size="mini" plain icon="el-icon-delete" @click="clearTrajectories">清除全部轨迹</el-button>
            <div class="farmland-gis__hint">
              当前轨迹点数：{{ trajectoryPointCount }}
            </div>
          </el-tab-pane>

          <el-tab-pane label="路线" name="route">
            <RoutePanel :route="routeModel" :points="points" :guidance="guidance" />
          </el-tab-pane>

          <el-tab-pane label="历史数据" name="history">
            <HistoryPanel
              ref="historyPanel"
              :points="points"
              :devices="devices"
              :task-id="taskId"
              :focus-sampling-point-id="focusSamplingPointId"
              @export="onExportHistory" />
          </el-tab-pane>

          <el-tab-pane label="接口状态" name="diag">
            <GisDiagnostics :items="diagnostics" />
            <div class="farmland-gis__hint">
              <el-button size="mini" plain icon="el-icon-refresh-left" @click="resetDiagnostics">重置诊断</el-button>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- ===================== 底部：统计 + 自检 ===================== -->
    <div class="farmland-gis__bottom" :class="{ 'is-collapsed': bottomCollapsed }">
      <div class="farmland-gis__bottom-head">
        <el-tabs v-model="bottomTab" class="farmland-gis__bottom-tabs">
          <el-tab-pane label="采样统计图表" name="stats" />
          <el-tab-pane label="前端自检（几何/坐标/轨迹）" name="check" />
        </el-tabs>
        <el-button size="mini" type="text" @click="bottomCollapsed = !bottomCollapsed">
          {{ bottomCollapsed ? '展开' : '收起' }}
          <i :class="bottomCollapsed ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i>
        </el-button>
      </div>
      <div v-show="!bottomCollapsed" class="farmland-gis__bottom-body">
        <StatsChart
          v-show="bottomTab === 'stats'"
          :data="chartData"
          :loading="chartLoading"
          :error="chartError"
          @refresh="loadChart" />
        <GisSelfCheck v-show="bottomTab === 'check'" />
      </div>
    </div>

    <!-- ===================== 到达采样点弹窗 ===================== -->
    <SampleDataDialog
      :visible.sync="dialogVisible"
      :point="dialogPoint"
      :device-code="dialogDeviceCode"
      :device-id="dialogDeviceId"
      :metrics="dialogMetrics"
      :collect-time="dialogCollectTime"
      @view-history="onViewPointHistory" />
  </div>
</template>

<script>
/**
 * 农田智能采样 GIS 主页面（1号 刘建鑫 · 前端GIS 负责人）
 *
 * 岗位边界（严格遵守任务书）：
 *  - 本页面只负责「看得见」：农田边界、采样点、设备实时位置、历史轨迹、算法路线、统计图与整体交互。
 *  - 不实现 UDP 发送（2号）、不实现路径优化算法（3号）、不设计数据库（4号）、不写后端业务（5号）。
 *  - 所有业务数据都通过 5号 REST 接口获取；接口未就绪时由 gisGateway 降级到字段完全一致的 mock。
 *
 * 统一字段（冻结，禁止改名）：
 *  deviceId / deviceCode / farmlandId / samplingPointId / taskId /
 *  longitude / latitude / coordinateSystem / collectTime / status
 */
import GisMap from './components/GisMap'
import LayerControl from './components/LayerControl'
import FarmlandInfoPanel from './components/FarmlandInfoPanel'
import SamplingPointPanel from './components/SamplingPointPanel'
import DevicePanel from './components/DevicePanel'
import RoutePanel from './components/RoutePanel'
import HistoryPanel from './components/HistoryPanel'
import SampleDataDialog from './components/SampleDataDialog'
import StatsChart from './components/StatsChart'
import GisDiagnostics from './components/GisDiagnostics'
import GisSelfCheck from './components/GisSelfCheck'

import gateway, { DATA_SOURCE, normalizeLatestMonitor } from '@/api/gis/gisGateway'
import { LAYER } from '@/utils/gis/mapAdapter'
import {
  buildBoundaryModel,
  buildSamplingPointModels,
  buildDeviceModels,
  buildRouteModel,
  buildTrackModel,
  resolveSceneCoordinateSystem
} from '@/utils/gis/sceneModel'
import {
  validatePointInBoundary,
  findNearestUnsampledPoint,
  isSampled,
  haversine,
  bearing,
  formatDistance
} from '@/utils/gis/geometry'
import { checkPermission, isGisDemoMode, GIS_PERMISSION } from '@/utils/gis/gisPermission'
import { toMapCoordinate } from '@/utils/gis/coordinate'

/**
 * 任务书 M1 要求采样点为 3~4 个，这里按**总点数**限制上限。
 * （合并评审意见 #6：此前写成 manualPoints.length >= 4 && points.length >= 4，
 *   已有 4 个远端点、手动点 0 个时仍能继续加，会超出 3~4 个的要求。）
 */
const MAX_SAMPLING_POINTS = 4

export default {
  name: 'FarmlandGis',
  components: {
    GisMap,
    LayerControl,
    FarmlandInfoPanel,
    SamplingPointPanel,
    DevicePanel,
    RoutePanel,
    HistoryPanel,
    SampleDataDialog,
    StatsChart,
    GisDiagnostics,
    GisSelfCheck
  },
  data () {
    return {
      // ---- 基础选择 ----
      farmlandList: [],
      farmlandId: '',
      farmland: {},
      taskId: 'TK20260917001',

      // ---- 数据 ----
      points: [],
      devices: [],
      route: {},
      chartData: { columns: [], rows: [] },
      trajectories: {},
      latestByPoint: {},

      // ---- 视图模型 ----
      boundaryModel: {},
      routeModel: {},
      sceneCoordinateSystem: '',
      scene: {},
      sceneVersion: 0,

      // ---- 图层 & 交互 ----
      layers: {
        [LAYER.BOUNDARY]: true,
        [LAYER.SAMPLING_POINT]: true,
        [LAYER.DEVICE]: true,
        [LAYER.ROUTE]: true,
        [LAYER.TRAJECTORY]: true,
        [LAYER.GUIDANCE]: true,
        [LAYER.LABEL]: true
      },
      pickMode: false,
      pickError: '',
      manualPoints: [],

      /**
       * 地图实现选择：'' = 自动（优先高德） / 'amap' = 强制高德 / 'vector' = 强制内置离线地图。
       *
       * ⚠️ 这个字段之前漏写在 data() 里，但模板里用了两处（v-model 与 :force-provider），
       *    导致 Vue 报 "Property or method forceProvider is not defined"，
       *    而且「地图」那组单选按钮实际上**点不动**。生产构建会把 Vue warn 剥离，
       *    所以只有在 development 构建/带 console 的浏览器里才看得出来。
       */
      forceProvider: '',

      // ---- 边界选中效果 ----
      boundarySelected: true,

      // ---- 定位 ----
      locating: false,
      userLocation: null,

      // ---- 历史数据 ----
      focusSamplingPointId: '',

      // ---- 状态 ----
      loading: false,
      saving: false,
      chartLoading: false,
      chartError: '',
      trackLoading: false,
      selectedDeviceId: '',
      selectedPointId: '',
      activeTab: 'farmland',
      bottomTab: 'stats',
      bottomCollapsed: false,

      // ---- 演示推进 ----
      demoMode: true,
      demoSpeed: 14,
      refreshInterval: 2000,
      timer: null,
      offlineSimulated: false,

      // ---- 来源提示 ----
      globalNotice: '',
      globalNoticeType: 'warning',
      dataSourceSummary: '',
      providerError: '',

      // ---- 弹窗 ----
      dialogVisible: false,
      dialogPoint: null,
      dialogDeviceId: '',
      dialogDeviceCode: '',
      dialogMetrics: {},
      dialogCollectTime: ''
    }
  },
  computed: {
    diagnostics () {
      return gateway.getDiagnostics()
    },
    isFallback () {
      return gateway.hasFallback()
    },
    guidance () {
      if (!this.selectedDeviceId || !this.devices.length) {
        return null
      }
      const device = this.devices.filter(d => d.deviceId === this.selectedDeviceId)[0]
      if (!device) {
        return null
      }
      const nearest = findNearestUnsampledPoint({
        longitude: device.longitude,
        latitude: device.latitude,
        coordinateSystem: device.coordinateSystem
      }, this.points)
      if (!nearest) {
        return null
      }
      return {
        from: { longitude: device.longitude, latitude: device.latitude },
        to: { longitude: nearest.point.longitude, latitude: nearest.point.latitude },
        text: `${device.deviceCode} → ${nearest.point.pointCode} ${formatDistance(nearest.distance)}`,
        deviceId: device.deviceId,
        deviceCode: device.deviceCode,
        targetPoint: nearest.point,
        distance: nearest.distance
      }
    },
    layerCounts () {
      return {
        boundary: this.boundaryModel.ringCount || 0,
        samplingPoint: this.points.length,
        device: this.devices.length,
        route: (this.routeModel.coordinates || []).length,
        trajectory: this.trajectoryPointCount
      }
    },
    selectedDeviceCode () {
      const device = this.devices.filter(d => d.deviceId === this.selectedDeviceId)[0]
      return device ? device.deviceCode : ''
    },
    trajectoryPointCount () {
      return Object.keys(this.trajectories).reduce((total, key) => total + (this.trajectories[key] || []).length, 0)
    },
    /**
     * 是否允许手动选点。
     *
     * 权限规则（合并评审意见 #2 修复后）：
     *   - 正式页面：严格按 samplingpoint:samplingPoint:add 校验，拿不到权限就一律拒绝；
     *   - 只有显式声明演示模式的入口（gis.html，见 gisPermission.isGisDemoMode）才放行；
     *   - **不再以"权限列表为空"作为放行条件**。
     *
     * 另外注意：允许"选点"只是允许这个 UI 交互（M1 要求的落点校验与展示），
     * **不代表可以写库** —— v2.1 §3.2 没有冻结任何采样点写接口，所以提交按钮是禁用状态。
     */
    canPickPoints () {
      return checkPermission(GIS_PERMISSION.SAMPLING_POINT_ADD, this.hasPermission).allowed
    },
    /** 演示模式标记，用于界面提示（不是放行条件本身） */
    isDemoMode () {
      return isGisDemoMode()
    }
  },
  mounted () {
    this.boot()
  },
  beforeDestroy () {
    this.stopTimer()
  },
  methods: {
    // ================================================================ 启动
    async boot () {
      this.loading = true
      try {
        await this.loadFarmlands()
        await Promise.all([
          this.loadSamplingPoints(),
          this.loadRoute(),
          this.loadChart(),
          this.reloadDevices()
        ])
        await this.loadHistoricalTracks()
      } finally {
        this.loading = false
        this.refreshDiagnostics()
        this.restartTimer()
      }
    },

    async loadFarmlands () {
      const list = await gateway.loadFarmlands()
      this.farmlandList = Array.isArray(list) ? list : (list && list.records) || []
      if (!this.farmlandList.length) {
        this.globalNotice = '未获取到农田数据（5号 农田接口不可用且 mock 为空）'
        this.globalNoticeType = 'error'
        return
      }
      if (!this.farmlandId) {
        this.farmlandId = this.farmlandList[0].farmlandId
      }
      this.applyFarmland()
    },

    applyFarmland () {
      const farmland = this.farmlandList.filter(f => f.farmlandId === this.farmlandId)[0] || this.farmlandList[0] || {}
      this.farmland = farmland
      // 场景坐标系仅用于「采样点 / 路线」这类自身声明了坐标系的对象的缺省判断，
      // 绝不用于解释农田边界 —— 边界必须自带 coordinateSystem（评审意见 #5）。
      const pointSystem = resolveSceneCoordinateSystem(this.points.map(p => p.coordinateSystem))
      const routeSystem = resolveSceneCoordinateSystem([this.route && this.route.coordinateSystem])
      this.sceneCoordinateSystem = pointSystem || routeSystem || ''
      // 严格模式：边界自己没声明 coordinateSystem 就直接拒绝渲染并报错，不接受 fallback
      this.boundaryModel = buildBoundaryModel(farmland)
      if (this.boundaryModel.error) {
        this.globalNotice = this.boundaryModel.error
        this.globalNoticeType = 'error'
      }
      this.rebuildScene(true)
    },

    onFarmlandChange () {
      this.manualPoints = []
      this.pickError = ''
      this.applyFarmland()
      this.loadSamplingPoints()
      this.loadRoute()
    },

    async reloadAll () {
      gateway.resetDiagnostics()
      this.rebuildScene(true)
      await this.boot()
    },

    // ================================================================ 数据加载
    async loadSamplingPoints () {
      try {
        const list = await gateway.loadSamplingPoints(this.farmlandId)
        const remote = Array.isArray(list) ? list : (list && list.records) || []
        // 手动新增但尚未提交的点保留在列表中，避免刷新后「选了点又消失」
        this.points = remote.concat(this.manualPoints)
        this.applyFarmland()
        this.refreshDiagnostics()
      } catch (error) {
        this.globalNotice = `采样点接口调用失败：${(error && error.message) || error}`
        this.globalNoticeType = 'error'
      }
    },

    async loadRoute () {
      try {
        this.route = await gateway.loadRoute(this.taskId)
      } catch (error) {
        this.route = {}
        this.globalNotice = `路线接口调用失败：${(error && error.message) || error}`
        this.globalNoticeType = 'error'
      } finally {
        const pointSystem = resolveSceneCoordinateSystem(this.points.map(p => p.coordinateSystem))
        this.routeModel = buildRouteModel(this.route, this.sceneCoordinateSystem || pointSystem)
        this.rebuildScene()
        this.refreshDiagnostics()
      }
    },

    async loadChart () {
      this.chartLoading = true
      this.chartError = ''
      try {
        const data = await gateway.loadChart({
          farmlandId: this.farmlandId,
          taskId: this.taskId,
          granularity: 'hour'
        })
        if (data && Array.isArray(data.columns) && Array.isArray(data.rows)) {
          this.chartData = data
        } else {
          this.chartData = { columns: [], rows: [] }
          this.chartError = '统计数据格式不符合 ChartDataDTO（需要 columns 与 rows 字段）'
        }
      } catch (error) {
        this.chartError = `统计接口调用失败：${(error && error.message) || error}`
      } finally {
        this.chartLoading = false
        this.refreshDiagnostics()
      }
    },

    async reloadDevices () {
      try {
        const list = await gateway.loadDevices()
        const remote = Array.isArray(list) ? list : (list && list.records) || []
        // 不传 fallback 坐标系：设备位置必须自带 coordinateSystem，否则判为位置无效（评审意见 #3）
        const models = buildDeviceModels(remote)
        // 演示推进模式下保留内存中的实时位置，避免每次轮询把设备「拉回」接口返回值
        if (this.demoMode && this.devices.length === models.devices.length && this.devices.length) {
          const merged = models.devices.map(device => {
            const current = this.devices.filter(d => d.deviceId === device.deviceId)[0]
            return current
              ? Object.assign({}, device, {
                longitude: current.longitude,
                latitude: current.latitude,
                heading: current.heading,
                status: current.status,
                collectTime: current.collectTime
              })
              : device
          })
          this.devices = merged
        } else {
          this.devices = models.devices
        }
        if (models.errors.length) {
          // 设备位置不可用是**契约问题**，不是数据异常，用 warning 明确告诉使用者要等 5号 冻结 DTO
          this.globalNotice = `设备位置暂不可用：${models.errors[0]}`
          this.globalNoticeType = 'warning'
        }
        if (!this.selectedDeviceId && this.devices.length) {
          this.selectedDeviceId = this.devices[0].deviceId
        }
        this.rebuildScene()
        this.refreshDiagnostics()
      } catch (error) {
        this.globalNotice = `设备接口调用失败：${(error && error.message) || error}`
        this.globalNoticeType = 'error'
      }
    },

    /**
     * 加载设备历史轨迹
     * @param {string} deviceId
     * @returns {{points:Array, error:string}} 由调用方决定如何提示
     */
    async fetchTrajectory (deviceId) {
      const records = await gateway.loadTrajectory(deviceId)
      return buildTrackModel(records, this.sceneCoordinateSystem)
    },

    /** 初始加载 3 台设备的历史轨迹：轨迹末点作为设备实时位置起点，演示推进从那里继续 */
    async loadHistoricalTracks () {
      if (!this.devices.length) {
        return
      }
      let firstTrackError = ''
      for (let i = 0; i < this.devices.length; i++) {
        const device = this.devices[i]
        try {
          const track = await this.fetchTrajectory(device.deviceId)
          if (track.error && !firstTrackError) {
            firstTrackError = track.error
          }
          const points = track.points
          if (points.length) {
            this.$set(this.trajectories, device.deviceId, points)
            this.pushTrajectoryToMap(device.deviceId, points)
            // 让设备从历史轨迹的最后一点继续走，轨迹整体保持连续
            const last = points[points.length - 1]
            const prev = points[points.length - 2] || last
            device.longitude = last.longitude
            device.latitude = last.latitude
            device.heading = bearing(prev.longitude, prev.latitude, last.longitude, last.latitude)
            device.collectTime = last.collectTime || device.collectTime
            device.status = 'online'
          }
        } catch (error) {
          if (!firstTrackError) {
            firstTrackError = `轨迹接口调用失败：${(error && error.message) || error}`
          }
        }
      }
      if (firstTrackError) {
        this.globalNotice = `历史轨迹不可用：${firstTrackError}`
        this.globalNoticeType = 'warning'
      }
      this.rebuildScene()
      this.refreshDiagnostics()
    },

    async loadSelectedTrajectory () {
      if (!this.selectedDeviceId) {
        this.$message.warning('请先选择一台设备')
        return
      }
      this.trackLoading = true
      try {
        const track = await this.fetchTrajectory(this.selectedDeviceId)
        if (track.error) {
          // 不静默画空轨迹：明确说明为什么画不出来
          this.$message.warning(track.error)
        }
        if (track.points.length) {
          this.$set(this.trajectories, this.selectedDeviceId, track.points)
          this.pushTrajectoryToMap(this.selectedDeviceId, track.points)
        }
        this.refreshDiagnostics()
      } catch (error) {
        this.$message.error(`轨迹加载失败：${(error && error.message) || error}`)
      } finally {
        this.trackLoading = false
      }
    },

    clearTrajectories () {
      const ids = Object.keys(this.trajectories)
      ids.forEach(id => {
        this.$delete(this.trajectories, id)
        if (this.$refs.gisMap && this.$refs.gisMap.clearTrajectory) {
          this.$refs.gisMap.clearTrajectory(id)
        }
      })
      this.$message.success('已清除全部轨迹图层')
    },

    // ================================================================ 场景刷新
    rebuildScene (fitView) {
      const pointModels = buildSamplingPointModels(this.points, this.sceneCoordinateSystem)
      const deviceModels = buildDeviceModels(this.devices)
      this.scene = {
        // 只有「选中」时才让地图画高亮样式，用来体现边界选中效果
        farmlandId: this.boundarySelected ? this.farmland.farmlandId : '',
        boundaryGeoJson: this.boundaryModel.geoJson,
        points: pointModels.points,
        devices: deviceModels.devices,
        route: {
          coordinates: this.routeModel.coordinates || [],
          orderedPoints: this.routeModel.orderedPoints || []
        },
        trajectories: this.trajectories,
        guidance: this.guidance,
        fitView: !!fitView
      }
      this.sceneVersion += 1
    },

    /** 只更新设备位置（每秒推进时调用，避免整场景重建） */
    pushDevicesToMap () {
      if (this.$refs.gisMap && this.$refs.gisMap.updateDevices) {
        const deviceModels = buildDeviceModels(this.devices)
        this.$refs.gisMap.updateDevices(deviceModels.devices)
      }
      if (this.$refs.gisMap && this.$refs.gisMap.setGuidance) {
        this.$refs.gisMap.setGuidance(this.guidance)
      }
    },

    pushTrajectoryToMap (deviceId, points) {
      if (this.$refs.gisMap && this.$refs.gisMap.updateTrajectory) {
        this.$refs.gisMap.updateTrajectory(deviceId, points)
      }
    },

    fitBounds () {
      if (this.$refs.gisMap) {
        this.$refs.gisMap.fitBounds()
      }
    },

    /** 边界选中效果：点击地图上的农田边界切换高亮 */
    onBoundaryClick () {
      this.boundarySelected = !this.boundarySelected
      this.rebuildScene()
      this.$message.info(this.boundarySelected ? '已高亮选中该农田边界' : '已取消边界高亮')
    },

    onBoundarySelectedChange () {
      this.rebuildScene()
    },

    /** 定位：把视野居中到选中的采样终端 */
    locateSelectedDevice () {
      const device = this.devices.filter(d => d.deviceId === this.selectedDeviceId)[0]
      if (!device || !isFinite(Number(device.longitude))) {
        this.$message.warning('选中的设备没有有效位置')
        return
      }
      if (this.$refs.gisMap) {
        this.$refs.gisMap.setCenterZoom(device.longitude, device.latitude, 17)
      }
      this.$message.success(`已定位到 ${device.deviceCode}`)
    },

    /** 定位：获取当前设备/浏览器的位置并在地图上标出 */
    async locateMe () {
      if (!this.$refs.gisMap) {
        this.$message.warning('地图尚未初始化')
        return
      }
      this.locating = true
      try {
        const position = await this.$refs.gisMap.locateUser()
        // 适配器会声明坐标来源（高德返回 GCJ02、浏览器返回 WGS84），这里统一转到地图坐标系
        const converted = toMapCoordinate({
          longitude: position.longitude,
          latitude: position.latitude,
          coordinateSystem: position.coordinateSystem
        })
        const located = {
          longitude: converted[0],
          latitude: converted[1],
          accuracy: position.accuracy
        }
        this.userLocation = located
        this.$refs.gisMap.setUserLocation(located)
        this.$refs.gisMap.setCenterZoom(located.longitude, located.latitude, 17)
        this.$message.success(`定位成功（来源坐标系 ${position.coordinateSystem}，精度约 ${Math.round(position.accuracy || 0)} m）`)
      } catch (error) {
        this.$message.error((error && error.message) || '定位失败')
      } finally {
        this.locating = false
      }
    },

    onExportHistory () {
      this.$message.info('Excel 导出由 4号/5号 的 /analysis/analysis/export 提供，前端已预留入口')
    },

    // ================================================================ 交互
    onLayerUpdate ({ key, value }) {
      this.$set(this.layers, key, value)
    },

    onMapReady ({ provider }) {
      if (provider === 'vector' && !this.providerError) {
        this.globalNotice = '高德地图未启用，当前使用内置离线矢量地图；配置 VUE_APP_AMAP_KEY 后自动切换为高德底图。'
        this.globalNoticeType = 'warning'
      }
      this.rebuildScene(true)
    },

    onProviderError ({ code, message }) {
      this.providerError = message
      this.globalNotice = `【${code}】${message}`
      this.globalNoticeType = 'warning'
    },

    onProviderChange () {
      this.providerError = ''
    },

    togglePickMode () {
      this.pickMode = !this.pickMode
      this.pickError = ''
    },

    /**
     * 地图点击：手动选点（做 PIP 校验，界外点直接拒绝）
     *
     * 上限按**总点数**判断（合并评审意见 #6）：
     *   旧写法 `manualPoints.length >= 4 && points.length >= 4` 有漏洞 ——
     *   已有 4 个远端点、手动点 0 个时两个条件都不同时成立，仍能继续加点。
     *   现在只看 `points.length >= MAX_SAMPLING_POINTS`。
     */
    onMapClick (lngLat) {
      if (!this.pickMode) {
        return
      }
      if (this.points.length >= MAX_SAMPLING_POINTS) {
        this.pickError = `老师任务书 M1 要求采样点为 3~4 个，当前已有 ${this.points.length} 个点，` +
          '请先移除已有手动点后再选'
        return
      }
      const candidate = {
        samplingPointId: `TMP-${Date.now()}`,
        farmlandId: this.farmlandId,
        pointCode: `M${this.manualPoints.length + 1}`,
        pointName: `手动采样点${this.manualPoints.length + 1}`,
        longitude: lngLat.longitude,
        latitude: lngLat.latitude,
        coordinateSystem: 'GCJ02',
        status: 'pending',
        manual: true
      }
      const check = validatePointInBoundary(candidate, this.boundaryModel.geoJson)
      if (!check.inside) {
        this.pickError = `${check.message}（点击位置 ${lngLat.longitude.toFixed(6)}, ${lngLat.latitude.toFixed(6)}）`
        return
      }
      this.pickError = ''
      this.manualPoints.push(candidate)
      this.points = this.points.concat([candidate])
      this.activeTab = 'point'
      this.rebuildScene()
      this.$message.success(
        `已在农田内添加 ${candidate.pointCode}（共 ${this.points.length} 个点）。` +
        '注意：写接口尚未冻结，该点仅在本页预览，不会写入后端。'
      )
    },

    /**
     * ⚠️ 手动选点的**入库**操作已按合并评审意见 #1 移除。
     *
     * 原因：v2.1 §3.2 白名单里没有任何采样点写接口，此前调用的
     * `/samplingPoint/saveBatch`、`/updateStatus` 都是自造端点，
     * 且请求体信封写错（`{ list: { farmlandId, taskId, points } }` 而不是点位列表）。
     * 在 5号 冻结端点 + DTO + 权限之前，前端不向任何未约定端点发请求，
     * 也不伪造成"保存成功"。
     */
    onManualSaveBlocked () {
      this.$message.warning(
        '写接口尚未冻结：v2.1 §3.2 未约定采样点写接口，需 5号 补充并冻结端点/DTO/权限后再联调。' +
        '当前手动点仅在本页预览、未写入后端。'
      )
    },

    /** 清空本地预览的手动点（不影响后端数据） */
    clearManualPreview () {
      const ids = this.manualPoints.map(p => p.samplingPointId)
      this.manualPoints = []
      this.points = this.points.filter(p => ids.indexOf(p.samplingPointId) === -1)
      this.rebuildScene()
      this.$message.success('已清空本地预览的手动点（未影响后端数据）')
    },

    removeManualPoint (row) {
      this.manualPoints = this.manualPoints.filter(p => p.samplingPointId !== row.samplingPointId)
      this.points = this.points.filter(p => p.samplingPointId !== row.samplingPointId)
      this.rebuildScene()
    },

    onPointSelect (row) {
      if (!row) {
        return
      }
      this.selectedPointId = row.samplingPointId
    },

    onPointClick (point) {
      this.selectedPointId = point.samplingPointId
      this.activeTab = 'point'
      this.onViewPointData(point)
    },

    onDeviceClick (device) {
      this.selectedDeviceId = device.deviceId
      this.activeTab = 'device'
      this.rebuildScene()
    },

    onDeviceSelect (device) {
      this.selectedDeviceId = device.deviceId
      this.rebuildScene()
    },

    /** 查看点位最新 5 项采样数据 */
    async onViewPointData (point) {
      try {
        const payload = await gateway.loadLatestByPoint(point.samplingPointId)
        const metrics = normalizeLatestMonitor(payload)
        this.dialogPoint = point
        this.dialogDeviceId = ''
        this.dialogDeviceCode = point.pointCode || ''
        this.dialogMetrics = metrics
        this.dialogCollectTime = point.collectTime || ''
        this.dialogVisible = true
        this.refreshDiagnostics()
      } catch (error) {
        this.$message.error(`监测数据获取失败：${(error && error.message) || error}`)
      }
    },

    onViewPointHistory (point) {
      this.dialogVisible = false
      this.activeTab = 'history'
      // 变化时子组件会监听到并自动按该采样点重新查询
      this.focusSamplingPointId = point.samplingPointId
      this.$nextTick(() => {
        if (this.$refs.historyPanel) {
          this.$refs.historyPanel.query.samplingPointId = point.samplingPointId
          this.$refs.historyPanel.reload()
        }
      })
    },

    simulateOffline () {
      this.offlineSimulated = !this.offlineSimulated
      const target = this.devices[this.devices.length - 1]
      if (target) {
        target.status = this.offlineSimulated ? 'offline' : 'online'
      }
      this.rebuildScene()
      this.$message.info(this.offlineSimulated ? '已模拟 1 台设备离线（用于验证离线状态样式）' : '已恢复在线')
    },

    // ================================================================ 定时推进
    restartTimer () {
      this.stopTimer()
      if (!this.refreshInterval) {
        return
      }
      this.timer = window.setInterval(() => {
        this.onTick()
      }, this.refreshInterval)
    },

    stopTimer () {
      if (this.timer) {
        window.clearInterval(this.timer)
        this.timer = null
      }
    },

    toggleDemo () {
      this.demoMode = !this.demoMode
      this.$message.info(this.demoMode ? '演示推进已开启：设备将自动走向最近的未采样点' : '演示推进已停止')
    },

    async onTick () {
      if (this.demoMode) {
        this.advanceDevices()
      } else {
        await this.reloadDevices()
      }
    },

    /**
     * 演示推进：让每台设备沿直线走向「分配给它的最近未采样点」。
     * 与老师任务书的 M3 流程一致：动态计算下一个最近的未采样点 → 移动 → 到达 → 标记已采样 → 弹窗。
     */
    advanceDevices () {
      const tickSeconds = this.refreshInterval / 1000
      const stepMeters = Math.max(this.demoSpeed * tickSeconds, 1)
      const unsampled = this.points.filter(p => !isSampled(p.status))
      const assigned = {}
      const arrivals = []

      // 为每台设备分配一个互不重复的目标点（避免 3 台设备冲向同一个点）
      const taken = {}
      this.devices.forEach(device => {
        if (device.status === 'offline') {
          return
        }
        let best = null
        unsampled.forEach(point => {
          if (taken[point.samplingPointId]) {
            return
          }
          const distance = haversine(device.longitude, device.latitude, point.longitude, point.latitude)
          if (!best || distance < best.distance) {
            best = { point, distance }
          }
        })
        if (best) {
          taken[best.point.samplingPointId] = true
          assigned[device.deviceId] = best
        }
      })

      this.devices.forEach(device => {
        const target = assigned[device.deviceId]
        if (!target) {
          return
        }
        const remaining = target.distance
        const heading = bearing(device.longitude, device.latitude, target.point.longitude, target.point.latitude)
        let nextLng = target.point.longitude
        let nextLat = target.point.latitude
        if (remaining > stepMeters) {
          const ratio = stepMeters / remaining
          nextLng = device.longitude + (target.point.longitude - device.longitude) * ratio
          nextLat = device.latitude + (target.point.latitude - device.latitude) * ratio
        }
        device.longitude = nextLng
        device.latitude = nextLat
        device.heading = heading
        device.collectTime = this.nowText()

        const track = this.trajectories[device.deviceId] || []
        track.push({
          deviceId: device.deviceId,
          longitude: nextLng,
          latitude: nextLat,
          coordinateSystem: 'GCJ02',
          collectTime: device.collectTime
        })
        // 控制内存与渲染开销：轨迹最多保留最近 1200 个点
        if (track.length > 1200) {
          track.splice(0, track.length - 1200)
        }
        this.$set(this.trajectories, device.deviceId, track)

        if (remaining <= stepMeters) {
          arrivals.push({ device, point: target.point })
        }
      })

      this.pushDevicesToMap()
      this.devices.forEach(device => {
        this.pushTrajectoryToMap(device.deviceId, this.trajectories[device.deviceId] || [])
      })

      arrivals.forEach(arrival => this.handleArrival(arrival.device, arrival.point))
    },

    /** 到达采样点：标记已采样 + 弹窗展示 5 项采样指标（M3） */
    async handleArrival (device, point) {
      point.status = 'sampled'
      point.collectTime = this.nowText()
      this.$set(this.points, this.points.indexOf(point), point)
      this.rebuildScene()

      let metrics = {}
      try {
        const payload = await gateway.loadLatestByPoint(point.samplingPointId)
        metrics = normalizeLatestMonitor(payload)
      } catch (error) {
        metrics = {}
      }
      this.dialogPoint = point
      this.dialogDeviceId = device.deviceId
      this.dialogDeviceCode = device.deviceCode
      this.dialogMetrics = metrics
      this.dialogCollectTime = point.collectTime
      this.dialogVisible = true
      this.refreshDiagnostics()
      this.$message.success(`${device.deviceCode} 到达采样点 ${point.pointCode}，已标记为已采样`)
    },

    // ================================================================ 杂项
    nowText () {
      const date = new Date()
      const pad = n => String(n).padStart(2, '0')
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
        `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    },

    refreshDiagnostics () {
      const items = gateway.getDiagnostics()
      const fallbackCount = items.filter(i => i.source !== DATA_SOURCE.API).length
      this.dataSourceSummary = items.length === 0
        ? '尚未发起接口调用'
        : `${items.length} 个资源已加载，其中 ${fallbackCount} 个使用模拟数据`
    },

    resetDiagnostics () {
      gateway.resetDiagnostics()
      this.refreshDiagnostics()
      this.$message.success('诊断信息已重置')
    }
  }
}
</script>

<style lang="scss" scoped>
.farmland-gis {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 720px;
  padding: 8px;
  box-sizing: border-box;
  background: #f2f5f7;

  &__toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 10px;
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  }

  &__toolbar-left,
  &__toolbar-right {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  &__brand {
    font-size: 15px;
    font-weight: 700;
    color: #0d47a1;

    i {
      margin-right: 4px;
      color: #1976d2;
    }
  }

  &__select {
    width: 230px;
  }

  &__input {
    width: 150px;
  }

  &__interval {
    width: 104px;
  }

  &__label {
    font-size: 12px;
    color: #78909c;
  }

  &__notice {
    margin-top: 8px;
  }

  &__body {
    display: flex;
    flex: 1;
    gap: 8px;
    margin-top: 8px;
    min-height: 460px;
  }

  &__map {
    position: relative;
    flex: 1;
    min-width: 0;
    background: #fff;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  }

  &__side {
    width: 402px;
    flex: none;
    background: #fff;
    border-radius: 4px;
    padding: 6px 10px 10px;
    box-sizing: border-box;
    overflow: auto;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  }

  &__tabs ::v-deep .el-tabs__header {
    margin-bottom: 10px;
  }

  &__hint {
    font-size: 12px;
    color: #607d8b;
    margin-top: 8px;
    line-height: 20px;
  }

  &__hint-text {
    margin-left: 6px;
  }

  &__bottom {
    margin-top: 8px;
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);

    &.is-collapsed {
      padding-bottom: 4px;
    }
  }

  &__bottom-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 10px;
  }

  &__bottom-tabs {
    flex: 1;

    ::v-deep .el-tabs__header {
      margin: 0;
    }

    ::v-deep .el-tabs__content {
      display: none;
    }
  }

  &__bottom-body {
    padding: 0 10px 10px;
    max-height: 340px;
    overflow: auto;
  }
}
</style>
