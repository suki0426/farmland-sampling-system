/**
 * 监测模块 API Service（1号 前端GIS 岗位）
 *
 * 接口来源：字段与公共接口约束 V2.1
 *  - 3.2 前端唯一允许调用：GET /monitor/monitorRecord/latestByPoint
 *        params: samplingPointId, metricCodes?  -> List<MonitorLatestDTO>
 *  - 7.2 / 6.2 历史查询与设备轨迹：GET /monitor/monitorRecord/history
 *        params: deviceId / samplingPointId / taskId / metricCode(s) / startTime / endTime / current / size
 *        -> IPage<MonitorRecordDTO>
 *
 * 说明（已登记到「接口问题单」）：
 *   3.2 的冻结清单里没有单列「设备轨迹」接口，而 1号 交付物要求展示历史轨迹。
 *   本模块按 6.2「设备轨迹：输入 deviceId + startTime + endTime，输出按 collectTime
 *   排序的坐标点」的规定，复用 7.2 的 /monitor/monitorRecord/history 获取轨迹。
 *   如果 5号 后续提供专用的轨迹接口，只需修改本文件的 trajectory() 一处实现。
 */

import request from '@/utils/httpRequest'

export default {
  /** 点位最新监测数据（5项采样指标） */
  latestByPoint (samplingPointId, metricCodes) {
    return request({
      url: '/monitor/monitorRecord/latestByPoint',
      method: 'get',
      params: {
        samplingPointId,
        metricCodes: Array.isArray(metricCodes) ? metricCodes.join(',') : metricCodes
      }
    })
  },

  /** 监测历史（分页） */
  history (params) {
    return request({
      url: '/monitor/monitorRecord/history',
      method: 'get',
      params
    })
  },

  /**
   * 设备历史轨迹：按 deviceId + 时间范围取一段坐标序列
   *
   * ⚠️ 排序字段必须是**数据库列名 `collect_time`**（v2.1 §2.2：请求 orders 走数据库字段，
   *    只有 DTO/JSON 用 camelCase；§6.3 要求排序字段走白名单）。
   *    此前误写成 `collectTime`，会被后端排序白名单拒绝或忽略（合并评审意见 #4）。
   *
   * ⚠️ 另一个未决契约问题：既有 MonitorRecordDTO **未冻结** longitude / latitude /
   *    coordinateSystem，真实历史记录里很可能没有坐标，前端过滤后轨迹会是空的。
   *    已登记为接口问题单 Q2，需 D/5号 冻结「历史轨迹 DTO」或提供专用轨迹接口。
   *    冻结之前本方法只按现有契约取数；取不到坐标时由页面**明确报错提示**，不静默返回空。
   */
  trajectory (deviceId, startTime, endTime, size = 500) {
    return request({
      url: '/monitor/monitorRecord/history',
      method: 'get',
      params: {
        deviceId,
        startTime,
        endTime,
        current: 1,
        size: size,
        orders: [{ column: 'collect_time', asc: true }]
      }
    })
  }
}
