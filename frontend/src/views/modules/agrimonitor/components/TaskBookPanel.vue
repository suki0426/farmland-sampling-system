<template>
  <section class="taskbook">
    <!-- ══════════ 折叠头 ══════════ -->
    <div class="taskbook__bar" @click="open = !open">
      <i class="el-icon-notebook-2"></i>
      <span class="taskbook__bar-title">任务书指标区</span>
      <span class="taskbook__bar-sub">
        M1~M4 必做任务 · E1~E4 扩展任务 · T1/T2/T3/T5 验收要点 · 回传帧 19 字节结构
      </span>
      <span class="taskbook__bar-stat">
        任务 {{ summary.done }}/{{ summary.total }} 已交付 · 用例 {{ summary.testsPass }}/{{ summary.tests }} 通过
      </span>
      <i :class="open ? 'el-icon-arrow-down' : 'el-icon-arrow-up'"></i>
    </div>

    <div v-show="open" class="taskbook__cards">
      <!-- ═══════════════ 卡 1：任务书对照 ═══════════════ -->
      <div class="tb-card">
        <div class="tb-card__title">
          <i class="el-icon-s-claim"></i>任务书条目对照
          <span class="tb-card__hint">逐条摘自任务书 §3 / §4 / §5</span>
        </div>

        <div class="tb-mod">
          <div v-for="m in modules" :key="m.key" class="tb-mod__row">
            <span class="tb-mod__code" :class="'tb-mod__code--' + m.status">{{ m.key }}</span>
            <span class="tb-mod__title" :title="m.requirement">{{ m.title }}</span>
            <span class="tb-mod__owner">{{ m.owner }}</span>
            <i :class="statusIcon(m.status)" :title="statusText(m.status)"></i>
          </div>
        </div>

        <div class="tb-tests">
          <span
            v-for="t in tests"
            :key="t.key"
            class="tb-chip"
            :class="chipClass(t.status)"
            :title="t.requirement">
            {{ t.key }} {{ t.title }}
          </span>
        </div>
        <div class="tb-card__foot">
          任务书原文条目对照与实现说明 → <code>frontend/docs/MONITOR_TASKBOOK.md</code>
        </div>
      </div>

      <!-- ═══════════════ 卡 2：回传帧（M4） ═══════════════ -->
      <div class="tb-card">
        <div class="tb-card__title">
          <i class="el-icon-cpu"></i>数据回传帧 · 19 字节
          <span class="tb-card__hint">任务书 §2 建议结构，实时编码 / 解码</span>
          <el-button
            size="mini"
            type="text"
            class="tb-card__action"
            @click="demoCorrupt">
            {{ corruptShown ? '恢复正常帧' : '演示 CRC 拦截' }}
          </el-button>
        </div>

        <!-- 字节尺 -->
        <div class="frame-ruler">
          <div
            v-for="(row, i) in layout"
            :key="i"
            class="frame-ruler__seg"
            :style="{ flex: row.bytes, background: segColor(i) }"
            :title="`偏移 ${offsetOf(i)} · ${row.bytes} · ${row.field} · ${row.desc}`">
            <span class="frame-ruler__hex">{{ hexAt(i) }}</span>
            <span class="frame-ruler__name">{{ row.short }}</span>
          </div>
        </div>
        <div class="frame-offsets">
          <span v-for="(row, i) in layout" :key="i" :style="{ flex: row.bytes }">{{ row.bytes }}</span>
        </div>

        <div class="frame-body">
          <div class="frame-hex" :class="{ 'is-bad': corruptShown }">
            {{ corruptShown ? corrupt.hex : currentFrame.hex }}
          </div>

          <div v-if="corruptShown" class="frame-error">
            <i class="el-icon-warning-outline"></i>
            {{ corrupt.error }}
            <em>（篡改字段：{{ corrupt.tamperedField }}）</em>
          </div>
          <div v-else class="frame-values">
            <span>采样点ID <b>{{ currentFrame.sample.samplingPointId }}</b>（{{ currentFrame.sample.pointCode }}）</span>
            <span>LAT <b>{{ currentFrame.sample.latitude.toFixed(7) }}</b></span>
            <span>LON <b>{{ currentFrame.sample.longitude.toFixed(7) }}</b></span>
            <span
              v-for="m in frameMeta.metrics"
              :key="m.key">
              {{ m.label }} <b>{{ currentFrame.decoded[m.key] }}{{ m.unit }}</b>
            </span>
            <span class="frame-values__crc">CRC 通过 · 0x{{ (currentFrame.decoded.crc || 0).toString(16).toUpperCase() }}</span>
          </div>
        </div>

        <div class="tb-card__foot">
          ⚠️ 只做「编码—解码」演示，**不发送 UDP、不写数据库**；封包与入库是 2号 / 5号 的岗位。
          解码值与原值差 &lt; 1 是因为帧内指标只有 1 字节（任务书规定）。
        </div>
      </div>

      <!-- ═══════════════ 卡 3：E1 布点策略 ═══════════════ -->
      <div class="tb-card">
        <div class="tb-card__title">
          <i class="el-icon-place"></i>E1 布点策略效果评估
          <span class="tb-card__hint">
            真值均值 {{ e1.truth }} · 每策略 {{ e1.targetPoints }} 点 · 种子 {{ e1.seed }}
          </span>
        </div>

        <div class="e1">
          <div v-for="r in e1.rows" :key="r.key" class="e1__item" :class="{ 'is-best': r.rank === 1 }">
            <div class="e1__head">
              <span class="e1__label">{{ r.label }}</span>
              <span class="e1__rank">#{{ r.rank }}</span>
            </div>
            <svg class="e1__svg" viewBox="0 -6 300 212" preserveAspectRatio="xMidYMid meet">
              <!-- 田块（含右上凹口） -->
              <path :d="fieldPath" class="e1__field" />
              <!-- 禁入区 -->
              <circle :cx="FIELD.pond.cx" :cy="FIELD.height - FIELD.pond.cy" :r="FIELD.pond.r" class="e1__pond" />
              <!-- 采样点 -->
              <circle
                v-for="(s, i) in r.samples"
                :key="i"
                :cx="s.x"
                :cy="FIELD.height - s.y"
                r="4.6"
                class="e1__pt" />
            </svg>
            <div class="e1__stats">
              <span>界外 <b class="ok">{{ r.illegal }}</b></span>
              <span>最小间距 <b>{{ r.minDistance }}m</b></span>
              <span>IDW 估计 <b>{{ r.estimate }}</b></span>
              <span>相对误差 <b :class="{ ok: r.rank === 1 }">{{ r.relErr }}%</b></span>
            </div>
            <div class="e1__note">{{ r.note }}</div>
          </div>
        </div>

        <div class="tb-card__foot">
          等高线式的「真实养分场」= 两个高斯高值区 + 缓变背景；IDW 为反距离权重插值（p=2）。
          界外点恒为 0 即任务书 T1「所有点落在多边形内部」。
        </div>
      </div>

      <!-- ═══════════════ 卡 4：E2 路线算法 ═══════════════ -->
      <div class="tb-card">
        <div class="tb-card__title">
          <i class="el-icon-share"></i>E2 路线优化算法对比
          <span class="tb-card__hint">
            同一组 {{ e2.pointCount }} 点 · 基准（本轮最好）{{ e2.refBest }} m
          </span>
          <span class="tb-card__warn">前端复现实验 · 生产路线仍由 3号 算法下发</span>
        </div>

        <div class="e2">
          <table class="e2__table">
            <thead>
              <tr>
                <th>算法</th>
                <th>最终距离(m)</th>
                <th>相对差距</th>
                <th>迭代量</th>
                <th>时间复杂度</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in e2.rows" :key="r.key" :class="{ 'is-best': r.isBest }">
                <td>{{ r.label }}<i v-if="r.isBest" class="el-icon-trophy" title="本轮最好"></i></td>
                <td class="num">{{ r.length }}</td>
                <td class="num" :class="{ ok: r.isBest }">{{ r.gap }}%</td>
                <td class="effort">{{ r.effort }}</td>
                <td class="cx">{{ r.complexity }}</td>
              </tr>
            </tbody>
          </table>

          <div class="e2__curves">
            <svg viewBox="0 0 300 90" preserveAspectRatio="none">
              <g v-for="(c, ci) in curves" :key="ci">
                <polyline
                  :points="c.points"
                  :stroke="c.color"
                  fill="none"
                  stroke-width="1.6" />
              </g>
            </svg>
            <div class="e2__legend">
              <span v-for="c in curves" :key="c.key">
                <i :style="{ background: c.color }"></i>{{ c.label }}
              </span>
              <span class="e2__legend-axis">横轴 = 迭代进度，纵轴 = 当前最好距离</span>
            </div>
          </div>
        </div>

        <div class="tb-card__foot">
          收敛曲线只记录"出现改进"的时刻，因此严格单调不增。三种启发式都显著优于纯贪心，
          符合任务书 E2「放到同一组点集上对比，绘制收敛曲线与最终距离，分析时间复杂度」。
        </div>
      </div>
    </div>
  </section>
