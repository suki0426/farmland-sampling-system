<template>
  <div class="weather-map">
    <!-- ══════════ 图层切换（天气 App 的图层胶囊） ══════════ -->
    <div class="weather-map__layers">
      <div v-for="g in layerGroups" :key="g.key" class="weather-map__layer-group">
        <span class="weather-map__group-label">{{ g.label }}</span>
        <button
          v-for="l in layersOf(g.key)"
          :key="l.key"
          class="layer-pill"
          :class="{ 'is-active': l.key === layer }"
          :title="l.desc"
          @click="switchLayer(l.key)">
          <i :class="l.icon"></i>
          <span>{{ l.label }}</span>
        </button>
      </div>
    </div>

    <!-- ══════════ 面包屑：全国 → 省 → 市（第三级） ══════════ -->
    <div class="weather-map__crumbs">
      <span class="crumb" :class="{ 'is-current': level === 'nation' }" @click="resetDrill">全国</span>
      <template v-if="provinceName">
        <i class="el-icon-arrow-right"></i>
        <span class="crumb" :class="{ 'is-current': level === 'province' }" @click="backToProvince">{{ provinceName }}</span>
      </template>
      <template v-if="cityName">
        <i class="el-icon-arrow-right"></i>
        <span class="crumb is-current">{{ cityName }}</span>
      </template>
      <el-button v-if="level !== 'nation'" size="mini" type="text" icon="el-icon-back" @click="back">返回上一级</el-button>
      <span class="weather-map__level-hint">{{ levelHint }}</span>
      <span class="weather-map__station-hint">站点 {{ stations.length }}（{{ stationLabel }}）</span>
    </div>

    <!-- ══════════ 地图画布 ══════════ -->
    <div ref="chart" class="weather-map__canvas"></div>

    <div v-if="loading" v-loading="true" class="weather-map__mask"
         element-loading-background="rgba(4, 18, 36, 0.72)"
         element-loading-text="正在生成图层数据…"></div>

    <div v-if="error" class="weather-map__error">
      <i class="el-icon-warning-outline"></i>
      <div>
        <strong>图层渲染失败</strong>
        <p>{{ error }}</p>
      </div>
    </div>

    <div v-if="drillError" class="weather-map__warn">
      <i class="el-icon-warning-outline"></i>
      <span class="weather-map__warn-text">{{ drillError }}</span>
      <el-button type="text" size="mini" @click="drillError = ''">知道了</el-button>
    </div>

    <!-- ══════════ 悬浮信息卡 ══════════ -->
    <transition name="el-fade-in">
      <div v-if="hover" class="weather-map__tip" :style="tipStyle">
        <div class="weather-map__tip-title">
          <span>{{ hover.name }}</span>
          <span class="weather-map__tip-time">{{ currentFrameLabel }}</span>
        </div>
        <div class="weather-map__tip-row">
          <span>{{ hover.kind === 'region' ? '区域均值' : layerDef.label }}</span>
          <b>{{ hover.value }}{{ layerDef.unit }}</b>
        </div>
        <div v-if="hover.peak !== null" class="weather-map__tip-row">
          <span>区域峰值</span>
          <b>{{ hover.peak }}{{ layerDef.unit }}</b>
        </div>
        <div v-if="hover.level" class="weather-map__tip-row">
          <span>空气质量</span>
          <b :style="{ color: hover.level.color }">{{ hover.level.label }}</b>
        </div>
        <div v-if="hover.extra" class="weather-map__tip-extra">{{ hover.extra }}</div>
        <div v-if="hover.kind === 'region' && hookText" class="weather-map__tip-extra">{{ hookText }}</div>
        <div class="weather-map__tip-foot">
          {{ hover.kind === 'region'
            ? (level === 'nation' ? '单击下钻到该省' : (level === 'province' ? '单击下钻到该市' : '已是第三级'))
            : '滚轮缩放 / 拖动平移' }}
        </div>
      </div>
    </transition>

    <!-- ══════════ 图例 ══════════ -->
    <div class="weather-map__legend">
      <div class="weather-map__legend-head">
        <span>{{ layerDef.label }}（{{ layerDef.unit }}）</span>
        <span class="weather-map__legend-range">{{ layerDef.min }} ~ {{ layerDef.max }}</span>
      </div>
      <div class="weather-map__legend-bar">
        <span v-for="(c, i) in layerDef.colors" :key="i" :style="{ background: c, flex: 1 }"></span>
      </div>
      <div class="weather-map__legend-foot">
        <span>{{ currentScopeLabel }}均值 {{ summaryText }}</span>
        <span>栅格 {{ rasterInfo }}</span>
      </div>
    </div>

    <!-- ══════════ 时间轴：实时变化播放 ══════════ -->
    <div class="weather-map__timeline">
      <el-button
        size="mini"
        :type="playing ? 'warning' : 'primary'"
        :icon="playing ? 'el-icon-video-pause' : 'el-icon-video-play'"
        @click="togglePlay">
        {{ playing ? '暂停' : '播放' }}
      </el-button>

      <span class="weather-map__time-label">
        {{ currentFrameLabel }}
        <em v-if="frameInfo.dayOffset !== 0">（{{ frameInfo.dayOffset > 0 ? '未来+' : '过去' }}{{ Math.abs(frameInfo.dayOffset) }}天）</em>
      </span>

      <el-slider
        v-model="frame"
        :min="0"
        :max="frameCount - 1"
        :show-tooltip="false"
        class="weather-map__slider"
        @input="onFrameChange" />

      <span class="weather-map__time-axis">
        <em>过去 {{ -FRAME_START_HOUR }}h</em>
        <em>现在</em>
        <em>未来 {{ FRAME_COUNT - 1 + FRAME_START_HOUR }}h</em>
      </span>
    </div>
  </div>
