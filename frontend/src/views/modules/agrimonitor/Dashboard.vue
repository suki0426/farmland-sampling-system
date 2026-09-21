<template>
  <div class="dashboard">
    <!-- ═══════════════ 顶栏 ═══════════════ -->
    <header class="dashboard__header">
      <div class="dashboard__brand">
        <i class="el-icon-monitor"></i>
        <h1>星穹耕界 · 农田智能监测大屏</h1>
        <el-tag size="mini" type="warning" effect="plain">演示数据 · 不连数据库</el-tag>
      </div>

      <div class="dashboard__header-right">
        <div class="view-switch">
          <button
            v-for="v in views"
            :key="v.key"
            class="view-switch__item"
            :class="{ 'is-active': view === v.key }"
            :title="v.desc"
            @click="view = v.key">
            <i :class="v.icon"></i>{{ v.label }}
          </button>
        </div>
        <span class="dashboard__clock">{{ clock }}</span>
        <el-button size="mini" icon="el-icon-refresh" :loading="loading" @click="reload">刷新</el-button>
      </div>
    </header>

    <!-- ═══════════════ 主体三栏 ═══════════════ -->
    <div class="dashboard__body">
      <!-- ── 左栏 ── -->
      <aside class="dashboard__side">
        <!-- 2D：图层说明 -->
        <div v-if="view === 'weather'" class="panel">
          <div class="panel__title">
            当前图层
            <span class="panel__title-extra panel__title-time">{{ frameLabel }}</span>
          </div>
          <div class="layer-info">
            <div class="layer-info__head">
              <i :class="layerDef.icon"></i>
              <b>{{ layerDef.label }}</b>
              <em>{{ layerDef.unit }}</em>
            </div>
            <div class="layer-info__bar">
              <span v-for="(c, i) in layerDef.colors" :key="i" :style="{ background: c, flex: 1 }"></span>
            </div>
            <div class="layer-info__range">
              <span>{{ layerDef.min }}</span>
              <span>{{ layerDef.max }}</span>
            </div>
            <div class="layer-info__desc">{{ layerDef.desc }}</div>
            <div class="layer-info__hook">
              <i class="el-icon-warning-outline"></i>{{ hookText }}
            </div>
          </div>
          <div class="layer-info__tip">
            地图上可切换 {{ layerCount }} 个图层 · 单击省份/地市可下钻到第三级
          </div>
        </div>

        <!-- 3D：监控指标 -->
        <div v-else class="panel">
          <div class="panel__title">监控指标</div>
          <div class="metric-switch">
            <button
              v-for="m in metrics"
              :key="m.key"
              class="metric-switch__item"
              :class="{ 'is-active': m.key === metric }"
              @click="metric = m.key">
              <span class="metric-switch__dot" :style="{ background: m.colors[3] }"></span>
              {{ m.label }}
              <em>{{ m.unit }}</em>
            </button>
          </div>
          <div class="metric-switch__desc">{{ metricDef.desc }}</div>
        </div>

        <div class="panel">
          <div class="panel__title">全国汇总</div>
          <div class="stat-grid">
            <div v-for="item in summaryCards" :key="item.label" class="stat-grid__item">
              <div class="stat-grid__value" :style="{ color: item.color }">{{ item.value }}</div>
              <div class="stat-grid__label">{{ item.label }}</div>
            </div>
          </div>
        </div>

        <div class="panel panel--grow">
          <div class="panel__title">
            {{ rankTitle }}
            <el-radio-group v-model="rankOrder" size="mini" class="panel__title-extra">
              <el-radio-button label="desc">高→低</el-radio-button>
              <el-radio-button label="asc">低→高</el-radio-button>
            </el-radio-group>
          </div>
          <div class="rank">
            <div
              v-for="(item, index) in rankedProvinces"
              :key="item.name"
              class="rank__row"
              :class="{ 'is-top3': index < 3 }">
              <span class="rank__no" :class="'rank__no--' + (index + 1)">{{ index + 1 }}</span>
              <span class="rank__name">{{ item.name }}</span>
              <span class="rank__bar">
                <i :style="{ width: barWidth(item) + '%', background: rankAccent }"></i>
              </span>
              <span class="rank__value">{{ item.display }}{{ rankUnit }}</span>
            </div>
          </div>
          <div v-if="view === 'weather'" class="rank__note">
            排名值取自与地图**同一个场函数**在该省中心点的取值，因此与图上颜色一致
          </div>
        </div>
      </aside>

      <!-- ── 中栏：地图 ── -->
      <section class="dashboard__center">
        <WeatherMap
          v-if="view === 'weather'"
          ref="weatherMap"
          :initial-layer="weatherLayer"
          :initial-province="initialProvince"
          @layer-change="onLayerChange"
          @frame-change="onFrameChange"
          @drill="onDrill" />
        <China3DMap
          v-else
          :stats="provinces"
          :metric="metric"
          @select-province="onSelectProvince" />

        <div class="dashboard__center-hint">
          <template v-if="view === 'weather'">
            <i class="el-icon-info"></i>
            <b v-if="drillPath">{{ drillPath }} · </b>
            悬浮查看区域均值/峰值与农事结论 · 单击下钻 省份→地市→区县（第三级） · 滚轮缩放 / 拖动平移
          </template>
          <template v-else>
            <i class="el-icon-info"></i>
            3D 地形视图 · 悬浮查看该地区概况 · 单击进入地区监控 · 可拖动旋转/滚轮缩放
          </template>
        </div>
      </section>

      <!-- ── 右栏 ── -->
      <aside class="dashboard__side">
        <div class="panel">
          <div class="panel__title">
            实时预警
            <span class="panel__badge">{{ warnings.filter(w => w.status === 'open').length }}</span>
          </div>
          <div class="warn-list">
            <div v-for="w in warnings.slice(0, 7)" :key="w.warningId" class="warn-list__row">
              <span class="warn-list__level" :style="{ background: levelColor(w.level) }">{{ levelLabel(w.level) }}</span>
              <div class="warn-list__main">
                <div class="warn-list__title">{{ w.typeLabel }}</div>
                <div class="warn-list__meta">{{ w.regionKey }}</div>
              </div>
              <span class="warn-list__time">{{ w.createTime.slice(11, 16) }}</span>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel__title">终端在线状态</div>
          <div class="device-bar">
            <div class="device-bar__seg device-bar__seg--online" :style="{ width: onlinePercent + '%' }"></div>
            <div class="device-bar__seg device-bar__seg--offline" :style="{ width: (100 - onlinePercent) + '%' }"></div>
          </div>
          <div class="device-bar__legend">
            <span><i class="dot dot--online"></i>在线 {{ nation.onlineCount }}</span>
            <span><i class="dot dot--offline"></i>离线 {{ nation.offlineCount }}</span>
            <span class="device-bar__percent">{{ onlinePercent }}%</span>
          </div>
          <div class="device-bar__stats">
            <div><b>{{ nation.provinceCount }}</b><span>覆盖省份</span></div>
            <div><b>{{ nation.samplePointCount || '—' }}</b><span>采样点</span></div>
            <div><b>{{ nation.taskCount }}</b><span>进行中任务</span></div>
          </div>
        </div>

        <div class="panel panel--grow">
          <div class="panel__title">全国近 24 小时趋势</div>
          <MiniTrendChart title="云量均值" unit="%" :rows="trend.cloud" accent="#4fc3f7" :height="80" />
          <MiniTrendChart title="降雨均值" unit="mm" :rows="trend.rain" accent="#26a69a" :height="80" />
          <MiniTrendChart title="CO₂ 均值" unit="ppm" :rows="trend.co2" accent="#ffb74d" :height="80" />
        </div>
      </aside>
    </div>

    <!-- ═══════════════ 任务书指标区 ═══════════════ -->
    <TaskBookPanel />

    <!-- ═══════════════ 底部滚动条 ═══════════════ -->
    <footer class="dashboard__footer">
      <span class="dashboard__footer-label">重点关注地区</span>
      <div class="dashboard__ticker">
        <span v-for="p in focusProvinces" :key="p.name" class="dashboard__ticker-item">
          {{ p.name }} · 预警 {{ p.warningCount }} 条 · 终端 {{ p.onlineCount }}/{{ p.deviceCount }} 在线 ·
          土壤湿度 {{ p.soilMoisture }}%
        </span>
        <span v-for="p in focusProvinces" :key="'dup-' + p.name" class="dashboard__ticker-item">
          {{ p.name }} · 预警 {{ p.warningCount }} 条 · 终端 {{ p.onlineCount }}/{{ p.deviceCount }} 在线 ·
          土壤湿度 {{ p.soilMoisture }}%
        </span>
      </div>
    </footer>
  </div>
