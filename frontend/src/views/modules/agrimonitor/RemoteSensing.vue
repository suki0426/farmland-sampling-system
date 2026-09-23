<template>
  <div class="remote-sensing">
    <el-alert
      type="info"
      :closable="false"
      show-icon
      class="remote-sensing__note"
      title="本页做的是星历与过境的「展示层」：天空视图、信噪比、过境预报、开普勒轨道根数。数值为演示数据，不是真实星历 —— 真实接入方式见页面底部说明。">
    </el-alert>

    <!-- ══════════ 定位解算质量 ══════════ -->
    <div class="remote-sensing__quality">
      <div v-for="q in qualityCards" :key="q.label" class="q-card">
        <div class="q-card__label">{{ q.label }}</div>
        <div class="q-card__value" :style="{ color: q.color }">{{ q.value }}</div>
        <div class="q-card__sub">{{ q.sub }}</div>
      </div>
    </div>

    <!-- ══════════ 主体三栏 ══════════ -->
    <div class="remote-sensing__body">
      <!-- 卫星列表 -->
      <div class="remote-sensing__col remote-sensing__col--list">
        <div class="panel-head">
          卫星列表
          <el-select v-model="kindFilter" size="mini" class="remote-sensing__sel">
            <el-option label="全部" value="" />
            <el-option label="导航星座" value="navigation" />
            <el-option label="遥感卫星" value="remote" />
          </el-select>
        </div>
        <el-table
          :data="filteredSatellites"
          size="mini"
          border
          height="400"
          highlight-current-row
          @current-change="onSelectSatellite">
          <el-table-column label="编号" prop="id" width="76">
            <template slot-scope="scope">
              <span :style="{ color: scope.row.color, fontWeight: 700 }">{{ scope.row.id }}</span>
            </template>
          </el-table-column>
          <el-table-column label="星座" prop="constellationLabel" width="80" />
          <el-table-column label="方位角" width="72">
            <template slot-scope="scope">{{ scope.row.azimuth }}°</template>
          </el-table-column>
          <el-table-column label="仰角" width="66">
            <template slot-scope="scope">{{ scope.row.elevation }}°</template>
          </el-table-column>
          <el-table-column label="信噪比" width="72">
            <template slot-scope="scope">{{ scope.row.visible ? scope.row.snr + ' dB' : '—' }}</template>
          </el-table-column>
          <el-table-column label="状态" min-width="90" align="center">
            <template slot-scope="scope">
              <el-tag size="mini" :type="tagType(scope.row)">
                {{ statusText(scope.row) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 天空视图 -->
      <div class="remote-sensing__col remote-sensing__col--sky">
        <SkyPlotChart :satellites="navigationSatellites" />
      </div>

      <!-- 星历 + 信噪比 -->
      <div class="remote-sensing__col remote-sensing__col--eph">
        <div class="panel-head">
          星历参数
          <el-tag v-if="selected" size="mini" :style="{ background: selected.color, borderColor: selected.color, color: '#fff' }">
            {{ selected.id }}
          </el-tag>
        </div>
        <el-descriptions v-if="ephemeris" :column="1" border size="mini" class="remote-sensing__eph">
          <el-descriptions-item label="历元时刻">{{ ephemeris.epoch }}</el-descriptions-item>
          <el-descriptions-item label="坐标系">{{ ephemeris.coordinateSystem }}</el-descriptions-item>
          <el-descriptions-item label="半长轴 a">{{ ephemeris.semiMajorAxis }} km</el-descriptions-item>
          <el-descriptions-item label="偏心率 e">{{ ephemeris.eccentricity }}</el-descriptions-item>
          <el-descriptions-item label="轨道倾角 i">{{ ephemeris.inclination }}°</el-descriptions-item>
          <el-descriptions-item label="升交点赤经 Ω">{{ ephemeris.raan }}°</el-descriptions-item>
          <el-descriptions-item label="近地点角距 ω">{{ ephemeris.argumentOfPerigee }}°</el-descriptions-item>
          <el-descriptions-item label="平近点角 M">{{ ephemeris.meanAnomaly }}°</el-descriptions-item>
          <el-descriptions-item label="平均角速度 n">{{ ephemeris.meanMotion }} 圈/天</el-descriptions-item>
          <el-descriptions-item label="轨道周期">{{ ephemeris.orbitPeriodMin }} 分钟</el-descriptions-item>
          <el-descriptions-item label="钟差 / 钟漂">{{ ephemeris.clockBias }} / {{ ephemeris.clockDrift }}</el-descriptions-item>
          <el-descriptions-item label="数据来源">{{ ephemeris.source }}</el-descriptions-item>
          <el-descriptions-item label="健康状态">
            <el-tag size="mini" type="success">{{ ephemeris.health }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <el-empty v-else description="从左侧选择一颗卫星" :image-size="60" />

        <MiniTrendChart
          v-if="selected"
          :title="`${selected.id} · 信噪比 / 仰角`"
          unit="dB"
          :rows="snrRows"
          accent="#1976d2"
          :height="150" />
      </div>
    </div>

    <!-- ══════════ 过境预报 ══════════ -->
    <div class="remote-sensing__section">
      <div class="panel-head">过境预报（遥感卫星）</div>
      <el-table :data="passes" size="mini" border height="240">
        <el-table-column label="卫星" prop="satellite" width="90" />
        <el-table-column label="任务类型" prop="mission" width="110" />
        <el-table-column label="升轨时间" prop="riseTime" width="160" />
        <el-table-column label="中天时间" prop="culminateTime" width="160" />
        <el-table-column label="降轨时间" prop="setTime" width="160" />
        <el-table-column label="最大仰角" width="90">
          <template slot-scope="scope">{{ scope.row.maxElevation }}°</template>
        </el-table-column>
        <el-table-column label="持续" width="80">
          <template slot-scope="scope">{{ scope.row.durationMin }} 分</template>
        </el-table-column>
        <el-table-column label="过境方向" prop="direction" min-width="130" />
        <el-table-column label="成像质量" width="90" align="center">
          <template slot-scope="scope">
            <el-tag size="mini" :type="scope.row.quality === '优' ? 'success' : 'info'">{{ scope.row.quality }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- ══════════ 遥感影像 ══════════ -->
    <div class="remote-sensing__section">
      <div class="panel-head">遥感影像与产品</div>
      <el-table :data="imagery" size="mini" border height="220">
        <el-table-column label="影像编号" prop="imageId" width="140" />
        <el-table-column label="卫星" prop="satellite" width="90" />
        <el-table-column label="产品类型" prop="product" width="130" />
        <el-table-column label="覆盖区域" prop="regionKey" min-width="150" />
        <el-table-column label="获取时间" prop="acquireTime" width="160" />
        <el-table-column label="云量" width="80">
          <template slot-scope="scope">{{ scope.row.cloudPercent }}%</template>
        </el-table-column>
        <el-table-column label="分辨率" prop="resolution" width="80" />
        <el-table-column label="幅宽" width="80">
          <template slot-scope="scope">{{ scope.row.swathKm }} km</template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template slot-scope="scope">
            <el-tag size="mini" :type="scope.row.status === 'ready' ? 'success' : 'warning'">
              {{ scope.row.status === 'ready' ? '就绪' : '处理中' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- ══════════ 接入说明 ══════════ -->
    <el-card shadow="never" class="remote-sensing__integrate">
      <div slot="header">真实星历数据从哪来（本页接入口）</div>
      <ul>
        <li>
          <b>导航星座（北斗/GPS/GLONASS/Galileo）</b>：解析 RINEX 观测文件或广播星历（BRDC）得到轨道根数；
          或者直接复用 <b>2号 设备模拟器</b> 输出的 <b>NMEA</b> 语句（GGA/RMC/GSV）——
          GSV 里就带每颗卫星的仰角、方位角、信噪比，换算成天空视图所需字段即可。
          前端不解析这些文件，由后端解析后通过 REST 下发。
        </li>
        <li>
          <b>遥感卫星（风云/高分/Sentinel）</b>：用 TLE 两行轨道根数 + SGP4 做过境预报，
          这是后端的活；前端只展示预报结果与影像清单。
        </li>
        <li>
          <b>建议接口形态</b>（尚未冻结，供 5号 参考）：
          <code>GET /remote/satellite/visible</code> → 可见卫星列表（azimuth/elevation/snr），
          <code>GET /remote/satellite/ephemeris?satelliteId=</code> → 轨道根数，
          <code>GET /remote/satellite/passes</code> → 过境预报，
          <code>GET /remote/imagery/list</code> → 影像清单。
        </li>
        <li>
          <b>本页现状</b>：以上接口均未冻结，因此页面使用前端演示数据，不发任何请求；
          接入时只需把本页 created() 里的 mock 调用换成对应请求，组件与图表无需改动。
        </li>
      </ul>
    </el-card>
  </div>
</template>

<script>
/**
 * 页面 4 —— 遥感分析 / 卫星星历分析（需求 4：「这个界面还待商榷，可以简单做一下」）
 *
 * 本页定位为**展示层**，包含：
 *   - 定位解算质量（固定解类型、经纬度、参与解算/可见卫星数、DOP、精度）
 *   - 卫星列表（方位角/仰角/信噪比/状态）
 *   - 天空视图（极坐标散点，方位角 × 仰角，按星座着色）
 *   - 星历参数（开普勒六根数 + 钟差钟漂，分导航/遥感两类数据来源）
 *   - 过境预报（升轨/中天/降轨、最大仰角、持续时长、方向、成像质量）
 *   - 遥感影像与产品清单
 *
 * ⚠️ 前端**不做任何轨道计算、不解析 RINEX/TLE**，数值为演示数据。
 *    真实数据来源与建议接口形态写在页面底部的"接入说明"里。
 * ⚠️ 不连数据库、不写任何数据。
 */
import SkyPlotChart from './components/SkyPlotChart'
import MiniTrendChart from './components/MiniTrendChart'
import {
  mockVisibleSatellites, mockPositionQuality, mockPassPredictions,
  mockEphemeris, mockSnrSeries, mockImageryList
} from '@/mock/agrimonitor'

export default {
  name: 'RemoteSensing',
  components: { SkyPlotChart, MiniTrendChart },
  data () {
    return {
      satellites: [],
      quality: mockPositionQuality(),
      passes: [],
      imagery: [],
      selected: null,
      ephemeris: null,
      snrRows: [],
      kindFilter: 'navigation'
    }
  },
  computed: {
    filteredSatellites () {
      return this.satellites.filter(s => !this.kindFilter || s.kind === this.kindFilter)
    },
    navigationSatellites () {
      return this.satellites.filter(s => s.kind === 'navigation')
    },
    qualityCards () {
      const q = this.quality
      return [
        { label: '解算状态', value: q.fixType, sub: q.coordinateSystem, color: '#52c41a' },
        { label: '经度', value: q.longitude, sub: '度（WGS84）', color: '#1890ff' },
        { label: '纬度', value: q.latitude, sub: '度（WGS84）', color: '#1890ff' },
        { label: '高程', value: q.altitude + ' m', sub: '大地高', color: '#722ed1' },
        { label: '参与解算', value: `${q.satellitesUsed}/${q.satellitesVisible}`, sub: '已用/可见卫星', color: '#13c2c2' },
        { label: 'HDOP / VDOP', value: `${q.hdop} / ${q.vdop}`, sub: `PDOP ${q.pdop}`, color: '#fa8c16' },
        { label: '水平 / 垂直精度', value: `${q.accuracyH}m / ${q.accuracyV}m`, sub: '1σ', color: '#52c41a' },
        { label: '更新时间', value: q.updateTime.slice(11), sub: q.updateTime.slice(0, 10), color: '#8c8c8c' }
      ]
    }
  },
  created () {
    this.satellites = mockVisibleSatellites()
    this.passes = mockPassPredictions()
    this.imagery = mockImageryList()
    this.selectSatellite(this.satellites[0])
  },
  methods: {
    onSelectSatellite (row) {
      if (row) {
        this.selectSatellite(row)
      }
    },

    selectSatellite (sat) {
      if (!sat) {
        return
      }
      this.selected = sat
      this.ephemeris = mockEphemeris(sat.id)
      this.snrRows = mockSnrSeries(sat.id, 30).map(r => ({ time: r.time.slice(3), value: r.snr }))
    },

    tagType (row) {
      if (row.used) {
        return 'success'
      }
      if (row.visible) {
        return 'info'
      }
      return 'warning'
    },

    statusText (row) {
      if (row.used) {
        return '已参与解算'
      }
      if (row.visible) {
        return '可见'
      }
      return '地平线下'
    }
  }
}
</script>

<style lang="scss" scoped>
.remote-sensing {
  padding: 10px 12px;
  background: #f2f5f7;
  min-height: 100%;

  &__note {
    margin-bottom: 10px;
  }

  &__quality {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 10px;
    margin-bottom: 10px;
  }

  &__body {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  &__col {
    background: #fff;
    border-radius: 4px;
    padding: 10px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);

    &--list { width: 460px; flex: none; }
    &--sky { flex: 1; min-width: 0; }
    &--eph { width: 400px; flex: none; }
  }

  &__sel {
    width: 120px;
    margin-left: auto;
  }

  &__eph {
    max-height: 260px;
    overflow: auto;
  }

  &__section {
    margin-top: 12px;
    padding: 10px;
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  }

  &__integrate {
    margin-top: 12px;
    border: 1px dashed #b0bec5 !important;

    ::v-deep .el-card__header {
      padding: 8px 12px;
      font-size: 13px;
      font-weight: 600;
      color: #0d47a1;
      background: #f5faff;
    }

    ul {
      margin: 0;
      padding-left: 20px;
      font-size: 12px;
      line-height: 21px;
      color: #546e7a;
    }

    li {
      margin-bottom: 8px;
    }

    code {
      background: #eef3f8;
      padding: 0 4px;
      border-radius: 2px;
      color: #1565c0;
    }
  }
}

.q-card {
  padding: 8px;
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
    font-size: 15px;
    font-weight: 700;
    font-family: Consolas, Monaco, monospace;
  }

  &__sub {
    color: #b0bec5;
    font-size: 11px;
  }
}

.panel-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding-left: 8px;
  border-left: 3px solid #1976d2;
  font-size: 13px;
  font-weight: 600;
  color: #263238;
}
</style>
