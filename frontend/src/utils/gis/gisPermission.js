/**
 * GIS 模块权限码与权限判定（1号 前端GIS 岗位）
 *
 * 约束来源：字段与公共接口约束 V2.1 §2.2
 *  「权限：<module>:<CamelResource>:<action>，例如 ddevice:dDevice:list；Controller 与前端权限一致。」
 *
 * ────────────────────────────────────────────────────────────────────────
 * ⚠️ 合并评审意见 #2 的修复说明
 *
 * 此前的实现是「localStorage.permissions 为空 → 直接放行」，这是错的：
 * 权限列表为空可能意味着「菜单还没配好」，也可能意味着「这个账号真的没有任何权限」，
 * 两者无法区分；更糟的是**生产环境**下若权限接口异常或延迟，就会把写操作入口暴露出来。
 *
 * 现在改成：
 *   1. **生产构建（NODE_ENV === 'production'）一律严格校验**，不存在任何放行分支；
 *   2. 放行只能由**显式开关**触发 —— 独立演示入口 `gis.html` 显式设置
 *      `window.__GIS_DEMO__ = true`，或构建期显式打开 `VUE_APP_GIS_DEMO_MODE=true`；
 *   3. 不再以「权限列表为空」作为任何判断条件。
 *
 * 也就是说：JeePlus 正式页面（/farmland/FarmlandGis）永远走严格校验；
 * 只有显式声明的演示入口在非生产环境才放行。
 */

export const GIS_PERMISSION = {
  FARMLAND_LIST: 'farmland:farmland:list',
  SAMPLING_POINT_LIST: 'samplingpoint:samplingPoint:list',
  SAMPLING_POINT_ADD: 'samplingpoint:samplingPoint:add',
  SAMPLING_POINT_EDIT: 'samplingpoint:samplingPoint:edit',
  DEVICE_LIST: 'ddevice:dDevice:list',
  NAVIGATION_VIEW: 'navigation:navigationRoute:view',
  MONITOR_LIST: 'monitor:monitorRecord:list',
  MONITOR_IMPORT: 'monitor:monitorRecord:import',
  ANALYSIS_LIST: 'analysis:analysis:list',
  ANALYSIS_EXPORT: 'analysis:analysis:export'
}

/**
 * 是否为「显式声明的演示模式」。
 * 生产构建永远返回 false —— 生产环境没有演示放行这回事。
 */
export function isGisDemoMode () {
  if (process.env.NODE_ENV === 'production') {
    return false
  }
  if (typeof window !== 'undefined' && window.__GIS_DEMO__ === true) {
    return true
  }
  return String(process.env.VUE_APP_GIS_DEMO_MODE || '').toLowerCase() === 'true'
}

/**
 * 判断某个操作是否放行。
 *
 * 注意：本函数**不再读取 localStorage.permissions 是否为空**。
 * 权限列表为空时 `hasPermission()` 返回 false，即严格拒绝 —— 这才是正确行为：
 * 拿不到权限就当作没有权限，而不是当作"演示模式"。
 *
 * @param {string} key GIS_PERMISSION 中的权限码
 * @param {Function} hasPermissionFn 平台注入的 hasPermission（Vue.prototype.hasPermission）
 * @returns {{allowed:boolean, reason:string, demo:boolean}}
 */
export function checkPermission (key, hasPermissionFn) {
  if (isGisDemoMode()) {
    return { allowed: true, demo: true, reason: `演示模式（显式开关）放行：${key}` }
  }
  if (typeof hasPermissionFn !== 'function') {
    return { allowed: false, demo: false, reason: '缺少权限校验能力，已按无权限处理' }
  }
  const allowed = !!hasPermissionFn(key)
  return {
    allowed,
    demo: false,
    reason: allowed ? '' : `当前账号没有权限 ${key}`
  }
}

export default { GIS_PERMISSION, isGisDemoMode, checkPermission }
