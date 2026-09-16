export const INDICATOR_MIND_MAP_NODE_WIDTH = 218
export const INDICATOR_MIND_MAP_NODE_HEIGHT = 82
export const INDICATOR_MIND_MAP_LEVEL_GAP = 342
export const INDICATOR_MIND_MAP_ROW_GAP = 106
export const INDICATOR_MIND_MAP_NODE_SAFE_MARGIN = 36
export const INDICATOR_MIND_MAP_GRAPH_PADDING = 132

function toIdSet (ids = []) {
  return ids instanceof Set ? ids : new Set(ids || [])
}

function createVisibleNode (node, collapsedSet) {
  if (!node) return null

  const children = node.children || []
  return {
    ...node,
    _mindMapChildCount: children.length,
    children: collapsedSet.has(node.id)
      ? []
      : children.map(child => createVisibleNode(child, collapsedSet)).filter(Boolean)
  }
}

export function createVisibleIndicatorMindMapRoot (root, collapsedIds = []) {
  return createVisibleNode(root, toIdSet(collapsedIds))
}

export function buildIndicatorMindMapGraph (root, options = {}) {
  if (!root) {
    return { nodes: [], links: [], width: 0, height: 0 }
  }

  const visibleRoot = createVisibleIndicatorMindMapRoot(root, options.collapsedIds)
  if (!visibleRoot) {
    return { nodes: [], links: [], width: 0, height: 0 }
  }

  const nodes = []
  let cursor = 0
  let maxDepth = 0

  const walk = (node, depth) => {
    const children = node.children || []
    const item = {
      node,
      x: depth * INDICATOR_MIND_MAP_LEVEL_GAP,
      y: 0
    }
    maxDepth = Math.max(maxDepth, depth)

    if (children.length) {
      const childItems = children.map(child => walk(child, depth + 1))
      item.y = childItems.reduce((sum, child) => sum + child.y, 0) / childItems.length
    } else {
      item.y = cursor * INDICATOR_MIND_MAP_ROW_GAP
      cursor += 1
    }

    nodes.push(item)
    return item
  }

  walk(visibleRoot, 0)

  const minY = Math.min(...nodes.map(item => item.y))
  nodes.forEach(item => {
    item.x += INDICATOR_MIND_MAP_GRAPH_PADDING
    item.y = item.y - minY + INDICATOR_MIND_MAP_GRAPH_PADDING
  })

  const links = []
  nodes.forEach(item => {
    const children = item.node.children || []
    children.forEach(child => {
      const childItem = nodes.find(nodeItem => nodeItem.node.id === child.id)
      if (childItem) {
        links.push({
          id: `${item.node.id}-${child.id}`,
          fromId: item.node.id,
          toId: child.id,
          fromNode: item.node,
          toNode: child,
          path: createIndicatorMindMapLinkPath(item, childItem)
        })
      }
    })
  })

  return {
    nodes,
    links,
    width: maxDepth * INDICATOR_MIND_MAP_LEVEL_GAP + INDICATOR_MIND_MAP_NODE_WIDTH + INDICATOR_MIND_MAP_GRAPH_PADDING * 2,
    height: Math.max(
      cursor * INDICATOR_MIND_MAP_ROW_GAP + INDICATOR_MIND_MAP_GRAPH_PADDING * 2,
      INDICATOR_MIND_MAP_NODE_HEIGHT + INDICATOR_MIND_MAP_GRAPH_PADDING * 2
    )
  }
}

export function createIndicatorMindMapLinkPath (from, to) {
  const x1 = from.x + INDICATOR_MIND_MAP_NODE_WIDTH
  const y1 = from.y + INDICATOR_MIND_MAP_NODE_HEIGHT / 2
  const x2 = to.x
  const y2 = to.y + INDICATOR_MIND_MAP_NODE_HEIGHT / 2
  const gap = Math.max(24, x2 - x1)
  const curve = Math.min(80, Math.max(24, gap * 0.5))
  return `M ${x1} ${y1} C ${x1 + curve} ${y1}, ${x2 - curve} ${y2}, ${x2} ${y2}`
}

export function findIndicatorMindMapMatches (root, keyword) {
  const normalizedKeyword = String(keyword || '').trim().toLowerCase()
  if (!root || !normalizedKeyword) return []

  const matches = []
  const walk = node => {
    const code = String(node.code || '').toLowerCase()
    const name = String(node.name || '').toLowerCase()
    if (code.includes(normalizedKeyword) || name.includes(normalizedKeyword)) {
      matches.push(node)
    }

    ;(node.children || []).forEach(walk)
  }

  walk(root)
  return matches
}

export function getIndicatorMindMapNodeCenter (graph, nodeId) {
  const item = graph && graph.nodes
    ? graph.nodes.find(nodeItem => nodeItem.node.id === nodeId)
    : null
  if (!item) return null

  return {
    x: item.x + INDICATOR_MIND_MAP_NODE_WIDTH / 2,
    y: item.y + INDICATOR_MIND_MAP_NODE_HEIGHT / 2
  }
}

export function getIndicatorMindMapPathIds (path = []) {
  return path.map(node => node.id)
}

export function isIndicatorMindMapPathLink (link, pathIds = []) {
  if (!link || pathIds.length < 2) return false

  return pathIds.some((id, index) => (
    index < pathIds.length - 1 &&
    link.fromId === id &&
    link.toId === pathIds[index + 1]
  ))
}
