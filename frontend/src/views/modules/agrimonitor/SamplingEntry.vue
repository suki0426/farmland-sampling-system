<template>
  <div class="sampling-entry">
    <!-- ══════════ 顶部说明 ══════════ -->
    <div class="entry-head">
      <div class="entry-head__left">
        <i class="el-icon-edit-outline"></i>
        <div>
          <h2>采样数据录入</h2>
          <p>采集员专用：填写现场数据 → 按农事规则判定 → 封装回传帧 → 给出结论</p>
        </div>
      </div>
      <div class="entry-head__right">
        <el-tag size="mini" type="warning" effect="plain">仅本页 · 不写数据库</el-tag>
        <el-button size="mini" icon="el-icon-refresh-left" @click="resetForm">清空</el-button>
        <el-button size="mini" type="primary" icon="el-icon-magic-stick" @click="loadDemo">载入示例</el-button>
      </div>
    </div>

    <div class="entry-body">
      <!-- ══════════ 左：录入表单 ══════════ -->
      <div class="entry-col">
        <div class="panel">
          <div class="panel__title">① 采样点与坐标</div>

          <el-form label-width="92px" size="small" class="entry-form">
            <el-form-item label="选择采样点">
              <el-select v-model="form.samplingPointId" placeholder="选择采样点" style="width:100%">
                <el-option
                  v-for="p in samplePoints"
                  :key="p.samplingPointId"
                  :label="`${p.pointCode} · ${p.pointName}`"
                  :value="p.samplingPointId" />
              </el-select>
            </el-form-item>

            <el-form-item label="采样点 ID">
              <el-input-number v-model="form.samplingPointId" :min="0" :max="65535" :controls="false" style="width:100%" />
              <div class="entry-hint">对应回传帧里的 2 字节，取值 0~65535</div>
            </el-form-item>

            <el-form-item label="经度 LON">
              <el-input v-model="form.longitude" placeholder="如 112.5465203" />
            </el-form-item>
            <el-form-item label="纬度 LAT">
              <el-input v-model="form.latitude" placeholder="如 37.8684907" />
            </el-form-item>
          </el-form>
        </div>

        <div class="panel panel--grow">
          <div class="panel__title">
            ② 五项采样指标
            <span class="panel__title-extra">
              <el-button size="mini" type="text" @click="loadDemo">填入示例值</el-button>
            </span>
          </div>

          <el-form label-width="92px" size="small" class="entry-form">
            <el-form-item
              v-for="f in fields"
              :key="f.key"
              :label="f.label">
              <div class="entry-field">
                <el-input v-model="form[f.key]" :placeholder="`${f.min} ~ ${f.max}`" />
                <span class="entry-field__unit">{{ f.unit }}</span>
              </div>
              <div class="entry-hint">农事适宜区间 {{ f.min }} ~ {{ f.max }}{{ f.unit }}</div>
            </el-form-item>
          </el-form>

          <el-button
            type="primary"
            class="entry-submit"
            icon="el-icon-s-promotion"
            @click="evaluate">
            按规则计算并封装回传帧
          </el-button>
        </div>
      </div>

      <!-- ══════════ 右：计算结果 ══════════ -->
      <div class="entry-col">
        <div v-if="!result" class="panel entry-empty">
          <i class="el-icon-cpu"></i>
          <p>填好左侧数据后点「按规则计算并封装回传帧」，这里会显示：</p>
          <ul>
            <li>五项指标的逐项判定（偏低 / 正常 / 偏高）</li>
            <li>综合评分与结论、预警等级</li>
            <li>真实的回传帧十六进制与 CRC 校验值</li>
          </ul>
        </div>

        <template v-else>
          <!-- 结论 -->
          <div class="panel entry-result" :style="{ borderColor: result.conclusion.color }">
            <div class="entry-result__head">
              <span class="entry-result__score" :style="{ color: result.conclusion.color }">
                {{ result.conclusion.score }}
                <em>分</em>
              </span>
              <div class="entry-result__main">
                <h3 :style="{ color: result.conclusion.color }">{{ result.conclusion.title }}</h3>
                <div class="entry-result__meta">
                  预警等级
                  <el-tag size="mini" :style="{ background: result.conclusion.level.color, borderColor: result.conclusion.level.color, color: '#fff' }">
                    {{ result.conclusion.level.label }}
                  </el-tag>
                  <span class="entry-result__time">{{ result.submittedAt }}</span>
                </div>
              </div>
            </div>
            <p class="entry-result__detail">{{ result.conclusion.detail }}</p>
          </div>

          <!-- 错误 -->
          <div v-if="result.validation.errors.length" class="panel entry-alert entry-alert--error">
            <div class="entry-alert__title"><i class="el-icon-error"></i>硬性错误（{{ result.validation.errors.length }}）</div>
            <ul><li v-for="(e, i) in result.validation.errors" :key="i">{{ e }}</li></ul>
          </div>
          <div v-if="result.validation.warnings.length" class="panel entry-alert entry-alert--warn">
            <div class="entry-alert__title"><i class="el-icon-warning-outline"></i>提示（{{ result.validation.warnings.length }}）</div>
            <ul><li v-for="(w, i) in result.validation.warnings" :key="i">{{ w }}</li></ul>
          </div>

          <!-- 逐项判定 -->
          <div class="panel">
            <div class="panel__title">③ 五项指标逐项判定</div>
            <table class="entry-table">
              <thead>
                <tr><th>指标</th><th>录入值</th><th>适宜区间</th><th>判定</th><th>说明</th></tr>
              </thead>
              <tbody>
                <tr v-for="i in result.indicators" :key="i.key">
                  <td>{{ i.label }}</td>
                  <td class="num">{{ i.value === null ? '—' : i.value + i.unit }}</td>
                  <td class="num dim">{{ i.min }} ~ {{ i.max }}{{ i.unit }}</td>
                  <td><span class="dot" :style="{ background: i.status.color }"></span>{{ i.status.label }}</td>
                  <td class="dim">{{ i.advice }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 回传帧 -->
          <div class="panel">
            <div class="panel__title">
              ④ 回传帧封装（任务书 §2 · {{ result.frame.expectedLength }} 字节）
              <span class="panel__title-extra">
                <el-tag v-if="result.frame.ok" size="mini" type="success" effect="dark">封装成功</el-tag>
                <el-tag v-else size="mini" type="danger" effect="dark">封装失败</el-tag>
              </span>
            </div>
            <div v-if="result.frame.ok">
              <div class="entry-hex">{{ result.frame.hex }}</div>
              <div class="entry-frame-meta">
                <span>长度 <b>{{ result.frame.length }}</b> 字节</span>
                <span>CRC-16/MODBUS <b>0x{{ result.frame.crc.toString(16).toUpperCase() }}</b></span>
                <span>采样点 ID <b>{{ result.frame.decoded.samplingPointId }}</b></span>
                <span>反解坐标 <b>{{ result.frame.decoded.latitude }}, {{ result.frame.decoded.longitude }}</b></span>
              </div>
              <div class="entry-hint">
                这是用 <code>src/utils/udpFrame.js</code> 真实编码后再反解出来的结果，不是画出来的。
                帧内 5 项指标各占 1 字节，所以反解值与录入值可能差 &lt;1。
              </div>
            </div>
            <div v-else class="entry-alert entry-alert--error entry-alert--inline">
              <i class="el-icon-warning-outline"></i>{{ result.frame.error }}
            </div>
          </div>

          <el-button
            type="success"
            class="entry-submit"
            icon="el-icon-check"
            :disabled="!result.validation.ok"
            @click="submit">
            {{ result.validation.ok ? '确认提交（仅记录在本页）' : '存在硬性错误，无法提交' }}
          </el-button>
        </template>
      </div>
    </div>

    <!-- ══════════ 本次会话录入记录 ══════════ -->
    <div class="panel entry-records">
      <div class="panel__title">
        本次会话录入记录
        <span class="panel__title-extra">共 {{ records.length }} 条</span>
      </div>
      <div v-if="!records.length" class="entry-hint">还没有提交记录。录入并点「确认提交」后会出现在这里（仅存在于本页内存，刷新即清空）。</div>
      <table v-else class="entry-table">
        <thead>
          <tr>
            <th>#</th><th>采样点</th><th>坐标</th>
            <th v-for="f in fields" :key="f.key">{{ f.label }}</th>
            <th>评分</th><th>结论</th><th>帧长</th><th>时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, idx) in records" :key="idx">
            <td>{{ idx + 1 }}</td>
            <td>{{ r.pointCode }}</td>
            <td class="num dim">{{ r.longitude }}, {{ r.latitude }}</td>
            <td v-for="f in fields" :key="f.key" class="num">{{ r[f.key] }}</td>
            <td class="num"><span :style="{ color: r.color }">{{ r.score }}</span></td>
            <td class="dim">{{ r.title }}</td>
            <td class="num dim">{{ r.frameLength }}</td>
            <td class="dim">{{ r.time }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
/**
 * 采样数据录入（采集员专用子页面）
 *
 * 需求原文：「采集者可以填入信息，然后按照一些赋权规则、算法最终计算得出结果，
 *            要么就是单独分他一个子页面专门用来录入信息功能」
 *
 * 这一页就是那个"单独的子页面"，流程是：
 *   填写采样点与 5 项指标
 *     → `samplingRule.evaluateSample()` 跑规则（逐项阈值判定 + 硬性校验 + 综合评分 + 结论）
 *     → 用真实的 `udpFrame.encodeFrame()` 封成回传帧并反解核对
 *     → 给出结论；有硬性错误时**明确列出来且不允许提交**（不静默兜底）
 *
 * ⚠️ 「确认提交」只把记录放进本页内存，**不调接口、不写数据库**；
 *    真正的入库要等 5号 冻结写接口之后接上。
 */
import { SAMPLE_POINTS } from '@/mock/agrimonitor/frameStream'
import {
  SAMPLE_FIELDS, DEFAULT_SAMPLE, evaluateSample
} from '@/mock/agrimonitor/samplingRule'

export default {
  name: 'AgriSamplingEntry',
  data () {
    return {
      fields: SAMPLE_FIELDS,
      samplePoints: SAMPLE_POINTS,
      form: { ...DEFAULT_SAMPLE },
      result: null,
      records: []
    }
  },
  watch: {
    // 切换采样点时自动带出该点的坐标
    'form.samplingPointId' (id) {
      const p = SAMPLE_POINTS.filter(x => x.samplingPointId === id)[0]
      if (p) {
        this.form.longitude = p.longitude
        this.form.latitude = p.latitude
        this.form.pointCode = p.pointCode
      }
    }
  },
  methods: {
    evaluate () {
      const res = evaluateSample(this.form)
      res.submittedAt = this.now()
      this.result = res
      if (!res.validation.ok) {
        this.$message.warning('存在硬性错误，已列出原因，请修正后再提交')
      } else if (res.conclusion.tone === 'ok') {
        this.$message.success('样本有效，可直接提交')
      } else {
        this.$message.info(res.conclusion.title)
      }
    },

    loadDemo () {
      this.form = { ...DEFAULT_SAMPLE }
      this.evaluate()
    },

    resetForm () {
      this.form = {
        samplingPointId: null,
        pointCode: '',
        longitude: '',
        latitude: '',
        soilTemperature: '',
        soilMoisture: '',
        airTemperature: '',
        airHumidity: '',
        soilDepth: ''
      }
      this.result = null
    },

    submit () {
      if (!this.result || !this.result.validation.ok) {
        return
      }
      this.records.unshift({
        pointCode: this.form.pointCode || '—',
        longitude: this.form.longitude,
        latitude: this.form.latitude,
        soilTemperature: this.form.soilTemperature,
        soilMoisture: this.form.soilMoisture,
        airTemperature: this.form.airTemperature,
        airHumidity: this.form.airHumidity,
        soilDepth: this.form.soilDepth,
        score: this.result.conclusion.score,
        title: this.result.conclusion.title,
        color: this.result.conclusion.color,
        frameLength: this.result.frame.length,
        time: this.now()
      })
      this.$message.success('已加入本次会话记录（未写入数据库）')
    },

    now () {
      const d = new Date()
      const pad = n => String(n).padStart(2, '0')
      return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    }
  }
}
</script>

<style lang="scss" scoped>
$line: rgba(79, 195, 247, 0.22);
$text: #cfe8ff;
$dim: #8fb8d8;

.sampling-entry {
  padding: 14px;
  box-sizing: border-box;
  min-height: 100%;
  background:
    radial-gradient(1000px 520px at 50% -10%, rgba(21, 101, 192, 0.28), transparent 70%),
    linear-gradient(180deg, #041224 0%, #061a32 60%, #04101f 100%);
  color: $text;
}

.entry-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  padding: 10px 14px;
  border: 1px solid $line;
  border-radius: 6px;
  background: rgba(6, 26, 50, 0.6);

  &__left {
    display: flex;
    align-items: center;
    gap: 12px;

    i { font-size: 26px; color: #4fc3f7; }

    h2 {
      margin: 0;
      font-size: 17px;
      color: #81d4fa;
      letter-spacing: 1px;
    }

    p {
      margin: 3px 0 0;
      font-size: 12px;
      color: $dim;
    }
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: none;
  }
}

.entry-body {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.entry-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel {
  border: 1px solid $line;
  border-radius: 6px;
  background: rgba(6, 26, 50, 0.55);
  padding: 12px;
  box-sizing: border-box;

  &--grow { flex: 1; }

  &__title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    padding-left: 8px;
    border-left: 3px solid #4fc3f7;
    font-size: 14px;
    font-weight: 600;
    color: #81d4fa;
  }

  &__title-extra { margin-left: auto; font-weight: 400; font-size: 12px; color: $dim; }
}

.entry-form {
  ::v-deep .el-form-item { margin-bottom: 14px; }
  ::v-deep .el-form-item__label { color: $dim; }
  ::v-deep .el-input__inner {
    background: rgba(4, 18, 36, 0.72);
    border-color: rgba(79, 195, 247, 0.28);
    color: $text;
  }
  ::v-deep .el-input__inner::placeholder { color: #5b7c99; }
  ::v-deep .el-input__inner:focus { border-color: #4fc3f7; }
  ::v-deep .el-input-number .el-input__inner { text-align: left; }
}

.entry-field {
  display: flex;
  align-items: center;
  gap: 8px;

  .el-input { flex: 1; }

  &__unit {
    flex: none;
    width: 42px;
    color: $dim;
    font-size: 12px;
  }
}

.entry-hint {
  margin-top: 4px;
  font-size: 11px;
  line-height: 16px;
  color: #5b7c99;

  code {
    color: #81d4fa;
    background: rgba(79, 195, 247, 0.1);
    padding: 0 3px;
    border-radius: 2px;
  }
}

.entry-submit {
  width: 100%;
  margin-top: 4px;
}

.entry-empty {
  text-align: center;
  padding: 30px 16px;
  color: $dim;

  i { font-size: 34px; color: rgba(79, 195, 247, 0.5); }

  p { margin: 10px 0 8px; font-size: 13px; }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: 12px;
    line-height: 22px;
    color: #6d90ad;
  }
}

.entry-result {
  border-width: 2px;

  &__head {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  &__score {
    flex: none;
    font-size: 34px;
    font-weight: 700;
    font-family: Consolas, Monaco, monospace;
    line-height: 1;

    em { font-size: 13px; font-style: normal; margin-left: 2px; }
  }

  &__main { flex: 1; min-width: 0; }

  h3 { margin: 0; font-size: 15px; }

  &__meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 6px;
    font-size: 12px;
    color: $dim;
  }

  &__time {
    margin-left: auto;
    font-family: Consolas, Monaco, monospace;
    color: #6d90ad;
  }

  &__detail {
    margin: 10px 0 0;
    padding-top: 10px;
    border-top: 1px dashed rgba(79, 195, 247, 0.2);
    font-size: 12px;
    line-height: 20px;
    color: $text;
    word-break: break-all;
  }
}

.entry-alert {
  padding: 10px 12px;
  border-radius: 5px;

  &__title { font-size: 13px; font-weight: 600; margin-bottom: 5px; }

  ul { margin: 0; padding-left: 18px; font-size: 12px; line-height: 20px; }

  &--error {
    background: rgba(239, 83, 80, 0.12);
    border: 1px solid rgba(239, 83, 80, 0.5);
    .entry-alert__title { color: #ff8a80; }
    ul { color: #ffab91; }
  }

  &--warn {
    background: rgba(255, 183, 77, 0.12);
    border: 1px solid rgba(255, 183, 77, 0.5);
    .entry-alert__title { color: #ffcc80; }
    ul { color: #ffe0b2; }
  }

  &--inline {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #ffab91;
    background: rgba(239, 83, 80, 0.12);
    border: 1px solid rgba(239, 83, 80, 0.5);
  }
}

.entry-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;

  th {
    text-align: left;
    padding: 6px 8px;
    color: #6d90ad;
    font-weight: 400;
    font-size: 11px;
    border-bottom: 1px solid rgba(79, 195, 247, 0.2);
    white-space: nowrap;
  }

  td {
    padding: 7px 8px;
    border-bottom: 1px dashed rgba(79, 195, 247, 0.12);
    white-space: nowrap;
  }

  tbody tr:hover { background: rgba(79, 195, 247, 0.07); }

  .num { font-family: Consolas, Monaco, monospace; }
  .dim { color: $dim; }
}

.dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-right: 5px;
  vertical-align: middle;
}

.entry-hex {
  padding: 8px 10px;
  border-radius: 4px;
  background: rgba(4, 18, 36, 0.8);
  border: 1px solid rgba(79, 195, 247, 0.24);
  font-family: Consolas, Monaco, monospace;
  font-size: 13px;
  letter-spacing: 0.6px;
  color: #9fe6a0;
  word-break: break-all;
}

.entry-frame-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
  margin-top: 8px;
  font-size: 12px;
  color: $dim;

  b { color: #e6f5ff; font-family: Consolas, Monaco, monospace; font-weight: 400; }
}

.entry-records {
  margin-top: 12px;

  .entry-hint { margin-top: 0; }
}

@media (max-width: 1100px) {
  .entry-body { flex-direction: column; }
  .entry-col { width: 100%; }
}
</style>
