// 农业智能监测平台的权限码与路由守卫。
// ⚠️ permissions.js 是**零 import 的叶子模块**，导入它是安全的；
//    千万不要在这里 import `@/utils` —— 它内部 `import router from '@/router'`，
//    会形成 staticRoutes → utils → router → staticRoutes 的循环依赖
//    （component 会解析成 undefined，表现为白屏）。
import {
  PERM_DASHBOARD,
  PERM_REGION_MONITOR,
  PERM_DATABASE_MANAGE,
  PERM_REMOTE_SENSING,
  requirePermission
} from '@/views/modules/agrimonitor/permissions'

export function createGlobalRoutes (_import) {
  return [
    { path: '/login', component: _import('modules/sys/login/login'), name: 'login', meta: { title: '登录' } },
    { path: '/casLogin', component: _import('common/CasLogin'), name: 'casLogin', meta: { title: 'CAS登录' } }
  ]
}

export function createMainRoutes (_import) {
  return {
    path: '/',
    component: _import('main'),
    name: 'main',
    redirect: { name: 'home' },
    meta: { title: '整体布局' },
    children: [
      { path: '/redirect/:path(.*)', component: _import('modules/redirect/index') },
      { path: '/home', redirect: '/sys/dashboard/analysis/index', name: 'home' },
      { path: '/flowable/task/TaskForm', component: _import('modules/flowable/task/TaskForm'), name: 'task-form', meta: { title: '流程表单' } },
      { path: '/flowable/task/TaskFormEdit', component: _import('modules/flowable/task/TaskFormEdit'), name: 'task-form-edit', meta: { title: '流程表单' } },
      { path: '/flowable/task/TaskFormDetail', component: _import('modules/flowable/task/TaskFormDetail'), name: 'task-form-detail', meta: { title: '流程表单详情' } },
      { path: '/dfiletemplate/DFileTemplateSectionList', component: _import('modules/dfiletemplate/DFileTemplateSectionList'), name: 'dfiletemplate-section-list', meta: { title: '教学文档模板管理', singleTab: true } },
      { path: '/dfiletemplate/DFileTemplateDesigner', component: _import('modules/dfiletemplate/DFileTemplateDesigner'), name: 'dfiletemplate-template-designer', meta: { title: '教学文档模板编辑', singleTab: true } },
      { path: '/dteachingdocument/DTeachingDocumentList', component: _import('modules/dteachingdocument/DTeachingDocumentList'), name: 'dteachingdocument-list', meta: { title: '教学文档管理', singleTab: true } },
      { path: '/dteachingdocument/DTeachingDocumentCreate', component: _import('modules/dteachingdocument/DTeachingDocumentCreate'), name: 'dteachingdocument-create', meta: { title: '新建教学文档', singleTab: true } },
      { path: '/dteachingdocument/DTeachingDocumentEditor', component: _import('modules/dteachingdocument/DTeachingDocumentEditor'), name: 'dteachingdocument-editor', meta: { title: '填写教学文档', singleTab: true } },
      { path: '/dteachingdocument/DTeachingDocumentDetail', component: _import('modules/dteachingdocument/DTeachingDocumentDetail'), name: 'dteachingdocument-detail', meta: { title: '教学文档详情', singleTab: true } },
      { path: '/teaching/TeachingFileImport', component: _import('modules/teaching/TeachingFileImport'), name: 'teaching-file-import', meta: { title: '教学文件上传解析', singleTab: true } },
      { path: '/indicator/IndicatorManageList', component: _import('modules/indicator/IndicatorMindMap'), name: 'indicator-manage-list', meta: { title: '指标管理', singleTab: true } },
      { path: '/indicator/IndicatorImport', component: _import('modules/indicator/IndicatorMindMap'), name: 'indicator-import', meta: { title: '指标管理', singleTab: true } },
      { path: '/indicator/IndicatorTreeView', component: _import('modules/indicator/IndicatorMindMap'), name: 'indicator-tree-view', meta: { title: '指标管理', singleTab: true } },
      { path: '/indicator/IndicatorMindMap', component: _import('modules/indicator/IndicatorMindMap'), name: 'indicator-mind-map', meta: { title: '指标管理', singleTab: true } },
      { path: '/form/generateList', component: _import('modules/form/GenerateList'), name: 'form-preview-list', meta: { title: '列表' } },
      { path: '/echarts/GenerateChart', component: _import('modules/echarts/GenerateChart'), name: 'echarts-generate', meta: { title: '预览图表' } },
      { path: '/ureport/designer', component: null, name: 'ureport-designer', meta: { title: '预览报表', type: 'iframe', menuId: 'ureport-designer' } },
      { path: '/ureport/preview', component: null, name: 'ureport-preview', meta: { title: '预览报表', type: 'iframe', menuId: 'ureport-preview' } },
      { path: '/form/explorer', component: null, name: 'form-explorer', meta: { title: '浏览器', type: 'iframe' } },
      { path: '/database/datatable/TableForm', component: _import('modules/database/datatable/TableForm'), name: 'table-form', meta: { title: '数据库表详情' } },
      // ↓ 农业智能监测平台（首页大屏 / 地区监控 / 数据库管理 / 遥感分析）
      // 注册为静态路由，保证后端菜单（sys_menu）尚未配置时页面也能直接访问。
      // 若后续在菜单里配了同名 href，dynamicRoutes.js 会检测到同名 path 而跳过，不会冲突。
      //
      // ⚠️ 角色赋权：静态路由的副作用是「任何登录用户敲 URL 都能进」，所以这里补一层
      //    **路由级权限校验**（平台原有的 authGuard 只校验 token 是否存在，不校验权限）。
      //    权限码定义在 modules/agrimonitor/permissions.js，与新增 sys_menu 时的
      //    permission 字段值一一对应；没有权限会跳到「无权限」提示页而不是误导性的 404。
      //    配置 SQL 与角色对照表见 docs/ROLE_PERMISSION.md。
      { path: '/agrimonitor/Dashboard', component: _import('modules/agrimonitor/Dashboard'), name: 'agri-dashboard', meta: { title: '监测大屏', singleTab: true, permission: PERM_DASHBOARD }, beforeEnter: requirePermission(PERM_DASHBOARD) },
      { path: '/agrimonitor/RegionMonitor', component: _import('modules/agrimonitor/RegionMonitor'), name: 'agri-region-monitor', meta: { title: '地区监控', singleTab: true, permission: PERM_REGION_MONITOR }, beforeEnter: requirePermission(PERM_REGION_MONITOR) },
      { path: '/agrimonitor/DatabaseManage', component: _import('modules/agrimonitor/DatabaseManage'), name: 'agri-database', meta: { title: '数据库管理', singleTab: true, permission: PERM_DATABASE_MANAGE }, beforeEnter: requirePermission(PERM_DATABASE_MANAGE) },
      { path: '/agrimonitor/RemoteSensing', component: _import('modules/agrimonitor/RemoteSensing'), name: 'agri-remote-sensing', meta: { title: '遥感分析', singleTab: true, permission: PERM_REMOTE_SENSING }, beforeEnter: requirePermission(PERM_REMOTE_SENSING) },
      // 被权限拦截后的落地页。**本身不校验权限**，否则会出现「拦截页也被拦截」的死循环。
      { path: '/agrimonitor/NoPermission', component: _import('modules/agrimonitor/NoPermission'), name: 'agri-no-permission', meta: { title: '无访问权限', singleTab: true } },
      { path: '/404', component: _import('common/404'), name: '404', meta: { title: '404未找到' } }
    ]
  }
}
