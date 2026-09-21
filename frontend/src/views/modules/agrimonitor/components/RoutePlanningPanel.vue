<template>
  <div class="route-planning">
    <el-alert
      type="warning"
      :closable="false"
      show-icon
      class="route-planning__note"
      title="算法模块接口已预留，但尚未接入：3号 的 Python 模块需由 5号 封装成 REST 后前端才能真调用。当前结果标记为「模拟」，只用于把页面与数据结构跑通。" />

    <div class="route-planning__body">
      <!-- ── 左侧：参数 ── -->
      <div class="route-planning__form">
        <div class="panel-title">布点参数</div>
        <el-form label-width="86px" size="mini">
          <el-form-item label="所属地区">
            <el-input :value="regionKey" disabled />
          </el-form-item>
          <el-form-item label="布点策略">
            <el-select v-model="strategy" class="route-planning__full">
              <el-option v-for="s in strategies" :key="s.code" :label="s.label" :value="s.code" />
            </el-select>
          </el-form-item>
          <el-form-item label="采样点数">
            <el-input-number v-model="count" :min="3" :max="40" size="mini" class="route-planning__full" />
          </el-form-item>
          <el-form-item label="">
            <el-button size="mini" type="primary" icon="el-icon-place" :loading="generating" @click="doGenerate">
              生成采样点
            </el-button>
          </el-form-item>
        </el-form>

        <div class="panel-title">路线算法</div>
        <el-form label-width="86px" size="mini">
          <el-form-item label="算法">
            <el-select v-model="method" class="route-planning__full">
              <el-option v-for="m in methods" :key="m.code" :label="m.label" :value="m.code" />
            </el-select>
          </el-form-item>
          <el-form-item label="起点">
            <el-select v-model="startIndex" class="route-planning__full">
              <el-option v-for="(p, i) in points" :key="p.samplingPointId" :label="p.pointCode" :value="i" />
            </el-select>
          </el-form-item>
          <el-form-item label="">
            <el-button
              size="mini"
              type="success"
              icon="el-icon-guide"
              :loading="planning"
              :disabled="points.length < 2"
              @click="doPlan">
              规划路线
            </el-button>
          </el-form-item>
        </el-form>

        <div class="route-planning__method-desc">
          {{ currentMethod.desc }}
        </div>
      </div>

      <!-- ── 中间：示意图 ── -->
      <div class="route-planning__sketch">
        <div class="panel-title">
          路线示意图
          <span v-if="result" class="route-planning__badge" :class="result.source === 'mock' ? 'is-mock' : 'is-real'">
            {{ result.source === 'mock' ? '模拟结果' : '算法返回' }}
          </span>
        </div>
        <svg v-if="points.length" class="route-planning__svg" viewBox="0 0 400 320" preserveAspectRatio="xMidYMid meet">
          <!-- 地块示意边框 -->
          <rect x="24" y="20" width="352" height="280" fill="rgba(76,175,80,0.06)" stroke="#4caf50" stroke-dasharray="6 4" />
          <!-- 路线 -->
          <polyline v-if="sketchPath" :points="sketchPath" fill="none" stroke="#1565c0" stroke-width="2.5" />
          <!-- 方向箭头（每段中点） -->
          <polygon
            v-for="(a, i) in sketchArrows"
            :key="'a' + i"
            :points="a.points"
            :transform="`rotate(${a.angle} ${a.x} ${a.y})`"
            fill="#1565c0" />
          <!-- 点 -->
          <g v-for="(p, i) in sketchPoints" :key="p.id">
            <circle :cx="p.x" :cy="p.y" :r="i === 0 ? 9 : 7" :fill="i === 0 ? '#ff8f00' : '#f9a825'" stroke="#fff" stroke-width="2" />
            <text :x="p.x" :y="p.y + 3.5" text-anchor="middle" font-size="9" fill="#fff" font-weight="700">
              {{ p.order }}
            </text>
            <text :x="p.x" :y="p.y - 12" text-anchor="middle" font-size="9" fill="#37474f">{{ p.code }}</text>
          </g>
        </svg>
        <el-empty v-else description="先点击「生成采样点」" :image-size="70" />
      </div>

      <!-- ── 右侧：结果 ── -->
      <div class="route-planning__result">
        <div class="panel-title">规划结果</div>
        <template v-if="result">
          <div class="result-grid">
            <div class="result-grid__item">
              <div class="result-grid__value">{{ result.distance }}<em>m</em></div>
              <div class="result-grid__label">总距离</div>
            </div>
            <div class="result-grid__item">
              <div class="result-grid__value">{{ durationText }}</div>
              <div class="result-grid__label">预计耗时</div>
            </div>
            <div class="result-grid__item">
              <div class="result-grid__value">{{ result.orderedPoints.length }}</div>
              <div class="result-grid__label">访问点数</div>
            </div>
          </div>

          <div class="result-improve">
            <span>优化对比</span>
            <b>{{ result.diagnostics.initialDistance }} m</b>
            <i class="el-icon-right"></i>
            <b class="is-good">{{ result.diagnostics.optimizedDistance }} m</b>
            <el-tag size="mini" type="success">缩短 {{ result.diagnostics.improvementPercent }}%</el-tag>
          </div>

          <div class="panel-title panel-title--sub">访问顺序</div>
          <div class="route-planning__chips">
            <span v-for="(p, i) in result.orderedPoints" :key="p.samplingPointId" class="chip">
              <b>{{ i + 1 }}</b>{{ p.pointCode }}
            </span>
          </div>

          <div class="panel-title panel-title--sub">算法契约（真实接入时后端需返回）</div>
          <pre class="route-planning__code">plan_route(points, start_point=None, method="{{ method }}")
  -> {
       orderedPoints: List[Point],   // 不漏点、不重复
       routeGeoJson:  str,           // LineString
       distance:      float,         // 米
       method:        str,           // 实际使用的算法
       diagnostics:   { initialDistance, optimizedDistance }
     }

