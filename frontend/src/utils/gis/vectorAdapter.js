/**
 * 内置离线矢量地图适配器（1号 前端GIS 岗位）
 *
 * 纯 Canvas 实现，不依赖任何在线地图服务与 Key：
 *  - 等距圆柱投影 + 纬度余弦修正，保证农田形状不走样
 *  - 支持滚轮缩放（以光标为锚点）、拖拽平移、自适应缩放到数据范围
 *  - 可绘制：农田边界/内环、采样点、设备（含朝向）、算法路线、历史轨迹、导航指引
 *  - 支持点选事件与空白处点击（供「手动选点」使用）
 *
 * 它的作用是保证「高德 Key 未配置 / 网络不通」时页面依旧可以完整演示，
 * 而不是替代高德；两个实现共用同一套字段与同一套图层接口。
 */

import { BaseMapAdapter, LAYER, MAP_THEME, trajectoryColor, deviceColor } from './mapBase'
import { extractRings, extractHoles, isSampled } from './geometry'

const METERS_PER_DEG_LAT = 110540
const METERS_PER_DEG_LNG = 111320

export default class VectorAdapter extends BaseMapAdapter {
  constructor () {
    super()
    this.provider = 'vector'
    this.providerLabel = '内置离线地图（未启用高德 Key）'
    this.container = null
    this.canvas = null
    this.ctx = null
    this.width = 0
    this.height = 0
    this.dpr = 1

    // 视图状态（世界坐标单位为米）
    this.centerX = 0
    this.centerY = 0
    this.scale = 0.05 // px / m

    this.baseLat = 0
    this.dataBounds = null

    this.boundary = null
    this.selectedFarmlandId = null
    this.points = []
    this.devices = []
    this.route = null
    this.trajectories = {}
    this.guidance = null
    this.userLocation = null

    this.pickMode = false
    this.hover = null
    this.rafId = null
    this.dragging = false
    this.dragMoved = false
    this.lastPointer = null
    this.resizeObserver = null

    this._onWheel = this._onWheel.bind(this)
    this._onMouseDown = this._onMouseDown.bind(this)
    this._onMouseMove = this._onMouseMove.bind(this)
    this._onMouseUp = this._onMouseUp.bind(this)
    this._onMouseLeave = this._onMouseLeave.bind(this)
    this._onResize = this._onResize.bind(this)
  }

  // ---------------------------------------------------------------- 生命周期
  init (container) {
    this.container = container
    if (!container) {
      return Promise.reject(new Error('地图容器不存在'))
    }
    this.canvas = document.createElement('canvas')
    this.canvas.style.display = 'block'
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    this.canvas.style.cursor = 'grab'
    container.appendChild(this.canvas)
    this.ctx = this.canvas.getContext('2d')

    container.addEventListener('wheel', this._onWheel, { passive: false })
    container.addEventListener('mousedown', this._onMouseDown)
    window.addEventListener('mousemove', this._onMouseMove)
    window.addEventListener('mouseup', this._onMouseUp)
    container.addEventListener('mouseleave', this._onMouseLeave)
    window.addEventListener('resize', this._onResize)

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(this._onResize)
      this.resizeObserver.observe(container)
    }

