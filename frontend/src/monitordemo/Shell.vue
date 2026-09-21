<template>
  <div class="monitor-shell">
    <!-- ══════════ 左侧菜单 ══════════ -->
    <aside class="monitor-shell__side">
      <div class="monitor-shell__logo">
        <i class="el-icon-s-data"></i>
        <div>
          <strong>星穹耕界</strong>
          <span>农业智能监测平台</span>
        </div>
      </div>

      <nav class="monitor-shell__nav">
        <button
          v-for="item in menus"
          :key="item.key"
          class="monitor-shell__nav-item"
          :class="{ 'is-active': page === item.key }"
          :title="item.desc"
          @click="page = item.key">
          <i :class="item.icon"></i>
          <span class="monitor-shell__nav-text">
            <b>{{ item.label }}</b>
            <em>{{ item.desc }}</em>
          </span>
          <span v-if="item.badge" class="monitor-shell__nav-badge">{{ item.badge }}</span>
        </button>
      </nav>

      <div class="monitor-shell__side-foot">
        <el-tag size="mini" type="warning" effect="plain">演示数据</el-tag>
        <p>全部数据为前端 mock，<b>不连数据库、不写任何数据</b></p>
        <el-button size="mini" plain icon="el-icon-map-location" @click="openGis">
          打开农田 GIS 采样演示
        </el-button>
      </div>
    </aside>

    <!-- ══════════ 右侧内容 ══════════ -->
    <main class="monitor-shell__main" :class="{ 'is-dark': page === 'dashboard' }">
      <AgriDashboard
        v-if="page === 'dashboard'"
        :initial-province="drillProvince"
        :initial-layer="initialLayer"
        @select-province="onSelectProvince" />

      <RegionMonitor
        v-else-if="page === 'region'"
        :initial-province="drillProvince" />

      <DatabaseManage v-else-if="page === 'database'" />

      <RemoteSensing v-else-if="page === 'remote'" />
    </main>
  </div>
</template>

<script>
/**
 * 农业智能监测平台 —— 独立演示外壳（本地演示入口）
 *
 * 用途：无需登录、无需后端菜单即可查看 4 个新页面（首页大屏 / 地区监控 / 数据库管理 / 遥感分析）。
 *       与 GIS 演示入口同样只在**非生产构建**产出，避免正式环境出现绕过登录的入口。
 *
 * 交互串联：首页大屏点击某个省份 → 自动跳转到「地区监控」并把该省带过去（多地区监控下钻）。
 */
import AgriDashboard from '@/views/modules/agrimonitor/Dashboard'
import RegionMonitor from '@/views/modules/agrimonitor/RegionMonitor'
import DatabaseManage from '@/views/modules/agrimonitor/DatabaseManage'
import RemoteSensing from '@/views/modules/agrimonitor/RemoteSensing'

