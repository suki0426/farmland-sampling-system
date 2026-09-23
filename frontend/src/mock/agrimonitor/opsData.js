/**
 * 数据库管理 —— 备份设置 / 备份记录 / 运维配置 演示数据（纯前端 mock）
 *
 * ⚠️⚠️ 重要：本文件与"数据库管理"页面**只做界面**。
 *   - 不连接数据库、不执行任何 SQL、不创建/删除/修改任何表或数据；
 *   - 页面上的"立即备份""恢复""保存配置"等按钮**不会**对数据库产生任何影响，
 *     它们只调用本文件的 mock 函数并在界面上给出提示；
 *   - 真实实现需要 4号（数据层）提供备份脚本与运维接口后，由 5号 封装成 REST 再接入。
 *     接入点已在本文件底部与页面注释中标明。
 */

import { mulberry32 } from './geoData'

function hashSeed (text) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** 备份设置（表单默认值） */
export function mockBackupSettings () {
  return {
    enabled: true,
    cron: '0 30 2 * * ?',                 // 每天 02:30
    cronText: '每天 02:30',
    mode: 'full',                         // full | incremental
    retentionDays: 30,                    // 保留天数
    maxCopies: 15,                        // 最多保留份数
    compress: true,
    encrypt: false,
    storage: 'local',                     // local | minio | oss
    storagePath: '/data/backup/mysql',
    storageBucket: '',
    includeTables: 'all',                 // all | selected
    selectedTables: [
      'd_device', 'sampling_point', 'sample_task',
      'monitor_record', 'warning_record', 'history_data'
    ],
    notifyOnFail: true,
    notifyChannels: ['mail'],
    notifyTo: ''
  }
}

/** 备份记录（历史） */
export function mockBackupRecords () {
  const rnd = mulberry32(hashSeed('backup-records'))
  const now = new Date('2026-09-17T02:30:00')
  const list = []
  for (let i = 0; i < 22; i++) {
    const t = new Date(now.getTime() - i * 86400000 - Math.floor(rnd() * 3600000))
    const failed = rnd() > 0.9
    const sizeMB = Math.round(120 + rnd() * 680)
    list.push({
      backupId: 'BK' + String(20260917000 + (22 - i)),
      fileName: `agriculture_${t.getFullYear()}${String(t.getMonth() + 1).padStart(2, '0')}${String(t.getDate()).padStart(2, '0')}_023000.sql.gz`,
      mode: i % 7 === 0 ? 'full' : 'incremental',
      trigger: i % 7 === 0 ? 'schedule' : 'schedule',   // schedule | manual
      status: failed ? 'failed' : 'success',
      sizeText: `${sizeMB} MB`,
      durationText: `${Math.round(8 + rnd() * 70)} s`,
      tableCount: 24,
      recordCount: Math.round(120000 + rnd() * 900000),
      storage: 'local',
      storagePath: '/data/backup/mysql',
      createTime: `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')} ` +
        `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}:${String(t.getSeconds()).padStart(2, '0')}`,
      operator: 'system',
      remark: failed ? '磁盘空间不足，备份中断' : ''
    })
  }
  return list
}

/** 运维配置（表单默认值） */
export function mockOpsConfig () {
  return {
    // 连接池
    pool: {
      maxActive: 50,
      minIdle: 5,
      maxWait: 6000,
      validationQuery: 'SELECT 1',
      testWhileIdle: true
    },
    // 慢查询
    slowQuery: {
      enabled: true,
      thresholdMs: 1000,
      logPath: '/data/logs/mysql-slow.log',
      autoAnalyze: true
    },
    // 监控告警
    monitor: {
      enabled: true,
      intervalSec: 30,
      cpuThreshold: 80,
      memThreshold: 85,
      diskThreshold: 85,
      connectionThreshold: 80,
      notifyChannels: ['mail', 'sms']
    },
    // 数据保留
    retention: {
      monitorRecordDays: 180,
      historyDataDays: 1095,
      logDays: 90,
      autoClean: true,
      cleanCron: '0 0 3 * * ?'
    },
    // 连接信息（只读展示，不回显真实密码）
    connection: {
      host: 'localhost',
      port: 3306,
      database: 'agriculture_sample',
      username: 'agri_app',
      passwordMasked: '••••••••',
      charset: 'utf8mb4',
      timezone: 'Asia/Shanghai'
    }
  }
}

