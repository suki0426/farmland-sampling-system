import { IMPORT_STATUS, INDICATOR_TEMPLATE_EXTENSIONS } from './constants'

export function getFileExtension (fileName = '') {
  const parts = fileName.split('.')
  return parts.length > 1 ? parts.pop().toLowerCase() : ''
}

export function formatFileSize (size = 0) {
  if (size < 1024) return `${size}B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`
  return `${(size / 1024 / 1024).toFixed(1)}MB`
}

export function validateTemplateFile (file, options = {}) {
  const extensions = options.extensions || INDICATOR_TEMPLATE_EXTENSIONS
  const maxSize = options.maxSize || 10
  const extension = getFileExtension(file.name)

  if (extensions.indexOf(extension) === -1) {
    return {
      valid: false,
      message: `仅支持 ${extensions.map(item => `.${item}`).join(' / ')} 文件导入`
    }
  }

  if (file.size / 1024 / 1024 > maxSize) {
    return {
      valid: false,
      message: `导入文件大小不能超过 ${maxSize}MB`
    }
  }

  return { valid: true, message: '' }
}

export function createSelectedTemplate (file) {
  return {
    file,
    name: file.name,
    size: file.size,
    sizeText: formatFileSize(file.size),
    status: IMPORT_STATUS.READY,
    progress: 0
  }
}

export function resolveImportStatus (result) {
  if (!result) return IMPORT_STATUS.IDLE
  if (result.failCount > 0 && result.successCount > 0) return IMPORT_STATUS.PARTIAL
  if (result.failCount > 0) return IMPORT_STATUS.FAILED
  return IMPORT_STATUS.SUCCESS
}