POST /navigation/route/plan
  { boundaryGeoJson, points, startPoint, method } -> RouteResult</pre>
        </template>
        <el-empty v-else description="点击「规划路线」查看结果" :image-size="70" />
      </div>
    </div>
  </div>
</template>

<script>
/**
 * 路线规划面板（需求 2-(2)：「这个可以留下算法模块」）
 *
 * ── 本组件的定位 ──────────────────────────────────────────────────
 *   前端**不实现任何路径优化算法**。算法是 3号 的 Python 模块，
 *   由 5号 通过 adapter 调成 REST；前端只负责 传参 → 拿结果 → 画出来。
 *   因此这里做的是：把**接口契约、参数表单、结果展示**全部准备好，
 *   等 5号 冻结 REST 后，只需替换 `@/api/agri/routeAlgorithm` 里的两个函数体。
 *
 * ⚠️ 当前结果来自 mock，已在界面上明确标记「模拟结果」，不会伪造成"算法已接入"。
 * ⚠️ 不连数据库、不写任何数据。
 */
import { ROUTE_METHODS, POINT_STRATEGIES, generateSamplingPoints, planRoute } from '@/api/agri/routeAlgorithm'

export default {
  name: 'RoutePlanningPanel',
  props: {
    regionKey: { type: String, default: '' }
  },
  data () {
    return {
      methods: ROUTE_METHODS,
      strategies: POINT_STRATEGIES,
      strategy: 'grid',
      method: '2opt',
      count: 8,
      startIndex: 0,
      points: [],
      result: null,
      generating: false,
      planning: false
    }
  },
  computed: {
    currentMethod () {
      return this.methods.filter(m => m.code === this.method)[0] || this.methods[0]
    },
    durationText () {
      if (!this.result) {
        return '--'
      }
      const m = Math.floor(this.result.durationSeconds / 60)
      const s = Math.round(this.result.durationSeconds % 60)
      return `${m}分${s}秒`
    },
    /** 把经纬度映射到 SVG 视口 */
    sketchPoints () {
      const list = this.result ? this.result.orderedPoints : this.points
      if (!list.length) {
        return []
      }
      const lngs = list.map(p => p.longitude)
      const lats = list.map(p => p.latitude)
      const minLng = Math.min.apply(null, lngs)
      const maxLng = Math.max.apply(null, lngs)
      const minLat = Math.min.apply(null, lats)
      const maxLat = Math.max.apply(null, lats)
      const spanLng = Math.max(maxLng - minLng, 1e-6)
      const spanLat = Math.max(maxLat - minLat, 1e-6)
      return list.map((p, i) => ({
        id: p.samplingPointId,
        code: p.pointCode,
        order: i + 1,
        x: 40 + ((p.longitude - minLng) / spanLng) * 320,
        y: 300 - ((p.latitude - minLat) / spanLat) * 260
      }))
    },
    sketchPath () {
      return this.sketchPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    },
    sketchArrows () {
      const pts = this.sketchPoints
      const arrows = []
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1]
        const b = pts[i]
        const len = Math.hypot(b.x - a.x, b.y - a.y)
        if (len < 22) {
          continue
        }
        const angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI + 90
        const mx = (a.x + b.x) / 2
        const my = (a.y + b.y) / 2
        arrows.push({
          angle,
          x: mx,
          y: my,
          points: `${mx.toFixed(1)},${(my - 5).toFixed(1)} ${(mx - 4).toFixed(1)},${(my + 4).toFixed(1)} ${(mx + 4).toFixed(1)},${(my + 4).toFixed(1)}`
        })
      }
      return arrows
    }
  },
  watch: {
    regionKey () {
      this.points = []
      this.result = null
    }
  },
  methods: {
    async doGenerate () {
      this.generating = true
      this.result = null
      try {
        const res = await generateSamplingPoints({
          regionKey: this.regionKey,
          count: this.count,
          strategy: this.strategy
        })
        this.points = res.points
        this.startIndex = 0
        if (res.source === 'mock') {
          this.$message.info('采样点由前端演示数据生成（真实布点由 3号 算法按农田边界计算）')
        }
      } catch (e) {
        this.$message.error(`生成采样点失败：${(e && e.message) || e}`)
      } finally {
        this.generating = false
      }
    },

    async doPlan () {
      if (this.points.length < 2) {
        this.$message.warning('至少需要 2 个采样点')
        return
      }
      this.planning = true
      try {
        const ordered = this.points.slice()
        // 按选定起点重排（仅调整输入顺序，不做优化计算）
        const start = ordered.splice(this.startIndex, 1)[0]
        ordered.unshift(start)
        const res = await planRoute({ points: ordered, method: this.method })
        this.result = res
        if (res.source === 'mock') {
          this.$message.warning('当前为模拟结果：算法 REST 尚未冻结，前端不发请求')
        }
      } catch (e) {
        this.$message.error(`路线规划失败：${(e && e.message) || e}`)
      } finally {
        this.planning = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.route-planning {
  &__note {
    margin-bottom: 10px;
  }

  &__body {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  &__form {
    width: 280px;
    flex: none;
  }

  &__sketch {
    flex: 1;
    min-width: 0;
  }

  &__result {
    width: 340px;
    flex: none;
  }

  &__full {
    width: 100%;
  }

  &__method-desc {
    margin-top: 4px;
    padding: 8px 10px;
    border-radius: 4px;
    background: #f5f7fa;
    color: #607d8b;
    font-size: 12px;
    line-height: 18px;
  }

  &__svg {
    width: 100%;
    height: 320px;
    background: #fafcff;
    border: 1px solid #e4e9f0;
    border-radius: 4px;
  }

  &__badge {
    margin-left: auto;
    padding: 0 8px;
    border-radius: 9px;
    font-size: 11px;
    font-weight: 400;

    &.is-mock {
      background: #fff3e0;
      color: #e65100;
    }

    &.is-real {
      background: #e8f5e9;
      color: #2e7d32;
    }
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__code {
    margin: 6px 0 0;
    padding: 10px;
    background: #263238;
    color: #b2ff59;
    border-radius: 4px;
    font-size: 11px;
    line-height: 16px;
    overflow: auto;
  }
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 0 8px;
  padding-left: 8px;
  border-left: 3px solid #1976d2;
  font-size: 13px;
  font-weight: 600;
  color: #263238;

  &--sub {
    margin-top: 14px;
    border-left-color: #90a4ae;
    font-size: 12px;
  }

  &:first-child {
    margin-top: 0;
  }
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;

  &__item {
    padding: 8px 4px;
    border: 1px solid #e4e9f0;
    border-radius: 4px;
    background: #fafcff;
    text-align: center;
  }

  &__value {
    font-size: 18px;
    font-weight: 700;
    color: #1565c0;
    font-family: Consolas, Monaco, monospace;

    em {
      font-style: normal;
      font-size: 11px;
      color: #90a4ae;
      margin-left: 1px;
    }
  }

  &__label {
    color: #78909c;
    font-size: 12px;
  }
}

.result-improve {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 8px 10px;
  border-radius: 4px;
  background: #e8f5e9;
  font-size: 12px;
  color: #37474f;

  span {
    color: #78909c;
  }

  .is-good {
    color: #2e7d32;
  }
}

.chip {
  padding: 2px 8px;
  border-radius: 10px;
  background: #e3f2fd;
  color: #1565c0;
  font-size: 12px;

  b {
    margin-right: 3px;
  }
}
</style>
