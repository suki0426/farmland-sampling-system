export const INDICATOR_TEMPLATE_EXTENSIONS = ['xls', 'xlsx']

export const IMPORT_STATUS = {
  IDLE: 'idle',
  READY: 'ready',
  UPLOADING: 'uploading',
  SUCCESS: 'success',
  PARTIAL: 'partial',
  FAILED: 'failed'
}

export const IMPORT_STATUS_META = {
  [IMPORT_STATUS.IDLE]: { label: '等待文件', type: 'info' },
  [IMPORT_STATUS.READY]: { label: '待导入', type: 'info' },
  [IMPORT_STATUS.UPLOADING]: { label: '导入中', type: 'warning' },
  [IMPORT_STATUS.SUCCESS]: { label: '导入成功', type: 'success' },
  [IMPORT_STATUS.PARTIAL]: { label: '部分失败', type: 'warning' },
  [IMPORT_STATUS.FAILED]: { label: '导入失败', type: 'danger' }
}

export const TEMPLATE_COLUMNS = [
  { name: '指标编码', desc: '同一指标体系内唯一，例如 A-01-001' },
  { name: '指标名称', desc: '指标展示名称，不能为空' },
  { name: '上级指标编码', desc: '一级指标为空，二级及以下必填' },
  { name: '指标级别', desc: '支持 1 到 5 级' },
  { name: '排序号', desc: '同级节点排序' },
  { name: '指标说明', desc: '用于描述评价口径' }
]