</template>

<script>
/**
 * 页面 1 —— 首页监控大屏
 *
 * 需求对应：
 *   「以省划分的 3D 地形的中国地图，展现云/雨/CO₂，用不同颜色表示，鼠标悬浮显示该地区」
 *     → 视图一「3D 地形」：China3DMap（echarts-gl map3D + 省级 GeoJSON + visualMap 配色）
 *   「做成天气 App 那种空气质量地图 / 降水地图实时变化图，像 iPhone 里一样可以切换」
 *     → 视图二「天气图层」（默认）：WeatherMap —— 栅格热力 + 10 个图层胶囊 + 25 帧时间轴
 *   「太粗略，只有省份，精确到第三级」
 *     → WeatherMap 内置全国三级区划（2728 个区县），支持 全国 → 省 → 市 下钻
 *   「结合任务书要求对页面进行填充」
 *     → 底部 TaskBookPanel：M1~M4 / E1~E4 / T1~T5 对照 + 19 字节回传帧实编码 +
 *       E1 布点策略误差评估 + E2 路线算法对比（数字均为现算）
 *
 * ⚠️ 全部为前端演示数据（@/mock/agrimonitor），**不连数据库、不写任何数据**。
 */
import WeatherMap from './components/WeatherMap'
import China3DMap from './components/China3DMap'
import MiniTrendChart from './components/MiniTrendChart'
import TaskBookPanel from './components/TaskBookPanel'
import {
  METRICS, WEATHER_LAYERS, layerByKey, field01, toRealValue, frameTime, FRAME_COUNT, HOOK_TEXT,
  mockProvinceStats, mockNationSummary, mockWarnings,
  mockDeviceSeries, WARNING_LEVELS
} from '@/mock/agrimonitor'

