export function getCreateDialogOptionsFromRoute (query = {}) {
  if (query.openCreate !== '1' && !query.preferredMethod) return null
  return {
    method: query.preferredMethod || 'manual',
    defaults: {
      docType: query.docType || '',
      templateId: query.templateId || ''
    }
  }
}

export function buildCreateDocumentRoute (payload = {}) {
  const query = {
    docType: payload.docType
  }

  if (payload.createMethod === 'file_import') {
    return {
      name: 'teaching-file-import',
      query
    }
  }

  query.templateId = payload.templateId
  query.templateVersion = payload.templateVersion
  if (payload.templateName && payload.templateName !== '-') {
    query.templateName = payload.templateName
  }

  return {
    name: 'dteachingdocument-editor',
    query
  }
}

export function pushRouteLater (router, route, delay = 900) {
  window.setTimeout(() => {
    router.push(route)
  }, delay)
}
