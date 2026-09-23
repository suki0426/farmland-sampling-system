/**
 * 任务书条目对照表（首页大屏「任务书指标区」用）
 *
 * 内容**逐条摘自**课题任务书原文：
 *   `28-星穹耕界——基于北斗GIS与多终端协同的农田智能采样系统任务书`
 *   第 2 节（回传帧建议结构）、第 3 节（必做任务 M1~M4）、
 *   第 4 节（扩展任务 E1~E4）、第 5 节（测试用例与验收要点 T1~T5）。
 *
 * 每一条都标注了：
 *   - `owner`  任务书/分工里的负责岗位
 *   - `frontend` 1号（前端 GIS）在浏览器侧交付/呈现的部分
 *   - `evidence` 本页面或交付物里能当场验证的证据位置
 *
 * ⚠️ 只做"呈现与对照"，不代表前端实现了其他岗位的算法与入库逻辑。
 */

/* ───────────────────────── 必做任务 M1~M4 ───────────────────────── */

export const TASK_MODULES = [
  {
    key: 'M1',
    title: '采样点选取',
    requirement: '在农田范围内选择 3 至 4 个定位点作为采样点；采样点必须落在农田多边形内部，需做点在多边形内判定；每个采样点分配唯一采样点 ID，对应回传帧中 2B，取值 0 至 65535；采样点在地图上以标记显示。',
    owner: '3号 算法（布点） / 1号 前端（判定与标记）',
    frontend: '射线法 PIP 判定（支持凹多边形与内部禁入区），界外点直接拒绝；采样点唯一 ID 与地图标记',
    evidence: '农田 GIS 页「采样点 → 手动选点」；本页下方回传帧的「采样点ID」字段',
    status: 'done'
  },
  {
    key: 'M2',
    title: '遍历路线生成',
    requirement: '根据采样点生成一条遍历路线，要求尽量短，并在地图上以连线显示。',
    owner: '3号 算法（路径优化） / 5号 后端（下发） / 1号 前端（连线展示）',
    frontend: '按 routeGeoJson 原样绘制路线折线，展示 distance / durationSeconds；前端不含任何路径优化代码',
    evidence: '地区监控页「路线规划」标签；本页下方 E2 对比实验（仅实验，不参与业务链路）',
    status: 'done'
  },
  {
    key: 'M3',
    title: '路径指引与到达弹窗',
    requirement: '指引采样员前往下一个最近的未采样点，到达后以弹窗方式展示采样数据。要求动态计算下一个最近的未采样点并考虑当前位置；地图上以箭头、虚线或文字提示指引；到达后标记该点为已采样，弹窗展示土壤温度、土壤湿度、空气温度、空气湿度、土壤深度。',
    owner: '1号 前端（指引/状态/弹窗） / 2号 终端（上报）',
    frontend: '动态最近未采样点计算、虚线+箭头指引、到达改状态并弹出 5 项指标（含单位）',
    evidence: '农田 GIS 页「设备」标签 → 到达弹窗（5 项指标）',
    status: 'done'
  },
  {
    key: 'M4',
    title: '数据回传帧封装与入库',
    requirement: '将采样数据按指定帧结构封装，最终存储到数据库，并在历史数据界面展示。',
    owner: '2号 模拟器（封包） / 5号 后端（UDP 接收与入库） / 4号 数据库 / 1号 前端（历史数据界面）',
    frontend: '历史数据分页界面（按采样点/设备/指标/时间筛选）+ 统计图表；本页把 19B 帧结构可视化对照',
    evidence: '本页下方「回传帧」区：帧结构表 + 真实编码的十六进制 + CRC 校验演示',
    status: 'done'
  }
]

/* ───────────────────────── 扩展任务 E1~E4 ───────────────────────── */

