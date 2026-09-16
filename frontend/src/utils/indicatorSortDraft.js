import { findIndicatorNode, validateIndicatorNodeMove } from '@/utils/indicatorTree'

export function createEmptyIndicatorDragState () {
  return {
    sourceId: '',
    targetId: '',
    dropPlacement: '',
    invalidReason: '',
    invalidMessage: ''
  }
}

export function resolveIndicatorMoveReasonMessage (reason) {
  switch (reason) {
    case 'root-locked':
      return '当前导图根节点是视图锚点，第一版不支持直接拖拽它。'
    case 'same-node':
      return '请拖拽到其他同级节点上。'
    case 'ancestor-descendant':
      return '不能拖到自己的上级或下级节点上。'
    case 'cross-parent':
      return '第一版仅支持同一父节点下的顺序调整。'
    default:
      return '未找到有效拖拽目标，请重新操作。'
  }
}

export function getIndicatorDragHintText ({
  dragState,
  treeData,
  hasPendingStructureChange,
  pendingChangeCount
}) {
  if (dragState.invalidMessage) {
    return dragState.invalidMessage
  }

  if (dragState.sourceId && dragState.targetId) {
    const sourceNode = findIndicatorNode(treeData, dragState.sourceId)
    const targetNode = findIndicatorNode(treeData, dragState.targetId)
    if (sourceNode && targetNode) {
      const placementText = dragState.dropPlacement === 'before' ? '前方' : '后方'
      return `释放后会把“${sourceNode.name}”移动到“${targetNode.name}”${placementText}。`
    }
  }

  if (hasPendingStructureChange) {
    return `当前有 ${pendingChangeCount} 项顺序调整待保存，可继续拖拽或直接提交草稿。`
  }

  return '拖拽同级节点到目标节点上即可重排，第一版暂不支持跨父级移动。'
}

export function createIndicatorStructureChangeEntry ({ sourceNode, targetNode, placement }) {
  return {
    sourceId: sourceNode.id,
    targetId: targetNode.id,
    placement,
    text: `已将“${sourceNode.name}”移动到“${targetNode.name}”${placement === 'before' ? '前方' : '后方'}`
  }
}

export function resolveIndicatorDropPlacement (event) {
  const targetRect = event.currentTarget && event.currentTarget.getBoundingClientRect
    ? event.currentTarget.getBoundingClientRect()
    : null
  if (!targetRect) return ''

  return event.clientY <= targetRect.top + targetRect.height / 2 ? 'before' : 'after'
}

export function resolveIndicatorDragTargetState ({
  treeData,
  dragState,
  targetId,
  dropPlacement = ''
}) {
  if (!dragState.sourceId) return dragState

  const validation = validateIndicatorNodeMove(treeData, dragState.sourceId, targetId)
  const invalidReason = validation.valid ? '' : validation.reason

  return {
    ...dragState,
    targetId,
    dropPlacement: validation.valid ? (dropPlacement || dragState.dropPlacement || 'after') : '',
    invalidReason,
    invalidMessage: validation.valid ? '' : resolveIndicatorMoveReasonMessage(invalidReason)
  }
}
