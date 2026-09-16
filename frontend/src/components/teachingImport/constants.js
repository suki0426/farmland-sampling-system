export const ACCEPT_EXTENSIONS = ['doc', 'docx']

export const PARSE_STATUS = {
  WAITING: 'waiting',
  UPLOADING: 'uploading',
  PARSING: 'parsing',
  SUCCESS: 'success',
  FAILED: 'failed'
}

export const STATUS_META = {
  [PARSE_STATUS.WAITING]: { label: '待上传', type: 'info' },
  [PARSE_STATUS.UPLOADING]: { label: '上传中', type: 'warning' },
  [PARSE_STATUS.PARSING]: { label: '解析中', type: 'warning' },
  [PARSE_STATUS.SUCCESS]: { label: '解析成功', type: 'success' },
  [PARSE_STATUS.FAILED]: { label: '解析失败', type: 'danger' }
}

export const DOC_TYPE_KEYWORDS = [
  { keyword: '教学日历', type: 'calendar' },
  { keyword: '教学大纲', type: 'syllabus' },
  { keyword: '教案', type: 'lesson_plan' }
]