</template>

<script>
/**
 * 任务书指标区（首页大屏底部）
 *
 * 作用：把任务书的必做任务（M1~M4）、扩展任务（E1~E4）、验收要点（T1/T2/T3/T5）
 *      以及数据回传帧结构，做成**答辩时能当场跑、当场看**的面板。
 *
 * 三条设计原则：
 *   1. **数字是现算的，不是写死的**：E1 的 IDW 误差、E2 的各算法距离与收敛曲线，
 *      都是本组件挂载时用 `@/mock/agrimonitor/experiments` 真跑出来的；
 *      回传帧是用 `@/utils/udpFrame` 真编码再真解码的。
 *   2. **职责边界写清楚**：生产用的布点/路径算法与入库分别属于 3号/2号/5号，
 *      这里只做"前端复现实验"与"界面呈现"，卡片标题里都有明确标注。
 *   3. **不碰数据库**：没有 SQL、没有写接口、没有连接。
 */
import {
  TASK_MODULES, EXTENDED_TASKS, TEST_CASES, taskSummary
} from '@/mock/agrimonitor/taskData'
import {
  FIELD, runPlacementExperiment, runRouteExperiment
} from '@/mock/agrimonitor/experiments'
import { mockFrameStream, mockCorruptedFrame, FRAME_META } from '@/mock/agrimonitor/frameStream'
import { FRAME_LAYOUT } from '@/utils/udpFrame'