export const EXTENDED_TASKS = [
  {
    key: 'E1',
    title: '布点策略效果评估实验',
    requirement: '设计一个"真实土壤养分分布场"（人为定义的空间函数，如两个高值区），用三种布点策略各取 20 个点，用插值（如 IDW 反距离权重）估计整个田块均值，与真值比较误差。',
    owner: '3号 算法为主，1号 前端提供可当场运行的评估面板',
    status: 'done',
    where: '本页「布点策略 E1」卡片'
  },
  {
    key: 'E2',
    title: '路线优化算法对比',
    requirement: '把最近邻、2-opt、模拟退火或遗传算法放在同一组点集上对比，绘制收敛曲线与最终距离，分析时间复杂度。',
    owner: '3号 算法为主，1号 前端提供对比可视化',
    status: 'done',
    where: '本页「路线算法 E2」卡片（前端复现，不参与生产路径）'
  },
  {
    key: 'E3',
    title: '采样区域约束（禁入区 / 不采样区）',
    requirement: '增加"禁入区"（如池塘、坟头）与"不采样区"，布点与路线都需避让。',
    owner: '3号 算法 / 1号 前端（禁入区绘制与拒绝提示）',
    status: 'done',
    where: '农田 GIS 页：红色斜纹禁入区，点选落进去直接拒绝；E1 实验场里的池塘同样参与了避让'
  },
  {
    key: 'E4',
    title: '多采样员并行',
    requirement: '模拟 2~3 名采样员同时工作，把采样点合理划分给不同人员（如按 Voronoi 分区或简单的地理聚类），最大化团队效率。',
    owner: '3号 算法',
    status: 'frontend-ready',
    where: '前端已支持同屏渲染多台设备的实时位置与各自指引虚线，算法给出分区结果即可直接展示'
  }
]

/* ───────────────────────── 测试用例 T1~T5 ───────────────────────── */

export const TEST_CASES = [
  {
    key: 'T1',
    title: '布点有效性',
    requirement: '对同一块多边形农田分别用三种策略布点，验证：所有点落在多边形内部（无界外点）、点间距符合设定、随机法的随机种子可复现（同种子两次结果完全一致）。',
    checks: [
      { name: '所有点落在田块内部', detail: '随机布点对界外/凹口/禁入区的点重新抽取', evidence: 'E1 卡片「界外点」列恒为 0' },
      { name: '点间距符合设定', detail: '统计最小间距与平均间距', evidence: 'E1 卡片「最小间距 / 平均间距」列' },
      { name: '随机种子可复现', detail: '同种子两次生成结果逐点一致', evidence: '命令行 tests/monitor/run.mjs 断言' }
    ],
    status: 'pass'
  },
  {
    key: 'T2',
    title: '导航指引正确性',
    requirement: '构造已知相对位置关系，看系统是否可以给出正确的最短路线。',
    checks: [
      { name: '动态最近未采样点', detail: '每台设备按自身当前位置独立计算', evidence: '农田 GIS 页地图上的指示线与设备、农田页的后续行' },
      { name: '到点状态切换', detail: '到达后状态由未采样改为已采样并弹窗', evidence: '农田 GIS 页「到达弹窗（5 项指标）」' }
    ],
    status: 'pass'
  },
  {
    key: 'T3',
    title: '采样记录导出',
    requirement: '完成 20 个点的采样与录入，导出记录表，核对点号、坐标、时间、录入内容完整无缺；未完成点清单正确。',
    checks: [
      { name: '记录字段完整性', detail: '点号 / 坐标 / 时间 / 5 项指标', evidence: '回传帧解码结果逐字段展示；历史数据界面可导出' }
    ],
    status: 'pass'
  },
  {
    key: 'T4',
    title: '（任务书未定义 T4）',
    requirement: '任务书「测试用例与验收要点」一节的编号为 T1、T2、T3、T5，**未定义 T4**。此处保留位置并明确标注，避免答辩时被误认为漏做。',
    checks: [],
    status: 'n/a'
  },
  {
    key: 'T5',
    title: '凹多边形地块',
    requirement: '用带凹口的地块验证布点与路线都不越界、不穿过禁入区域。',
    checks: [
      { name: '凹多边形 PIP 正确', detail: '射线法支持凹多边形，凹口内的点判定为外部', evidence: '命令行测试中的凹多边形与禁入区用例' },
      { name: '路线不穿禁入区', detail: '路线由算法侧保证，前端只负责绘制与提示', evidence: '农田 GIS 页地图：禁入区为红色斜纹' }
    ],
    status: 'pass'
  }
]

/* ───────────────────────── 汇总统计 ───────────────────────── */

export function taskSummary () {
  const all = TASK_MODULES.concat(EXTENDED_TASKS)
  return {
    total: all.length,
    done: all.filter(t => t.status === 'done').length,
    pending: all.filter(t => t.status !== 'done').length,
    tests: TEST_CASES.length,
    testsPass: TEST_CASES.filter(t => t.status === 'pass').length
  }
}

export default {
  TASK_MODULES,
  EXTENDED_TASKS,
  TEST_CASES,
  taskSummary
}
