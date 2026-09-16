import { createClientId, createTemplateDraft, createTemplateSection } from '@/components/fileTemplate/utils'

function resolveData (response = {}) {
  return response.data || response
}

function getTemplateSectionRows (template = {}) {
  if (Array.isArray(template.sections) && template.sections.length) {
    return template.sections
  }
  return template.dFileTemplateSectionDTOList || []
}

function createSectionLinkKeys (section = {}) {
  return [
    section.id,
    section.sectionCode,
    section.sectionTitle
  ].filter(Boolean).map(item => String(item))
}

function isTreeSectionNode (item = {}) {
  const hasNestedField = Object.prototype.hasOwnProperty.call(item, 'children') || Object.prototype.hasOwnProperty.call(item, 'sections')
  const nestedChildren = item.children || item.sections || []
  return hasNestedField && String(item.sectionLevel || '1') === '1' && Array.isArray(nestedChildren)
}

function normalizeTreeSections (sections = []) {
  return (sections || []).map((item, index) => createTemplateSection({
    ...item,
    children: item.children || item.sections || []
  }, {
    sortNo: Number(item.sortNo || index + 1),
    sectionLevel: 1
  })).map((section, index) => ({
    ...section,
    sortNo: index + 1,
    children: (section.children || []).map((child, childIndex) => ({
      ...child,
      sortNo: Number(child.sortNo || childIndex + 1),
      parentClientId: section.clientId
    }))
  }))
}

function buildSectionTree (rows = []) {
  if ((rows || []).some(isTreeSectionNode)) {
    return normalizeTreeSections(rows)
  }

  const orderedRows = (rows || []).slice().sort((a, b) => {
    const levelA = Number(a.sectionLevel || 0)
    const levelB = Number(b.sectionLevel || 0)
    if (levelA !== levelB) return levelA - levelB
    return Number(a.sortNo || 0) - Number(b.sortNo || 0)
  })

  const sections = orderedRows
    .filter(item => String(item.sectionLevel) === '1')
    .sort((a, b) => Number(a.sortNo || 0) - Number(b.sortNo || 0))
    .map((item, index) => createTemplateSection({
      ...item,
      children: []
    }, {
      sortNo: index + 1,
      sectionLevel: 1
    }))

  const sectionMap = sections.reduce((map, section) => {
    createSectionLinkKeys(section).forEach(key => {
      map[key] = section
    })
    return map
  }, {})

  orderedRows
    .filter(item => String(item.sectionLevel) === '2')
    .sort((a, b) => Number(a.sortNo || 0) - Number(b.sortNo || 0))
    .forEach(item => {
      const parentKey = item.parentSectionId ? String(item.parentSectionId) : ''
      const parent = sectionMap[parentKey]
      if (!parent) return
      parent.children.push(createTemplateSection(item, {
        sortNo: Number(item.sortNo || parent.children.length + 1),
        sectionLevel: 2,
        parentClientId: parent.clientId
      }))
    })

  return sections.map((section, index) => ({
    ...section,
    sortNo: index + 1,
    children: (section.children || []).map((child, childIndex) => ({
      ...child,
      sortNo: childIndex + 1,
      parentClientId: section.clientId
    }))
  }))
}

function flattenTemplateSections (sections = []) {
  const rows = []
  ;(sections || []).forEach((section, sectionIndex) => {
    const sectionId = section.id || section.clientId || createClientId('section')
    const parentSectionId = sectionId
    rows.push({
      id: sectionId,
      parentSectionId: '',
      sectionLevel: '1',
      sectionTitle: section.sectionTitle || '',
      sectionCode: section.sectionCode || '',
      sortNo: sectionIndex + 1,
      requiredFlag: section.requiredFlag || '1',
      visibleFlag: section.visibleFlag || '1',
      componentType: section.componentType || 'step',
      placeHolderText: section.placeHolderText || '',
      defaultvalue: section.defaultvalue || '',
      status: section.status || 'enabled'
    })
    ;(section.children || []).forEach((child, childIndex) => {
      const childId = child.id || child.clientId || createClientId('block')
      rows.push({
        id: childId,
        parentSectionId,
        sectionLevel: '2',
        sectionTitle: child.sectionTitle || '',
        sectionCode: child.sectionCode || '',
        sortNo: childIndex + 1,
        requiredFlag: child.requiredFlag || '1',
        visibleFlag: child.visibleFlag || '1',
        componentType: child.componentType || 'richtext',
        placeHolderText: child.placeHolderText || '',
        defaultvalue: child.defaultvalue || '',
        status: child.status || 'enabled'
      })
    })
  })
  return rows
}

export function normalizeTemplateDetail (response = {}) {
  const data = resolveData(response)
  const template = data.template || data

  return createTemplateDraft({
    ...template,
    sections: buildSectionTree(getTemplateSectionRows(template))
  })
}

export function buildTemplateSavePayload (template = {}) {
  const normalized = createTemplateDraft(template)
  const templateId = normalized.id || createClientId('template')
  return {
    id: templateId,
    templateCode: normalized.templateCode || '',
    templateName: normalized.templateName || '',
    docType: normalized.docType || '',
    versionNo: normalized.versionNo || 'V1.0',
    applicableMajor: normalized.applicableMajor || '',
    applicableCourse: normalized.applicableCourse || '',
    isDefault: normalized.isDefault || '0',
    status: normalized.status || 'draft',
    remark: normalized.remark || '',
    sortNo: normalized.sortNo || 0,
    dFileTemplateSectionDTOList: flattenTemplateSections(normalized.sections || [])
  }
}

export function normalizeTemplateTreeItems (items = []) {
  return (items || []).map(item => ({
    ...item,
    name: item.templateName || item.name,
    templateName: item.templateName || item.name
  }))
}

export function normalizeTemplateSectionRows (response = {}) {
  const template = normalizeTemplateDetail(response)
  const rows = []
  ;(template.sections || []).forEach(section => {
    rows.push({
      ...section,
      sectionLevel: '1'
    })
    ;(section.children || []).forEach(child => {
      rows.push({
        ...child,
        sectionLevel: '2',
        parentClientId: section.clientId,
        parentSectionId: child.parentSectionId || section.id || section.sectionCode || section.sectionTitle || ''
      })
    })
  })
  return rows
}

export function normalizeWordParseResult (response = {}) {
  const data = resolveData(response)
  const outline = data.outline || data.sections || []

  return {
    taskId: data.taskId || '',
    fileId: data.fileId || '',
    fileName: data.fileName || '',
    docType: data.docType || '',
    titleStats: data.titleStats || {
      level1Count: outline.length,
      level2Count: outline.reduce((sum, item) => sum + ((item.children || []).length), 0),
      warningCount: (data.warnings || []).length
    },
    warnings: data.warnings || [],
    sections: outline.map((section, index) => createTemplateSection(section, {
      sortNo: index + 1,
      sectionLevel: 1
    }))
  }
}

export function buildWordCreatePayload (form = {}, parseResult = {}) {
  return createTemplateDraft({
    ...form,
    sourceMode: 'word',
    sourceFileId: parseResult.fileId,
    sourceFileName: parseResult.fileName,
    sections: parseResult.sections || []
  })
}
