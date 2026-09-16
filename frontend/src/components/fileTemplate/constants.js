export const TEMPLATE_DOC_TYPES = [
  { label: '教学日历', value: 'calendar' },
  { label: '教学大纲', value: 'syllabus' },
  { label: '教案', value: 'lesson_plan' }
]

const TEMPLATE_DOC_TYPE_ALIASES = TEMPLATE_DOC_TYPES.reduce((map, item) => {
  map[item.value] = item.value
  map[item.label] = item.value
  return map
}, {})

export function normalizeTemplateDocType (value = '') {
  return TEMPLATE_DOC_TYPE_ALIASES[value] || value
}

export function getTemplateDocTypeLabel (value = '') {
  const normalizedValue = normalizeTemplateDocType(value)
  const hit = TEMPLATE_DOC_TYPES.find(item => item.value === normalizedValue)
  return hit ? hit.label : value
}

export const TEMPLATE_WIZARD_STEPS = [
  { key: 'category', label: '选择分类' },
  { key: 'config', label: '配置内容' },
  { key: 'result', label: '确认生成' }
]

export const TEMPLATE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
}

export const TEMPLATE_STATUS_META = {
  [TEMPLATE_STATUS.DRAFT]: { label: '草稿', type: 'warning' },
  [TEMPLATE_STATUS.PUBLISHED]: { label: '已发布', type: 'success' },
  [TEMPLATE_STATUS.ARCHIVED]: { label: '已归档', type: 'info' }
}

export const DEFAULT_MANUAL_SECTIONS = [
  {
    sectionTitle: '培养目标',
    children: [
      { sectionTitle: '培养目标内容' },
      { sectionTitle: '毕业要求支撑' }
    ]
  },
  {
    sectionTitle: '计划内容',
    children: [
      { sectionTitle: '教学内容' },
      { sectionTitle: '教学方法' }
    ]
  }
]
