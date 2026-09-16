import {
  TEMPLATE_STATUS,
  getTemplateDocTypeLabel,
  normalizeTemplateDocType
} from './constants'

export function createClientId (prefix = 'node') {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function createSectionCode (title = '', index = 1) {
  const knownMap = {
    培养目标: 'trainingGoal',
    培养目标内容: 'trainingGoalContent',
    毕业要求支撑: 'graduationSupport',
    计划内容: 'planContent',
    教学内容: 'teachingContent',
    教学方法: 'teachingMethod',
    学时分配: 'hourAllocation',
    参考文献: 'reference',
    能力目标: 'abilityGoal',
    素质目标: 'qualityGoal'
  }

  if (knownMap[title]) return knownMap[title]

  const ascii = String(title)
    .replace(/[^A-Za-z0-9\s_-]/g, ' ')
    .trim()
    .replace(/[-_\s]+([A-Za-z0-9])/g, (_, char) => char.toUpperCase())
    .replace(/^[A-Z]/, char => char.toLowerCase())

  if (!ascii) return `field${index}`
  return /^[A-Za-z]/.test(ascii) ? ascii : `field${ascii}`
}

export function createTemplateSection (raw = {}, options = {}) {
  const sortNo = options.sortNo || raw.sortNo || 1
  const sectionLevel = options.sectionLevel || raw.sectionLevel || 1
  const sectionTitle = raw.sectionTitle || raw.title || ''
  const sectionCode = raw.sectionCode || createSectionCode(sectionTitle, sortNo)
  const children = raw.children || []
  const clientId = raw.clientId || createClientId(sectionLevel === 1 ? 'step' : 'block')

  return {
    id: raw.id || '',
    clientId,
    templateId: raw.templateId || '',
    parentSectionId: raw.parentSectionId || '',
    parentClientId: options.parentClientId || raw.parentClientId || '',
    sectionLevel,
    sectionTitle,
    sectionCode,
    sortNo,
    requiredFlag: sectionLevel === 2 ? '1' : raw.requiredFlag || '1',
    visibleFlag: sectionLevel === 2 ? '1' : raw.visibleFlag || '1',
    componentType: sectionLevel === 1 ? 'step' : 'richtext',
    placeHolderText: raw.placeHolderText || raw.placeholder || '',
    defaultvalue: raw.defaultvalue || raw.bodyText || '',
    status: raw.status || 'enabled',
    children: children.map((child, index) => createTemplateSection(child, {
      sortNo: index + 1,
      sectionLevel: 2,
      parentClientId: clientId
    }))
  }
}

export function createTemplateDraft (payload = {}) {
  const templateName = payload.templateName || resolveTemplateName(payload)
  return {
    id: payload.id || '',
    templateCode: payload.templateCode || '',
    templateName,
    name: templateName,
    docType: normalizeTemplateDocType(payload.docType || ''),
    versionNo: payload.versionNo || 'V1.0',
    status: payload.status || TEMPLATE_STATUS.DRAFT,
    isDefault: payload.isDefault || '0',
    applicableMajor: payload.applicableMajor || '',
    applicableCourse: payload.applicableCourse || '',
    sourceMode: payload.sourceMode || '',
    sourceFileId: payload.sourceFileId || '',
    sourceFileName: payload.sourceFileName || '',
    remark: payload.remark || '',
    sections: (payload.sections || []).map((section, index) => createTemplateSection(section, {
      sortNo: index + 1,
      sectionLevel: 1
    }))
  }
}

export function ensureUniqueSectionCodes (template = {}) {
  const usedCodes = new Set()
  ;(template.sections || []).forEach((section, sectionIndex) => {
    ;(section.children || []).forEach((child, childIndex) => {
      const title = child.sectionTitle || child.sectionCode || `field${sectionIndex + 1}_${childIndex + 1}`
      const baseCode = createSectionCode(title, childIndex + 1)
      let nextCode = child.sectionCode

      if (!nextCode || usedCodes.has(nextCode)) {
        nextCode = baseCode
      }

      let suffix = 2
      while (usedCodes.has(nextCode)) {
        nextCode = `${baseCode}${suffix}`
        suffix += 1
      }

      child.sectionCode = nextCode
      usedCodes.add(nextCode)
    })
  })

  return template
}

export function resolveTemplateName (payload = {}) {
  if (payload.fileName) {
    return payload.fileName.replace(/\.[^.]+$/, '').replace(/课程?/, '') + '模板 V1'
  }
  if (payload.docType) return `${getTemplateDocTypeLabel(payload.docType)}模板 V1`
  return '教学文档模板 V1'
}

export function validateTemplateDraft (template = {}) {
  ensureUniqueSectionCodes(template)
  const errors = []
  if (!template.docType) errors.push({ field: 'docType', message: '请选择文档分类' })
  if (!template.templateName) errors.push({ field: 'templateName', message: '请填写模板名称' })
  if (!template.sections || !template.sections.length) errors.push({ field: 'sections', message: '至少需要一个一级标题' })

  const codes = {}
  ;(template.sections || []).forEach((section, sectionIndex) => {
    if (!section.sectionTitle) {
      errors.push({ field: `sections.${sectionIndex}.sectionTitle`, message: '一级标题不能为空' })
    }
    if (!section.children || !section.children.length) {
      errors.push({ field: `sections.${sectionIndex}.children`, message: `${section.sectionTitle || '当前步骤'}至少需要一个二级标题` })
    }
    ;(section.children || []).forEach((child, childIndex) => {
      if (!child.sectionTitle) {
        errors.push({ field: `sections.${sectionIndex}.children.${childIndex}.sectionTitle`, message: '二级标题不能为空' })
      }
      if (!child.sectionCode) {
        errors.push({ field: `sections.${sectionIndex}.children.${childIndex}.sectionCode`, message: `${child.sectionTitle || '内容块'}配置异常` })
      } else if (codes[child.sectionCode]) {
        errors.push({ field: `sections.${sectionIndex}.children.${childIndex}.sectionCode`, message: `${child.sectionTitle || '内容块'}配置重复，请调整标题后重试` })
      }
      if (!child.componentType) {
        errors.push({ field: `sections.${sectionIndex}.children.${childIndex}.componentType`, message: `${child.sectionTitle || '内容块'}内容格式配置异常` })
      }
      codes[child.sectionCode] = true
    })
  })

  return {
    valid: errors.length === 0,
    errors
  }
}
