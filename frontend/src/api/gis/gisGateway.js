/**
 * GIS 数据网关（1号 前端GIS 岗位）
 *
 * 职责：把「调用 5号 REST 接口」和「降级到字段一致的 mock」收敛到一个地方。
 *
 * 为什么这样做（对应任务书的硬性要求）：
 *  - 「接口未完成时使用字段完全一致的 mock JSON；只替换 API Service 的调用实现，不重写页面字段」
 *    -> 页面只跟本网关打交道，后端就绪后不需要改任何页面代码。
 *  - 「验收标准：接口断开时有合理提示」
 *    -> 每次调用都会记录数据来源与失败原因，页面顶部据此给出可读提示。
 *  - 加了熔断（连续失败后短暂跳过真实请求），避免后端未启动时轮询把控制台刷爆、把界面拖慢。
 */

import farmlandService from '@/api/farmland/farmlandService'
import samplingPointService from '@/api/samplingpoint/samplingPointService'
import dDeviceGisService from '@/api/ddevice/dDeviceGisService'
import navigationRouteService from '@/api/navigation/navigationRouteService'
import monitorGisService from '@/api/monitor/monitorGisService'
import analysisGisService from '@/api/analysis/analysisGisService'
import gisMock from '@/mock/gis'

export const DATA_SOURCE = {
  API: 'api',
  MOCK: 'mock'
}

/** 熔断参数：同一个资源连续失败 N 次后，暂停 M 毫秒内的真实请求 */
const BREAKER_THRESHOLD = 2
const BREAKER_COOLDOWN_MS = 20000

/**
 * 单个 GIS 接口的等待上限。
 * axios 全局超时是 100 秒（见 shared/api/request.js），后端未启动时如果只是被防火墙
 * 丢包而不是立刻拒绝连接，页面会一直转圈等下去、既看不到数据也看不到错误提示。
 * 这里统一收口到 8 秒：超时即视为接口不可用，立刻降级并给出可读原因。
 */
const API_TIMEOUT_MS = 8000

/** 给 Promise 加超时，避免后端无响应时页面长时间空白 */
function withTimeout (promise, ms, label) {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`${label} 超过 ${ms}ms 无响应`))
    }, ms)
    promise.then(
      value => {
        window.clearTimeout(timer)
        resolve(value)
      },
      error => {
        window.clearTimeout(timer)
        reject(error)
      }
    )
  })
}

const RESOURCE_LABEL = {
  farmland: '农田/边界接口',
  samplingPoint: '采样点接口',
  device: '设备接口',
  route: '路线接口',
  monitor: '监测接口',
  trajectory: '轨迹接口',
  history: '监测历史接口',
  analysis: '统计接口'
}

/** 取出 axios 响应里的业务数据（后端成功直接返回 ResponseEntity<T>，没有 code/msg/data 包装） */
function unwrap (response) {
  if (response && typeof response === 'object' && 'data' in response && response.data !== undefined) {
    return response.data
  }
  return response
}

/** 把「一个指标一行」的监测数据归一成 5 项指标的扁平对象 */
export function normalizeLatestMonitor (payload) {
  const result = {}
  if (!payload) {
    return result
  }
  if (Array.isArray(payload)) {
    payload.forEach(item => {
      if (item && item.metricCode !== undefined && item.metricCode !== null) {
        result[item.metricCode] = item.metricValue
      } else if (item && item.soilMoisture !== undefined) {
        Object.assign(result, item)
      }
    })
    return result
  }
  if (typeof payload === 'object') {
    Object.assign(result, payload)
  }
  return result
}

/** 轨迹/历史记录归一：保证每条含 longitude / latitude / coordinateSystem / collectTime */
export function normalizeTrajectory (payload) {
  const records = Array.isArray(payload)
    ? payload
    : (payload && Array.isArray(payload.records) ? payload.records : [])
  return records
    .filter(r => r && isFinite(Number(r.longitude)) && isFinite(Number(r.latitude)))
    .map(r => ({
      deviceId: r.deviceId,
      longitude: Number(r.longitude),
      latitude: Number(r.latitude),
      coordinateSystem: r.coordinateSystem,
      collectTime: r.collectTime
    }))
}