/** 字节尺上的字段短名（与任务书表格字段一一对应） */
const SHORT_NAME = {
  帧头: '帧头',
  采样点ID: '点ID',
  纬度LAT: 'LAT',
  经度LON: 'LON',
  土壤温度: '土温',
  土壤湿度: '土湿',
  空气温度: '气温',
  空气湿度: '气湿',
  土壤深度: '深度',
  CRC: 'CRC'
}

const SEG_COLORS = [
  'rgba(255,255,255,0.30)',
  'rgba(129,199,132,0.42)',
  'rgba(79,195,247,0.34)',
  'rgba(79,195,247,0.34)',
  'rgba(255,183,77,0.34)',
  'rgba(38,166,154,0.34)',
  'rgba(255,138,101,0.34)',
  'rgba(38,166,154,0.34)',
  'rgba(186,104,200,0.34)',
  'rgba(244,67,54,0.42)'
]

const CURVE_COLORS = {
  twoOpt: '#4fc3f7',
  sa: '#ffb74d',
  ga: '#81c784'
}

export default {
  name: 'TaskBookPanel',
  data () {
    return {
      open: true,
      FIELD,
      modules: TASK_MODULES,
      extended: EXTENDED_TASKS,
      tests: TEST_CASES,
      summary: { total: 0, done: 0, pending: 0, tests: 0, testsPass: 0 },
      frameMeta: FRAME_META,
      layout: FRAME_LAYOUT.map(r => ({
        short: SHORT_NAME[r.field] || r.field,
        bytes: parseInt(r.bytes, 10),
        field: r.field,
        desc: r.desc
      })),
      frames: [],
      frameIndex: 0,
      corrupt: { hex: '', decoded: null, error: '尚未生成篡改示例', tamperedField: '—', originalHex: '' },
      corruptShown: false,
      e1: { truth: 0, targetPoints: 20, seed: 0, rows: [] },
      e2: { pointCount: 0, refBest: 0, rows: [] },
      rotateTimer: null
    }
  },
  computed: {
    currentFrame () {
      return this.frames[this.frameIndex] || { hex: '—', sample: { latitude: 0, longitude: 0, samplingPointId: 0, pointCode: '—' }, decoded: {} }
    },
    /** 田块轮廓（含右上凹口）在 SVG 坐标下的 path，SVG 的 y 轴向下，故取反 */
    fieldPath () {
      const n = FIELD.notch
      const W = FIELD.width
      const H = FIELD.height
      const topY = H - n.y0
      return `M0,${H} L0,0 L${n.x0},0 L${n.x0},${topY} L${W},${topY} L${W},${H} Z`
    },
    /** 各算法的收敛曲线（归一化到同一条 SVG 里） */
    curves () {
      const withCurve = this.e2.rows.filter(r => r.curve && r.curve.length > 1)
      if (!withCurve.length) {
        return []
      }
      const maxLen = Math.max.apply(null, withCurve.map(r => r.curve.length))
      let minV = Infinity
      let maxV = -Infinity
      withCurve.forEach(r => r.curve.forEach(v => {
        if (v < minV) minV = v
        if (v > maxV) maxV = v
      }))
      const span = Math.max(1e-6, maxV - minV)
      return withCurve.map(r => {
        const pts = r.curve.map((v, i) => {
          const x = maxLen === 1 ? 0 : (i / (maxLen - 1)) * 300
          const y = 88 - ((maxV - v) / span) * 84
          return `${x.toFixed(1)},${y.toFixed(1)}`
        }).join(' ')
        return {
          key: r.key,
          label: r.label,
          color: CURVE_COLORS[r.key] || '#90a4ae',
          points: pts
        }
      })
    }
  },
  created () {
    this.summary = taskSummary()
    // 12 帧真实编解码
    this.frames = mockFrameStream(12)
    const corrupt = mockCorruptedFrame()
    if (corrupt) {
      this.corrupt = corrupt
    }
    // E1 / E2：真实跑一遍实验
    this.e1 = runPlacementExperiment()
    this.e2 = runRouteExperiment()
  },
  mounted () {
    this.rotateTimer = window.setInterval(() => {
      if (!this.corruptShown) {
        this.frameIndex = (this.frameIndex + 1) % Math.max(1, this.frames.length)
      }
    }, 2400)
  },
  beforeDestroy () {
    if (this.rotateTimer) {
      window.clearInterval(this.rotateTimer)
    }
  },
  methods: {
    offsetOf (i) {
      let off = 0
      for (let k = 0; k < i; k++) {
        off += this.layout[k].bytes
      }
      return off
    },
    hexAt (i) {
      if (this.corruptShown) {
        const parts = (this.corrupt.hex || '').split(' ')
        return parts.slice(this.offsetOf(i), this.offsetOf(i) + this.layout[i].bytes).join(' ')
      }
      const f = this.currentFrame.fields && this.currentFrame.fields[i]
      return f ? f.hex : ''
    },
    segColor (i) {
      return SEG_COLORS[i] || 'rgba(144,164,174,0.3)'
    },
    demoCorrupt () {
      this.corruptShown = !this.corruptShown
    },
    /** 状态 → 安全的 class 名（'n/a' 不能直接拼进选择器） */
    chipClass (status) {
      return {
        pass: 'tb-chip--pass',
        fail: 'tb-chip--fail',
        'n/a': 'tb-chip--na'
      }[status] || 'tb-chip--na'
    },
    statusIcon (status) {
      return {
        done: 'el-icon-circle-check',
        'frontend-ready': 'el-icon-time',
        'n/a': 'el-icon-remove-outline'
      }[status] || 'el-icon-question'
    },
    statusText (status) {
      return {
        done: '已完成',
        'frontend-ready': '前端已就绪，等算法侧结果',
        'n/a': '任务书未定义'
      }[status] || status
    }
  }
}
</script>

