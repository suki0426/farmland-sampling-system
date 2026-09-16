const DEFAULT_PARSE_STATUS = {
  PARSING: 'parsing',
  SUCCESS: 'success'
}

function resolveData (response = {}) {
  return response.data || response
}

export function normalizeTeachingUploadResult (response = {}, item = {}) {
  const payload = resolveData(response)
  const data = Array.isArray(payload) ? (payload[0] || {}) : payload
  return {
    taskId: data.taskId || data.id || item.uid,
    recordId: data.recordId || '',
    docType: data.docType || data.type || item.docType,
    status: data.status || DEFAULT_PARSE_STATUS.PARSING,
    errorMessage: data.errorMessage || data.message || ''
  }
}

export function normalizeTeachingParseStatus (response = {}, item = {}) {
  const data = resolveData(response)
  return {
    taskId: data.taskId || item.taskId || item.uid,
    status: data.status || DEFAULT_PARSE_STATUS.SUCCESS,
    progress: Number(data.progress || 100),
    recordId: data.recordId || item.recordId || '',
    docType: data.docType || data.type || item.docType,
    errorMessage: data.errorMessage || data.message || ''
  }
}
