/**
 * 地图适配层公共基类与常量（1号 前端GIS 岗位）
 *
 * 这个文件单独存在是为了**打断循环依赖**：
 *   mapAdapter.js（工厂） 需要 import AmapAdapter 与 VectorAdapter，
 *   而两个 Adapter 又需要 import 基类 BaseMapAdapter。
 *   如果基类留在 mapAdapter.js 里，就会形成
 *       mapAdapter → vectorAdapter → mapAdapter（求值中，BaseMapAdapter 尚未定义）
 *   于是 `class VectorAdapter extends BaseMapAdapter` 在运行时报
 *   "Uncaught TypeError: Super expression must either be null or a function"，整页白屏。
 *
 * 现在依赖方向是单向的：
 *   mapBase.js  ←  amapAdapter.js
 *   mapBase.js  ←  vectorAdapter.js
 *   mapBase.js  ←  mapAdapter.js  →  两个 Adapter
 * 没有任何环。
 */

export const MAP_PROVIDER = {
  AMAP: 'amap',
  VECTOR: 'vector'
}

/** 图层开关 key（与「图层管理」界面一一对应） */
export const LAYER = {
  BOUNDARY: 'boundary',
  SAMPLING_POINT: 'samplingPoint',
  DEVICE: 'device',
  ROUTE: 'route',
  TRAJECTORY: 'trajectory',
  GUIDANCE: 'guidance',
  LABEL: 'label'
}

/** 统一配色（采样点/设备/路线），两个实现共用，避免出现两套视觉常量 */
export const MAP_THEME = {
  boundaryStroke: '#2f7d32',
  boundaryFill: 'rgba(76, 175, 80, 0.18)',
  boundarySelectedStroke: '#1b5e20',
  boundarySelectedFill: 'rgba(76, 175, 80, 0.32)',
  holeStroke: '#b71c1c',
  holeFill: 'rgba(183, 28, 28, 0.12)',
  route: '#1565c0',
  routeArrow: '#1565c0',
  trajectory: ['#e65100', '#6a1b9a', '#00838f'],
  guidance: '#d81b60',
  pointPending: '#f9a825',
  pointSampled: '#2e7d32',
  pointSelected: '#c62828',
  pointStroke: '#ffffff',
  deviceOnline: '#1976d2',
  deviceOffline: '#9e9e9e',
  deviceFault: '#d32f2f',
  text: '#212121'
}

/** 设备轨迹配色（按设备索引循环） */
export function trajectoryColor (index) {
  return MAP_THEME.trajectory[index % MAP_THEME.trajectory.length]
}

/** 设备状态 -> 颜色 */
export function deviceColor (status) {
  switch (String(status || '').toLowerCase()) {
    case 'online': return MAP_THEME.deviceOnline
    case 'fault': return MAP_THEME.deviceFault
    default: return MAP_THEME.deviceOffline
  }
}

/**
 * 地图适配器基类：统一事件与图层可见性管理，子类实现具体绘制
 */
export class BaseMapAdapter {
  constructor () {
    this.listeners = {}
    this.layerVisible = {
      [LAYER.BOUNDARY]: true,
      [LAYER.SAMPLING_POINT]: true,
      [LAYER.DEVICE]: true,
      [LAYER.ROUTE]: true,
      [LAYER.TRAJECTORY]: true,
      [LAYER.GUIDANCE]: true,
      [LAYER.LABEL]: true
    }
    this.ready = false
    this.provider = ''
    this.providerLabel = ''
  }

  /** 注册事件：pointClick / deviceClick / mapClick / boundaryClick */
  on (event, handler) {
    if (typeof handler !== 'function') {
      return this
    }
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(handler)
    return this
  }

  emit (event, payload) {
    const handlers = this.listeners[event]
    if (!handlers) {
      return
    }
    handlers.forEach(fn => {
      try {
        fn(payload)
      } catch (e) {
        // 单个监听器异常不影响其他监听器
        console.error('[gis] map event handler error:', e)
      }
    })
  }

  isReady () {
    return this.ready
  }

  /** 图层是否可见 */
  isLayerVisible (key) {
    return this.layerVisible[key] !== false
  }

  setLayerVisible (key, visible) {
    this.layerVisible[key] = !!visible
    this.applyLayerVisibility()
  }

  /** 子类覆盖：根据 layerVisible 重绘/显隐 */
  applyLayerVisibility () {}

  /**
   * 定位到用户当前位置。
   * 默认走浏览器 Geolocation（拿到的是 WGS84 原始坐标），高德实现会覆盖为 AMap.Geolocation。
   * 返回对象里的 coordinateSystem 用于让上层做正确的坐标转换——不做默认假设。
   * @returns {Promise<{longitude:number, latitude:number, coordinateSystem:string, accuracy:number}>}
   */
  locateUser (options) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('当前浏览器不支持定位（navigator.geolocation 不可用）'))
        return
      }
      navigator.geolocation.getCurrentPosition(
        position => {
          resolve({
            longitude: position.coords.longitude,
            latitude: position.coords.latitude,
            coordinateSystem: 'WGS84',
            accuracy: position.coords.accuracy
          })
        },
        error => {
          reject(new Error(geolocationErrorMessage(error)))
        },
        Object.assign({
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 30000
        }, options || {})
      )
    })
  }

  /** 在地图上标出「我的位置」（子类实现） */
  setUserLocation () {}

  /** 子类必须实现 */
  init () { throw new Error('init() 未实现') }
  setBoundary () {}
  setSamplingPoints () {}
  setDevices () {}
  setRoute () {}
  setTrajectory () {}
  clearTrajectory () {}
  setGuidance () {}
  setPickMode () {}
  fitBounds () {}
  setCenterZoom () {}
  destroy () {}
}

/** Geolocation 错误码 -> 可读中文 */
export function geolocationErrorMessage (error) {
  const code = error && error.code
  if (code === 1) {
    return '定位被拒绝：浏览器未授权该站点获取位置，请在地址栏权限里允许定位后重试'
  }
  if (code === 2) {
    return '定位失败：当前设备无法获取位置信息（可能未开启系统定位）'
  }
  if (code === 3) {
    return '定位超时：8 秒内未取到位置，请重试或检查网络'
  }
  return `定位失败：${(error && error.message) || '未知原因'}`
}