<style lang="scss" scoped>
$line: rgba(79, 195, 247, 0.22);
$text: #cfe8ff;
$dim: #8fb8d8;
$ok: #81c784;

.taskbook {
  flex: none;
  border-top: 1px solid $line;
  background: rgba(4, 18, 36, 0.55);

  &__bar {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 32px;
    padding: 0 10px;
    cursor: pointer;
    user-select: none;

    i { color: #4fc3f7; font-size: 14px; }
    &:hover { background: rgba(79, 195, 247, 0.07); }
  }

  &__bar-title {
    font-size: 13px;
    font-weight: 700;
    color: #81d4fa;
    letter-spacing: 1px;
  }

  &__bar-sub {
    flex: 1;
    color: $dim;
    font-size: 11px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__bar-stat {
    flex: none;
    color: $ok;
    font-size: 11px;
  }

  &__cards {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 0 10px 8px;
    max-height: 232px;
    overflow: auto;
  }
}

.tb-card {
  flex: 1 1 380px;
  min-width: 360px;
  display: flex;
  flex-direction: column;
  padding: 7px 9px;
  border: 1px solid $line;
  border-radius: 5px;
  background: rgba(6, 26, 50, 0.5);
  font-size: 11px;
  color: $text;

  &__title {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    padding-left: 7px;
    border-left: 3px solid #4fc3f7;
    font-size: 12px;
    font-weight: 700;
    color: #81d4fa;

    i { font-size: 13px; }
  }

  &__hint {
    font-weight: 400;
    color: $dim;
    font-size: 10px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__action {
    margin-left: auto;
    padding: 0;
    font-size: 11px;
  }

  &__warn {
    margin-left: auto;
    flex: none;
    padding: 1px 6px;
    border-radius: 8px;
    background: rgba(255, 152, 0, 0.18);
    border: 1px solid rgba(255, 152, 0, 0.5);
    color: #ffcc80;
    font-size: 10px;
    font-weight: 400;
  }

  &__foot {
    margin-top: auto;
    padding-top: 5px;
    border-top: 1px dashed rgba(79, 195, 247, 0.18);
    color: #6d90ad;
    font-size: 10px;
    line-height: 15px;

    code {
      color: #81d4fa;
      background: rgba(79, 195, 247, 0.1);
      padding: 0 3px;
      border-radius: 2px;
    }
  }
}

/* ── 卡 1 ── */
.tb-mod {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px 12px;

  &__row {
    display: flex;
    align-items: center;
    gap: 5px;
    height: 19px;
  }

  &__code {
    flex: none;
    width: 24px;
    text-align: center;
    border-radius: 2px;
    font-size: 10px;
    font-weight: 700;
    line-height: 15px;
    background: rgba(79, 195, 247, 0.18);
    color: #81d4fa;

    &--done { background: rgba(129, 199, 132, 0.2); color: $ok; }
    &--frontend-ready { background: rgba(255, 183, 77, 0.2); color: #ffb74d; }
  }

  &__title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__owner {
    flex: none;
    max-width: 120px;
    color: #6d90ad;
    font-size: 10px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  i.el-icon-circle-check { color: $ok; }
  i.el-icon-time { color: #ffb74d; }
}

.tb-tests {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.tb-chip {
  padding: 1px 6px;
  border-radius: 9px;
  font-size: 10px;
  border: 1px solid rgba(79, 195, 247, 0.3);
  color: $dim;
  cursor: default;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &--pass {
    border-color: rgba(129, 199, 132, 0.5);
    background: rgba(129, 199, 132, 0.14);
    color: #c5e1a5;
  }

  &--fail {
    border-color: rgba(239, 83, 80, 0.5);
    background: rgba(239, 83, 80, 0.14);
    color: #ef9a9a;
  }

  &--na {
    border-style: dashed;
    color: #6d90ad;
  }
}

/* ── 卡 2：回传帧 ── */
.frame-ruler {
  display: flex;
  height: 26px;
  border-radius: 3px;
  overflow: hidden;
  border: 1px solid rgba(79, 195, 247, 0.28);

  &__seg {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 0;
    border-right: 1px solid rgba(4, 18, 36, 0.8);
    overflow: hidden;

    &:last-child { border-right: none; }
  }

  &__hex {
    font-family: Consolas, Monaco, monospace;
    font-size: 9px;
    color: #e6f5ff;
    white-space: nowrap;
    overflow: hidden;
  }

  &__name {
    font-size: 9px;
    color: #b3d9f2;
    white-space: nowrap;
  }
}

.frame-offsets {
  display: flex;
  margin-top: 1px;
  color: #5b7c99;
  font-size: 9px;
  font-family: Consolas, Monaco, monospace;

  span {
    text-align: center;
    min-width: 0;
    overflow: hidden;
  }
}

.frame-body {
  margin-top: 6px;
}

.frame-hex {
  padding: 4px 6px;
  border-radius: 3px;
  background: rgba(4, 18, 36, 0.75);
  border: 1px solid rgba(79, 195, 247, 0.2);
  font-family: Consolas, Monaco, monospace;
  font-size: 11px;
  letter-spacing: 0.4px;
  color: #9fe6a0;
  word-break: break-all;

  &.is-bad {
    border-color: #ef5350;
    color: #ff8a80;
    animation: frame-blink 1s steps(2, start) infinite;
  }
}

@keyframes frame-blink {
  50% { opacity: 0.55; }
}

.frame-error {
  margin-top: 5px;
  color: #ff8a80;
  font-size: 10px;
  line-height: 15px;

  i { margin-right: 3px; }
  em { color: #6d90ad; font-style: normal; }
}

.frame-values {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 10px;
  margin-top: 5px;
  font-size: 10px;
  color: $dim;

  b { color: #e6f5ff; font-family: Consolas, Monaco, monospace; }

  &__crc {
    margin-left: auto;
    color: $ok;
  }
}

/* ── 卡 3：E1 ── */
.e1 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 7px;

  &__item {
    padding: 5px 6px;
    border-radius: 4px;
    background: rgba(4, 18, 36, 0.55);
    border: 1px solid rgba(79, 195, 247, 0.14);

    &.is-best {
      border-color: rgba(129, 199, 132, 0.55);
      box-shadow: 0 0 8px rgba(129, 199, 132, 0.18);
    }
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11px;
    color: $text;
    margin-bottom: 3px;
  }

  &__rank {
    color: $dim;
    font-size: 10px;

    .is-best & { color: $ok; font-weight: 700; }
  }

  &__svg {
    width: 100%;
    height: 62px;
    display: block;
    background: rgba(2, 12, 26, 0.6);
    border-radius: 3px;
  }

  &__field {
    fill: rgba(38, 166, 154, 0.14);
    stroke: rgba(79, 195, 247, 0.5);
    stroke-width: 1.4;
  }

  &__pond {
    fill: rgba(244, 67, 54, 0.28);
    stroke: rgba(244, 67, 54, 0.75);
    stroke-width: 1.2;
  }

  &__pt {
    fill: #ffd54f;
    stroke: rgba(0, 0, 0, 0.5);
    stroke-width: 0.8;
  }

  &__stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px 6px;
    margin-top: 4px;
    font-size: 10px;
    color: $dim;

    b {
      color: #e6f5ff;
      font-family: Consolas, Monaco, monospace;
      font-weight: 400;
    }

    b.ok { color: $ok; font-weight: 700; }
  }

  &__note {
    margin-top: 3px;
    color: #5b7c99;
    font-size: 9px;
    line-height: 12px;
  }
}

/* ── 卡 4：E2 ── */
.e2 {
  display: flex;
  gap: 10px;

  &__table {
    flex: 1.35;
    border-collapse: collapse;

    th {
      text-align: left;
      padding: 1px 4px;
      color: #6d90ad;
      font-weight: 400;
      font-size: 9px;
      border-bottom: 1px solid rgba(79, 195, 247, 0.2);
      white-space: nowrap;
    }

    td {
      padding: 2px 4px;
      font-size: 10px;
      border-bottom: 1px dashed rgba(79, 195, 247, 0.1);
      white-space: nowrap;
    }

    tr.is-best td {
      color: $ok;
      background: rgba(129, 199, 132, 0.1);
    }

    .num { font-family: Consolas, Monaco, monospace; }
    .num.ok { font-weight: 700; }
    .effort, .cx { color: $dim; font-size: 9px; }
    i.el-icon-trophy { margin-left: 4px; color: #ffd54f; }
  }

  &__curves {
    flex: 1;
    min-width: 0;

    svg {
      width: 100%;
      height: 74px;
      display: block;
      background: rgba(2, 12, 26, 0.6);
      border-radius: 3px;
    }
  }

  &__legend {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 8px;
    margin-top: 4px;
    font-size: 9px;
    color: $dim;

    i {
      display: inline-block;
      width: 8px;
      height: 2px;
      margin-right: 3px;
      vertical-align: middle;
    }
  }

  &__legend-axis {
    color: #5b7c99;
  }
}
</style>
