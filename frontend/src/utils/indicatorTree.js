export function flattenIndicatorTree (tree = []) {
  return tree.reduce((list, node) => {
    list.push(node)
    if (node.children && node.children.length) {
      list.push(...flattenIndicatorTree(node.children))
    }
    return list
  }, [])
}

export function findIndicatorNode (tree = [], id) {
  for (let i = 0; i < tree.length; i++) {
    const node = tree[i]
    if (node.id === id) return node
    if (node.children && node.children.length) {
      const matched = findIndicatorNode(node.children, id)
      if (matched) return matched
    }
  }
  return null
}

export function cloneIndicatorTree (tree = []) {
  return JSON.parse(JSON.stringify(tree || []))
}

export function findIndicatorPath (tree = [], id, parents = []) {
  for (let i = 0; i < tree.length; i++) {
    const node = tree[i]
    const nextPath = parents.concat(node)
    if (node.id === id) return nextPath
    if (node.children && node.children.length) {
      const matched = findIndicatorPath(node.children, id, nextPath)
      if (matched.length) return matched
    }
  }
  return []
}

export function getFirstIndicatorId (tree = []) {
  return tree.length ? tree[0].id : ''
}

export function getIndicatorStats (tree = []) {
  const nodes = flattenIndicatorTree(tree)
  const maxLevel = nodes.reduce((level, node) => Math.max(level, node.level || 1), 0)

  return {
    total: nodes.length,
    enabled: nodes.filter(node => node.status === 'enabled').length,
    warning: nodes.filter(node => node.status === 'warning').length,
    disabled: nodes.filter(node => node.status === 'disabled').length,
    maxLevel
  }
}

export function getChildCount (node) {
  if (!node || !node.children) return 0
  return node.children.length
}

export function getDescendantCount (node) {
  if (!node || !node.children) return 0
  return flattenIndicatorTree(node.children).length
}

export function validateIndicatorNodeMove (tree = [], sourceId, targetId) {
  if (!sourceId || !targetId) {
    return { valid: false, reason: 'missing-node' }
  }

  if (sourceId === targetId) {
    return { valid: false, reason: 'same-node' }
  }

  const sourcePath = findIndicatorPath(tree, sourceId)
  const targetPath = findIndicatorPath(tree, targetId)
  if (!sourcePath.length || !targetPath.length) {
    return { valid: false, reason: 'missing-node' }
  }

  if (sourcePath.length <= 1) {
    return { valid: false, reason: 'root-locked', sourcePath, targetPath }
  }

  const sourcePathIds = sourcePath.map(node => node.id)
  const targetPathIds = targetPath.map(node => node.id)
  if (sourcePathIds.indexOf(targetId) > -1 || targetPathIds.indexOf(sourceId) > -1) {
    return { valid: false, reason: 'ancestor-descendant', sourcePath, targetPath }
  }

  const sourceParentId = sourcePath[sourcePath.length - 2].id
  const targetParentId = targetPath[targetPath.length - 2] ? targetPath[targetPath.length - 2].id : ''
  if (sourceParentId !== targetParentId) {
    return { valid: false, reason: 'cross-parent', sourcePath, targetPath, sourceParentId, targetParentId }
  }

  return {
    valid: true,
    reason: '',
    sourcePath,
    targetPath,
    sourceParentId,
    targetParentId
  }
}

