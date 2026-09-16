export function resolveDocumentRecordId (payload = {}) {
  if (!payload || typeof payload !== 'object') return ''
  if (payload.id) return payload.id
  if (payload.recordId) return payload.recordId
  if (payload.data && payload.data.id) return payload.data.id
  if (payload.data && payload.data.recordId) return payload.data.recordId
  if (payload.record && payload.record.id) return payload.record.id
  if (payload.record && payload.record.recordId) return payload.record.recordId
  return ''
}

export function resolveDocumentRecord (payload = {}) {
  if (!payload || typeof payload !== 'object') return null
  if (payload.data && typeof payload.data === 'object' && (payload.data.id || payload.data.recordId)) {
    return payload.data
  }
  if (payload.record && typeof payload.record === 'object' && (payload.record.id || payload.record.recordId)) {
    return payload.record
  }
  if (payload.id || payload.recordId) {
    return payload
  }
  return null
}

export function mergeHighlightedRecord ({
  records = [],
  highlightedRecordId = '',
  highlightedRecordSnapshot = null,
  pendingHighlightedRecordSync = false,
  pageSize = 10
}) {
  const list = Array.isArray(records) ? records.slice() : []
  const highlightedId = highlightedRecordId ? String(highlightedRecordId) : ''
  if (!pendingHighlightedRecordSync || !highlightedId || !highlightedRecordSnapshot) {
    return {
      records: list,
      inserted: false,
      matchedRecord: null,
      pendingHighlightedRecordSync
    }
  }

  const matchedRecord = list.find(item => item && String(item.id) === highlightedId)
  if (matchedRecord) {
    return {
      records: list,
      inserted: false,
      matchedRecord,
      pendingHighlightedRecordSync: false
    }
  }

  const merged = [highlightedRecordSnapshot, ...list].filter(Boolean)
  const deduped = []
  const seen = new Set()
  merged.forEach(item => {
    const recordId = item && item.id ? String(item.id) : ''
    if (!recordId || seen.has(recordId)) return
    seen.add(recordId)
    deduped.push(item)
  })

  return {
    records: deduped.slice(0, pageSize),
    inserted: true,
    matchedRecord: null,
    pendingHighlightedRecordSync
  }
}

export function isHighlightedRecord (row, highlightedRecordId) {
  if (!row || !row.id || !highlightedRecordId) return false
  return String(row.id) === String(highlightedRecordId)
}
