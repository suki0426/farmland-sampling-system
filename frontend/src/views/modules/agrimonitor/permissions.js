/**
 * 农业智能监测平台 —— 权限码常量
 *
 * 命名遵循 `TEAM_DEVELOPMENT_STANDARD.md` §6：
 *     `<module>:<CamelResource>:<action>`
 * 本模块只提供**权限字符串**，由 `src/router/staticRoutes.js` 挂到路由的 `meta.permission` 上，
 * 并作为新增 `sys_menu` 记录时的 `permission` 字段值。
 *
 * ⚠️ 这个文件**故意不 import 任何东西**：
 *    `staticRoutes.js` 在应用启动最早期被加载，而 `@/utils` 里 `import router from '@/router'`，
 *    一旦让它 import `@/utils`，就会形成
 *    `staticRoutes → utils → router → staticRoutes` 的循环依赖，
 *    表现为路由 component 解析成 undefined 甚至是白屏。
 *    所以这里保持成纯常量模块，路由守卫直接读 localStorage（见 staticRoutes.js）。
 *
 * ⚠️ 前端**不判断"是不是管理员"**：
 *    谁能看到哪个菜单由后端 `sys_menu` + `sys_role_menu` 决定；
 *    前端只做两件事 —— ① 菜单由后端下发，没配就没有；
 *    ② 直接敲 URL 时用这里的权限码做一次校验，没有权限就挡掉。
 */

/** 首页监控大屏 —— 所有角色都应具备 */
export const PERM_DASHBOARD = 'agrimonitor:dashboard:view'

/** 地区监控 —— 采集员/值班人员需要 */
export const PERM_REGION_MONITOR = 'agrimonitor:regionMonitor:view'

/**
 * 采样数据录入 —— 采集员的核心工作页：
 * 填现场数据 → 按农事规则判定 → 封装回传帧 → 给出结论。
 * 采集员必须拥有这一条。
 */
export const PERM_SAMPLING_ENTRY = 'agrimonitor:samplingEntry:view'

/** 数据库管理 —— 仅管理员，纯界面但含运维信息，不应下放 */
export const PERM_DATABASE_MANAGE = 'agrimonitor:databaseManage:view'

/** 遥感分析 —— 管理/分析岗 */
export const PERM_REMOTE_SENSING = 'agrimonitor:remoteSensing:view'

/** 全部权限码（新增 sys_menu 时按这个列表配） */
export const AGRI_PERMISSIONS = [
  PERM_DASHBOARD,
  PERM_REGION_MONITOR,
  PERM_SAMPLING_ENTRY,
  PERM_DATABASE_MANAGE,
  PERM_REMOTE_SENSING
]

/**
 * 读取当前登录用户拥有的权限码列表。
 *
 * 语义与平台自带的 `utils.hasPermission()` **完全一致**（见 `src/utils/index.js`）：
 *     JSON.parse(localStorage.getItem('permissions') || '[]').indexOf(key) !== -1
 * 即：**权限列表为空/缺失时一律返回 false（严格拒绝）**，
 * 不做"取不到就放行"的兜底 —— 那正是 GIS 模块合并评审里被点名的"权限默认放行"问题。
 *
 * 这里直接读 localStorage 而不 import `@/utils`，是为了避开上面说的循环依赖。
 *
 * @returns {string[]}
 */
export function currentPermissions () {
  try {
    const raw = window.localStorage.getItem('permissions')
    if (!raw) {
      return []
    }
    const list = JSON.parse(raw)
    return Array.isArray(list) ? list : []
  } catch (e) {
    // localStorage 被禁用或内容损坏时按"无权限"处理，不抛错打断路由
    return []
  }
}

/**
 * 是否具备某个权限码。
 * @param {string} permission
 * @returns {boolean}
 */
export function hasAgriPermission (permission) {
  if (!permission) {
    return false
  }
  return currentPermissions().indexOf(permission) !== -1
}

/**
 * vue-router 的 `beforeEnter` 工厂：没有权限就跳到「无权限」提示页。
 *
 * 用**路由级** `beforeEnter` 而不是改全局 `authGuard.js`，原因：
 *   - 影响面只限于本模块的 4 条路由，不会动到其他成员的页面跳转逻辑；
 *   - 平台原本只校验 token 是否存在，不做路由级权限判断，
 *     而静态路由的副作用是"任何登录用户敲 URL 都能进"，这一层正好补上。
 *
 * @param {string} permission
 * @returns {Function} (to, from, next) => void
 */
export function requirePermission (permission) {
  return function (to, from, next) {
    if (hasAgriPermission(permission)) {
      next()
      return
    }
    next({
      name: 'agri-no-permission',
      // 把被拦截的目标带上，提示页可以告诉用户"你没权限访问 XXX"
      params: undefined,
      query: { from: to.path, need: permission }
    })
  }
}

export default {
  PERM_DASHBOARD,
  PERM_REGION_MONITOR,
  PERM_SAMPLING_ENTRY,
  PERM_DATABASE_MANAGE,
  PERM_REMOTE_SENSING,
  AGRI_PERMISSIONS,
  currentPermissions,
  hasAgriPermission,
  requirePermission
}
