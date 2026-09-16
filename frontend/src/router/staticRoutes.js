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
      { path: '/404', component: _import('common/404'), name: '404', meta: { title: '404未找到' } }
    ]
  }
}
