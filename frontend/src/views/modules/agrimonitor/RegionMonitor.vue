<template>
  <div class="region-monitor">
    <!-- ══════════ 地区选择 ══════════ -->
    <div class="region-monitor__selector">
      <span class="region-monitor__selector-label"><i class="el-icon-location-outline"></i> 选择监控地区</span>
      <el-select v-model="province" size="small" placeholder="省 / 直辖市" class="region-monitor__sel" @change="onProvinceChange">
        <el-option v-for="p in tree" :key="p.name" :label="p.name" :value="p.name" />
      </el-select>
      <el-select v-model="city" size="small" placeholder="地市" class="region-monitor__sel" clearable @change="onCityChange">
        <el-option v-for="c in cities" :key="c.name" :label="c.name" :value="c.name" />
      </el-select>
      <el-select v-model="district" size="small" placeholder="区县" class="region-monitor__sel" clearable @change="onDistrictChange">
        <el-option v-for="d in districts" :key="d.name" :label="d.name" :value="d.name" />
      </el-select>
      <el-button size="small" type="primary" icon="el-icon-search" @click="locate">定位该地区</el-button>
      <el-tag v-if="usingGeneratedDistrict" size="mini" type="warning" effect="plain">
        该区县为演示名（非真实行政区划）
      </el-tag>
    </div>

    <!-- ══════════ 地点详细介绍 ══════════ -->
    <el-card v-if="detail" shadow="never" class="region-monitor__detail">
      <div class="region-monitor__detail-head">
        <div class="region-monitor__detail-title">
          <h2>{{ detail.title }}</h2>
          <el-tag size="mini" type="info">{{ detail.level }}</el-tag>
          <el-tag size="mini" :type="riskTagType">{{ riskLabel }}</el-tag>
        </div>
        <div class="region-monitor__detail-coord">
          中心坐标 {{ detail.center[0] }}, {{ detail.center[1] }}（GCJ02）
        </div>
      </div>

      <p class="region-monitor__intro">{{ detail.intro }}</p>

      <div class="region-monitor__detail-grid">
        <div v-for="item in detailItems" :key="item.label" class="detail-item">
          <div class="detail-item__label">{{ item.label }}</div>
          <div class="detail-item__value">{{ item.value }}</div>
        </div>
      </div>
    </el-card>

    <!-- ══════════ 四个功能模块 ══════════ -->
    <el-tabs v-model="activeTab" type="border-card" class="region-monitor__tabs">
      <el-tab-pane name="report">
        <span slot="label"><i class="el-icon-data-line"></i> 数据报表</span>
        <DataReportPanel :region-key="regionKey" :device-code="primaryDeviceCode" />
      </el-tab-pane>

      <el-tab-pane name="route">
        <span slot="label"><i class="el-icon-guide"></i> 路线规划</span>
        <RoutePlanningPanel :region-key="regionKey" />
      </el-tab-pane>

      <el-tab-pane name="device">
        <span slot="label"><i class="el-icon-cpu"></i> 监控（传感器）</span>
        <DeviceOverviewPanel :region-key="regionKey" />
      </el-tab-pane>

      <el-tab-pane name="warning">
        <span slot="label">
          <i class="el-icon-warning-outline"></i> 预警中心
          <el-badge v-if="openWarningCount" :value="openWarningCount" class="region-monitor__badge" />
        </span>
        <WarningCenterPanel :region-key="regionKey" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
/**
 * 页面 2 —— 地区监控页
 *
 * 需求对应：
 *   「选择省市区详细地点下方出现该地点的详细介绍」→ 三级联动 + RegionDetail 卡片
 *   「(1) 数据报表：历史数据 + 实时图表、生成报表、自动预警」→ DataReportPanel
 *   「(2) 路线规划，留下算法模块」→ RoutePlanningPanel（契约已备好，等 5号 冻结 REST）
 *   「(3) 监控：传感器设备总览、实时监控 + yolo」→ DeviceOverviewPanel（含接入契约说明）
 *   「(4) 可以自动预警，也可以手动添加预警」→ WarningCenterPanel
 *
 * ⚠️ 全部数据来自 @/mock/agrimonitor，**不连数据库、不写任何数据**。
 */
import DataReportPanel from './components/DataReportPanel'
import RoutePlanningPanel from './components/RoutePlanningPanel'
import DeviceOverviewPanel from './components/DeviceOverviewPanel'
import WarningCenterPanel from './components/WarningCenterPanel'
import { mockRegionTree, mockRegionDetail, mockWarnings, mockDevices } from '@/mock/agrimonitor'

