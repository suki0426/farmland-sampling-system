import {
  cloneIndicatorTree,
  findIndicatorPath,
  getFirstIndicatorId
} from '@/utils/indicatorTree'
import { createEmptyIndicatorDragState } from '@/utils/indicatorSortDraft'

export function createIndicatorMindMapLoadState (treeData = [], queryId = '') {
  const firstId = getFirstIndicatorId(treeData)
  const queryPath = queryId ? findIndicatorPath(treeData, queryId) : []
  const selectedId = queryPath.length ? queryId : firstId

  return {
    treeData,
    rootId: queryPath.length ? queryPath[0].id : firstId,
    selectedId,
    keyword: '',
    activeMatchIndex: 0,
    collapsedNodeIds: [],
    maintenanceEnabled: false,
    savedTreeDataSnapshot: cloneIndicatorTree(treeData),
    lastSavedStructurePayload: null,
    structureChangeLog: [],
    dragState: createEmptyIndicatorDragState(),
    focusNodeId: queryPath.length > 1 ? selectedId : '',
    shouldCenterRoot: queryPath.length <= 1
  }
}

export function getFirstIndicatorMatchIndex (matchedNodes = []) {
  return matchedNodes.length ? 0 : -1
}

export function getPreviousIndicatorMatchIndex (activeMatchIndex, matchedNodes = []) {
  if (!matchedNodes.length) return -1
  return activeMatchIndex <= 0 ? matchedNodes.length - 1 : activeMatchIndex - 1
}

export function getNextIndicatorMatchIndex (activeMatchIndex, matchedNodes = []) {
  if (!matchedNodes.length) return -1
  return activeMatchIndex >= matchedNodes.length - 1 ? 0 : activeMatchIndex + 1
}

export function getIndicatorMatchFocusTarget (matchedNodes = [], index = 0) {
  return matchedNodes[index] || null
}

export function createIndicatorLeafEditForm (node = {}) {
  return {
    id: node.id || '',
    name: node.name || '',
    weight: node.weight || '',
    description: node.description || ''
  }
}

export function applyIndicatorLeafEdit (treeData = [], record = {}) {
  return (treeData || []).map(node => {
    if (node.id === record.id) {
      return {
        ...node,
        name: record.name,
        description: record.description,
        weight: record.weight,
        status: record.status || node.status,
        updatedAt: record.updatedAt || node.updatedAt
      }
    }

    return {
      ...node,
      children: node.children && node.children.length
        ? applyIndicatorLeafEdit(node.children, record)
        : node.children
    }
  })
}
