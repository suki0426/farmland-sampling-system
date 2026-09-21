<template>
  <div class="db-manage">
    <!-- ══════════ 醒目的安全声明 ══════════ -->
    <el-alert
      type="error"
      :closable="false"
      show-icon
      class="db-manage__safety"
      title="本页仅做界面演示，不会对数据库执行任何操作">
      <template slot="default">
        <div class="db-manage__safety-body">
          页面上的「立即备份」「恢复」「保存配置」「删除记录」等按钮<b>不会</b>连接数据库、
          <b>不会</b>执行任何 SQL、<b>不会</b>创建/修改/删除任何表或数据。
          真实备份与运维能力需由 <b>4号（数据层）</b>提供脚本、<b>5号</b>封装成 REST 后再接入；
          相关接口尚未冻结，因此前端现在只渲染界面、按钮均为禁用或仅作演示。
        </div>
      </template>
    </el-alert>

    <!-- ══════════ 数据库健康概览 ══════════ -->
    <div class="db-manage__health">
      <div v-for="h in healthCards" :key="h.label" class="health-card">
        <div class="health-card__label">{{ h.label }}</div>
        <div class="health-card__value" :style="{ color: h.color }">{{ h.value }}</div>
        <div class="health-card__sub">{{ h.sub }}</div>
      </div>
    </div>

    <!-- ══════════ 三个页签 ══════════ -->
    <el-tabs v-model="activeTab" type="border-card" class="db-manage__tabs">
      <!-- ────── 备份设置 ────── -->
      <el-tab-pane name="settings">
        <span slot="label"><i class="el-icon-setting"></i> 备份设置</span>

        <el-form :model="settings" label-width="120px" size="small" class="db-manage__form">
          <el-form-item label="启用自动备份">
            <el-switch v-model="settings.enabled" />
            <span class="db-manage__tip">关闭后仅支持手动备份</span>
          </el-form-item>

          <el-form-item label="备份周期">
            <el-input v-model="settings.cron" class="db-manage__input-sm" />
            <span class="db-manage__tip">{{ settings.cronText }}（Quartz 表达式）</span>
          </el-form-item>

          <el-form-item label="备份方式">
            <el-radio-group v-model="settings.mode">
              <el-radio label="full">全量备份</el-radio>
              <el-radio label="incremental">增量备份</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="保留策略">
            保留 <el-input-number v-model="settings.retentionDays" :min="1" :max="365" size="mini" :controls="false" class="db-manage__num" /> 天，
            最多 <el-input-number v-model="settings.maxCopies" :min="1" :max="100" size="mini" :controls="false" class="db-manage__num" /> 份
          </el-form-item>

          <el-form-item label="压缩 / 加密">
            <el-checkbox v-model="settings.compress">启用 gzip 压缩</el-checkbox>
            <el-checkbox v-model="settings.encrypt">启用加密</el-checkbox>
          </el-form-item>

          <el-form-item label="存储位置">
            <el-select v-model="settings.storage" class="db-manage__input-sm">
              <el-option label="本地磁盘" value="local" />
              <el-option label="MinIO" value="minio" />
              <el-option label="阿里云 OSS" value="oss" />
            </el-select>
            <el-input v-model="settings.storagePath" class="db-manage__input-lg" placeholder="/data/backup/mysql" />
          </el-form-item>

          <el-form-item label="备份范围">
            <el-radio-group v-model="settings.includeTables">
              <el-radio label="all">全部表（{{ tables.length }} 张）</el-radio>
              <el-radio label="selected">指定表</el-radio>
            </el-radio-group>
            <el-select
              v-if="settings.includeTables === 'selected'"
              v-model="settings.selectedTables"
              multiple
              collapse-tags
              class="db-manage__input-xl">
              <el-option v-for="t in tables" :key="t.name" :label="`${t.name}（${t.comment}）`" :value="t.name" />
            </el-select>
          </el-form-item>

          <el-form-item label="失败通知">
            <el-switch v-model="settings.notifyOnFail" />
            <el-checkbox-group v-model="settings.notifyChannels" class="db-manage__channels">
              <el-checkbox label="mail">邮件</el-checkbox>
              <el-checkbox label="sms">短信</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" size="small" @click="saveBlocked">保存设置</el-button>
            <el-button size="small" :loading="backing" icon="el-icon-refresh" @click="runBackupNow">立即备份（演示）</el-button>
            <el-button size="small" @click="resetSettings">恢复默认</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- ────── 备份记录 ────── -->
      <el-tab-pane name="records">
        <span slot="label"><i class="el-icon-time"></i> 备份记录</span>

        <div class="db-manage__toolbar">
          <el-select v-model="recordStatus" size="mini" class="db-manage__select" @change="refreshRecords">
            <el-option label="全部状态" value="" />
            <el-option label="成功" value="success" />
            <el-option label="失败" value="failed" />
          </el-select>
          <el-select v-model="recordMode" size="mini" class="db-manage__select" @change="refreshRecords">
            <el-option label="全部方式" value="" />
            <el-option label="全量" value="full" />
            <el-option label="增量" value="incremental" />
          </el-select>
          <el-button size="mini" icon="el-icon-refresh" @click="refreshRecords">刷新</el-button>
          <span class="db-manage__count">共 {{ records.length }} 条</span>
        </div>

        <el-table :data="records" size="mini" border height="360">
          <el-table-column label="备份编号" prop="backupId" width="140" />
          <el-table-column label="文件名" prop="fileName" min-width="280" show-overflow-tooltip />
          <el-table-column label="方式" width="80" align="center">
            <template slot-scope="scope">
              <el-tag size="mini" :type="scope.row.mode === 'full' ? 'primary' : 'info'" effect="plain">
                {{ scope.row.mode === 'full' ? '全量' : '增量' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="80" align="center">
            <template slot-scope="scope">
              <el-tag size="mini" :type="scope.row.status === 'success' ? 'success' : 'danger'">
                {{ scope.row.status === 'success' ? '成功' : '失败' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="大小" prop="sizeText" width="90" />
          <el-table-column label="耗时" prop="durationText" width="80" />
          <el-table-column label="记录数" prop="recordCount" width="100" />
          <el-table-column label="备份时间" prop="createTime" width="150" />
          <el-table-column label="备注" prop="remark" min-width="140" show-overflow-tooltip />
          <el-table-column label="操作" width="150" align="center" fixed="right">
            <template slot-scope="scope">
              <el-tooltip content="恢复功能需 4号/5号 提供接口，且属于高危操作，当前已禁用" placement="top">
                <span>
                  <el-button type="text" size="mini" disabled>恢复</el-button>
                </span>
              </el-tooltip>
              <el-button type="text" size="mini" @click="showBackupDetail(scope.row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ────── 运维配置 ────── -->
      <el-tab-pane name="ops">
        <span slot="label"><i class="el-icon-s-tools"></i> 运维配置</span>

        <div class="db-manage__ops">
          <el-card shadow="never" class="db-manage__op-card">
            <div slot="header">连接信息（只读展示，不回显真实密码）</div>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="主机">{{ ops.connection.host }}</el-descriptions-item>
              <el-descriptions-item label="端口">{{ ops.connection.port }}</el-descriptions-item>
              <el-descriptions-item label="数据库">{{ ops.connection.database }}</el-descriptions-item>
              <el-descriptions-item label="账号">{{ ops.connection.username }}</el-descriptions-item>
              <el-descriptions-item label="密码">{{ ops.connection.passwordMasked }}</el-descriptions-item>
              <el-descriptions-item label="字符集">{{ ops.connection.charset }}</el-descriptions-item>
              <el-descriptions-item label="时区">{{ ops.connection.timezone }}</el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-card shadow="never" class="db-manage__op-card">
            <div slot="header">连接池</div>
            <el-form :model="ops.pool" label-width="130px" size="mini">
              <el-form-item label="最大连接数"><el-input-number v-model="ops.pool.maxActive" :min="1" :max="500" size="mini" :controls="false" /></el-form-item>
              <el-form-item label="最小空闲连接"><el-input-number v-model="ops.pool.minIdle" :min="0" :max="100" size="mini" :controls="false" /></el-form-item>
              <el-form-item label="获取连接超时(ms)"><el-input-number v-model="ops.pool.maxWait" :min="100" :max="60000" size="mini" :controls="false" /></el-form-item>
              <el-form-item label="校验语句"><el-input v-model="ops.pool.validationQuery" class="db-manage__input-sm" /></el-form-item>
            </el-form>
          </el-card>

          <el-card shadow="never" class="db-manage__op-card">
            <div slot="header">慢查询</div>
            <el-form :model="ops.slowQuery" label-width="130px" size="mini">
              <el-form-item label="启用"><el-switch v-model="ops.slowQuery.enabled" /></el-form-item>
              <el-form-item label="阈值(ms)"><el-input-number v-model="ops.slowQuery.thresholdMs" :min="100" :max="10000" size="mini" :controls="false" /></el-form-item>
              <el-form-item label="日志路径"><el-input v-model="ops.slowQuery.logPath" class="db-manage__input-lg" /></el-form-item>
              <el-form-item label="自动分析"><el-switch v-model="ops.slowQuery.autoAnalyze" /></el-form-item>
            </el-form>
          </el-card>

          <el-card shadow="never" class="db-manage__op-card">
            <div slot="header">监控告警</div>
            <el-form :model="ops.monitor" label-width="130px" size="mini">
              <el-form-item label="启用"><el-switch v-model="ops.monitor.enabled" /></el-form-item>
              <el-form-item label="采集间隔(秒)"><el-input-number v-model="ops.monitor.intervalSec" :min="5" :max="300" size="mini" :controls="false" /></el-form-item>
              <el-form-item label="CPU 阈值(%)"><el-input-number v-model="ops.monitor.cpuThreshold" :min="10" :max="100" size="mini" :controls="false" /></el-form-item>
              <el-form-item label="内存阈值(%)"><el-input-number v-model="ops.monitor.memThreshold" :min="10" :max="100" size="mini" :controls="false" /></el-form-item>
              <el-form-item label="磁盘阈值(%)"><el-input-number v-model="ops.monitor.diskThreshold" :min="10" :max="100" size="mini" :controls="false" /></el-form-item>
              <el-form-item label="连接数阈值(%)"><el-input-number v-model="ops.monitor.connectionThreshold" :min="10" :max="100" size="mini" :controls="false" /></el-form-item>
            </el-form>
          </el-card>

          <el-card shadow="never" class="db-manage__op-card">
            <div slot="header">数据保留</div>
            <el-form :model="ops.retention" label-width="130px" size="mini">
              <el-form-item label="监测记录(天)"><el-input-number v-model="ops.retention.monitorRecordDays" :min="7" :max="3650" size="mini" :controls="false" /></el-form-item>
              <el-form-item label="历史归档(天)"><el-input-number v-model="ops.retention.historyDataDays" :min="30" :max="3650" size="mini" :controls="false" /></el-form-item>
              <el-form-item label="日志(天)"><el-input-number v-model="ops.retention.logDays" :min="7" :max="3650" size="mini" :controls="false" /></el-form-item>
              <el-form-item label="自动清理"><el-switch v-model="ops.retention.autoClean" /></el-form-item>
            </el-form>
          </el-card>
        </div>

        <div class="db-manage__ops-actions">
          <el-button type="primary" size="small" @click="saveBlocked">保存运维配置</el-button>
          <el-button size="small" @click="resetOps">恢复默认</el-button>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 备份详情 -->
    <el-dialog title="备份详情" :visible.sync="detailVisible" width="560px" append-to-body>
      <el-descriptions v-if="detailRecord" :column="1" border size="small">
        <el-descriptions-item label="备份编号">{{ detailRecord.backupId }}</el-descriptions-item>
        <el-descriptions-item label="文件名">{{ detailRecord.fileName }}</el-descriptions-item>
        <el-descriptions-item label="方式 / 状态">
          {{ detailRecord.mode === 'full' ? '全量' : '增量' }} /
          {{ detailRecord.status === 'success' ? '成功' : '失败' }}
        </el-descriptions-item>
        <el-descriptions-item label="大小 / 耗时">{{ detailRecord.sizeText }} / {{ detailRecord.durationText }}</el-descriptions-item>
        <el-descriptions-item label="表数量 / 记录数">{{ detailRecord.tableCount }} / {{ detailRecord.recordCount }}</el-descriptions-item>
        <el-descriptions-item label="存储位置">{{ detailRecord.storage }} · {{ detailRecord.storagePath }}</el-descriptions-item>
        <el-descriptions-item label="备份时间">{{ detailRecord.createTime }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ detailRecord.remark || '—' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script>
/**
 * 页面 3 —— 数据库管理（备份设置 / 备份记录 / 运维配置）
 *
 * ⚠️⚠️ 本页面**只做界面**，这是需求里明确要求的：
 *   「先做在我电脑上，不要传数据库或者对数据库做出更改」
 *
 *   因此：
 *   - 页面不发起任何数据库相关请求，不执行任何 SQL；
 *   - 「立即备份」调用的是本地 mock，只在前端显示一条记录，磁盘和数据库都不动；
 *   - 「恢复」「保存配置」「删除记录」等操作要么禁用并说明原因，要么只改本地表单值；
 *   - 真实能力需要 4号（数据层，备份脚本与运维查询）+ 5号（封装 REST）就绪后接入，
 *     接口清单与请求体格式已写在 `@/mock/agrimonitor/opsData.js` 底部的注释里。
 */
import {
  mockBackupSettings, mockBackupRecords, mockOpsConfig, mockDbHealth, mockTables, mockRunBackup
} from '@/mock/agrimonitor'

export default {
  name: 'DatabaseManage',
  data () {
    return {
      activeTab: 'settings',
      settings: mockBackupSettings(),
      ops: mockOpsConfig(),
      tables: [],
      records: [],
      recordStatus: '',
      recordMode: '',
      backing: false,
      detailVisible: false,
      detailRecord: null
    }
  },
  computed: {
    health () {
      return mockDbHealth()
    },
    healthCards () {
      const h = this.health
      return [
        { label: '运行状态', value: h.status === 'healthy' ? '健康' : h.status, sub: h.version, color: '#52c41a' },
        { label: '运行时长', value: h.uptimeText, sub: `数据库大小 ${h.sizeText}`, color: '#1890ff' },
        { label: '表数量', value: h.tableCount, sub: `QPS ${h.qps}`, color: '#722ed1' },
        { label: '连接数', value: `${h.connectionUsed}/${h.connectionMax}`, sub: `活跃线程 ${h.threadRunning}`, color: Number(h.connectionUsed) / Number(h.connectionMax) > 0.8 ? '#f5222d' : '#13c2c2' },
        { label: '24h 慢查询', value: h.slowQueryCount24h, sub: '阈值 1000ms', color: h.slowQueryCount24h > 10 ? '#fa8c16' : '#52c41a' },
        { label: '最近备份', value: h.lastBackupStatus === 'success' ? '成功' : '失败', sub: `下次 ${h.nextBackupTime.slice(5, 16)}`, color: h.lastBackupStatus === 'success' ? '#52c41a' : '#f5222d' }
      ]
    }
  },
  created () {
    this.tables = mockTables()
    this.refreshRecords()
  },
  methods: {
    refreshRecords () {
      let list = mockBackupRecords()
      if (this.recordStatus) {
        list = list.filter(r => r.status === this.recordStatus)
      }
      if (this.recordMode) {
        list = list.filter(r => r.mode === this.recordMode)
      }
      this.records = list
    },

    resetSettings () {
      this.settings = mockBackupSettings()
      this.$message.info('已恢复为默认值（仅本页表单）')
    },

    resetOps () {
      this.ops = mockOpsConfig()
      this.$message.info('已恢复为默认值（仅本页表单）')
    },

    /** 保存：接口未冻结，不发请求，明确告知 */
    saveBlocked () {
      this.$message.warning(
        '运维/备份接口尚未冻结：需要 4号 提供备份与运维能力、5号 封装 REST（见 opsData.js 底部接口清单）。' +
        '当前修改仅存在于本页表单，未写入任何地方。'
      )
    },

    /** 立即备份：调用前端 mock，不触碰数据库与磁盘 */
    async runBackupNow () {
      this.backing = true
      try {
        const res = await mockRunBackup({ mode: this.settings.mode })
        this.records.unshift({
          backupId: res.backupId,
          fileName: `agriculture_manual_${Date.now()}.sql.gz`,
          mode: res.mode,
          trigger: 'manual',
          status: 'success',
          sizeText: res.sizeText,
          durationText: res.durationText,
          tableCount: this.tables.length,
          recordCount: 0,
          storage: this.settings.storage,
          storagePath: this.settings.storagePath,
          createTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
          operator: '当前登录用户',
          remark: '演示记录（未真实执行备份）'
        })
        this.$message.success('已生成一条演示备份记录 —— 未对数据库或磁盘做任何操作')
      } finally {
        this.backing = false
      }
    },

    showBackupDetail (row) {
      this.detailRecord = row
      this.detailVisible = true
    }
  }
}
</script>

<style lang="scss" scoped>
.db-manage {
  padding: 10px 12px;
  background: #f2f5f7;
  min-height: 100%;

  &__safety {
    margin-bottom: 10px;
  }

  &__safety-body {
    line-height: 20px;
    font-size: 12px;
  }

  &__health {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 10px;
    margin-bottom: 10px;
  }

  &__tabs {
    border: none !important;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  }

  &__form {
    max-width: 760px;
  }

  &__tip {
    margin-left: 10px;
    color: #90a4ae;
    font-size: 12px;
  }

  &__input-sm { width: 180px; }
  &__input-lg { width: 260px; margin-left: 8px; }
  &__input-xl { width: 100%; margin-top: 6px; }
  &__num { width: 70px; }

  &__channels {
    display: inline-block;
    margin-left: 16px;
  }

  &__toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }

  &__select {
    width: 130px;
  }

  &__count {
    margin-left: auto;
    color: #90a4ae;
    font-size: 12px;
  }

  &__ops {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
    gap: 12px;
  }

  &__op-card {
    border: 1px solid #eceff1 !important;

    ::v-deep .el-card__header {
      padding: 8px 12px;
      font-size: 13px;
      font-weight: 600;
      color: #0d47a1;
      background: #f5faff;
    }

    ::v-deep .el-form-item {
      margin-bottom: 8px;
    }

    ::v-deep .el-input-number {
      width: 110px;
    }
  }

  &__ops-actions {
    margin-top: 12px;
  }
}

.health-card {
  padding: 10px;
  border: 1px solid #e4e9f0;
  border-radius: 4px;
  background: #fff;
  text-align: center;

  &__label {
    color: #90a4ae;
    font-size: 12px;
  }

  &__value {
    margin: 2px 0;
    font-size: 19px;
    font-weight: 700;
    font-family: Consolas, Monaco, monospace;
  }

  &__sub {
    color: #b0bec5;
    font-size: 11px;
  }
}
</style>
