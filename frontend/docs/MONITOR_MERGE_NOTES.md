# 农业智能监测平台 —— 合并注意事项（给组长）

> 分支：`feature/monitor-ui`　提交人：1号 刘建鑫（前端）
> 配套文档：`frontend/docs/MONITOR_TASKBOOK.md`（功能与技术细节）、`frontend/docs/GIS_FRONTEND.md`（GIS 模块）

---

## 0. 一句话

本 PR 新增 **4 个页面**（首页监控大屏 / 地区监控 / 数据库管理 / 遥感分析）+
**1 个独立演示入口** `monitor.html`，以及配套的栅格地图工具、回传帧编解码器、逻辑回归测试。

**改动范围：新增 35 个文件、修改 4 个文件、删除 0 个文件。全部在 `frontend/` 内。**
未改动 `backend/**`、`simulator/**`、任何 SQL、任何其他人的页面或 Service。

---

## 1. ⚠️ 与 `feature/frontend-gis` 的重叠：3 个共享文件

本分支基于 `main`，与 `feature/frontend-gis`（1号 的 GIS 模块 PR）**同时改了 3 个共享文件**。
两个 PR 的改动**都是纯粹的追加**（加路由 / 加入口 / 加脚本），没有任何语义冲突 ——
但 Git 的行级合并会在下面这 3 个文件报冲突。

### 1.1 `frontend/src/router/staticRoutes.js`

| PR | 追加内容 |
| --- | --- |
| GIS PR | 1 条路由：`/farmland/FarmlandGis` |
| 本 PR | 4 条路由：`/agrimonitor/Dashboard`、`RegionMonitor`、`DatabaseManage`、`RemoteSensing` |

两者都插在 `/404` 之前，所以会冲突。

**解决方式：两边都保留**（共 5 条路由都在 `/404` 之前），删掉冲突标记即可。

### 1.2 `frontend/vue.config.js` ⚠️ 这个要手工做

| PR | 改动 |
| --- | --- |
| GIS PR | 把内联的 `pages: {...}` 重构成 `buildPages()` 函数，并在 `NODE_ENV !== 'production'` 时加入 `pages.gis` |
| 本 PR | 同样重构成 `buildPages()`，并在同样的条件下加入 `pages.monitor` |

两个 PR 都引入了名为 `buildPages()` 的函数，Git 会报冲突。

**解决方式**：**只保留一个 `buildPages()` 函数**，`if (process.env.NODE_ENV !== 'production') { ... }`
里同时包含 `pages.gis` 和 `pages.monitor` 两个入口。结果应该长这样：

```js
function buildPages () {
  const pages = {
    index: { /* ... 原样不动 ... */ },
    aivideo: { /* ... 原样不动 ... */ }
  }

  if (process.env.NODE_ENV !== 'production') {
    pages.gis = {
      entry: 'src/gisdemo/main.js',
      template: 'src/gisdemo/index.html',
      title: '农田智能采样GIS演示',
      filename: 'gis.html',
      chunks: ['chunk-vendors', 'chunk-common', 'gis']
    }
    pages.monitor = {
      entry: 'src/monitordemo/main.js',
      template: 'src/monitordemo/index.html',
      title: '星穹耕界 · 农业智能监测平台',
      filename: 'monitor.html',
      chunks: ['chunk-vendors', 'chunk-common', 'monitor']
    }
  }

  return pages
}
```

> 两个演示入口都**必须在生产构建下不产出**，这是评审意见 #3 的安全要求，合并时不要漏掉任一个 `if`。

### 1.3 `frontend/package.json`

| PR | 追加的脚本 |
| --- | --- |
| GIS PR | `"test:gis": "node tests/gis/run.mjs"` |
| 本 PR | `"test:monitor": "node tests/monitor/run.mjs"` |

**解决方式：两个脚本都保留。** 另外本 PR 新增了一个依赖 `"echarts-gl": "^1.1.2"`（3D 地形视图用），
`package-lock.json` 已同步，与 GIS PR 不冲突。

### 1.4 推荐的合并顺序

**先合 `feature/frontend-gis`，再合本 PR。**
先合 GIS 之后，本 PR 只需在 `buildPages()` 里追加一个 `pages.monitor` 块，冲突面会小很多。
如果顺序反过来，解决方式完全一样（两边都保留），只是要手工删一次冲突标记。

> 两个 PR 合并后**都要跑一次**：`npm run build`（确认 dist 里**既没有** `gis.html` **也没有** `monitor.html`）、
> `npm run test:gis`、`npm run test:monitor`。

---

## 2. 怎么跑起来、怎么自测

```bash
cd frontend
npm install                                        # 本 PR 新增了 echarts-gl
set NODE_OPTIONS=--openssl-legacy-provider         # Windows；Node 17+ 必须加（工程用 webpack 4）
npm run serve
```