export default {
  name: 'RegionMonitor',
  components: { DataReportPanel, RoutePlanningPanel, DeviceOverviewPanel, WarningCenterPanel },
  props: {
    /** 由首页大屏下钻时传入的省名 */
    initialProvince: { type: String, default: '' }
  },
  data () {
    return {
      tree: [],
      province: '',
      city: '',
      district: '',
      detail: null,
      activeTab: 'report',
      openWarningCount: 0,
      primaryDeviceCode: 'SOIL-001'
    }
  },
  computed: {
    cities () {
      const p = this.tree.filter(x => x.name === this.province)[0]
      return p ? p.cities : []
    },
    districts () {
      const c = this.cities.filter(x => x.name === this.city)[0]
      return c ? c.districts : []
    },
    usingGeneratedDistrict () {
      const c = this.cities.filter(x => x.name === this.city)[0]
      if (!c || !this.district) {
        return false
      }
      const d = c.districts.filter(x => x.name === this.district)[0]
      return !!(d && d.demoGenerated)
    },
    regionKey () {
      return [this.province, this.city, this.district].filter(Boolean).join('/')
    },
    riskLabel () {
      if (!this.detail) {
        return ''
      }
      return { high: '高风险', medium: '中风险', low: '低风险' }[this.detail.riskLevel] || '—'
    },
    riskTagType () {
      if (!this.detail) {
        return 'info'
      }
      return { high: 'danger', medium: 'warning', low: 'success' }[this.detail.riskLevel] || 'info'
    },
    detailItems () {
      const d = this.detail
      if (!d) {
        return []
      }
      return [
        { label: '气候类型', value: d.climate },
        { label: '年降水量', value: `${d.annualRain} mm` },
        { label: '年均气温', value: `${d.annualTemp} °C` },
        { label: '无霜期', value: `${d.frostFreeDays} 天` },
        { label: '海拔', value: `${d.elevation} m` },
        { label: '耕地面积', value: `${d.farmlandArea.toLocaleString()} 公顷` },
        { label: '主要作物', value: d.mainCrops.join('、') },
        { label: '土壤类型', value: d.soilType },
        { label: '灌溉覆盖率', value: `${d.irrigationRate}%` },
        { label: '采样终端', value: `${d.deviceCount} 台` },
        { label: '终端在线率', value: `${d.onlineRate}%` },
        { label: '采样点数量', value: `${d.samplePointCount} 个` },
        { label: '最近采样', value: d.lastSampleTime },
        { label: '未关闭预警', value: `${d.warningCount} 条` }
      ]
    }
  },
  watch: {
    initialProvince (v) {
      if (v && this.tree.some(p => p.name === v)) {
        this.province = v
        this.onProvinceChange()
      }
    }
  },
  created () {
    this.tree = mockRegionTree()
    const provinces = this.tree.map(p => p.name)
    const initial = (this.initialProvince && provinces.indexOf(this.initialProvince) !== -1)
      ? this.initialProvince
      : '山西'
    this.province = initial
    const p = this.tree.filter(x => x.name === initial)[0]
    this.city = p && p.cities.length ? p.cities[0].name : ''
    const c = this.cities.filter(x => x.name === this.city)[0]
    this.district = c && c.districts.length ? c.districts[0].name : ''
    this.refreshDetail()
  },
  methods: {
    onProvinceChange () {
      this.city = this.cities.length ? this.cities[0].name : ''
      this.onCityChange()
    },

    onCityChange () {
      this.district = this.districts.length ? this.districts[0].name : ''
      this.refreshDetail()
    },

    onDistrictChange () {
      this.refreshDetail()
    },

    locate () {
      this.refreshDetail()
      this.$message.success(`已定位到 ${this.regionKey}`)
    },

    refreshDetail () {
      this.detail = mockRegionDetail({
        province: this.province,
        city: this.city,
        district: this.district
      })
      // 预警角标 + 主设备编号（供数据报表面板默认曲线使用）
      const warnings = mockWarnings({ regionKey: this.regionKey })
      this.openWarningCount = warnings.filter(w => w.status === 'open').length
      const devices = mockDevices(this.regionKey)
      const soil = devices.filter(d => d.type === 'soil')[0]
      this.primaryDeviceCode = soil ? soil.deviceCode : (devices[0] ? devices[0].deviceCode : 'SOIL-001')
      this.$emit('region-change', this.regionKey)
    }
  }
}
</script>

<style lang="scss" scoped>
.region-monitor {
  padding: 10px 12px;
  background: #f2f5f7;
  min-height: 100%;

  &__selector {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  }

  &__selector-label {
    font-size: 14px;
    font-weight: 600;
    color: #0d47a1;

    i {
      margin-right: 4px;
      color: #1976d2;
    }
  }

  &__sel {
    width: 170px;
  }

  &__detail {
    margin-top: 10px;
    border: none !important;
  }

  &__detail-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__detail-title {
    display: flex;
    align-items: center;
    gap: 8px;

    h2 {
      margin: 0;
      font-size: 20px;
      color: #0d47a1;
    }
  }

  &__detail-coord {
    color: #90a4ae;
    font-size: 12px;
    font-family: Consolas, Monaco, monospace;
  }

  &__intro {
    margin: 10px 0 12px;
    padding: 10px 12px;
    border-left: 3px solid #64b5f6;
    background: #f5faff;
    border-radius: 0 4px 4px 0;
    color: #455a64;
    font-size: 13px;
    line-height: 21px;
  }

  &__detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 8px;
  }

  &__tabs {
    margin-top: 10px;
    border: none !important;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  }

  &__badge {
    margin-left: 6px;

    ::v-deep .el-badge__content {
      transform: translateY(-1px);
    }
  }
}

.detail-item {
  padding: 7px 10px;
  border: 1px solid #eceff1;
  border-radius: 4px;
  background: #fafcff;

  &__label {
    color: #90a4ae;
    font-size: 12px;
  }

  &__value {
    margin-top: 2px;
    color: #263238;
    font-size: 13px;
    font-weight: 600;
    word-break: break-all;
  }
}
</style>
