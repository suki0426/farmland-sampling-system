<template>
  <div class="warning-center">
    <div class="warning-center__stats">
      <div v-for="s in stats" :key="s.label" class="warning-center__stat">
        <div class="warning-center__stat-value" :style="{ color: s.color }">{{ s.value }}</div>
        <div class="warning-center__stat-label">{{ s.label }}</div>
      </div>
    </div>

    <div class="warning-center__toolbar">
      <el-radio-group v-model="sourceFilter" size="mini">
        <el-radio-button label="">全部来源</el-radio-button>
        <el-radio-button label="auto">自动预警</el-radio-button>
        <el-radio-button label="manual">手动添加</el-radio-button>
      </el-radio-group>
      <el-select v-model="statusFilter" size="mini" class="warning-center__select" placeholder="状态">
        <el-option label="全部状态" value="" />
        <el-option label="未关闭" value="open" />
        <el-option label="已关闭" value="closed" />
      </el-select>
      <el-select v-model="levelFilter" size="mini" class="warning-center__select" placeholder="级别">
        <el-option label="全部级别" value="" />
        <el-option v-for="l in levels" :key="l.code" :label="l.label" :value="l.code" />
      </el-select>
      <el-button size="mini" type="primary" icon="el-icon-plus" @click="openAdd">手动添加预警</el-button>
      <el-button size="mini" icon="el-icon-refresh" @click="reload">刷新</el-button>
      <span class="warning-center__count">共 {{ filtered.length }} 条</span>
    </div>

    <el-alert
      type="info"
      :closable="false"
      show-icon
      class="warning-center__note"
      title="「自动预警」由后端规则引擎在数据入库时触发（前端只展示）；「手动添加」在本页即时可见，未写入任何数据库 —— 入库等 5号 冻结预警写接口后再接入。" />

    <el-table :data="filtered" size="mini" border height="330">
      <el-table-column label="来源" width="90" align="center">
        <template slot-scope="scope">
          <el-tag size="mini" :type="scope.row.source === 'auto' ? 'success' : 'warning'" effect="plain">
            {{ scope.row.source === 'auto' ? '自动触发' : '手动添加' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="类型" prop="typeLabel" width="110" />
      <el-table-column label="级别" width="80" align="center">
        <template slot-scope="scope">
          <el-tag size="mini" :style="{ background: levelColor(scope.row.level), borderColor: levelColor(scope.row.level), color: '#fff' }">
            {{ levelLabel(scope.row.level) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="地区" prop="regionKey" min-width="160" show-overflow-tooltip />
      <el-table-column label="设备" prop="deviceCode" width="100" />
      <el-table-column label="监测值/阈值" width="130">
        <template slot-scope="scope">
          <span class="warning-center__value">{{ scope.row.metricValue }}</span>
          <span class="warning-center__slash">/</span>
          <span>{{ scope.row.threshold }}</span>
        </template>
      </el-table-column>
      <el-table-column label="触发时间" prop="createTime" width="150" />
      <el-table-column label="状态" width="86" align="center">
        <template slot-scope="scope">
          <el-tag size="mini" :type="scope.row.status === 'open' ? 'danger' : 'info'">
            {{ scope.row.status === 'open' ? '未关闭' : '已关闭' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="128" align="center">
        <template slot-scope="scope">
          <el-button type="text" size="mini" @click="viewDetail(scope.row)">详情</el-button>
          <el-button
            v-if="scope.row.status === 'open'"
            type="text"
            size="mini"
            @click="closeWarning(scope.row)">关闭</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- ── 手动添加预警 ── -->
    <el-dialog title="手动添加预警" :visible.sync="addVisible" width="560px" append-to-body>
      <el-form ref="addForm" :model="addForm" :rules="addRules" label-width="92px" size="small">
        <el-form-item label="预警类型" prop="typeCode">
          <el-select v-model="addForm.typeCode" class="warning-center__form-select" placeholder="请选择">
            <el-option v-for="t in types" :key="t.code" :label="t.label" :value="t.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="预警级别" prop="level">
          <el-radio-group v-model="addForm.level">
            <el-radio v-for="l in levels" :key="l.code" :label="l.code">{{ l.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="所属地区" prop="regionKey">
          <el-input v-model="addForm.regionKey" placeholder="例如：山西/太原市/小店区" />
        </el-form-item>
        <el-form-item label="关联设备">
          <el-input v-model="addForm.deviceCode" placeholder="选填，例如 SOIL-001" />
        </el-form-item>
        <el-form-item label="预警标题" prop="title">
          <el-input v-model="addForm.title" placeholder="简要描述" />
        </el-form-item>
        <el-form-item label="详细说明">
          <el-input v-model="addForm.content" type="textarea" :rows="3" placeholder="现场情况、建议处置措施等" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="addVisible = false">取消</el-button>
        <el-button size="small" type="primary" @click="submitAdd">添加（仅本页）</el-button>
      </div>
    </el-dialog>

    <!-- ── 详情 ── -->
    <el-dialog title="预警详情" :visible.sync="detailVisible" width="520px" append-to-body>
      <el-descriptions v-if="detail" :column="1" border size="small">
        <el-descriptions-item label="预警编号">{{ detail.warningId }}</el-descriptions-item>
        <el-descriptions-item label="来源">
          {{ detail.source === 'auto' ? '自动触发（规则引擎）' : '手动添加' }}
        </el-descriptions-item>
        <el-descriptions-item label="类型 / 级别">
          {{ detail.typeLabel }} / {{ levelLabel(detail.level) }}
        </el-descriptions-item>
        <el-descriptions-item label="地区">{{ detail.regionKey }}</el-descriptions-item>
        <el-descriptions-item label="设备">{{ detail.deviceCode || '—' }}</el-descriptions-item>
        <el-descriptions-item label="监测值 / 阈值">{{ detail.metricValue }} / {{ detail.threshold }}</el-descriptions-item>
        <el-descriptions-item label="触发时间">{{ detail.createTime }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ detail.status === 'open' ? '未关闭' : '已关闭' }}</el-descriptions-item>
        <el-descriptions-item label="说明">{{ detail.content }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script>
/**
 * 预警中心（需求 2-(4)：可以自动预警，也可以手动添加预警）
 *
 * ── 两条来源的处理原则 ────────────────────────────────────────────────
 *   自动预警：**由后端规则引擎产生**（数据入库时判定阈值）。前端只做展示与筛选，
 *             不实现判定逻辑，避免和后端各判一套导致不一致。
 *   手动预警：前端提供表单即时添加到本页列表，**不写入数据库**。
 *             入库动作等 5号 冻结预警写接口后再接入（与采样点写接口同样的处理原则：
 *             未冻结就不调，不做假设，也不伪造成"保存成功"）。
 *
 * ⚠️ 数据来自 @/mock/agrimonitor，纯前端演示，不连数据库。
 */
import { mockWarnings, mockWarningRules, WARNING_TYPES, WARNING_LEVELS } from '@/mock/agrimonitor'

export default {
  name: 'WarningCenterPanel',
  props: {
    regionKey: { type: String, default: '' }
  },
  data () {
    return {
      warnings: [],
      types: WARNING_TYPES,
      levels: WARNING_LEVELS,
      sourceFilter: '',
      statusFilter: 'open',
      levelFilter: '',
      addVisible: false,
      detailVisible: false,
      detail: null,
      addForm: {
        typeCode: 'manual',
        level: 'medium',
        regionKey: '',
        deviceCode: '',
        title: '',
        content: ''
      },
      addRules: {
        typeCode: [{ required: true, message: '请选择预警类型', trigger: 'change' }],
        level: [{ required: true, message: '请选择级别', trigger: 'change' }],
        regionKey: [{ required: true, message: '请填写所属地区', trigger: 'blur' }],
        title: [{ required: true, message: '请填写预警标题', trigger: 'blur' }]
      }
    }
  },
  computed: {
    filtered () {
      return this.warnings.filter(w =>
        (!this.sourceFilter || w.source === this.sourceFilter) &&
        (!this.statusFilter || w.status === this.statusFilter) &&
        (!this.levelFilter || w.level === this.levelFilter)
      )
    },
    stats () {
      const open = this.warnings.filter(w => w.status === 'open')
      return [
        { label: '未关闭', value: open.length, color: '#f5222d' },
        { label: '自动触发', value: this.warnings.filter(w => w.source === 'auto').length, color: '#52c41a' },
        { label: '手动添加', value: this.warnings.filter(w => w.source === 'manual').length, color: '#fa8c16' },
        { label: '紧急级别', value: this.warnings.filter(w => w.level === 'high' && w.status === 'open').length, color: '#d4380d' },
        { label: '已关闭', value: this.warnings.filter(w => w.status === 'closed').length, color: '#8c8c8c' }
      ]
    }
  },
  watch: {
    regionKey () {
      this.reload()
    }
  },
  mounted () {
    this.reload()
  },
  methods: {
    reload () {
      this.warnings = mockWarnings({ regionKey: this.regionKey })
    },

    openAdd () {
      this.addForm = {
        typeCode: 'manual',
        level: 'medium',
        regionKey: this.regionKey,
        deviceCode: '',
        title: '人工巡查发现异常',
        content: ''
      }
      this.addVisible = true
      this.$nextTick(() => {
        if (this.$refs.addForm) {
          this.$refs.addForm.clearValidate()
        }
      })
    },

    submitAdd () {
      this.$refs.addForm.validate(valid => {
        if (!valid) {
          return
        }
        const type = this.types.filter(t => t.code === this.addForm.typeCode)[0] || { label: '人工上报' }
        const d = new Date()
        const pad = n => String(n).padStart(2, '0')
        this.warnings.unshift({
          warningId: 'WM' + Date.now().toString().slice(-6),
          source: 'manual',
          typeCode: this.addForm.typeCode,
          typeLabel: type.label,
          level: this.addForm.level,
          regionKey: this.addForm.regionKey,
          deviceCode: this.addForm.deviceCode,
          metricValue: '—',
          threshold: '—',
          title: this.addForm.title,
          content: this.addForm.content || this.addForm.title,
          createTime: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
          status: 'open',
          handler: '当前登录用户',
          handleTime: ''
        })
        this.addVisible = false
        this.sourceFilter = ''
        this.statusFilter = ''
        this.$message.success('已添加到本页列表（未写入数据库；写接口冻结后再接入入库）')
      })
    },

    closeWarning (row) {
      this.$confirm('确认关闭该预警？本操作仅影响本页展示，不会修改数据库。', '提示', {
        type: 'warning'
      }).then(() => {
        row.status = 'closed'
        this.$message.success('已关闭（仅本页展示）')
      }).catch(() => {})
    },

    viewDetail (row) {
      this.detail = row
      this.detailVisible = true
    },

    levelLabel (level) {
      const item = WARNING_LEVELS.filter(l => l.code === level)[0]
      return item ? item.label : level
    },

    levelColor (level) {
      const item = WARNING_LEVELS.filter(l => l.code === level)[0]
      return item ? item.color : '#1976d2'
    }
  }
}
</script>

<style lang="scss" scoped>
.warning-center {
  &__stats {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
    margin-bottom: 10px;
  }

  &__stat {
    padding: 8px;
    border: 1px solid #e4e9f0;
    border-radius: 4px;
    background: #fafcff;
    text-align: center;
  }

  &__stat-value {
    font-size: 20px;
    font-weight: 700;
    font-family: Consolas, Monaco, monospace;
  }

  &__stat-label {
    color: #78909c;
    font-size: 12px;
  }

  &__toolbar {
    display: flex;
    flex-wrap: wrap;
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

  &__note {
    margin-bottom: 10px;
  }

  &__value {
    color: #f5222d;
    font-weight: 700;
  }

  &__slash {
    margin: 0 4px;
    color: #b0bec5;
  }

  &__form-select {
    width: 100%;
  }
}
</style>
