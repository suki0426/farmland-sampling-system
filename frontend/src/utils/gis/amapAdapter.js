/**
 * 高德地图适配器（1号 前端GIS 岗位）
 *
 * 正式方案：高德地图 JavaScript API 2.0。
 * 与 VectorAdapter 实现完全相同的接口，页面在两者之间切换时不需要改任何字段或逻辑。
 */

import { BaseMapAdapter, LAYER, MAP_THEME, trajectoryColor, deviceColor } from './mapBase'
import { extractRings, extractHoles, isSampled } from './geometry'
import { loadAMap } from './amapLoader'

export default class AmapAdapter extends BaseMapAdapter {
  constructor () {
    super()
    this.provider = 'amap'
    this.providerLabel = '高德地图 JS API 2.0'
    this.map = null
    this.AMap = null
    this.container = null

    this.boundaryOverlays = []
    this.holeOverlays = []
    this.pointOverlays = {}
    this.deviceOverlays = {}
    this.routeOverlays = []
    this.routeLabelOverlays = []
    this.trajectoryOverlays = {}
    this.guidanceOverlays = []

    this.points = []
    this.devices = []
    this.route = null
    this.boundary = null
    this.selectedFarmlandId = null
    this.trajectories = {}
    this.guidance = null
    this.pickMode = false
  }

  init (container, options = {}) {
    this.container = container
    if (!container) {
      return Promise.reject(new Error('地图容器不存在'))
    }
    return loadAMap(options.loaderOptions || {}).then(AMap => {
      this.AMap = AMap
      this.map = new AMap.Map(container, {
        zoom: options.zoom || 16,
        center: options.center || [112.4357, 38.0134],
        viewMode: '2D',
        resizeEnable: true,
        mapStyle: options.mapStyle || 'amap://styles/normal'
      })
      if (AMap.Scale) {
        this.map.addControl(new AMap.Scale())
      }
      if (AMap.ToolBar) {
        this.map.addControl(new AMap.ToolBar({ position: { right: '16px', bottom: '48px' } }))
      }
      this.map.on('click', e => {
        const lngLat = {
          longitude: Number(e.lnglat.getLng()),
          latitude: Number(e.lnglat.getLat())
        }
        this.emit('mapClick', lngLat)
      })
      this.ready = true
      return this
    })
  }

  destroy () {
    if (this.map) {
      this.map.clearMap()
      this.map.destroy()
    }
    this.map = null
    this.ready = false
  }

  isReady () {
    return this.ready && !!this.map
  }

  // ---------------------------------------------------------------- 工具
  _pixel (x, y) {
    return new this.AMap.Pixel(x, y)
  }

  _htmlMarker (position, html, offsetX, offsetY) {
    const marker = new this.AMap.Marker({
      position,
      content: html,
      offset: this._pixel(offsetX, offsetY),
      zIndex: 120
    })
    return marker
  }

  _clear (overlays) {
    if (Array.isArray(overlays) && overlays.length) {
      this.map.remove(overlays)
      overlays.length = 0
    }
  }

  // ---------------------------------------------------------------- 数据写入
  setBoundary (boundaryGeoJson, options = {}) {
    if (!this.isReady()) {
      return
    }
    this.boundary = boundaryGeoJson || null
    this.selectedFarmlandId = options.selectedFarmlandId || null
    this._clear(this.boundaryOverlays)
    this._clear(this.holeOverlays)

    if (!this.boundary) {
      return
    }
    const selected = !!this.selectedFarmlandId
    extractRings(this.boundary).forEach(ring => {
      const path = ring.map(c => [Number(c[0]), Number(c[1])])
      if (path.length < 3) {
        return
      }
      const polygon = new this.AMap.Polygon({
        path,
        strokeColor: selected ? MAP_THEME.boundarySelectedStroke : MAP_THEME.boundaryStroke,
        strokeWeight: selected ? 3 : 2,
        strokeOpacity: 1,
        fillColor: selected ? MAP_THEME.boundarySelectedFill : MAP_THEME.boundaryFill,
        fillOpacity: 1,
        zIndex: 50,
        bubble: true,
        cursor: 'pointer'
      })
      polygon.on('click', () => {
        this.emit('boundaryClick', { boundaryGeoJson: this.boundary })
      })
      this.boundaryOverlays.push(polygon)
    })

    // 内环按「不采样区」绘制（扩展任务 E3 的可视化）
    extractHoles(this.boundary).forEach(hole => {
      const path = hole.map(c => [Number(c[0]), Number(c[1])])
      if (path.length < 3) {
        return
      }
      this.holeOverlays.push(new this.AMap.Polygon({
        path,
        strokeColor: MAP_THEME.holeStroke,
        strokeWeight: 2,
        strokeStyle: 'dashed',
        fillColor: MAP_THEME.holeFill,
        fillOpacity: 1,
        zIndex: 60,
        bubble: true
      }))
    })

    this.map.add(this.boundaryOverlays.concat(this.holeOverlays))
    this.applyLayerVisibility()
  }