</template>

<script>
/**
 * 天气 App 风格的栅格图层地图
 *
 * ── 需求对应 ────────────────────────────────────────────────────────
 *   「做成天气 App 那种空气质量地图 / 降水地图实时变化图，像 iPhone 里一样可以切换」
 *     ① 逐像素着色的栅格图层（不是行政边界填色，也不是散点热力）；
 *     ② 10 个图层胶囊可切换（环境 7 个 + 业务 3 个）；
 *     ③ 25 帧时间轴（过去 9h ~ 未来 15h），雨团/污染团随时间漂移。
 *   「太粗略，只有省份，精确到第三级」
 *     → 全国 → 省 → 市 下钻；站点与区划离线内置到区县（2728 个）。
 *
 * ── 为什么不用 ECharts 的 heatmap 系列（重要）────────────────────────
 *   最初用 `heatmap` + `coordinateSystem:'geo'` 实现，效果是**整张图一个颜色**。原因：
 *   `heatmap` 把每个数据点画成一个**带模糊半径的圆**再叠加混色，
 *   而 `pointSize:11 / blurSize:18` 打在 0.35° 网格上（屏幕上约 5px 间距）时，
 *   一个像素被约 36 个点覆盖 —— 颜色被平均掉，只剩一片中间调。
 *   把 blur 调小又会在大比例缩放下露出点与点之间的空隙，两头都不对。
 *
 *   所以改成：直接生成一张**逐像素着色**的栅格位图，用 `custom` 系列
 *   通过 `api.coord()` 贴到 geo 上。这样
 *     · 颜色 = 该像素经纬度处的场值，逐像素精确，空间层次分明；
 *     · 缩放/平移时 `renderItem` 会被重新调用，跟着 geo 走，永不错位；
 *     · 陆地之外由掩膜裁掉，颜色不会溢到海上。
 *
 * ── 另一个必须知道的坑（已修）─────────────────────────────────────
 *   `public/geo/china.json` 是 echarts 旧版**压缩坐标**格式
 *   （`coordinates` 是编码字符串，真值在 `encodeOffsets`）。
 *   `registerMap` 会自己解码，所以画底图没事；
 *   但只要自己拿 `geometry.coordinates` 做点在多边形内判定，
 *   拿到的就是字符串，比较全变 NaN，**任何点都判为界外且不报错**。
 *   之前"全国视图悬浮省份没反应"就是这个原因，现统一由
 *   `@/utils/geo/geojson` 的 `ensurePlainGeoJson()` 兜底。
 */
import * as echarts from 'echarts'
import { registerChinaMap, loadChinaGeoJson, CHINA_MAP_NAME } from '@/utils/geo/chinaMapLoader'
import { loadDivisions, loadGrid, citiesOf, districtsOf, fetchSubMap } from '@/utils/geo/divisions'
import {
  ensurePlainGeoJson, collectRings, ringsOfGeometry, pointInRing, geoJsonBounds, buildMaskFromRings
} from '@/utils/geo/geojson'
import {
  WEATHER_LAYERS, LAYER_GROUPS, FRAME_COUNT, FRAME_START_HOUR,
  layerByKey, frameTime, framePhase, evalPrepared, prepareField,
  buildStationData, frameSummary, aqiLevel, HOOK_TEXT,
  rasterSize, buildRasterRGBA, rasterStats as computeRasterStats
} from '@/mock/agrimonitor/weatherField'

/** 下钻后按 adcode 缓存"格点裁剪"结果，避免来回切换时重复计算 */
const gridFilterCache = {}