| 入口 | 地址 | 需要后端/登录吗 |
| --- | --- | --- |
| **独立演示（推荐自测用这个）** | `http://localhost:3000/monitor.html` | **不需要**，全部走前端 mock |
| 地区监控 | `monitor.html?page=region&province=山西` | 不需要 |
| 数据库管理 | `monitor.html?page=database` | 不需要 |
| 遥感分析 | `monitor.html?page=remote` | 不需要 |
| 大屏直接下钻到某省 | `monitor.html?province=山西&layer=aqi` | 不需要 |
| JeePlus 正式路由 | `/#/agrimonitor/Dashboard` 等 4 条 | 需要 5号 后端可登录 |

**命令行自测**（不需要浏览器、不需要 `npm install`）：

```bash
npm run test:monitor      # 68 项，退出码 0 表示全过
```

覆盖：回传帧编解码与非法输入拒绝（25 项）、E1 布点策略评估（9 项）、
E2 路线算法对比（8 项）、echarts 压缩坐标解码回归（7 项）、栅格掩膜与着色（8 项）、
任务书条目对照完整性（6 项），以及"时间轴首末帧必须不同"等 5 条带 ★ 的关键回归。

**页面自测建议顺序**（约 3 分钟）：

1. 打开 `monitor.html` —— 默认是「天气图层」视图，中国地图上有逐像素着色的降水栅格，底部时间轴在自动播放。
2. 点顶部「空气质量」胶囊 —— 配色切成国标六级；鼠标悬浮任意省份 → 弹出**该省内格点的真实均值与峰值**。
3. 单击「山西」→ 再单击「太原市」—— 面包屑变成 `全国 › 山西 › 太原市`，站点从 475 个地级市变成 117 个区县。
4. 右上角切「3D 地形」—— 换回原来的 3D 中国地图。
5. 拉到最下面「任务书指标区」—— 4 张卡：任务书条目对照 / 19 字节回传帧（点「演示 CRC 拦截」）/ E1 布点策略 / E2 路线算法对比。

> ⚠️ **开发模式首屏会慢十几秒**：`chunk-common.js` 未压缩有 21 MB，还要下载 283 KB 地图数据并预计算掩膜。
> 白屏十几秒属正常，第二次走缓存就快了。

---

## 3. 新增了什么（按功能分组）

| 分组 | 文件 | 说明 |
| --- | --- | --- |
| 4 个页面 | `views/modules/agrimonitor/{Dashboard,RegionMonitor,DatabaseManage,RemoteSensing}.vue` | 与团队规范 `views/modules/<module>/<Resource>.vue` 一致 |
| 10 个组件 | `views/modules/agrimonitor/components/*.vue` | 栅格地图 / 3D 地形 / 任务书指标区 / 数据报表 / 预警中心 / 设备总览 / 路线规划 / 星历图 / 迷你趋势图 |
| 演示入口 | `monitordemo/{index.html,main.js,Shell.vue}` | 无需登录，仅非生产构建产出 |
| 演示数据 | `mock/agrimonitor/*.js`（9 个） | 固定种子确定性生成，**不连数据库、不调写接口** |
| 地图工具 | `utils/geo/{chinaMapLoader,divisions,geojson}.js` | 地图注册、三级区划（33 省/475 市/2728 区县）、压缩坐标解码、栅格掩膜 |
| 回传帧 | `utils/udpFrame.js` | 任务书 §2 的 19 字节帧**真实编解码** + CRC-16/MODBUS |
| 静态资源 | `public/geo/{china,cn-divisions,cn-grid-mask}.json` | 共 283 KB，随 `public/` 原样拷贝，不进业务 bundle |
| 算法预留 | `api/agri/routeAlgorithm.js` | 路线算法的接入缝（当前返回 mock，生产路线仍由 3号 下发） |
| 测试 | `tests/monitor/run.mjs` | 68 项断言 |
| 文档 | `docs/MONITOR_TASKBOOK.md` | 与任务书逐条对照 + 三个已修坑的记录 |

**新增 npm 依赖只有 1 个**：`echarts-gl@^1.1.2`（3D 地形视图）。

---

## 4. 与任务书的对应

| 任务书 | 在哪体现 |
| --- | --- |
| **M1 采样点选取** | 「采样点密度」图层；GIS 模块的 PIP 判定 |
| **M2 遍历路线生成** | 地区监控页「路线规划」标签；E2 对比实验 |
| **M3 路径指引与到达弹窗** | 「终端在线率」图层；GIS 模块的到达弹窗（5 项指标） |
| **M4 数据回传帧封装与入库** | 「预警密度」图层；大屏底部「19 字节回传帧」卡（真实编解码 + CRC 拦截演示） |
| **E1 布点策略效果评估** | 大屏底部 E1 卡：双高值区养分场 + 三种策略各 20 点 + IDW 误差，**全部现算** |
| **E2 路线优化算法对比** | 大屏底部 E2 卡：最近邻 / 2-opt / 模拟退火 / 遗传算法 + 收敛曲线 + 复杂度 |
| **E3 采样区域约束** | 禁入区（池塘）参与避让；E1 实验场同样有禁入区 |
| **T1 / T2 / T3 / T5** | 大屏底部 T 用例芯片；断言落在 `tests/monitor/run.mjs` |