const VIEWS = [
  { key: 'weather', label: '天气图层', icon: 'el-icon-map-location', desc: '栅格热力 · 10 个可切换图层 · 25 帧时间轴 · 下钻到区县' },
  { key: 'terrain', label: '3D 地形', icon: 'el-icon-s-data', desc: '3D 地形中国地图 · 云/雨/CO₂ 按省填色' }
]

export default {
  name: 'AgriDashboard',
  components: { WeatherMap, China3DMap, MiniTrendChart, TaskBookPanel },
  props: {
    /** 深链：打开即下钻到某个省（省短名或 adcode） */
    initialProvince: { type: String, default: '' },
    /** 深链：打开时的默认图层，例如 aqi / precip */
    initialLayer: { type: String, default: '' }
  },
  data () {
    return {
      views: VIEWS,
      view: 'weather',
      // 3D 视图用
      metrics: METRICS,
      metric: 'cloud',
      // 2D 视图用
      weatherLayer: this.initialLayer || 'precip',
      frameIndex: 0,
      frameLabel: frameTime(0).full.slice(5),
      drillPath: '',
      provinces: [],
      warnings: [],
      rankOrder: 'desc',
      loading: false,
      clock: '',
      trend: { cloud: [], rain: [], co2: [] },
      timer: null
    }
  },
  computed: {
    layerDef () {
      return layerByKey(this.weatherLayer)
    },
    hookText () {
      return HOOK_TEXT[this.weatherLayer] || ''
    },
    layerCount () {
      return WEATHER_LAYERS.length
    },
    metricDef () {
      return METRICS.filter(m => m.key === this.metric)[0] || METRICS[0]
    },
    nation () {
      return mockNationSummary(this.provinces)
    },
    summaryCards () {
      const n = this.nation
      return [
        { label: '覆盖省份', value: n.provinceCount, color: '#4fc3f7' },
        { label: '采样终端', value: n.deviceCount, color: '#81c784' },
        { label: '在线终端', value: n.onlineCount, color: '#4dd0e1' },
        { label: '未关闭预警', value: n.warningCount, color: '#ff8a65' },
        { label: '耕地面积(公顷)', value: n.farmlandArea.toLocaleString(), color: '#ffd54f' },
        { label: '累计采样', value: n.sampleCount.toLocaleString(), color: '#ba68c8' }
      ]
    },

    /** 省级排名的数据源：2D 用与地图同一个场函数，3D 用省份统计字段 */
    rankRows () {
      if (this.view === 'weather') {
        const def = this.layerDef
        const phase = FRAME_COUNT > 1 ? this.frameIndex / (FRAME_COUNT - 1) : 0
        return this.provinces.map(p => ({
          name: p.name,
          value: toRealValue(def.key, field01(def.key, p.lng, p.lat, phase))
        }))
      }
      return this.provinces.map(p => ({ name: p.name, value: Number(p[this.metric]) || 0 }))
    },
    rankTitle () {
      return this.view === 'weather' ? `省级排名 · ${this.layerDef.label}` : `省级排名 · ${this.metricDef.label}`
    },
    rankUnit () {
      return this.view === 'weather' ? this.layerDef.unit : this.metricDef.unit
    },
    rankAccent () {
      return this.view === 'weather' ? this.layerDef.colors[3] : '#4fc3f7'
    },
    rankDecimals () {
      if (this.view === 'weather') {
        return this.layerDef.decimals
      }
      // 台数/条数一类的统计量按整数显示
      return ['deviceCount', 'warningCount'].indexOf(this.metric) >= 0 ? 0 : 1
    },
    maxRankValue () {
      return this.rankRows.reduce((m, p) => Math.max(m, p.value), 1)
    },
    rankedProvinces () {
      const list = this.rankRows.map(r => Object.assign({}, r, {
        display: Number(r.value).toFixed(this.rankDecimals)
      })).sort((a, b) => this.rankOrder === 'desc' ? b.value - a.value : a.value - b.value)
      return list.slice(0, 12)
    },

    onlinePercent () {
      const n = this.nation
      return n.deviceCount ? Math.round((n.onlineCount / n.deviceCount) * 1000) / 10 : 0
    },
    focusProvinces () {
      return this.provinces.slice().sort((a, b) => b.warningCount - a.warningCount).slice(0, 6)
    }
  },
  mounted () {
    this.reload()
    this.tickClock()
    this.timer = window.setInterval(this.tickClock, 1000)
  },
  beforeDestroy () {
    if (this.timer) {
      window.clearInterval(this.timer)
    }
  },
  methods: {
    reload () {
      this.loading = true
      try {
        this.provinces = mockProvinceStats()
        this.warnings = mockWarnings({ regionKey: '全国' })
        this.trend = {
          cloud: mockDeviceSeries('NATIONAL', 'cloud', 24),
          rain: mockDeviceSeries('NATIONAL', 'rain', 24),
          co2: mockDeviceSeries('NATIONAL', 'co2', 24)
        }
      } finally {
        this.loading = false
      }
    },

    tickClock () {
      const d = new Date()
      const pad = n => String(n).padStart(2, '0')
      const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
      this.clock = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} 星期${week} ` +
        `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    },

    barWidth (item) {
      return Math.max(2, Math.round((item.value / this.maxRankValue) * 100))
    },

    levelLabel (level) {
      const item = WARNING_LEVELS.filter(l => l.code === level)[0]
      return item ? item.label : level
    },

    levelColor (level) {
      const item = WARNING_LEVELS.filter(l => l.code === level)[0]
      return item ? item.color : '#1976d2'
    },

    onLayerChange (key) {
      this.weatherLayer = key
    },

    onFrameChange (e) {
      this.frameIndex = e.frame
      this.frameLabel = e.label
    },

    onDrill (e) {
      this.drillPath = e.level === 'nation'
        ? ''
        : (e.level === 'province' ? `当前下钻：${e.name}（省级 · 地市界）` : `当前下钻：${e.name}（市级 · 区县界，第三级）`)
    },

    onSelectProvince (province) {
      this.$emit('select-province', province)
    }
  }
}
</script>

