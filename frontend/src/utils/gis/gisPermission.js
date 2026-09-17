/**
 * GIS 模块权限码（1号 前端GIS 岗位）
 *
 * 约束来源：字段与公共接口约束 V2.1 §2.2
 *  「权限：<module>:<CamelResource>:<action>，例如 ddevice:dDevice:list；Controller 与前端权限一致。」
 *
 * 这里只集中定义权限码字符串，避免在页面里散落硬编码的权限常量。
 *
 * ⚠️ 演示/开发期的放行规则：
 *   平台权限列表来自登录后写入 localStorage 的 `permissions`。当前 5号 还没建菜单，
 *   该列表为空，如果直接按权限隐藏按钮，页面上所有写操作按钮都会消失、没法演示。
 *   因此规则是：**平台已下发权限 → 严格校验；平台尚未下发（列表为空）→ 放行并提示**。
 *   等 5号 配好菜单权限后，这里不需要改代码就会自动生效。
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

/** 平台是否已经下发权限列表 */
export function isPermissionConfigured () {
  try {
    const raw = window.localStorage.getItem('permissions')
    const list = JSON.parse(raw || '[]')
    return Array.isArray(list) && list.length > 0
  } catch (e) {
    return false
  }
}

/**
 * 判断某个操作是否放行
 * @param {string} key GIS_PERMISSION 中的权限码
 * @param {Function} hasPermissionFn 平台注入的 hasPermission（Vue.prototype.hasPermission）
 * @returns {{allowed:boolean, reason:string}}
 */
export function checkPermission (key, hasPermissionFn) {
  if (!isPermissionConfigured()) {
    return { allowed: true, reason: '平台尚未下发权限列表（开发/演示模式），已放行' }
  }
  if (typeof hasPermissionFn !== 'function') {
    return { allowed: false, reason: '缺少权限校验能力，已拒绝' }
  }
  const allowed = !!hasPermissionFn(key)
  return {
    allowed,
    reason: allowed ? '' : `当前账号缺少权限 ${key}`
  }
}

export default { GIS_PERMISSION, isPermissionConfigured, checkPermission }
