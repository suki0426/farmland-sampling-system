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

      <!-- ══════════ 演示用角色模拟（正式环境由后端 sys_menu + 角色决定） ══════════ -->
      <div class="monitor-shell__role">
        <div class="monitor-shell__role-head">
          <i class="el-icon-user"></i>
          <span>角色模拟</span>
          <em>演示用</em>
        </div>
        <el-radio-group v-model="roleKey" size="mini" class="monitor-shell__role-group">
          <el-radio-button
            v-for="r in roles"
            :key="r.key"
            :label="r.key">{{ r.label }}</el-radio-button>
        </el-radio-group>
        <p class="monitor-shell__role-tip">
          当前 <b>{{ role.label }}</b>：{{ role.desc }}
        </p>
        <p class="monitor-shell__role-tip monitor-shell__role-tip--dim">
          正式环境里菜单由管理员在「角色管理」里分配，前端不判断角色。
        </p>
      </div>

      <nav class="monitor-shell__nav">
        <button
          v-for="item in visibleMenus"
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

        <p v-if="hiddenMenus.length" class="monitor-shell__nav-locked">
          <i class="el-icon-lock"></i>
          该角色无权限的功能已隐藏：{{ hiddenMenus.map(m => m.label).join('、') }}
        </p>
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
 *
 * ── 角色赋权（本次新增）────────────────────────────────────────────
 *   正式环境：菜单由后端 `sys_menu` 下发，谁能看到什么由 `sys_role_menu` 决定；
 *             直接敲 URL 时由路由级守卫 `requirePermission()` 读 `localStorage.permissions` 拦截。
 *   演示环境：本入口免登录、没有后端菜单，所以提供**角色模拟**：
 *             切换角色 → 菜单按权限码过滤 → 能当场演示"管理员看到 4 个、采集员只看到 1 个"。
 *             角色→权限码的映射在 `./roles.js`，与后端配置一一对应。
 *
 *   ⚠️ 演示外壳的过滤**不是鉴权实现**，正式页面的权限判断永远走 permissions.js。
 */
import AgriDashboard from '@/views/modules/agrimonitor/Dashboard'
import RegionMonitor from '@/views/modules/agrimonitor/RegionMonitor'
import DatabaseManage from '@/views/modules/agrimonitor/DatabaseManage'
import RemoteSensing from '@/views/modules/agrimonitor/RemoteSensing'
import {
  PERM_DASHBOARD,
  PERM_REGION_MONITOR,
  PERM_DATABASE_MANAGE,
  PERM_REMOTE_SENSING
} from '@/views/modules/agrimonitor/permissions'
import { DEMO_ROLES, DEFAULT_ROLE, roleByKey, roleHasPermission } from './roles'

