export const INDICATOR_STATUS_META = {
  enabled: {
    text: '正常',
    tagType: 'success'
  },
  warning: {
    text: '待检查',
    tagType: 'warning'
  },
  disabled: {
    text: '已停用',
    tagType: 'info'
  }
}

export function getIndicatorStatusText (status) {
  return (INDICATOR_STATUS_META[status] && INDICATOR_STATUS_META[status].text) || '未知'
}

export function getIndicatorStatusType (status) {
  return (INDICATOR_STATUS_META[status] && INDICATOR_STATUS_META[status].tagType) || 'info'
}