export default {
  name: 'WeatherMap',
  props: {
    /** 外部可指定初始图层（例如从任务书 M4 的预警入口进来时直接看预警密度） */
    initialLayer: { type: String, default: 'precip' },
    /** 是否自动播放时间轴 */
    autoPlay: { type: Boolean, default: true },
    /**
     * 打开时直接下钻到某个省（省短名如「山西」或 adcode 如「140000」）。
     * 便于演示时直接深链：monitor.html?page=dashboard&province=山西
     */
    initialProvince: { type: String, default: '' }
  },
  data () {
    return {
      layer: this.initialLayer,
      layerGroups: LAYER_GROUPS,
      frame: 0,
      frameCount: FRAME_COUNT,
      FRAME_START_HOUR,
      FRAME_COUNT,
      playing: false,
      loading: true,
      error: '',
      drillError: '',
      hover: null,
      tipStyle: { left: '0px', top: '0px' },
      chart: null,
      grid: null,
      divisions: null,
      // 当前层级的栅格与掩膜
      maskInfo: null,
      rasterCanvas: null,
      rasterCtx: null,
      rasterImage: null,
      rasterRGBA: null,
      rasterCount: 0,
      // 当前层级格点的场值（0~1，用于区域均值/峰值）
      gridValues: null,
      // 层级状态
      level: 'nation',
      provinceName: '',
      provinceAdcode: '',
      cityName: '',
      cityAdcode: '',
      cityShortName: '',
      activeMapName: CHINA_MAP_NAME,
      activeGridPoints: [],
      activeGeoJson: null,
      activeGeoPlain: null,
      regionIndex: { names: [], index: [] },
      stations: [],
      stationLabel: '地级市',
      summary: null,
      probe: false,
      playTimer: null,
      resizeHandler: null
    }
  },
  computed: {
    layerDef () {
      return layerByKey(this.layer)
    },
    frameInfo () {
      return frameTime(this.frame)
    },
    currentFrameLabel () {
      return this.frameInfo.full.slice(5)
    },
    currentScopeLabel () {
      return { nation: '全国', province: this.provinceName, city: this.cityName }[this.level] || '全国'
    },
    summaryText () {
      if (!this.summary) {
        return '--'
      }
      return `${this.summary.avg}${this.summary.unit}（峰值 ${this.summary.max}${this.summary.unit}）`
    },
    rasterInfo () {
      if (!this.maskInfo) {
        return '--'
      }
      return `${this.maskInfo.width}×${this.maskInfo.height} · 境内 ${this.rasterCount}`
    },
    levelHint () {
      return {
        nation: '全国视图 · 省界',
        province: '省级视图 · 地市界',
        city: '市级视图 · 区县界（第三级）'
      }[this.level]
    },
    hookText () {
      return HOOK_TEXT[this.layer] || ''
    }
  },
  watch: {
    frame (v) {
      this.renderFrame()
      this.$emit('frame-change', {
        frame: v,
        max: this.frameCount - 1,
        phase: framePhase(v),
        label: this.currentFrameLabel
      })
    },
    layer () {
      this.renderFrame()
      this.$emit('layer-change', this.layer)
    },
    initialLayer (v) {
      if (v && v !== this.layer) {
        this.switchLayer(v)
      }
    },
    initialProvince (v) {
      if (v && this.divisions) {
        this.applyInitialDrill()
      }
    }
  },
  mounted () {
    // 自动化验证钩子：带 ?probe=1 打开时，每帧把栅格的色彩层次统计写到
    // <body data-weather-probe="...">，无头浏览器 --dump-dom 就能读到。
    // 用途：客观回答"图层颜色是不是一样的"，而不是靠肉眼看截图。
    // 不带这个参数时完全不生效，也不影响任何渲染逻辑。
    this.probe = /(^|[?&])probe=1(&|$)/.test(String(window.location.search || ''))
    this.init()
    this.resizeHandler = () => this.chart && this.chart.resize()
    window.addEventListener('resize', this.resizeHandler)
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.resizeHandler)
    this.stopPlay()
    if (this.chart) {
      this.chart.dispose()
      this.chart = null
    }
  },
  methods: {
    /* ───────────────────────── 初始化 ───────────────────────── */

    async init () {
      this.loading = true
      this.error = ''
      try {
        await registerChinaMap(echarts)
        const [grid, divisions, geoJson] = await Promise.all([
          loadGrid(),
          loadDivisions(),
          loadChinaGeoJson()
        ])
        this.grid = grid
        this.divisions = divisions
        this.activeGridPoints = grid.points

        if (!this.chart) {
          this.chart = echarts.init(this.$refs.chart)
        }
        this.setActiveGeo(geoJson)
        this.buildStations()
        this.buildLevelMask()
        this.buildRegionIndex()
        this.applyGeoOption()
        this.renderFrame()
        if (this.autoPlay) {
          this.startPlay()
        }
        if (this.initialProvince) {
          await this.applyInitialDrill()
        }
      } catch (e) {
        this.error = (e && e.message) || String(e)
      } finally {
        this.loading = false
      }
    },

    /** 深链下钻：按省短名或 adcode 找到目标省并进入省级视图 */
    async applyInitialDrill () {
      const key = String(this.initialProvince || '').trim()
      if (!key || !this.divisions) {
        return
      }
      const prov = (this.divisions.provinces || []).filter(p => p.n === key || String(p.a) === key)[0]
      if (!prov) {
        this.drillError = `深链参数 province=${key} 未匹配到任何省份（可用省短名如「山西」或 adcode 如「140000」）`
        return
      }
      if (this.level !== 'nation' && this.provinceAdcode === prov.a) {
        return
      }
      this.stopPlay()
      await this.drillTo('province', prov.n, prov.a)
    },

    /** 设置当前层级的边界数据（同时缓存解码后的普通坐标版本） */
    setActiveGeo (geoJson) {
      this.activeGeoJson = geoJson
      this.activeGeoPlain = ensurePlainGeoJson(geoJson)
    },

    layersOf (group) {
      return WEATHER_LAYERS.filter(l => l.group === group)
    },

    /* ───────────────────────── 站点（离线三级区划） ───────────────────────── */

    /**
     * 分级别取站点：全国 → 地级市；省 → 区县（第三级）；市 → 区县
     * 直辖市在 DataV 的区划里省下面直接是区，这里按同一逻辑处理，不特殊判断。
     */
    buildStations () {
      const d = this.divisions
      if (!d) {
        this.stations = []
        return
      }
      if (this.level === 'nation') {
        this.stations = d.cities.map(c => ({ name: c.n, adcode: c.a, c: c.c })).filter(s => s.c)
        this.stationLabel = '地级市'
      } else if (this.level === 'province') {
        const shorts = citiesOf(d, this.provinceName).map(c => c.s)
        this.stations = d.districts
          .filter(x => shorts.indexOf(x.ct) >= 0)
          .map(x => ({ name: x.n, adcode: x.a, c: x.c }))
        this.stationLabel = '区县'
      } else {
        this.stations = districtsOf(d, this.cityShortName)
          .map(x => ({ name: x.n, adcode: x.a, c: x.c }))
        this.stationLabel = '区县'
      }
    },

    /* ───────────────────────── 栅格与掩膜 ───────────────────────── */

    /** 当前层级的经纬度范围：全国用预置栅格的范围，下钻后用下级边界的包围盒 */
    currentBounds () {
      if (this.level === 'nation' && this.grid) {
        return {
          lngMin: this.grid.lngMin,
          latMin: this.grid.latMin,
          lngMax: this.grid.lngMin + this.grid.cols * this.grid.step,
          latMax: this.grid.latMin + this.grid.rows * this.grid.step
        }
      }
      const b = geoJsonBounds(this.activeGeoPlain, 0.25)
      if (b) {
        return b
      }
      return { lngMin: 73, latMin: 17, lngMax: 136.35, latMax: 54.45 }
    },

    /** 为当前层级生成栅格掩膜（每次切层级只算一次） */
    buildLevelMask () {
      const bounds = this.currentBounds()
      const { width, height } = rasterSize(bounds)
      const rings = collectRings(this.activeGeoPlain)
      if (!rings.length) {
        // 边界数据没解出来就明确报错，不静默画一张空图
        this.error = '当前层级的边界数据无法解析（坐标未解码），已停止绘制栅格图层'
        this.maskInfo = null
        return
      }
      this.error = ''
      this.maskInfo = buildMaskFromRings(rings, bounds, width, height)
      this.maskInfo.ringCount = rings.length
      this.ensureRasterCanvas(width, height)
    },

    ensureRasterCanvas (w, h) {
      if (this.rasterCanvas && this.rasterCanvas.width === w && this.rasterCanvas.height === h) {
        return
      }
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      this.rasterCanvas = c
      this.rasterCtx = c.getContext('2d')
      this.rasterImage = this.rasterCtx.createImageData(w, h)
      this.rasterRGBA = null
    },

    /* ───────────────────────── 区域索引（用于区域均值/峰值） ───────────────────────── */

    /**
     * 预计算「行政区 → 格点下标」的映射（每层级只算一次）。
     * 有了它，悬浮某个省/市时就能给出**真实区域均值与峰值**，而不是"中心点采样"。
     */
    buildRegionIndex () {
      const geoJson = this.activeGeoPlain
      const points = this.activeGridPoints
      const names = []
      const index = []
      if (!geoJson || !points.length) {
        this.regionIndex = { names, index }
        return
      }
      for (const f of (geoJson.features || [])) {
        const name = (f.properties && f.properties.name) || ''
        if (!name) {
          continue
        }
        const rings = ringsOfGeometry(f.geometry)
        if (!rings.length) {
          continue
        }
        const hit = []
        for (let i = 0; i < points.length; i++) {
          const lng = points[i][0]
          const lat = points[i][1]
          for (let k = 0; k < rings.length; k++) {
            const rg = rings[k]
            if (lng < rg.x0 || lng > rg.x1 || lat < rg.y0 || lat > rg.y1) {
              continue
            }
            if (pointInRing(lng, lat, rg.ring)) {
              hit.push(i)
              break
            }
          }
        }
        if (hit.length) {
          names.push(name)
          index.push(hit)
        }
      }
      this.regionIndex = { names, index }
    },

    /* ───────────────────────── 渲染 ───────────────────────── */

    /** geo 底图（只在层级变化时重建） */
    applyGeoOption () {
      if (!this.chart) {
        return
      }
      this.chart.setOption({
        backgroundColor: 'transparent',
        tooltip: { show: false },
        animationDuration: 300,
        geo: {
          map: this.activeMapName,
          roam: true,
          zoom: this.level === 'nation' ? 1.15 : 1.05,
          scaleLimit: { min: 0.7, max: 14 },
          itemStyle: {
            areaColor: '#0b2138',
            borderColor: 'rgba(125, 205, 255, 0.6)',
            borderWidth: 0.9
          },
          emphasis: {
            itemStyle: { areaColor: 'rgba(21, 101, 192, 0.35)' }
          },
          label: {
            show: this.level !== 'nation',
            color: 'rgba(225, 242, 255, 0.9)',
            fontSize: 10,
            textBorderColor: 'rgba(0,0,0,0.75)',
            textBorderWidth: 2
          },
          select: { disabled: true }
        },
        series: []
      }, true)
      this.bindEvents()
    },

    /**
     * 栅格图层系列。
     * `renderItem` 只负责把已经画好的 canvas 贴到 geo 上：
     * 用 `api.coord()` 把栅格左上/右下角的经纬度换算成像素，
     * 因此缩放、平移时都会跟着 geo 走。
     */
    rasterSeries () {
      const info = this.maskInfo
      return {
        name: '栅格图层',
        type: 'custom',
        coordinateSystem: 'geo',
        silent: true,
        z: 2,
        data: [0],
        renderItem: (params, api) => {
          if (!this.rasterCanvas || !info) {
            return
          }
          const tl = api.coord([info.bounds.lngMin, info.bounds.latMax])
          const br = api.coord([info.bounds.lngMax, info.bounds.latMin])
          if (!tl || !br) {
            return
          }
          return {
            type: 'image',
            style: {
              image: this.rasterCanvas,
              x: tl[0],
              y: tl[1],
              width: br[0] - tl[0],
              height: br[1] - tl[1]
            }
          }
        }
      }
    },

    /** 每帧重算栅格像素与站点 */
    renderFrame () {
      if (!this.chart || !this.maskInfo || !this.rasterCtx) {
        return
      }
      const def = this.layerDef

      // ① 栅格：逐像素着色
      const res = buildRasterRGBA(this.layer, this.frame, this.maskInfo, this.rasterRGBA)
      this.rasterRGBA = res.rgba
      this.rasterCount = res.opaque
      this.rasterImage.data.set(res.rgba)
      this.rasterCtx.putImageData(this.rasterImage, 0, 0)

      // ② 每层级格点的场值，用于悬浮某个行政区时算真实均值/峰值
      const prep = prepareField(this.layer, framePhase(this.frame))
      const pts = this.activeGridPoints
      const vals = new Float32Array(pts.length)
      for (let i = 0; i < pts.length; i++) {
        vals[i] = evalPrepared(prep, pts[i][0], pts[i][1])
      }
      this.gridValues = vals
      this.summary = frameSummary(this.layer, pts, this.frame)

      // ③ 观测站点
      const jitter = def.group === 'business' ? 0.06 : 0.12
      const stationData = buildStationData(this.stations, this.layer, this.frame, jitter)
      const n = stationData.length
      const symbolSize = n > 300 ? 5 : (n > 80 ? 7 : 9)
      const showLabel = n <= 26
      const colors = def.colors
      const stationPoints = stationData.map(s => ({
        name: s.name,
        value: [s.lng, s.lat, s.value],
        adcode: s.adcode,
        lvl: s.level,
        itemStyle: {
          color: s.level
            ? s.level.color
            : colors[Math.max(0, Math.min(colors.length - 1, Math.round(s.raw01 * (colors.length - 1))))]
        }
      }))

      try {
        this.chart.setOption({
          series: [
            this.rasterSeries(),
            {
              name: '观测站点',
              type: 'scatter',
              coordinateSystem: 'geo',
              data: stationPoints,
              symbolSize,
              itemStyle: { borderColor: 'rgba(255,255,255,0.9)', borderWidth: 1 },
              label: {
                show: showLabel,
                position: 'right',
                formatter: p => `${p.data.name} ${p.data.value[2]}`,
                color: '#eaf6ff',
                fontSize: 10,
                textBorderColor: 'rgba(0,0,0,0.75)',
                textBorderWidth: 2
              },
              emphasis: { scale: 1.8 },
              z: 3,
              tooltip: { show: false }
            }
          ]
        })
      } catch (e) {
        this.error = `图层渲染失败：${(e && e.message) || e}`
      }

      if (this.probe) {
        this.publishProbe()
      }
    },

    /** 把栅格/区域索引的关键统计写到 body 上（仅 ?probe=1 时生效） */
    publishProbe () {
      try {
        const stats = this.getRasterStats()
        const info = this.getRegionIndexInfo()
        const rendered = this.renderedCanvasStats()
        document.body.setAttribute('data-weather-probe', JSON.stringify({
          layer: this.layer,
          level: this.level,
          frame: this.frame,
          regions: info.regions,
          gridPoints: info.gridPoints,
          rasterPixels: info.rasterPixels,
          maskInside: info.maskInside,
          rasterSize: this.maskInfo ? `${this.maskInfo.width}x${this.maskInfo.height}` : '',
          // 源数据（栅格缓冲区）的统计
          srcDistinctColors: stats ? stats.distinctColors : 0,
          srcStdevLuma: stats ? stats.stdevLuma : 0,
          srcMinLuma: stats ? stats.minLuma : 0,
          srcMaxLuma: stats ? stats.maxLuma : 0,
          // 真实渲染出来的画布统计 —— 这才是"用户看到的"东西
          canvasCount: rendered ? rendered.canvases : 0,
          canvasPixels: rendered ? rendered.pixels : 0,
          canvasColors: rendered ? rendered.colors : 0,
          canvasStdev: rendered ? rendered.stdev : 0,
          canvasMinLuma: rendered ? rendered.minLuma : 0,
          canvasMaxLuma: rendered ? rendered.maxLuma : 0,
          canvasError: rendered ? rendered.error : '',
          // 图层胶囊是否被容器裁掉（"后边的按钮看不到了"那条反馈的客观判据）
          pills: this.pillLayout()
        }))
      } catch (e) {
        // 诊断钩子失败不影响主流程
      }
    },

    /**
     * 图层胶囊的排版体检。
     * 之前的写法（外层 flex-wrap + 分组不换行）会让分组宽度超出容器，
     * 超出的胶囊被地图容器的 `overflow:hidden` **直接裁掉**，
     * 表现就是"环境图层后面几个按钮看不到了"。
     * 这里逐个数每个胶囊是否越过容器右边界，越界数必须是 0。
     */
    pillLayout () {
      try {
        const wrap = this.$el.querySelector('.weather-map__layers')
        if (!wrap) {
          return null
        }
        const box = wrap.getBoundingClientRect()
        const pills = wrap.querySelectorAll('.layer-pill')
        let clipped = 0
        let lines = new Set()
        for (const p of pills) {
          const r = p.getBoundingClientRect()
          if (r.right > box.right + 1 || r.left < box.left - 1) {
            clipped++
          }
          lines.add(Math.round(r.top))
        }
        return {
          total: pills.length,
          clipped,
          rows: lines.size,
          wrapWidth: Math.round(box.width),
          height: Math.round(box.height)
        }
      } catch (e) {
        return null
      }
    },

    /**
     * 读真实渲染画布的像素统计。
     * 这一步很关键：只统计"源栅格缓冲区"只能证明数据有层次，
     * **不能证明 ECharts 真的把层次画出来了**。所以直接抽样画布像素。
     */
    renderedCanvasStats () {
      try {
        const canvases = this.chart.getDom().querySelectorAll('canvas')
        const seen = new Set()
        let n = 0
        let sum = 0
        let sum2 = 0
        let minL = 255
        let maxL = 0
        for (const cv of canvases) {
          const ctx = cv.getContext('2d')
          if (!ctx) {
            continue
          }
          const w = cv.width
          const h = cv.height
          const data = ctx.getImageData(0, 0, w, h).data
          // 每 2 像素抽一个，兼顾精度与开销
          for (let y = 0; y < h; y += 2) {
            for (let x = 0; x < w; x += 2) {
              const o = (y * w + x) << 2
              if (data[o + 3] < 200) {
                continue
              }
              seen.add((data[o] << 16) | (data[o + 1] << 8) | data[o + 2])
              const l = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2]
              sum += l
              sum2 += l * l
              if (l < minL) minL = l
              if (l > maxL) maxL = l
              n++
            }
          }
        }
        const mean = n ? sum / n : 0
        return {
          canvases: canvases.length,
          pixels: n,
          colors: seen.size,
          stdev: Math.round(Math.sqrt(n ? Math.max(0, sum2 / n - mean * mean) : 0) * 10) / 10,
          minLuma: Math.round(minL * 10) / 10,
          maxLuma: Math.round(maxL * 10) / 10,
          error: ''
        }
      } catch (e) {
        return { canvases: 0, pixels: 0, colors: 0, stdev: 0, minLuma: 0, maxLuma: 0, error: String(e) }
      }
    },

    bindEvents () {
      if (!this.chart || this._bound) {
        return
      }
      this._bound = true
      const zr = this.chart.getZr()

      // ── 站点悬浮 ──
      this.chart.on('mouseover', { seriesType: 'scatter' }, params => {
        const d = params && params.data
        if (!d) {
          return
        }
        this.hover = {
          kind: 'station',
          name: d.name,
          value: d.value[2],
          peak: null,
          level: d.lvl,
          extra: d.adcode ? `区划代码 ${d.adcode}` : ''
        }
      })
      this.chart.on('mouseout', { seriesType: 'scatter' }, () => {
        if (this.hover && this.hover.kind === 'station') {
          this.hover = null
        }
      })

      // ── 区域悬浮：真实区域均值 + 峰值 ──
      this.chart.on('mouseover', { componentType: 'geo' }, params => {
        // 站点优先：鼠标在观测点上时不要被底下的区域覆盖
        if (this.hover && this.hover.kind === 'station') {
          return
        }
        const stat = this.regionStat(params.name)
        if (!stat) {
          return
        }
        this.hover = {
          kind: 'region',
          name: params.name,
          value: stat.avg,
          peak: stat.max,
          level: this.layer === 'aqi' ? aqiLevel(stat.avg) : null,
          extra: `格点 ${stat.count} 个`
        }
      })
      this.chart.on('mouseout', { componentType: 'geo' }, () => {
        if (this.hover && this.hover.kind === 'region') {
          this.hover = null
        }
      })

      // ── 悬浮卡片跟随鼠标 ──
      zr.on('mousemove', e => {
        if (!this.hover || !this.$refs.chart) {
          return
        }
        const rect = this.$refs.chart.getBoundingClientRect()
        const x = e.offsetX
        const y = e.offsetY
        this.tipStyle = {
          left: (x + 262 > rect.width ? Math.max(4, x - 262) : x + 16) + 'px',
          top: (y + 170 > rect.height ? Math.max(4, y - 170) : y + 14) + 'px'
        }
      })

      // ── 点击下钻 ──
      this.chart.on('click', params => {
        if (params && params.componentType === 'geo' && params.name) {
          this.onRegionClick(params.name)
        }
      })
    },

    /** 从当前帧的场值算某个行政区的均值/峰值 */
    regionStat (name) {
      const ri = this.regionIndex
      const k = ri.names.indexOf(name)
      if (k < 0 || !this.gridValues) {
        return null
      }
      const idx = ri.index[k]
      const def = this.layerDef
      const f = Math.pow(10, def.decimals)
      const span = def.max - def.min
      const toReal = v01 => Math.round((def.min + v01 * span) * f) / f
      let sum = 0
      let max = -Infinity
      for (let i = 0; i < idx.length; i++) {
        const v = this.gridValues[idx[i]]
        sum += v
        if (v > max) {
          max = v
        }
      }
      return {
        count: idx.length,
        avg: toReal(sum / idx.length),
        max: toReal(max)
      }
    },

    /* ───────────────────────── 下钻 ───────────────────────── */

    async onRegionClick (name) {
      this.drillError = ''
      if (this.level === 'nation') {
        const prov = (this.divisions.provinces || []).filter(p => p.n === name)[0]
        if (!prov) {
          this.drillError = `「${name}」暂无区划数据（演示数据不含港澳台下钻）`
          return
        }
        await this.drillTo('province', prov.n, prov.a)
      } else if (this.level === 'province') {
        const city = citiesOf(this.divisions, this.provinceName)
          .filter(c => c.n === name || c.s === name)[0]
        if (!city) {
          this.drillError = `未找到「${name}」对应的区划代码，无法下钻`
          return
        }
        this.cityShortName = city.s
        await this.drillTo('city', city.n, city.a)
      } else {
        this.$message.info('已经是区县（第三级）视图，无法继续下钻')
      }
    },

    async drillTo (level, name, adcode) {
      this.loading = true
      this.drillError = ''
      try {
        const geo = await fetchSubMap(adcode)
        const mapName = `drill-${adcode}`
        echarts.registerMap(mapName, geo)

        this.activeMapName = mapName
        this.level = level
        if (level === 'province') {
          this.provinceName = name
          this.provinceAdcode = adcode
          this.cityName = ''
          this.cityAdcode = ''
        } else {
          this.cityName = name
          this.cityAdcode = adcode
        }
        this.setActiveGeo(geo)
        // 栅格与格点都裁剪到当前边界内，避免颜色溢出到下钻区域之外
        this.activeGridPoints = filterGridByGeoJson(this.grid.points, this.activeGeoPlain, adcode)
        this.buildStations()
        this.buildLevelMask()
        this.buildRegionIndex()
        this.applyGeoOption()
        this.renderFrame()
        this.$emit('drill', {
          level,
          name,
          adcode,
          gridPoints: this.activeGridPoints.length,
          stations: this.stations.length,
          rasterPixels: this.rasterCount
        })
      } catch (e) {
        this.drillError = (e && e.message) || String(e)
      } finally {
        this.loading = false
      }
    },

    back () {
      if (this.level === 'city') {
        this.drillTo('province', this.provinceName, this.provinceAdcode)
      } else {
        this.resetDrill()
      }
    },

    backToProvince () {
      if (this.level === 'city') {
        this.drillTo('province', this.provinceName, this.provinceAdcode)
      }
    },

    async resetDrill () {
      if (this.level === 'nation') {
        return
      }
      this.activeMapName = CHINA_MAP_NAME
      this.level = 'nation'
      this.provinceName = ''
      this.provinceAdcode = ''
      this.cityName = ''
      this.cityAdcode = ''
      this.cityShortName = ''
      this.drillError = ''
      this.activeGridPoints = this.grid.points
      try {
        this.setActiveGeo(await loadChinaGeoJson())
      } catch (e) { /* 已缓存，正常不会失败 */ }
      this.buildStations()
      this.buildLevelMask()
      this.buildRegionIndex()
      this.applyGeoOption()
      this.renderFrame()
      this.$emit('drill', { level: 'nation' })
    },

    switchLayer (key) {
      // 只改图层；渲染由 watch(layer) 统一触发，避免重复渲染并保留当前缩放/平移
      if (this.layer === key) {
        return
      }
      this.layer = key
    },

    /* ───────────────────────── 时间轴 ───────────────────────── */

    onFrameChange () {
      if (this.playing) {
        this.stopPlay()
      }
    },

    togglePlay () {
      this.playing ? this.stopPlay() : this.startPlay()
    },

    startPlay () {
      this.stopPlay()
      this.playing = true
      this.playTimer = window.setInterval(() => {
        this.frame = (this.frame + 1) % this.frameCount
      }, 1500)
    },

    stopPlay () {
      this.playing = false
      if (this.playTimer) {
        window.clearInterval(this.playTimer)
        this.playTimer = null
      }
    },

    /** 供父组件/自动化验证调用：跳到指定时间 */
    setFrame (i) {
      this.frame = Math.max(0, Math.min(this.frameCount - 1, i | 0))
    },

    /**
     * 供父组件 / 自动化验证调用：当前栅格的色彩层次统计。
     * 用来客观回答"颜色是不是都一样"——`distinctColors` 少、`stdevLuma` 接近 0
     * 就说明图是糊的。父组件通过 ref 调用，不参与渲染。
     */
    getRasterStats () {
      if (!this.maskInfo || !this.rasterRGBA) {
        return null
      }
      return computeRasterStats({
        rgba: this.rasterRGBA,
        width: this.maskInfo.width,
        height: this.maskInfo.height
      })
    },

    /** 供自动化验证：当前层级的区域索引规模 */
    getRegionIndexInfo () {
      return {
        regions: this.regionIndex.names.length,
        gridPoints: this.activeGridPoints.length,
        rasterPixels: this.rasterCount,
        maskInside: this.maskInfo ? this.maskInfo.inside : 0
      }
    }
  }
}

