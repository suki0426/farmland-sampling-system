/**
 * 演示用角色定义（**只在 monitordemo 演示入口里使用**）
 *
 * 为什么需要它：
 *   正式环境里"谁能看到哪个菜单"完全由后端 `sys_menu` + `sys_role_menu` 决定，
 *   前端不判断角色。但演示入口 `monitor.html` 是**免登录**的（本地演示用，生产构建不产出），
 *   没有后端菜单可下发，所以这里放一份**与后端配置一一对应的角色 → 权限码映射**，
 *   让演示时能当场切换角色、直观看到「管理员看到 4 个功能、采集员只看到 1 个」。
 *
 * ⚠️ 这不是鉴权实现，**不得用于正式页面的权限判断**：
 *    - 正式页面的路由守卫读的是 `localStorage.permissions`（登录时由后端写入），
 *      见 `@/views/modules/agrimonitor/permissions.js` 的 `requirePermission()`；
 *    - 本文件只影响演示外壳的**菜单显示**，而且演示外壳本身就没有鉴权。
 *
 * 真实的角色配置请按 `frontend/docs/ROLE_PERMISSION.md` 里的 SQL 在后端配置。
 */
import {
  PERM_DASHBOARD,
  PERM_REGION_MONITOR,
  PERM_DATABASE_MANAGE,
  PERM_REMOTE_SENSING
} from '@/views/modules/agrimonitor/permissions'

/** 角色 → 权限码。key 与 URL 参数 `?role=` 对应 */
export const DEMO_ROLES = [
  {
    key: 'admin',
    label: '管理员',
    desc: '全部功能：大屏 / 地区监控 / 数据库管理 / 遥感分析',
    permissions: [
      PERM_DASHBOARD,
      PERM_REGION_MONITOR,
      PERM_DATABASE_MANAGE,
      PERM_REMOTE_SENSING
    ]
  },
  {
    key: 'collector',
    label: '采集员',
    desc: '只给最必要的：监控大屏（含任务书指标区与算法实验）',
    permissions: [
      PERM_DASHBOARD
    ]
  },
  {
    key: 'analyst',
    label: '分析员',
    desc: '大屏 + 地区监控 + 遥感分析，不含数据库管理',
    permissions: [
      PERM_DASHBOARD,
      PERM_REGION_MONITOR,
      PERM_REMOTE_SENSING
    ]
  }
]

/** 默认角色（演示打开时不带参数就是它） */
export const DEFAULT_ROLE = 'admin'

/** 按 key 取角色，取不到就退回默认角色 */
export function roleByKey (key) {
  return DEMO_ROLES.filter(r => r.key === key)[0] ||
    DEMO_ROLES.filter(r => r.key === DEFAULT_ROLE)[0] ||
    DEMO_ROLES[0]
}

/**
 * 当前角色是否具备某个权限码。
 * @param {{permissions: string[]}} role
 * @param {string} permission
 */
export function roleHasPermission (role, permission) {
  if (!role || !permission) {
    return false
  }
  return role.permissions.indexOf(permission) !== -1
}

export default { DEMO_ROLES, DEFAULT_ROLE, roleByKey, roleHasPermission }