/** 数据库健康概览（卡片展示） */
export function mockDbHealth () {
  return {
    status: 'healthy',
    version: 'MySQL 8.0.36',
    uptimeText: '37 天 6 小时',
    sizeText: '18.4 GB',
    tableCount: 24,
    connectionUsed: 17,
    connectionMax: 50,
    qps: 236,
    slowQueryCount24h: 3,
    threadRunning: 4,
    lastBackupTime: '2026-09-17 02:30:00',
    lastBackupStatus: 'success',
    nextBackupTime: '2026-09-18 02:30:00'
  }
}

/** 表清单（只读展示，用于"备份范围"选择） */
export function mockTables () {
  const rnd = mulberry32(hashSeed('tables'))
  const names = [
    ['d_device', '设备主数据'], ['sampling_point', '采样点'], ['sample_task', '采样任务'],
    ['monitor_record', '监测记录'], ['warning_record', '预警记录'], ['history_data', '历史归档'],
    ['farmland', '农田'], ['navigation_route', '导航路线'], ['device_track', '设备轨迹'],
    ['sys_user', '用户'], ['sys_role', '角色'], ['sys_menu', '菜单'],
    ['sys_dict_type', '字典类型'], ['sys_dict_value', '字典值'], ['sys_log', '操作日志'],
    ['sys_config', '系统配置'], ['analysis_cache', '统计缓存'], ['report_record', '报表记录'],
    ['ai_detect_record', 'AI 检测记录'], ['sensor_calibration', '传感器标定'],
    ['firmware_version', '固件版本'], ['device_maintenance', '设备维保'], ['alarm_rule', '预警规则'],
    ['data_sync_log', '数据同步日志']
  ]
  return names.map(([name, comment]) => ({
    name,
    comment,
    rows: Math.round(1200 + rnd() * 900000),
    sizeMB: Math.round(2 + rnd() * 1400),
    engine: 'InnoDB',
    collation: 'utf8mb4_general_ci',
    updatedAt: '2026-09-17 10:2' + Math.floor(rnd() * 9) + ':00'
  }))
}

/* ────────────────────────────────────────────────────────────────────────
 * 接入点（占位）——真实实现时由 5号 提供 REST，前端只替换这几个函数体
 *
 *   POST /ops/backup/run            { mode, storage }        -> { backupId, taskId }
 *   GET  /ops/backup/records        { current, size, status } -> IPage<BackupRecordDTO>
 *   POST /ops/backup/restore        { backupId, confirm }     -> { taskId }
 *   DELETE /ops/backup/delete       { ids }
 *   GET  /ops/backup/settings                                 -> BackupSettingsDTO
 *   POST /ops/backup/settings       BackupSettingsDTO
 *   GET  /ops/opsconfig/get                                   -> OpsConfigDTO
 *   POST /ops/opsconfig/save        OpsConfigDTO
 *   GET  /ops/db/health                                       -> DbHealthDTO
 *   GET  /ops/db/tables                                       -> List<TableDTO>
 *
 *   ⚠️ 这些接口**尚未冻结**，所以前端现在不发任何请求，只用 mock。
 *      与采样点写接口同样的处理原则：未冻结就不调，不做假设。
 * ──────────────────────────────────────────────────────────────────────── */

/** 演示：模拟"立即备份"（不会对数据库产生任何影响） */
export function mockRunBackup ({ mode = 'incremental' } = {}) {
  return new Promise(resolve => {
    window.setTimeout(() => {
      resolve({
        backupId: 'BK' + Date.now().toString().slice(-9),
        mode,
        status: 'success',
        sizeText: `${Math.round(60 + Math.random() * 420)} MB`,
        durationText: `${Math.round(6 + Math.random() * 40)} s`,
        createTime: '刚刚',
        simulated: true
      })
    }, 1200)
  })
}

export default {
  mockBackupSettings,
  mockBackupRecords,
  mockOpsConfig,
  mockDbHealth,
  mockTables,
  mockRunBackup
}