/* ═══════════════════════ 工具 ═══════════════════════ */

/** 把格点裁剪到指定 GeoJSON 范围内（下钻后用），按 adcode 缓存 */
function filterGridByGeoJson (points, plainGeoJson, cacheKey) {
  if (cacheKey && gridFilterCache[cacheKey]) {
    return gridFilterCache[cacheKey]
  }
  const rings = collectRings(plainGeoJson)
  if (!rings.length) {
    return points
  }
  const out = []
  for (const p of points) {
    const lng = p[0]
    const lat = p[1]
    for (let k = 0; k < rings.length; k++) {
      const rg = rings[k]
      if (lng < rg.x0 || lng > rg.x1 || lat < rg.y0 || lat > rg.y1) {
        continue
      }
      if (pointInRing(lng, lat, rg.ring)) {
        out.push(p)
        break
      }
    }
  }
  if (cacheKey) {
    gridFilterCache[cacheKey] = out
  }
  return out
}
</script>

<style lang="scss" scoped>
$line: rgba(79, 195, 247, 0.24);
$text: #cfe8ff;
$dim: #8fb8d8;

.weather-map {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 460px;

  &__canvas {
    width: 100%;
    height: 100%;
  }

  &__mask {
    position: absolute;
    inset: 0;
    z-index: 12;
  }

  &__error {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 15;
    display: flex;
    gap: 10px;
    max-width: 76%;
    padding: 14px 18px;
    border-radius: 6px;
    background: rgba(120, 30, 30, 0.94);
    border: 1px solid #ff7043;
    color: #ffe0db;
    font-size: 13px;
    line-height: 20px;

    i { font-size: 20px; color: #ffab91; }
    p { margin: 4px 0 0; word-break: break-all; }
  }

  &__warn {
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: 58px;
    z-index: 14;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 4px;
    background: rgba(120, 80, 10, 0.94);
    border: 1px solid #ffb74d;
    color: #ffe0b2;
    font-size: 12px;

    i { color: #ffcc80; flex: none; }
    .el-button { margin-left: auto; color: #fff; flex: none; }
  }

  &__warn-text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ── 图层胶囊：按分组换行，保证一个都不被裁掉 ── */
  &__layers {
    position: absolute;
    left: 12px;
    right: 12px;
    top: 54px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 5px;
    pointer-events: none;
  }

  &__layer-group {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px;
    min-width: 0;
    pointer-events: auto;
  }

  &__group-label {
    flex: none;
    color: $dim;
    font-size: 11px;
    letter-spacing: 1px;
    white-space: nowrap;
  }

  /* ── 面包屑 ── */
  &__crumbs {
    position: absolute;
    left: 12px;
    right: 12px;
    top: 10px;
    z-index: 11;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
    min-height: 32px;
    padding: 5px 12px;
    border-radius: 18px;
    background: rgba(6, 26, 50, 0.8);
    border: 1px solid $line;
    color: $text;
    font-size: 12px;
  }

  &__level-hint {
    margin-left: auto;
    color: $dim;
    white-space: nowrap;
  }

  &__station-hint {
    color: $dim;
    white-space: nowrap;
  }

  &__tip {
    position: absolute;
    z-index: 20;
    width: 246px;
    padding: 10px 12px;
    border-radius: 6px;
    background: rgba(6, 26, 50, 0.96);
    border: 1px solid rgba(79, 195, 247, 0.5);
    box-shadow: 0 6px 22px rgba(0, 0, 0, 0.45);
    color: $text;
    font-size: 12px;
    pointer-events: none;
  }

  &__tip-title {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    font-size: 14px;
    font-weight: 700;
    color: #4fc3f7;
    margin-bottom: 6px;
  }

  &__tip-time {
    font-size: 11px;
    font-weight: 400;
    color: $dim;
  }

  &__tip-row {
    display: flex;
    justify-content: space-between;
    line-height: 22px;

    span { color: $dim; }
    b { color: #e6f5ff; font-size: 14px; }
  }

  &__tip-extra {
    margin-top: 4px;
    color: #6d90ad;
    font-size: 11px;
    line-height: 16px;
  }

  &__tip-foot {
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px dashed rgba(79, 195, 247, 0.3);
    color: #64b5f6;
    text-align: center;
    font-size: 11px;
  }

  &__legend {
    position: absolute;
    left: 12px;
    bottom: 62px;
    z-index: 10;
    width: 272px;
    padding: 8px 10px;
    border-radius: 4px;
    background: rgba(6, 26, 50, 0.82);
    border: 1px solid $line;
    color: $text;
    font-size: 11px;
  }

  &__legend-head {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
  }

  &__legend-range { color: $dim; }

  &__legend-bar {
    display: flex;
    height: 10px;
    border-radius: 2px;
    overflow: hidden;
  }

  &__legend-foot {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-top: 5px;
    color: $dim;
  }

  &__timeline {
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: 10px;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 14px;
    border-radius: 20px;
    background: rgba(6, 26, 50, 0.86);
    border: 1px solid $line;
  }

  &__time-label {
    flex: none;
    min-width: 132px;
    color: #4fc3f7;
    font-size: 13px;
    font-weight: 700;
    font-family: Consolas, Monaco, monospace;

    em {
      font-style: normal;
      font-size: 11px;
      color: $dim;
      margin-left: 4px;
      font-weight: 400;
    }
  }

  &__slider {
    flex: 1;
    margin: 0 4px;
  }

  &__time-axis {
    flex: none;
    display: flex;
    gap: 14px;
    color: #6d90ad;
    font-size: 11px;

    em { font-style: normal; }
  }
}

.crumb {
  cursor: pointer;
  color: #64b5f6;
  flex: none;

  &:hover { color: #fff; }
  &.is-current { color: #fff; font-weight: 700; cursor: default; }
}

.layer-pill {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 11px;
  border-radius: 14px;
  border: 1px solid rgba(79, 195, 247, 0.32);
  background: rgba(6, 26, 50, 0.72);
  color: #9fc4de;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.16s;
  white-space: nowrap;

  i { font-size: 13px; }

  &:hover {
    border-color: #4fc3f7;
    color: #d7efff;
  }

  &.is-active {
    background: linear-gradient(90deg, rgba(21, 101, 192, 0.95), rgba(21, 101, 192, 0.5));
    border-color: #4fc3f7;
    color: #fff;
    box-shadow: 0 0 12px rgba(79, 195, 247, 0.45);
  }
}
</style>
