import { ACCEPT_EXTENSIONS, DOC_TYPE_KEYWORDS, PARSE_STATUS } from './constants'

export function getFileExtension (fileName = '') {
  const parts = fileName.split('.')
  return parts.length > 1 ? parts.pop().toLowerCase() : ''
}

export function formatFileSize (size = 0) {
  if (size < 1024) return `${size}B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`
  return `${(size / 1024 / 1024).toFixed(1)}MB`
}

export function resolveDocType (fileName = '') {
  const hit = DOC_TYPE_KEYWORDS.find(item => fileName.indexOf(item.keyword) > -1)
  return hit ? hit.type : '待识别'
}

export function validateImportFile (file, options = {}) {
  const extensions = options.extensions || ACCEPT_EXTENSIONS
  const maxSize = options.maxSize || 20
  const extension = getFileExtension(file.name)

  if (extensions.indexOf(extension) === -1) {
    return {
      valid: false,
      message: `仅支持 ${extensions.map(item => `.${item}`).join(' / ')} 文件`
    }
  }

  if (file.size / 1024 / 1024 > maxSize) {
    return {
      valid: false,
      message: `文件大小不能超过 ${maxSize}MB`
    }
  }

  return { valid: true, message: '' }
}

export function createImportItem (file) {
  const now = Date.now()
  return {
    uid: `${now}-${Math.random().toString(16).slice(2)}`,
    file,
    name: file.name,
    size: file.size,
    sizeText: formatFileSize(file.size),
    docType: resolveDocType(file.name),
    progress: 0,
    status: PARSE_STATUS.WAITING,
    taskId: '',
    recordId: '',
    errorMessage: '',
    createdAt: now
  }
}

export function summarizeImportItems (items = []) {
  return items.reduce((summary, item) => {
    summary.total += 1
    if (item.status === PARSE_STATUS.SUCCESS) summary.success += 1
    if (item.status === PARSE_STATUS.FAILED) summary.failed += 1
    if (item.status === PARSE_STATUS.UPLOADING) summary.uploading += 1
    if (item.status === PARSE_STATUS.PARSING) summary.parsing += 1
    if (item.status === PARSE_STATUS.WAITING) summary.waiting += 1
    return summary
  }, {
    total: 0,
    waiting: 0,
    uploading: 0,
    parsing: 0,
    success: 0,
    failed: 0
  })
}