  setSamplingPoints (points) {
    if (!this.isReady()) {
      return
    }
    this.points = Array.isArray(points) ? points : []
    this._clear(Object.keys(this.pointOverlays).map(k => this.pointOverlays[k]))
    this.pointOverlays = {}

    this.points.forEach((point, index) => {
      const position = [Number(point.longitude), Number(point.latitude)]
      if (!isFinite(position[0]) || !isFinite(position[1])) {
        return
      }
      const sampled = isSampled(point.status)
      const color = sampled ? MAP_THEME.pointSampled : MAP_THEME.pointPending
      const label = point.pointCode || point.pointName || `P${index + 1}`
      const html = `<div class="gis-marker gis-marker-point" style="--gis-color:${color}">
          <div class="gis-marker-dot">${sampled ? '✓' : index + 1}</div>
          <div class="gis-marker-label">${this._escape(label)}</div>
        </div>`
      const marker = this._htmlMarker(position, html, -12, -12)
      marker.on('click', () => {
        this.emit('pointClick', point)
      })
      this.pointOverlays[point.samplingPointId || `idx-${index}`] = marker
    })
    const list = Object.keys(this.pointOverlays).map(k => this.pointOverlays[k])
    if (list.length) {
      this.map.add(list)
    }
    this.applyLayerVisibility()
  }

  setDevices (devices) {
    if (!this.isReady()) {
      return
    }
    this.devices = Array.isArray(devices) ? devices : []
    this._clear(Object.keys(this.deviceOverlays).map(k => this.deviceOverlays[k]))
    this.deviceOverlays = {}

    this.devices.forEach(device => {
      const position = [Number(device.longitude), Number(device.latitude)]
      if (!isFinite(position[0]) || !isFinite(position[1])) {
        return
      }
      const color = deviceColor(device.status)
      const heading = isFinite(Number(device.heading)) ? Number(device.heading) : 0
      const html = `<div class="gis-marker gis-marker-device" style="--gis-color:${color}">
          <div class="gis-marker-ring"></div>
          <div class="gis-marker-arrow" style="transform: rotate(${heading}deg)"></div>
          <div class="gis-marker-core"></div>
          <div class="gis-marker-label gis-marker-label-strong">${this._escape(device.deviceCode || device.deviceName || '设备')}</div>
        </div>`
      const marker = this._htmlMarker(position, html, -16, -16)
      marker.on('click', () => {
        this.emit('deviceClick', device)
      })
      this.deviceOverlays[device.deviceId || device.deviceCode] = marker
    })
    const list = Object.keys(this.deviceOverlays).map(k => this.deviceOverlays[k])
    if (list.length) {
      this.map.add(list)
    }
    this.applyLayerVisibility()
  }