> **T4 说明**：任务书「测试用例与验收要点」的编号是 T1、T2、T3、T5，**没有 T4**。
> 界面里保留了这个位置并显式标注「任务书未定义」，避免答辩被误认为漏做。

---

## 5. ⚠️ 需要 5号 确认的一件事：回传帧格式

任务书 §2 明确给出了**二进制帧结构**（19 字节：帧头 `0xFF 0x55` + 2B 采样点ID +
4B 纬度×1e7 + 4B 经度×1e7 + 5×1B 指标 + 2B CRC-16/MODBUS）。

目前 `backend/.../integration/udp/` 下是 **JSON 占位实现**
（`DeviceMessageDecoder` 的注释写着 `TODO: 设备协议冻结后，如不是 JSON，新增对应 Decoder 实现`），
`scripts/send_mock_field_sampling_udp.py` 发的也是 JSON，字段用的是 `timestamp`。

**前端侧已经把任务书要求的二进制帧完整实现了**（`frontend/src/utils/udpFrame.js`），
包含 CRC-16/MODBUS（标准自测向量 `"123456789"` → `0x4B37`）与全部非法输入拒绝，
可以直接作为 5号 写 Java `BinaryDeviceMessageDecoder` 的参考实现。

两处任务书未写明、必须两边对齐的地方（前端各收口在一个常量上，改一行即可）：

| # | 事项 | 前端当前选择 | 怎么改 |
| --- | --- | --- | --- |
| 1 | **CRC 字节序** | 低字节在前（Modbus 常规） | 改 `CRC_BYTE_ORDER` 为 `'big'` |
| 2 | **1 字节温度的负值表示** | int8 二进制补码（-128~127°C） | 若用「+40 偏移」方案，改 `TEMP_ENCODING` 为 `'offset40'` |

另外 `timestamp` 不在团队冻结的公共字段里（`TEAM_MODULE_CONTRACTS.md` §1 规定设备采集时间是 `collectTime`），
建议 5号/2号 一并改成 `collectTime`。

---

## 6. 本 PR 明确**没有**做的事（岗位边界，不是遗漏）

| 没做的事 | 原因 |
| --- | --- |
| UDP 发送 / 二进制帧封包 | 2号 岗位 |
| 布点算法 / 最近邻 / 2-opt 的**生产实现** | 3号 岗位。前端只展示 5号 下发的 `routeGeoJson`；大屏里的 E1/E2 是任务书要求的**评估实验**，不参与业务链路 |
| MySQL 表设计 / 入库 / Excel 生成 | 4号 岗位 |
| Spring Boot 业务 / REST 路由 / UDP 接收 | 5号 岗位 |
| **任何数据库连接或写操作** | 「数据库管理」页面**是纯界面**：没有连接、没有 SQL，按钮只改前端状态；页面顶部有红色安全横幅 |

**页面数据全部来自 `frontend/src/mock/agrimonitor/` 的前端确定性 mock**，固定种子可复现。
后端就绪后把 mock 换成 `src/api/<module>/` 的 Service 即可，页面结构不用改。

---

## 7. 已知限制（先说清楚，避免答辩被问倒）

| 限制 | 说明 |
| --- | --- |
| 市级/区县级**边界**按需联网拉取 | 全国三级边界约 15 MB，无法内置；改为从 DataV 拉取并按 adcode 缓存。**拉取失败会在页面上弹黄条提示并保留当前层级，不会白屏**。区划数据与站点本身是离线内置的（不到 300 KB） |
| 栅格分辨率 0.16° | 约 9.3 万像素、单帧 40~70ms。放大到很大倍数时会略显柔和（双线性插值），这是有意的性能取舍 |
| 掩膜不处理"洞" | `china.json` 与 DataV 边界都没有洞；若将来有带洞的多边形，洞内格点会被算作境内 |
| 大屏底部任务书区的数字 | E1/E2 是**页面挂载时现算**的，每次刷新结果一致（固定种子），不是写死的常量 |

---

## 8. 顺便修掉的两个真实 bug（写在这里，因为它体现在代码注释里）

1. **`china.json` 是 echarts 旧版压缩坐标格式**（`coordinates` 是编码字符串，真值在 `encodeOffsets`）。
   `registerMap` 会自己解码所以画底图没事，但只要自己拿 `coordinates` 做点在多边形内判定，
   拿到的就是字符串 → 比较全变 `NaN` → **任何点都判为界外，而且不报错**。
   现统一由 `utils/geo/geojson.js` 的 `ensurePlainGeoJson()` 兜底，并有回归断言。
2. **栅格图层最初用 ECharts `heatmap` 实现时整张图是一个颜色**：
   `heatmap` 把每个点画成带模糊半径的圆再叠加混色，`blurSize:18` 打在屏幕上约 5px 的点距上时，
   一个像素被约 36 个点覆盖，颜色被平均掉。现改为**逐像素着色的栅格位图**，
   并用「渲染画布像素统计」客观验证（4729 种颜色 / 亮度标准差 22.3）。

两处的详细分析见 `frontend/docs/MONITOR_TASKBOOK.md` §2.2.1。