export default {
  name: 'MonitorShell',
  components: { AgriDashboard, RegionMonitor, DatabaseManage, RemoteSensing },
  data () {
    return {
      page: 'dashboard',
      drillProvince: '',
      initialLayer: '',
      menus: [
        {
          key: 'dashboard',
          label: '首页监控大屏',
          icon: 'el-icon-s-data',
          desc: '天气图层 / 3D 地形双视图 · 三级下钻 · 任务书指标区'
        },
        {
          key: 'region',
          label: '地区监控',
          icon: 'el-icon-location-outline',
          desc: '省市区三级选择 · 数据报表 / 路线规划 / 设备监控 / 预警'
        },
        {
          key: 'database',
          label: '数据库管理',
          icon: 'el-icon-coin',
          desc: '备份设置与记录、运维配置（纯界面，不动数据库）'
        },
        {
          key: 'remote',
          label: '遥感分析',
          icon: 'el-icon-guide',
          desc: '北斗/GNSS 卫星星历、可见性与过境预报'
        }
      ]
    }
  },
  created () {
    // 支持深链：
    //   monitor.html?page=dashboard&province=山西&layer=aqi   → 大屏直接下钻到山西并显示空气质量
    //   monitor.html?page=region&province=山西                 → 地区监控直接选中山西
    //   monitor.html?page=database / remote
    // 便于演示时"一步到位"，也方便自动化验证，不用手工点菜单。
    const query = this.parseQuery()
    const valid = this.menus.map(m => m.key)
    if (query.page && valid.indexOf(query.page) !== -1) {
      this.page = query.page
    }
    if (query.province) {
      this.drillProvince = query.province
    }
    if (query.layer) {
      this.initialLayer = query.layer
    }
  },
  methods: {
    parseQuery () {
      const out = {}
      const search = (window.location.search || '').replace(/^\?/, '')
      if (!search) {
        return out
      }
      search.split('&').forEach(pair => {
        const [k, v] = pair.split('=')
        if (k) {
          try {
            out[decodeURIComponent(k)] = decodeURIComponent(v || '')
          } catch (e) {
            out[k] = v || ''
          }
        }
      })
      return out
    },

    onSelectProvince (province) {
      if (!province) {
        return
      }
      this.drillProvince = province.name
      this.page = 'region'
      this.$message.success(`已下钻到 ${province.name} 的地区监控`)
    },

    openGis () {
      window.open('./gis.html', '_blank')
    }
  }
}
</script>

<style lang="scss" scoped>
.monitor-shell {
  display: flex;
  height: 100%;
  background: #eef2f6;

  &__side {
    width: 246px;
    flex: none;
    display: flex;
    flex-direction: column;
    background: linear-gradient(180deg, #0a2540 0%, #061a32 100%);
    color: #cfe8ff;
  }

  &__logo {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 14px;
    border-bottom: 1px solid rgba(79, 195, 247, 0.2);

    i {
      font-size: 26px;
      color: #4fc3f7;
    }

    strong {
      display: block;
      font-size: 15px;
      letter-spacing: 1px;
    }

    span {
      font-size: 11px;
      color: #6d90ad;
    }
  }

  &__nav {
    flex: 1;
    padding: 12px 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__nav-item {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    width: 100%;
    padding: 9px 10px;
    border: 1px solid transparent;
    border-radius: 6px;
    background: transparent;
    color: #9fc4de;
    font-size: 13px;
    text-align: left;
    cursor: pointer;
    transition: all 0.18s;

    i {
      font-size: 16px;
      margin-top: 1px;
    }

    &:hover {
      background: rgba(79, 195, 247, 0.12);
      color: #d7efff;
    }

    &.is-active {
      background: linear-gradient(90deg, rgba(21, 101, 192, 0.85), rgba(21, 101, 192, 0.35));
      border-color: rgba(79, 195, 247, 0.6);
      color: #fff;
      box-shadow: 0 2px 10px rgba(21, 101, 192, 0.35);
    }
  }

  &__nav-text {
    flex: 1;
    min-width: 0;

    b {
      display: block;
      font-weight: 600;
      font-size: 13px;
    }

    em {
      display: block;
      margin-top: 2px;
      font-style: normal;
      font-size: 10px;
      line-height: 13px;
      color: #6d90ad;
    }

    .is-active & em { color: #a8cbe4; }
  }

  &__nav-badge {
    flex: none;
    font-size: 10px;
    padding: 0 5px;
    border-radius: 8px;
    background: rgba(255, 112, 67, 0.85);
    color: #fff;
  }

  &__side-foot {
    padding: 12px 14px;
    border-top: 1px solid rgba(79, 195, 247, 0.2);
    font-size: 11px;
    line-height: 17px;

    p {
      margin: 6px 0 8px;
      color: #6d90ad;
    }

    b {
      color: #ffb74d;
    }
  }

  &__main {
    flex: 1;
    min-width: 0;
    overflow: auto;

    &.is-dark {
      background: #041224;
      overflow: hidden;
    }
  }
}
</style>