<style lang="scss" scoped>
$line: rgba(79, 195, 247, 0.22);
$text: #cfe8ff;
$text-dim: #8fb8d8;

.dashboard {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 900px;
  padding: 10px 12px 6px;
  box-sizing: border-box;
  background:
    radial-gradient(1200px 600px at 50% -10%, rgba(21, 101, 192, 0.35), transparent 70%),
    linear-gradient(180deg, #041224 0%, #061a32 55%, #04101f 100%);
  color: $text;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 6px 10px;
    border-bottom: 1px solid $line;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 10px;

    i {
      font-size: 22px;
      color: #4fc3f7;
    }

    h1 {
      margin: 0;
      font-size: 20px;
      letter-spacing: 2px;
      font-weight: 700;
      background: linear-gradient(90deg, #4fc3f7, #81d4fa, #4fc3f7);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      white-space: nowrap;
    }
  }

  &__header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__clock {
    font-family: Consolas, Monaco, monospace;
    color: #81d4fa;
    font-size: 14px;
    white-space: nowrap;
  }

  &__body {
    display: flex;
    flex: 1;
    gap: 10px;
    padding-top: 10px;
    min-height: 0;
  }

  &__side {
    width: 320px;
    flex: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow: auto;
  }

  &__center {
    position: relative;
    flex: 1;
    min-width: 0;
    min-height: 440px;
    border: 1px solid $line;
    border-radius: 6px;
    background: radial-gradient(800px 420px at 50% 45%, rgba(13, 71, 161, 0.28), transparent 72%);
    overflow: hidden;
  }

  &__center-hint {
    position: absolute;
    right: 14px;
    bottom: 14px;
    z-index: 5;
    max-width: 62%;
    padding: 4px 10px;
    border-radius: 12px;
    background: rgba(6, 26, 50, 0.78);
    border: 1px solid $line;
    color: $text-dim;
    font-size: 11px;
    line-height: 16px;

    b { color: #ffd54f; font-weight: 600; }
  }

  &__footer {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 6px;
    padding: 5px 10px;
    border-top: 1px solid $line;
    font-size: 12px;
    overflow: hidden;
  }

  &__footer-label {
    flex: none;
    color: #ff8a65;
    letter-spacing: 1px;
  }

  &__ticker {
    display: flex;
    gap: 26px;
    white-space: nowrap;
    animation: ticker-scroll 42s linear infinite;
    color: $text-dim;
  }

  &__ticker-item {
    flex: none;
  }
}

@keyframes ticker-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

/* ── 视图切换 ── */
.view-switch {
  display: flex;
  border: 1px solid rgba(79, 195, 247, 0.32);
  border-radius: 4px;
  overflow: hidden;

  &__item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 12px;
    border: none;
    background: rgba(4, 18, 36, 0.7);
    color: #9fc4de;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.18s;

    & + & { border-left: 1px solid rgba(79, 195, 247, 0.24); }

    &:hover { color: #d7efff; background: rgba(21, 101, 192, 0.35); }

    &.is-active {
      background: linear-gradient(90deg, rgba(21, 101, 192, 0.95), rgba(21, 101, 192, 0.55));
      color: #fff;
      box-shadow: inset 0 -2px 0 #4fc3f7;
    }
  }
}

.panel {
  border: 1px solid $line;
  border-radius: 6px;
  background: rgba(6, 26, 50, 0.55);
  padding: 10px;

  &--grow {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    padding-left: 8px;
    border-left: 3px solid #4fc3f7;
    font-size: 14px;
    font-weight: 600;
    color: #81d4fa;
  }

  &__title-extra {
    margin-left: auto;
  }

  &__title-time {
    font-family: Consolas, Monaco, monospace;
    font-size: 12px;
    font-weight: 400;
    color: #4fc3f7;
  }

  &__badge {
    margin-left: auto;
    min-width: 20px;
    height: 18px;
    line-height: 18px;
    padding: 0 6px;
    border-radius: 9px;
    background: rgba(255, 112, 67, 0.9);
    color: #fff;
    font-size: 11px;
    text-align: center;
  }
}

/* ── 图层说明卡 ── */
.layer-info {
  &__head {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: #e6f5ff;

    i { color: #4fc3f7; }

    em {
      margin-left: auto;
      font-style: normal;
      font-size: 11px;
      color: $text-dim;
    }
  }

  &__bar {
    display: flex;
    height: 10px;
    margin: 7px 0 3px;
    border-radius: 2px;
    overflow: hidden;
  }

  &__range {
    display: flex;
    justify-content: space-between;
    color: #6d90ad;
    font-size: 10px;
  }

  &__desc {
    margin-top: 7px;
    color: $text-dim;
    font-size: 11px;
    line-height: 17px;
  }

  &__hook {
    margin-top: 7px;
    padding: 5px 7px;
    border-radius: 3px;
    background: rgba(255, 152, 0, 0.12);
    border-left: 3px solid #ffb74d;
    color: #ffcc80;
    font-size: 11px;
    line-height: 16px;

    i { margin-right: 4px; }
  }

  &__tip {
    margin-top: 8px;
    color: #5b7c99;
    font-size: 10px;
    line-height: 15px;
  }
}

.metric-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;

  &__item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    border: 1px solid $line;
    border-radius: 4px;
    background: rgba(4, 18, 36, 0.6);
    color: $text;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.18s;

    em {
      margin-left: auto;
      font-style: normal;
      color: #6d90ad;
      font-size: 10px;
    }

    &:hover { border-color: #4fc3f7; }

    &.is-active {
      border-color: #4fc3f7;
      background: rgba(21, 101, 192, 0.45);
      box-shadow: 0 0 10px rgba(79, 195, 247, 0.35);
    }
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex: none;
  }

  &__desc {
    margin-top: 8px;
    color: $text-dim;
    font-size: 11px;
    line-height: 17px;
  }
}

.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;

  &__item {
    text-align: center;
    padding: 6px 2px;
    border-radius: 4px;
    background: rgba(4, 18, 36, 0.55);
  }

  &__value {
    font-size: 17px;
    font-weight: 700;
    font-family: Consolas, Monaco, monospace;
  }

  &__label {
    margin-top: 2px;
    color: $text-dim;
    font-size: 11px;
  }
}

.rank {
  &__row {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 24px;
    border-radius: 3px;
    padding: 0 4px;

    &:hover { background: rgba(79, 195, 247, 0.12); }
    &.is-top3 .rank__name { color: #ffd54f; }
  }

  &__no {
    width: 16px;
    text-align: center;
    color: #6d90ad;
    font-size: 11px;

    &--1, &--2, &--3 { color: #ffd54f; font-weight: 700; }
  }

  &__name {
    width: 54px;
    font-size: 12px;
    color: $text;
  }

  &__bar {
    flex: 1;
    height: 7px;
    border-radius: 4px;
    background: rgba(79, 195, 247, 0.12);
    overflow: hidden;

    i {
      display: block;
      height: 100%;
      border-radius: 4px;
      transition: width 0.4s;
    }
  }

  &__value {
    width: 74px;
    text-align: right;
    font-size: 12px;
    color: #81d4fa;
    font-family: Consolas, Monaco, monospace;
  }

  &__note {
    margin-top: 7px;
    color: #5b7c99;
    font-size: 10px;
    line-height: 14px;
  }
}

.warn-list {
  &__row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 0;
    border-bottom: 1px dashed rgba(79, 195, 247, 0.14);

    &:last-child { border-bottom: none; }
  }

  &__level {
    flex: none;
    width: 34px;
    text-align: center;
    border-radius: 3px;
    color: #fff;
    font-size: 10px;
    line-height: 16px;
  }

  &__main { flex: 1; min-width: 0; }

  &__title { font-size: 12px; color: $text; }

  &__meta {
    font-size: 10px;
    color: #6d90ad;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__time {
    flex: none;
    color: #6d90ad;
    font-size: 11px;
  }
}

.device-bar {
  display: flex;
  height: 14px;
  border-radius: 7px;
  overflow: hidden;
  background: rgba(4, 18, 36, 0.7);

  &__seg--online { background: linear-gradient(90deg, #26a69a, #4dd0e1); }
  &__seg--offline { background: linear-gradient(90deg, #546e7a, #37474f); }

  &__legend {
    display: flex;
    gap: 14px;
    margin-top: 6px;
    font-size: 11px;
    color: $text-dim;

    .dot {
      display: inline-block;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      margin-right: 4px;

      &--online { background: #4dd0e1; }
      &--offline { background: #546e7a; }
    }
  }

  &__percent {
    margin-left: auto;
    color: #4dd0e1;
    font-weight: 700;
  }

  &__stats {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    text-align: center;

    div { flex: 1; }

    b {
      display: block;
      color: #81d4fa;
      font-size: 15px;
      font-family: Consolas, Monaco, monospace;
    }

    span { color: $text-dim; font-size: 11px; }
  }
}
</style>
