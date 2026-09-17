/**
 * 统计分析模块 API Service（1号 前端GIS 岗位）
 *
 * 接口来源：字段与公共接口约束 V2.1 —— 3.2 / 7.2 / 6.2
 *  - GET /analysis/analysis/chart  AnalysisQueryDTO -> ChartDataDTO
 *    ChartDataDTO: columns: String[]、rows: List<Map<String,Object>>，首列为维度
 *
 * 前端只负责把 columns / rows 原样交给 ECharts（v-charts），不做二次列重命名。
 */

import request from '@/utils/httpRequest'

export default {
  /**
   * 图表数据
   * @param {object} params AnalysisQueryDTO
   *   farmlandId / samplingPointId / deviceId / taskId / metricCodes / startTime / endTime / granularity
   */
  chart (params) {
    return request({
      url: '/analysis/analysis/chart',
      method: 'get',
      params
    })
  },

  /** 统计汇总 */
  summary (params) {
    return request({
      url: '/analysis/analysis/summary',
      method: 'get',
      params
    })
  }
}