    this._onResize()
    this.ready = true
    return Promise.resolve(this)
  }

  destroy () {
    if (this.container) {
      this.container.removeEventListener('wheel', this._onWheel)
      this.container.removeEventListener('mousedown', this._onMouseDown)
      this.container.removeEventListener('mouseleave', this._onMouseLeave)
    }
    window.removeEventListener('mousemove', this._onMouseMove)
    window.removeEventListener('mouseup', this._onMouseUp)
    window.removeEventListener('resize', this._onResize)
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
    if (this.rafId) {
      window.cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas)
    }
    this.ready = false
    this.canvas = null
    this.ctx = null
    this.container = null
  }

  _onResize () {
    if (!this.container || !this.canvas) {
      return
    }
    const rect = this.container.getBoundingClientRect()
    this.dpr = window.devicePixelRatio || 1
    this.width = Math.max(1, Math.floor(rect.width))
    this.height = Math.max(1, Math.floor(rect.height))
    this.canvas.width = Math.floor(this.width * this.dpr)
    this.canvas.height = Math.floor(this.height * this.dpr)
    this.scheduleRender()
  }

  // ---------------------------------------------------------------- 投影
  /** 基准纬度：用数据平均纬度修正经度比例，避免高纬度地区横向拉伸 */
  _setBaseLat (lat) {
    if (isFinite(lat) && lat !== 0) {
      this.baseLat = lat
    }
  }

  _lngScale () {
    return METERS_PER_DEG_LNG * Math.cos((this.baseLat * Math.PI) / 180)
  }

  toWorld (lng, lat) {
    return {
      x: Number(lng) * this._lngScale(),
      y: -Number(lat) * METERS_PER_DEG_LAT
    }
  }

  toLngLat (x, y) {
    return {
      longitude: x / this._lngScale(),
      latitude: -y / METERS_PER_DEG_LAT
    }
  }

  toScreen (x, y) {
    return {
      sx: (x - this.centerX) * this.scale + this.width / 2,
      sy: (y - this.centerY) * this.scale + this.height / 2
    }
  }

  fromScreen (sx, sy) {
    return {
      x: (sx - this.width / 2) / this.scale + this.centerX,
      y: (sy - this.height / 2) / this.scale + this.centerY
    }
  }

  /** 把经纬度数组转成屏幕坐标数组 */
  _projectPath (coordinates) {
    const path = []
    ;(coordinates || []).forEach(c => {
      if (!Array.isArray(c)) {
        return
      }
      const [lng, lat] = this._cleanCoordinate(c)
      if (!isFinite(lng) || !isFinite(lat)) {
        return
      }
      const world = this.toWorld(lng, lat)
      const screen = this.toScreen(world.x, world.y)
      path.push(screen)
    })
    return path
  }

  /** 统一把内部坐标规范成 [lng, lat]；轨迹点是 {longitude, latitude} 对象 */
  _cleanCoordinate (item) {
    if (Array.isArray(item)) {
      return [Number(item[0]), Number(item[1])]
    }
    if (item && typeof item === 'object') {
      return [Number(item.longitude), Number(item.latitude)]
    }
    return [NaN, NaN]
  }

  // ---------------------------------------------------------------- 数据写入
  setBoundary (boundaryGeoJson, options = {}) {
    this.boundary = boundaryGeoJson || null
    this.selectedFarmlandId = options.selectedFarmlandId || null
    const rings = extractRings(this.boundary)
    if (rings.length && this.baseLat === 0) {
      const lat = Number(rings[0][0] && rings[0][0][1])
      this._setBaseLat(lat)
    }
    this.scheduleRender()
  }

  setSamplingPoints (points) {
    this.points = Array.isArray(points) ? points : []
    this.scheduleRender()
  }

  setDevices (devices) {
    this.devices = Array.isArray(devices) ? devices : []
    this.scheduleRender()
  }

  setRoute (route) {
    this.route = route || null
    this.scheduleRender()
  }

  setTrajectory (deviceId, points) {
    if (!deviceId) {
      return
    }
    this.trajectories[deviceId] = Array.isArray(points) ? points : []
    this.scheduleRender()
  }

  clearTrajectory (deviceId) {
    if (deviceId && this.trajectories[deviceId]) {
      delete this.trajectories[deviceId]
      this.scheduleRender()
    }
  }

  setGuidance (guidance) {
    this.guidance = guidance || null
    this.scheduleRender()
  }

  /** 「我的位置」标记（GCJ02） */
  setUserLocation (lngLat) {
    this.userLocation = (lngLat && isFinite(Number(lngLat.longitude)) && isFinite(Number(lngLat.latitude)))
      ? { longitude: Number(lngLat.longitude), latitude: Number(lngLat.latitude), accuracy: lngLat.accuracy }
      : null
    this.scheduleRender()
  }

  /** 手动选点模式：光标样式与提示 */
  setPickMode (pickMode) {
    this.pickMode = !!pickMode
    if (this.canvas) {
      this.canvas.style.cursor = this.pickMode ? 'crosshair' : 'grab'
    }
  }

  applyLayerVisibility () {
    this.scheduleRender()
  }

  // ---------------------------------------------------------------- 视图控制
  /** 收集所有需要纳入视野的坐标 */
  _collectCoordinates () {
    const coords = []
    extractRings(this.boundary).forEach(ring => ring.forEach(c => coords.push(c)))
    this.points.forEach(p => {
      const lng = Number(p.longitude)
      const lat = Number(p.latitude)
      if (isFinite(lng) && isFinite(lat)) {
        coords.push([lng, lat])
      }
    })
    this.devices.forEach(d => {
      const lng = Number(d.longitude)
      const lat = Number(d.latitude)
      if (isFinite(lng) && isFinite(lat)) {
        coords.push([lng, lat])
      }
    })
    Object.keys(this.trajectories).forEach(key => {
      ;(this.trajectories[key] || []).forEach(p => coords.push([Number(p.longitude), Number(p.latitude)]))
    })
    if (this.route && Array.isArray(this.route.coordinates)) {
      this.route.coordinates.forEach(c => coords.push(c))
    }
    return coords.filter(c => isFinite(Number(c[0])) && isFinite(Number(c[1])))
  }

  /** 自适应缩放到所有数据范围 */
  fitBounds (extraPadding = 60) {
    const coords = this._collectCoordinates()
    if (coords.length === 0 || !this.width || !this.height) {
      return
    }
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    coords.forEach(c => {
      const world = this.toWorld(c[0], c[1])
      if (world.x < minX) minX = world.x
      if (world.y < minY) minY = world.y
      if (world.x > maxX) maxX = world.x
      if (world.y > maxY) maxY = world.y
    })
    const spanX = Math.max(maxX - minX, 1)
    const spanY = Math.max(maxY - minY, 1)
    this.centerX = (minX + maxX) / 2
    this.centerY = (minY + maxY) / 2
    const usableW = Math.max(this.width - extraPadding * 2, 40)
    const usableH = Math.max(this.height - extraPadding * 2, 40)
    this.scale = Math.min(usableW / spanX, usableH / spanY)
    if (!isFinite(this.scale) || this.scale <= 0) {
      this.scale = 0.05
    }
    this.dataBounds = { minX, minY, maxX, maxY, spanX, spanY }
    this.scheduleRender()
  }

  /** 缩放到指定经纬度与层级（保持与高德接口一致，便于切换实现） */
  setCenterZoom (longitude, latitude, zoom) {
    const world = this.toWorld(longitude, latitude)
    this.centerX = world.x
    this.centerY = world.y
    if (isFinite(zoom) && zoom > 0) {
      this.scale = Math.pow(2, Number(zoom) - 16) * 0.9
    }
    this.scheduleRender()
  }

  // ---------------------------------------------------------------- 交互
  _onWheel (event) {
    event.preventDefault()
    const rect = this.container.getBoundingClientRect()
    const sx = event.clientX - rect.left
    const sy = event.clientY - rect.top
    const before = this.fromScreen(sx, sy)
    const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12
    const nextScale = Math.min(Math.max(this.scale * factor, 0.0005), 500000)
    this.scale = nextScale
    const after = this.fromScreen(sx, sy)
    // 保持光标下的地理点不动
    this.centerX += before.x - after.x
    this.centerY += before.y - after.y
    this.scheduleRender()
  }

  _onMouseDown (event) {
    if (event.button !== 0) {
      return
    }
    this.dragging = true
    this.dragMoved = false
    this.lastPointer = { x: event.clientX, y: event.clientY }
    if (this.canvas && !this.pickMode) {
      this.canvas.style.cursor = 'grabbing'
    }
  }

  _onMouseMove (event) {
    const rect = this.container ? this.container.getBoundingClientRect() : null
    if (rect) {
      const sx = event.clientX - rect.left
      const sy = event.clientY - rect.top
      const hit = this._hitTest(sx, sy)
      const changed = JSON.stringify(hit) !== JSON.stringify(this.hover)
      this.hover = hit
      if (this.canvas && !this.dragging) {
        this.canvas.style.cursor = this.pickMode ? 'crosshair' : (hit ? 'pointer' : 'grab')
      }
      if (changed) {
        this.scheduleRender()
      }
    }
    if (!this.dragging || !this.lastPointer) {
      return
    }
    const dx = event.clientX - this.lastPointer.x
    const dy = event.clientY - this.lastPointer.y
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      this.dragMoved = true
    }
    this.centerX -= dx / this.scale
    this.centerY -= dy / this.scale
    this.lastPointer = { x: event.clientX, y: event.clientY }
    this.scheduleRender()
  }

  _onMouseUp (event) {
    const wasDragging = this.dragging
    const moved = this.dragMoved
    this.dragging = false
    this.dragMoved = false
    if (this.canvas) {
      this.canvas.style.cursor = this.pickMode ? 'crosshair' : 'grab'
    }
    if (!wasDragging || moved || !this.container) {
      return
    }
    const rect = this.container.getBoundingClientRect()
    const sx = event.clientX - rect.left
    const sy = event.clientY - rect.top
    if (sx < 0 || sy < 0 || sx > this.width || sy > this.height) {
      return
    }
    const hit = this._hitTest(sx, sy)
    if (hit && hit.kind === 'point') {
      this.emit('pointClick', hit.data)
      return
    }
    if (hit && hit.kind === 'device') {
      this.emit('deviceClick', hit.data)
      return
    }
    const world = this.fromScreen(sx, sy)
    const lngLat = this.toLngLat(world.x, world.y)
    this.emit('mapClick', lngLat)
  }

  _onMouseLeave () {
    if (this.hover) {
      this.hover = null
      this.scheduleRender()
    }
  }

  /** 命中测试：返回最近的采样点或设备（12px 内） */
  _hitTest (sx, sy) {
    const threshold = 13
    let best = null
    if (this.isLayerVisible(LAYER.SAMPLING_POINT)) {
      this.points.forEach(p => {
        const world = this.toWorld(p.longitude, p.latitude)
        const screen = this.toScreen(world.x, world.y)
        const d = Math.hypot(screen.sx - sx, screen.sy - sy)
        if (d <= threshold && (!best || d < best.d)) {
          best = { kind: 'point', data: p, d }
        }
      })
    }
    if (this.isLayerVisible(LAYER.DEVICE)) {
      this.devices.forEach(dev => {
        const world = this.toWorld(dev.longitude, dev.latitude)
        const screen = this.toScreen(world.x, world.y)
        const d = Math.hypot(screen.sx - sx, screen.sy - sy)
        if (d <= threshold && (!best || d < best.d)) {
          best = { kind: 'device', data: dev, d }
        }
      })
    }
    if (!best) {
      return null
    }
    return { kind: best.kind, data: best.data }
  }

  // ---------------------------------------------------------------- 绘制
  scheduleRender () {
    if (this.rafId) {
      return
    }
    this.rafId = window.requestAnimationFrame(() => {
      this.rafId = null
      this.render()
    })
  }

  render () {
    const ctx = this.ctx
    if (!ctx) {
      return
    }
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    ctx.clearRect(0, 0, this.width, this.height)

    this._drawBackground(ctx)
    if (this.isLayerVisible(LAYER.BOUNDARY)) {
      this._drawBoundary(ctx)
    }
    if (this.isLayerVisible(LAYER.ROUTE)) {
      this._drawRoute(ctx)
    }
    if (this.isLayerVisible(LAYER.TRAJECTORY)) {
      this._drawTrajectories(ctx)
    }
    if (this.isLayerVisible(LAYER.GUIDANCE)) {
      this._drawGuidance(ctx)
    }
    if (this.isLayerVisible(LAYER.SAMPLING_POINT)) {
      this._drawSamplingPoints(ctx)
    }
    if (this.isLayerVisible(LAYER.DEVICE)) {
      this._drawDevices(ctx)
    }
    this._drawUserLocation(ctx)
    this._drawScaleBar(ctx)
    this._drawNorthArrow(ctx)

    if (!this.boundary && this.points.length === 0) {
      ctx.fillStyle = '#90a4ae'
      ctx.font = '14px "Microsoft YaHei", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('暂无农田边界数据', this.width / 2, this.height / 2)
      ctx.textAlign = 'start'
    }
  }

  _drawBackground (ctx) {
    ctx.fillStyle = '#eef4ea'
    ctx.fillRect(0, 0, this.width, this.height)

    // 网格：按比例尺选一个合适的经纬间隔，避免网格过密
    let step = 0.001
    const candidates = [0.0001, 0.0002, 0.0005, 0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1]
    for (let i = 0; i < candidates.length; i++) {
      const px = candidates[i] * this._lngScale() * this.scale
      if (px >= 70) {
        step = candidates[i]
        break
      }
      step = candidates[i]
    }

    const topLeft = this.fromScreen(0, 0)
    const bottomRight = this.fromScreen(this.width, this.height)
    const startLng = Math.floor(this.toLngLat(topLeft.x, topLeft.y).longitude / step) * step
    const endLng = this.toLngLat(bottomRight.x, bottomRight.y).longitude
    const startLat = this.toLngLat(bottomRight.x, bottomRight.y).latitude
    const endLat = this.toLngLat(topLeft.x, topLeft.y).latitude

    ctx.strokeStyle = 'rgba(120, 144, 156, 0.22)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let lng = startLng; lng <= endLng; lng += step) {
      const world = this.toWorld(lng, 0)
      const screen = this.toScreen(world.x, world.y)
      ctx.moveTo(screen.sx, 0)
      ctx.lineTo(screen.sx, this.height)
    }
    for (let lat = startLat; lat <= endLat; lat += step) {
      const world = this.toWorld(0, lat)
      const screen = this.toScreen(world.x, world.y)
      ctx.moveTo(0, screen.sy)
      ctx.lineTo(this.width, screen.sy)
    }
    ctx.stroke()
  }

  _drawBoundary (ctx) {
    const rings = extractRings(this.boundary)
    if (rings.length === 0) {
      return
    }
    const selected = !!this.selectedFarmlandId
    rings.forEach(ring => {
      const path = this._projectPath(ring)
      if (path.length < 3) {
        return
      }
      ctx.beginPath()
      path.forEach((p, i) => {
        if (i === 0) {
          ctx.moveTo(p.sx, p.sy)
        } else {
          ctx.lineTo(p.sx, p.sy)
        }
      })
      ctx.closePath()
      ctx.fillStyle = selected ? MAP_THEME.boundarySelectedFill : MAP_THEME.boundaryFill
      ctx.fill()
      ctx.lineWidth = selected ? 3 : 2
      ctx.strokeStyle = selected ? MAP_THEME.boundarySelectedStroke : MAP_THEME.boundaryStroke
      ctx.stroke()
    })

    // 内环（洞 / 禁入区）：作为「不采样区」可视化，与扩展任务 E3 对应
    extractHoles(this.boundary).forEach(hole => {
      const path = this._projectPath(hole)
      if (path.length < 3) {
        return
      }
      ctx.beginPath()
      path.forEach((p, i) => {
        if (i === 0) {
          ctx.moveTo(p.sx, p.sy)
        } else {
          ctx.lineTo(p.sx, p.sy)
        }
      })
      ctx.closePath()
      ctx.fillStyle = MAP_THEME.holeFill
      ctx.fill()
      ctx.setLineDash([6, 4])
      ctx.strokeStyle = MAP_THEME.holeStroke
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.setLineDash([])
    })
  }

  _drawRoute (ctx) {
    if (!this.route || !Array.isArray(this.route.coordinates) || this.route.coordinates.length < 2) {
      return
    }
    const path = this._projectPath(this.route.coordinates)
    this._strokePolyline(ctx, path, MAP_THEME.route, 3, [10, 6])
    this._drawArrowHeads(ctx, path, MAP_THEME.routeArrow)
    if (this.isLayerVisible(LAYER.LABEL)) {
      const ranked = this.route.orderedPoints || []
      ranked.forEach((point, index) => {
        const world = this.toWorld(point.longitude, point.latitude)
        const screen = this.toScreen(world.x, world.y)
        this._drawChip(ctx, screen.sx + 12, screen.sy - 12, `${index + 1}`, '#1565c0')
      })
    }
  }

  _drawTrajectories (ctx) {
    Object.keys(this.trajectories).forEach((deviceId, index) => {
      const points = this.trajectories[deviceId] || []
      if (points.length < 2) {
        return
      }
      const coords = points
        .map(p => [Number(p.longitude), Number(p.latitude)])
        .filter(c => isFinite(c[0]) && isFinite(c[1]))
      const path = this._projectPath(coords)
      this._strokePolyline(ctx, path, trajectoryColor(index), 2.5, [])
    })
  }

  _drawGuidance (ctx) {
    const guidance = this.guidance
    if (!guidance || !guidance.from || !guidance.to) {
      return
    }
    const fromWorld = this.toWorld(guidance.from.longitude, guidance.from.latitude)
    const toWorld = this.toWorld(guidance.to.longitude, guidance.to.latitude)
    const from = this.toScreen(fromWorld.x, fromWorld.y)
    const to = this.toScreen(toWorld.x, toWorld.y)

    ctx.save()
    ctx.setLineDash([8, 6])
    ctx.strokeStyle = MAP_THEME.guidance
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(from.sx, from.sy)
    ctx.lineTo(to.sx, to.sy)
    ctx.stroke()
    ctx.restore()
    this._drawArrowHeads(ctx, [from, to], MAP_THEME.guidance)

    if (this.isLayerVisible(LAYER.LABEL) && guidance.text) {
      const midX = (from.sx + to.sx) / 2
      const midY = (from.sy + to.sy) / 2
      this._drawChip(ctx, midX, midY - 18, guidance.text, MAP_THEME.guidance, true)
    }
  }

  _drawSamplingPoints (ctx) {
    this.points.forEach((point, index) => {
      const lng = Number(point.longitude)
      const lat = Number(point.latitude)
      if (!isFinite(lng) || !isFinite(lat)) {
        return
      }
      const world = this.toWorld(lng, lat)
      const screen = this.toScreen(world.x, world.y)
      const sampled = isSampled(point.status)
      const hovered = this.hover && this.hover.kind === 'point' &&
        this.hover.data && this.hover.data.samplingPointId === point.samplingPointId

      ctx.beginPath()
      ctx.arc(screen.sx, screen.sy, hovered ? 10 : 8, 0, Math.PI * 2)
      ctx.fillStyle = sampled ? MAP_THEME.pointSampled : MAP_THEME.pointPending
      ctx.fill()
      ctx.lineWidth = 2.5
      ctx.strokeStyle = MAP_THEME.pointStroke
      ctx.stroke()

      if (hovered) {
        ctx.beginPath()
        ctx.arc(screen.sx, screen.sy, 14, 0, Math.PI * 2)
        ctx.strokeStyle = MAP_THEME.pointSelected
        ctx.lineWidth = 2
        ctx.stroke()
      }
      // 已采样点中心画对勾
      if (sampled) {
        ctx.beginPath()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.moveTo(screen.sx - 3.5, screen.sy)
        ctx.lineTo(screen.sx - 1, screen.sy + 3)
        ctx.lineTo(screen.sx + 4, screen.sy - 3.5)
        ctx.stroke()
      }
      if (this.isLayerVisible(LAYER.LABEL)) {
        const label = point.pointCode || point.pointName || `P${index + 1}`
        this._drawText(ctx, screen.sx, screen.sy + 22, label, '#37474f', 'center')
      }
    })
  }

  _drawDevices (ctx) {
    this.devices.forEach(device => {
      const lng = Number(device.longitude)
      const lat = Number(device.latitude)
      if (!isFinite(lng) || !isFinite(lat)) {
        return
      }
      const world = this.toWorld(lng, lat)
      const screen = this.toScreen(world.x, world.y)
      const color = deviceColor(device.status)
      const hovered = this.hover && this.hover.kind === 'device' &&
        this.hover.data && this.hover.data.deviceId === device.deviceId

      // 外圈脉冲
      ctx.beginPath()
      ctx.arc(screen.sx, screen.sy, hovered ? 16 : 13, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(25, 118, 210, 0.15)'
      ctx.fill()

      // 朝向三角
      const heading = isFinite(Number(device.heading)) ? Number(device.heading) : 0
      const rad = ((heading - 90) * Math.PI) / 180
      ctx.beginPath()
      ctx.moveTo(screen.sx + Math.cos(rad) * 16, screen.sy + Math.sin(rad) * 16)
      ctx.lineTo(screen.sx + Math.cos(rad + 2.5) * 9, screen.sy + Math.sin(rad + 2.5) * 9)
      ctx.lineTo(screen.sx + Math.cos(rad - 2.5) * 9, screen.sy + Math.sin(rad - 2.5) * 9)
      ctx.closePath()
      ctx.fillStyle = color
      ctx.fill()

      ctx.beginPath()
      ctx.arc(screen.sx, screen.sy, 8, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
      ctx.lineWidth = 2.5
      ctx.strokeStyle = '#ffffff'
      ctx.stroke()

      if (this.isLayerVisible(LAYER.LABEL)) {
        this._drawText(ctx, screen.sx, screen.sy - 18, device.deviceCode || device.deviceName || '设备', color, 'center', true)
      }
    })
  }

  _strokePolyline (ctx, path, color, width, dash) {
    if (path.length < 2) {
      return
    }
    ctx.save()
    ctx.setLineDash(dash || [])
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.beginPath()
    path.forEach((p, i) => {
      if (i === 0) {
        ctx.moveTo(p.sx, p.sy)
      } else {
        ctx.lineTo(p.sx, p.sy)
      }
    })
    ctx.stroke()
    ctx.restore()
  }

  /** 在折线每一段中点画方向箭头，满足「以箭头提示行进方向」的要求 */
  _drawArrowHeads (ctx, path, color) {
    if (path.length < 2) {
      return
    }
    ctx.save()
    ctx.fillStyle = color
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1]
      const b = path[i]
      const dx = b.sx - a.sx
      const dy = b.sy - a.sy
      const len = Math.hypot(dx, dy)
      if (len < 40) {
        continue
      }
      const angle = Math.atan2(dy, dx)
      const mx = (a.sx + b.sx) / 2
      const my = (a.sy + b.sy) / 2
      ctx.beginPath()
      ctx.moveTo(mx + Math.cos(angle) * 7, my + Math.sin(angle) * 7)
      ctx.lineTo(mx + Math.cos(angle + 2.6) * 6, my + Math.sin(angle + 2.6) * 6)
      ctx.lineTo(mx + Math.cos(angle - 2.6) * 6, my + Math.sin(angle - 2.6) * 6)
      ctx.closePath()
      ctx.fill()
    }
    ctx.restore()
  }

  _drawChip (ctx, x, y, text, color, filled) {
    ctx.save()
    ctx.font = '12px "Microsoft YaHei", sans-serif'
    const width = ctx.measureText(text).width + 14
    const height = 20
    if (filled) {
      ctx.fillStyle = color
      ctx.fillRect(x - width / 2, y - height / 2, width, height)
      ctx.fillStyle = '#ffffff'
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.92)'
      ctx.fillRect(x - 9, y - 9, 18, 18)
      ctx.fillStyle = color
    }
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, x, y)
    ctx.restore()
  }

  _drawText (ctx, x, y, text, color, align, bold) {
    ctx.save()
    ctx.font = `${bold ? 'bold ' : ''}12px "Microsoft YaHei", sans-serif`
    ctx.textAlign = align || 'start'
    ctx.textBaseline = 'middle'
    ctx.lineWidth = 3
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'
    ctx.strokeText(text, x, y)
    ctx.fillStyle = color
    ctx.fillText(text, x, y)
    ctx.restore()
  }

  /** 「我的位置」：蓝点 + 精度圈，与采样终端区分开 */
  _drawUserLocation (ctx) {
    if (!this.userLocation) {
      return
    }
    const world = this.toWorld(this.userLocation.longitude, this.userLocation.latitude)
    const screen = this.toScreen(world.x, world.y)

    if (isFinite(this.userLocation.accuracy) && this.userLocation.accuracy > 0) {
      ctx.beginPath()
      ctx.arc(screen.sx, screen.sy, Math.max(6, this.userLocation.accuracy * this.scale), 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(2, 136, 209, 0.14)'
      ctx.fill()
    }

    ctx.beginPath()
    ctx.arc(screen.sx, screen.sy, 7, 0, Math.PI * 2)
    ctx.fillStyle = '#0288d1'
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = '#ffffff'
    ctx.stroke()

    if (this.isLayerVisible(LAYER.LABEL)) {
      this._drawText(ctx, screen.sx, screen.sy + 20, '我的位置', '#01579b', 'center', true)
    }
  }

  /** 比例尺：让离线地图也有空间尺度感 */
  _drawScaleBar (ctx) {
    const targetPx = 120
    const meters = targetPx / this.scale
    const nice = this._niceNumber(meters)
    const px = nice * this.scale
    const x = 16
    const y = this.height - 24
    ctx.save()
    ctx.strokeStyle = '#37474f'
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.lineWidth = 1.5
    ctx.fillRect(x - 6, y - 14, px + 60, 26)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + px, y)
    ctx.moveTo(x, y - 5)
    ctx.lineTo(x, y + 5)
    ctx.moveTo(x + px, y - 5)
    ctx.lineTo(x + px, y + 5)
    ctx.stroke()
    ctx.fillStyle = '#37474f'
    ctx.font = '12px "Microsoft YaHei", sans-serif'
    ctx.textBaseline = 'middle'
    ctx.fillText(nice >= 1000 ? `${(nice / 1000).toFixed(nice % 1000 === 0 ? 0 : 1)} km` : `${nice} m`, x + px + 8, y)
    ctx.restore()
  }

  _niceNumber (value) {
    if (!isFinite(value) || value <= 0) {
      return 1
    }
    const exponent = Math.floor(Math.log10(value))
    const base = Math.pow(10, exponent)
    const normalized = value / base
    let nice
    if (normalized <= 1) {
      nice = 1
    } else if (normalized <= 2) {
      nice = 2
    } else if (normalized <= 5) {
      nice = 5
    } else {
      nice = 10
    }
    return nice * base
  }

  _drawNorthArrow (ctx) {
    const x = this.width - 34
    const y = 34
    ctx.save()
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.beginPath()
    ctx.arc(x, y, 18, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(x, y - 12)
    ctx.lineTo(x - 6, y + 6)
    ctx.lineTo(x, y + 2)
    ctx.lineTo(x + 6, y + 6)
    ctx.closePath()
    ctx.fillStyle = '#c62828'
    ctx.fill()
    ctx.fillStyle = '#37474f'
    ctx.font = 'bold 10px "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('N', x, y + 14)
    ctx.restore()
  }
}
