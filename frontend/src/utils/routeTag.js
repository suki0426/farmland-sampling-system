export function getRouteTagKey (view = {}) {
  if (view.meta && view.meta.singleTab && view.path) {
    return view.path
  }
  return view.fullPath || view.path || view.name || ''
}

export function isSameRouteTag (left = {}, right = {}) {
  return getRouteTagKey(left) === getRouteTagKey(right)
}