export default {
  name: 'MonitorShell',
  components: { AgriDashboard, RegionMonitor, DatabaseManage, RemoteSensing },
  data () {
    return {
      page: 'dashboard',
      drillProvince: '',
      initialLayer: '',
      roles: DEMO_ROLES,
      roleKey: DEFAULT_ROLE,
      // permission 字段 = 该功能对应的权限码，与 sys_menu.permission 一致
      menus: [
        {
          key: 'dashboard',
          label: '首页监控大屏',
          icon: 'el-icon-s-data',
          desc: '天气图层 / 3D 地形双视图 · 三级下钻 · 任务书指标区',
          permission: PERM_DASHBOARD
        },
        {
          key: 'region',
          label: '地区监控',
          icon: 'el-icon-location-outline',
          desc: '省市区三级选择 · 数据报表 / 路线规划 / 设备监控 / 预警',
          permission: PERM_REGION_MONITOR
        },
        {
          key: 'database',
          label: '数据库管理',
          icon: 'el-icon-coin',
          desc: '备份设置与记录、运维配置（纯界面，不动数据库）',
          permission: PERM_DATABASE_MANAGE
        },
        {
          key: 'remote',
          label: '遥感分析',
          icon: 'el-icon-guide',
          desc: '北斗/GNSS 卫星星历、可见性与过境预报',
          permission: PERM_REMOTE_SENSING
        }
      ]
    }
  },
  computed: {
    role () {
      return roleByKey(this.roleKey)
    },
    /** 当前角色能看到的功能 */
    visibleMenus () {
      return this.menus.filter(m => roleHasPermission(this.role, m.permission))
    },
    /** 当前角色看不到的功能（演示时用来提示"被隐藏了什么"） */
    hiddenMenus () {
      return this.menus.filter(m => !roleHasPermission(this.role, m.permission))
    }
  },
  watch: {
    roleKey () {
      // 切换角色后如果当前页面已经无权访问，自动跳到该角色还能看到的第一个页面
      const allowed = this.visibleMenus.map(m => m.key)
      if (allowed.indexOf(this.page) === -1) {
        this.page = allowed.length ? allowed[0] : 'dashboard'
      }
      this.$emit('role-change', this.roleKey)
    }
  },
  created () {
    // 支持深链：
    //   monitor.html?page=dashboard&province=山西&layer=aqi   → 大屏直接下钻到山西并显示空气质量
    //   monitor.html?page=region&province=山西                 → 地区监控直接选中山西
    //   monitor.html?page=database / remote
    //   monitor.html?role=collector                            → 以「采集员」角色打开（角色赋权演示）
    // 便于演示时"一步到位"，也方便自动化验证，不用手工点菜单。
    const query = this.parseQuery()
    if (query.role && DEMO_ROLES.some(r => r.key === query.role)) {
      this.roleKey = query.role
    }
    const valid = this.visibleMenus.map(m => m.key)
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
    overflow: auto;
  }

  /* ── 演示用角色模拟 ── */
  &__role {
    padding: 10px 12px 12px;
    border-bottom: 1px solid rgba(79, 195, 247, 0.2);
    background: rgba(4, 18, 36, 0.45);
  }

  &__role-head {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    font-size: 12px;
    color: #81d4fa;
    font-weight: 600;

    i { font-size: 13px; }

    em {
      margin-left: auto;
      font-style: normal;
      font-size: 10px;
      font-weight: 400;
      padding: 1px 6px;
      border-radius: 8px;
      background: rgba(255, 183, 77, 0.18);
      border: 1px solid rgba(255, 183, 77, 0.5);
      color: #ffcc80;
    }
  }

  &__role-group {
    display: flex;
    width: 100%;

    ::v-deep .el-radio-button {
      flex: 1;
    }

    ::v-deep .el-radio-button__inner {
      width: 100%;
      padding: 6px 0;
      font-size: 12px;
      background: rgba(6, 26, 50, 0.7);
      border-color: rgba(79, 195, 247, 0.3);
      color: #9fc4de;
      box-shadow: none;
    }

    ::v-deep .el-radio-button__orig-radio:checked + .el-radio-button__inner {
      background: linear-gradient(90deg, rgba(21, 101, 192, 0.95), rgba(21, 101, 192, 0.55));
      border-color: #4fc3f7;
      color: #fff;
      box-shadow: none;
    }
  }

  &__role-tip {
    margin: 8px 0 0;
    font-size: 11px;
    line-height: 16px;
    color: #9fc4de;

    b { color: #4fc3f7; }

    &--dim {
      color: #5b7c99;
      font-size: 10px;
      line-height: 14px;
    }
  }

  &__nav-locked {
    display: flex;
    align-items: flex-start;
    gap: 5px;
    margin: 10px 2px 0;
    padding: 7px 9px;
    border-radius: 4px;
    background: rgba(255, 152, 0, 0.10);
    border-left: 3px solid #ffb74d;
    color: #ffcc80;
    font-size: 10px;
    line-height: 15px;

    i { margin-top: 2px; flex: none; }
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