export function moveIndicatorNode (tree = [], sourceId, targetId, options = {}) {
  const validation = validateIndicatorNodeMove(tree, sourceId, targetId)
  if (!validation.valid) {
    return {
      moved: false,
      tree: cloneIndicatorTree(tree),
      ...validation
    }
  }

  const placement = options.placement === 'before' ? 'before' : 'after'
  const draftTree = cloneIndicatorTree(tree)
  const parentNode = findIndicatorNode(draftTree, validation.sourceParentId)
  const siblings = parentNode && parentNode.children ? parentNode.children : []
  const sourceIndex = siblings.findIndex(node => node.id === sourceId)
  const originalTargetIndex = siblings.findIndex(node => node.id === targetId)
  if (sourceIndex < 0 || originalTargetIndex < 0) {
    return {
      moved: false,
      tree: draftTree,
      valid: false,
      reason: 'missing-node'
    }
  }

  const [sourceNode] = siblings.splice(sourceIndex, 1)
  let insertIndex = siblings.findIndex(node => node.id === targetId)
  if (insertIndex < 0) {
    return {
      moved: false,
      tree: draftTree,
      valid: false,
      reason: 'missing-node'
    }
  }

  if (placement === 'after') {
    insertIndex += 1
  }
  siblings.splice(insertIndex, 0, sourceNode)

  return {
    moved: true,
    tree: draftTree,
    placement,
    sourceNode: validation.sourcePath[validation.sourcePath.length - 1],
    targetNode: validation.targetPath[validation.targetPath.length - 1],
    parentId: validation.sourceParentId,
    sourceIndex,
    targetIndex: insertIndex,
    ...validation
  }
}

function collectIndicatorChildOrderMap (tree = [], parentId = '__root__', bucket = {}) {
  const childIds = tree.map(node => node.id)
  if (childIds.length) {
    bucket[parentId] = childIds
  }

  tree.forEach(node => {
    if (node.children && node.children.length) {
      collectIndicatorChildOrderMap(node.children, node.id, bucket)
    }
  })

  return bucket
}

export function buildIndicatorOrderDraft (baseTree = [], currentTree = []) {
  const baseOrderMap = collectIndicatorChildOrderMap(baseTree)
  const currentOrderMap = collectIndicatorChildOrderMap(currentTree)
  const parentIds = Array.from(new Set([
    ...Object.keys(baseOrderMap),
    ...Object.keys(currentOrderMap)
  ]))

  const changedParents = parentIds.reduce((list, parentId) => {
    const baseIds = baseOrderMap[parentId] || []
    const currentIds = currentOrderMap[parentId] || []
    if (!currentIds.length) return list

    const hasChanged = baseIds.length !== currentIds.length ||
      currentIds.some((id, index) => baseIds[index] !== id)
    if (!hasChanged) return list

    const parentNode = parentId === '__root__' ? null : findIndicatorNode(currentTree, parentId)
    const orderedChildren = currentIds
      .map((id, index) => {
        const node = findIndicatorNode(currentTree, id)
        if (!node) return null
        return {
          id: node.id,
          code: node.code,
          name: node.name,
          level: node.level || 1,
          sortIndex: index + 1
        }
      })
      .filter(Boolean)

    list.push({
      parentId: parentNode ? parentNode.id : '__root__',
      parentCode: parentNode ? parentNode.code : 'ROOT',
      parentName: parentNode ? parentNode.name : '根节点',
      parentLevel: parentNode ? (parentNode.level || 1) : 0,
      orderedChildIds: orderedChildren.map(item => item.id),
      orderedChildren
    })
    return list
  }, [])

  return {
    changedParents,
    changedParentCount: changedParents.length,
    changedNodeCount: changedParents.reduce((count, item) => count + item.orderedChildren.length, 0)
  }
}

export function buildIndicatorOrderSubmitPayload ({
  rootId = '',
  baseTree = [],
  currentTree = []
} = {}) {
  const draft = buildIndicatorOrderDraft(baseTree, currentTree)

  return {
    rootId,
    changeMode: 'same-parent-sort',
    changedParentCount: draft.changedParentCount,
    changedNodeCount: draft.changedNodeCount,
    submittedAt: new Date().toISOString(),
    changes: draft.changedParents.map(parent => ({
      parentId: parent.parentId,
      parentCode: parent.parentCode,
      parentName: parent.parentName,
      parentLevel: parent.parentLevel,
      orderedChildIds: parent.orderedChildIds,
      orderedChildren: parent.orderedChildren.map(item => ({
        id: item.id,
        code: item.code,
        name: item.name,
        level: item.level,
        sortIndex: item.sortIndex
      }))
    }))
  }
}