  setRoute (route) {
    if (!this.isReady()) {
      return
    }
    this.route = route || null
    this._clear(this.routeOverlays)
    this._clear(this.routeLabelOverlays)
    if (!this.route || !Array.isArray(this.route.coordinates) || this.route.coordinates.length < 2) {
      return
    }
    const path = this.route.coordinates.map(c => [Number(c[0]), Number(c[1])])
    const polyline = new this.AMap.Polyline({
      path,
      strokeColor: MAP_THEME.route,
      strokeWeight: 4,
      strokeOpacity: 0.95,
      strokeStyle: 'dashed',
      strokeDasharray: [10, 6],
      showDir: true,
      lineJoin: 'round',
      zIndex: 100
    })
    this.routeOverlays.push(polyline)

    ;(this.route.orderedPoints || []).forEach((point, index) => {
      const text = new this.AMap.Text({
        text: String(index + 1),
        position: [Number(point.longitude), Number(point.latitude)],
        anchor: 'center',
        offset: this._pixel(14, -14),
        zIndex: 150,
        style: {
          'background-color': '#1565c0',
          'border-color': '#1565c0',
          color: '#fff',
          'border-radius': '50%',
          width: '18px',
          height: '18px',
          'line-height': '18px',
          'text-align': 'center',
          'font-size': '11px',
          padding: '0'
        }
      })
      this.routeLabelOverlays.push(text)
    })

    this.map.add(this.routeOverlays.concat(this.routeLabelOverlays))
    this.applyLayerVisibility()
  }

  setTrajectory (deviceId, points, options = {}) {
    if (!this.isReady() || !deviceId) {
      return
    }
    this.trajectories[deviceId] = Array.isArray(points) ? points : []
    if (this.trajectoryOverlays[deviceId]) {
      this.map.remove(this.trajectoryOverlays[deviceId])
      delete this.trajectoryOverlays[deviceId]
    }
    const coords = (points || [])
      .map(p => [Number(p.longitude), Number(p.latitude)])
      .filter(c => isFinite(c[0]) && isFinite(c[1]))
    if (coords.length < 2) {
      return
    }
    const index = options.colorIndex || Object.keys(this.trajectoryOverlays).length
    const polyline = new this.AMap.Polyline({
      path: coords,
      strokeColor: trajectoryColor(index),
      strokeWeight: 3,
      strokeOpacity: 0.9,
      lineJoin: 'round',
      zIndex: 90
    })
    this.trajectoryOverlays[deviceId] = polyline
    this.map.add(polyline)
    this.applyLayerVisibility()
  }

  clearTrajectory (deviceId) {
    if (!this.isReady()) {
      return
    }
    if (deviceId && this.trajectoryOverlays[deviceId]) {
      this.map.remove(this.trajectoryOverlays[deviceId])
      delete this.trajectoryOverlays[deviceId]
    }
    if (deviceId) {
      delete this.trajectories[deviceId]
    }
  }

  setGuidance (guidance) {
    if (!this.isReady()) {
      return
    }
    this.guidance = guidance || null
    this._clear(this.guidanceOverlays)
    if (!this.guidance || !this.guidance.from || !this.guidance.to) {
      return
    }
    const path = [
      [Number(this.guidance.from.longitude), Number(this.guidance.from.latitude)],
      [Number(this.guidance.to.longitude), Number(this.guidance.to.latitude)]
    ]
    this.guidanceOverlays.push(new this.AMap.Polyline({
      path,
      strokeColor: MAP_THEME.guidance,
      strokeWeight: 3,
      strokeStyle: 'dashed',
      strokeDasharray: [8, 6],
      showDir: true,
      zIndex: 130
    }))
    if (this.guidance.text) {
      this.guidanceOverlays.push(new this.AMap.Text({
        text: this.guidance.text,
        position: [
          (path[0][0] + path[1][0]) / 2,
          (path[0][1] + path[1][1]) / 2
        ],
        anchor: 'center',
        zIndex: 220,
        style: {
          'background-color': MAP_THEME.guidance,
          'border-color': MAP_THEME.guidance,
          color: '#fff',
          'border-radius': '10px',
          padding: '2px 8px',
          'font-size': '12px'
        }
      }))
    }
    this.map.add(this.guidanceOverlays)
    this.applyLayerVisibility()
  }

  setPickMode (pickMode) {
    this.pickMode = !!pickMode
    if (this.map) {
      this.map.setDefaultCursor(this.pickMode ? 'crosshair' : 'default')
    }
  }