export function createGisGateway (options = {}) {
  const state = {
    fallbackEnabled: options.fallbackEnabled !== false,
    diagnostics: {},
    breaker: {}
  }

  /** 记录一次调用结果，供页面展示「数据来源 / 失败原因」 */
  function record (resource, source, ok, message) {
    state.diagnostics[resource] = {
      resource,
      label: RESOURCE_LABEL[resource] || resource,
      source,
      ok,
      message: message || '',
      at: Date.now()
    }
  }

  function breakerOpen (resource) {
    const entry = state.breaker[resource]
    if (!entry) {
      return false
    }
    if (Date.now() - entry.at > BREAKER_COOLDOWN_MS) {
      delete state.breaker[resource]
      return false
    }
    return entry.count >= BREAKER_THRESHOLD
  }

  function markFailure (resource) {
    const entry = state.breaker[resource] || { count: 0, at: 0 }
    entry.count += 1
    entry.at = Date.now()
    state.breaker[resource] = entry
  }

  /**
   * 统一调用包装：先试真实接口，失败则按需降级到 mock
   * @param {string} resource 资源标识（用于诊断与熔断）
   * @param {Function} apiCall 返回 Promise 的真实接口调用
   * @param {Function} mockCall 返回 Promise 的 mock 调用
   * @param {object} opts { silent: 不记录诊断 }
   */
  async function call (resource, apiCall, mockCall, opts = {}) {
    // 熔断打开：直接走 mock，避免无谓的失败请求
    if (breakerOpen(resource)) {
      if (state.fallbackEnabled && mockCall) {
        const data = await mockCall()
        record(resource, DATA_SOURCE.MOCK, true, '后端接口多次失败，已临时切换到模拟数据（20 秒后自动重试）')
        return data
      }
    }
    try {
      const data = unwrap(await withTimeout(
        Promise.resolve().then(apiCall),
        opts.timeout || API_TIMEOUT_MS,
        RESOURCE_LABEL[resource] || resource
      ))
      record(resource, DATA_SOURCE.API, true, '')
      // 成功一次即重置熔断计数
      delete state.breaker[resource]
      return data
    } catch (error) {
      markFailure(resource)
      if (state.fallbackEnabled && mockCall) {
        const data = await mockCall()
        record(resource, DATA_SOURCE.MOCK, true, describeError(error))
        return data
      }
      record(resource, DATA_SOURCE.API, false, describeError(error))
      throw error
    }
  }

  function describeError (error) {
    if (!error) {
      return '接口调用失败'
    }
    const response = error.response
    if (!response) {
      return '无法连接后端服务（请确认 5号 后端已启动、代理地址正确），已使用模拟数据'
    }
    return `接口返回 ${response.status}，已使用模拟数据`
  }

  return {
    // ------------------------------------------------------------ 农田
    loadFarmlands () {
      return call('farmland',
        () => farmlandService.list({ current: 1, size: 50 }),
        () => gisMock.farmlandList())
    },

    loadFarmlandBrief (ids) {
      return call('farmland',
        () => farmlandService.briefByIds(ids),
        () => gisMock.farmlandBriefByIds(ids))
    },

    // ------------------------------------------------------------ 采样点
    loadSamplingPoints (farmlandId, status) {
      return call('samplingPoint',
        () => samplingPointService.mapData(farmlandId, status),
        () => gisMock.samplingPoints(farmlandId))
    },

    /** 保存手动选点（失败时不伪造成功，明确告诉用户没存进后端） */
    saveManualPoints (farmlandId, points, taskId) {
      const payload = {
        farmlandId,
        taskId,
        points: points.map(p => ({
          farmlandId: p.farmlandId || farmlandId,
          pointCode: p.pointCode,
          pointName: p.pointName,
          longitude: p.longitude,
          latitude: p.latitude,
          coordinateSystem: p.coordinateSystem,
          status: p.status
        }))
      }
      return call('samplingPoint',
        () => samplingPointService.saveBatch(payload),
        null)
    },

    // ------------------------------------------------------------ 设备
    loadDevices () {
      return call('device',
        () => dDeviceGisService.listUsable({}),
        () => gisMock.devices())
    },

    loadDeviceBrief (ids) {
      return call('device',
        () => dDeviceGisService.briefByIds(ids),
        () => gisMock.devices())
    },

    // ------------------------------------------------------------ 路线
    loadRoute (taskId) {
      return call('route',
        () => navigationRouteService.byTaskId(taskId),
        () => gisMock.route(taskId))
    },

    // ------------------------------------------------------------ 监测
    loadLatestByPoint (samplingPointId) {
      return call('monitor',
        () => monitorGisService.latestByPoint(samplingPointId),
        () => gisMock.latestByPoint(samplingPointId))
    },

    // ------------------------------------------------------------ 轨迹
    loadTrajectory (deviceId) {
      return call('trajectory',
        () => monitorGisService.trajectory(deviceId),
        () => gisMock.trajectory(deviceId))
    },

    /**
     * 监测历史分页（M4「历史数据界面展示」）
     * @param {object} params deviceId / samplingPointId / taskId / metricCode / startTime / endTime / current / size
     */
    loadHistory (params) {
      return call('history',
        () => monitorGisService.history(params),
        () => gisMock.history(params))
    },

    // ------------------------------------------------------------ 统计
    loadChart (params) {
      return call('analysis',
        () => analysisGisService.chart(params),
        () => gisMock.chart())
    },

    /** 当前诊断信息（页面用来显示数据来源与错误提示） */
    getDiagnostics () {
      return Object.keys(state.diagnostics).map(key => state.diagnostics[key])
    },

    /** 是否存在降级：有任一资源来自 mock，或调用失败 */
    hasFallback () {
      return Object.keys(state.diagnostics).some(key => {
        const item = state.diagnostics[key]
        return item.source === DATA_SOURCE.MOCK || item.ok === false
      })
    },

    setFallbackEnabled (enabled) {
      state.fallbackEnabled = !!enabled
    },

    isFallbackEnabled () {
      return state.fallbackEnabled
    },

    resetDiagnostics () {
      state.diagnostics = {}
      state.breaker = {}
    }
  }
}

const defaultGateway = createGisGateway()

export default defaultGateway
