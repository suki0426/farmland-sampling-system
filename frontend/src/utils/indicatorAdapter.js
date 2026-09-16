function resolveData (response = {}) {
  return response.data || response
}

export function normalizeIndicatorImportResult (response = {}) {
  const data = resolveData(response)
  const errors = data.errors || data.errorRows || []
  const successCount = Number(data.successCount || data.success || 0)
  const failCount = Number(data.failCount || data.failed || errors.length || 0)

  return {
    batchNo: data.batchNo || `IMPORT-${Date.now()}`,
    totalCount: Number(data.totalCount || data.total || successCount + failCount),
    successCount,
    failCount,
    skippedCount: Number(data.skippedCount || data.skipped || 0),
    errors,
    message: data.message || ''
  }
}

export function normalizeIndicatorTree (response = {}) {
  const data = resolveData(response)
  return data.list || data.records || data.children || []
}

export function normalizeIndicatorList (response = {}) {
  const data = resolveData(response)
  const records = data.records || data.list || data.rows || []
  return {
    records,
    total: Number(data.total || data.count || records.length)
  }
}