  /**
   * 高德自带定位（AMap.Geolocation）。
   * 注意它返回的是 GCJ02 坐标，与浏览器原生 Geolocation（WGS84）不同，
   * 所以这里必须显式声明 coordinateSystem，交给上层决定是否转换。
   */
  locateUser () {
    if (!this.isReady() || !this.AMap || !this.AMap.Geolocation) {
      // 插件没加载成功时退回浏览器原生定位
      return super.locateUser()
    }
    return new Promise((resolve, reject) => {
      const geolocation = new this.AMap.Geolocation({
        enableHighAccuracy: true,
        timeout: 8000,
        showButton: false,
        showMarker: false,
        showCircle: false
      })
      geolocation.getCurrentPosition((status, result) => {
        if (status === 'complete' && result && result.position) {
          resolve({
            longitude: Number(result.position.lng),
            latitude: Number(result.position.lat),
            coordinateSystem: 'GCJ02',
            accuracy: Number(result.accuracy) || 0
          })
        } else {
          reject(new Error((result && result.message) || '高德定位失败'))
        }
      })
    })
  }

  /** 「我的位置」标记 */
  setUserLocation (lngLat) {
    if (!this.isReady()) {
      return
    }
    if (this.userMarker) {
      this.map.remove(this.userMarker)
      this.userMarker = null
    }
    if (!lngLat || !isFinite(Number(lngLat.longitude)) || !isFinite(Number(lngLat.latitude))) {
      return
    }
    const html = `<div class="gis-marker gis-marker-user">
        <div class="gis-marker-user-ring"></div>
        <div class="gis-marker-user-core"></div>
        <div class="gis-marker-label gis-marker-label-strong" style="color:#01579b">我的位置</div>
      </div>`
    this.userMarker = this._htmlMarker(
      [Number(lngLat.longitude), Number(lngLat.latitude)], html, -16, -16)
    this.map.add(this.userMarker)
  }

  applyLayerVisibility () {
    if (!this.isReady()) {
      return
    }
    const toggle = (overlays, visible) => {
      ;(overlays || []).forEach(overlay => {
        if (visible) {
          overlay.show()
        } else {
          overlay.hide()
        }
      })
    }
    toggle(this.boundaryOverlays, this.isLayerVisible(LAYER.BOUNDARY))
    toggle(this.holeOverlays, this.isLayerVisible(LAYER.BOUNDARY))
    toggle(Object.keys(this.pointOverlays).map(k => this.pointOverlays[k]), this.isLayerVisible(LAYER.SAMPLING_POINT))
    toggle(Object.keys(this.deviceOverlays).map(k => this.deviceOverlays[k]), this.isLayerVisible(LAYER.DEVICE))
    toggle(this.routeOverlays, this.isLayerVisible(LAYER.ROUTE))
    toggle(this.routeLabelOverlays, this.isLayerVisible(LAYER.ROUTE) && this.isLayerVisible(LAYER.LABEL))
    toggle(Object.keys(this.trajectoryOverlays).map(k => this.trajectoryOverlays[k]), this.isLayerVisible(LAYER.TRAJECTORY))
    toggle(this.guidanceOverlays, this.isLayerVisible(LAYER.GUIDANCE))
  }

  fitBounds () {
    if (!this.isReady()) {
      return
    }
    const overlays = []
      .concat(this.boundaryOverlays)
      .concat(this.holeOverlays)
      .concat(Object.keys(this.pointOverlays).map(k => this.pointOverlays[k]))
      .concat(Object.keys(this.deviceOverlays).map(k => this.deviceOverlays[k]))
      .concat(this.routeOverlays)
      .concat(Object.keys(this.trajectoryOverlays).map(k => this.trajectoryOverlays[k]))
    if (overlays.length === 0) {
      return
    }
    this.map.setFitView(overlays, false, [60, 60, 60, 60], 18)
  }

  setCenterZoom (longitude, latitude, zoom) {
    if (!this.isReady()) {
      return
    }
    this.map.setZoomAndCenter(zoom || 16, [Number(longitude), Number(latitude)])
  }

  _escape (text) {
    return String(text === undefined || text === null ? '' : text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }
}
