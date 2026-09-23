# 农业监测大屏（agrimonitor）说明 —— 与任务书逐条对照

> 适用对象：1号 刘建鑫（前端 GIS）本人、组长评审、其他岗位联调。
> 本模块是「扩展页面」，**不属于任务书必做交付**，但它是把任务书的
> M1~M4 / E1~E4 / T1~T5 用界面呈现出来的地方，答辩时非常好用。

---

## 0. 一句话

4 个新页面（首页监控大屏 / 地区监控 / 数据库管理 / 遥感分析）+ 1 个独立演示入口
`monitor.html`。**全部使用前端确定性生成的演示数据：不连数据库、不执行任何 SQL、
不调用任何写接口。**

---

## 1. 怎么跑起来

```bash
cd frontend
set NODE_OPTIONS=--openssl-legacy-provider     # Windows；Node 17+ 必须加（工程用 webpack 4）
npm run serve
```

| 入口 | 地址 | 说明 |
| --- | --- | --- |
| **独立演示（推荐）** | `http://localhost:3000/monitor.html` | 不需要后端、不需要登录 |
| 深链到具体页面 | `monitor.html?page=region&province=山西` | `page` = `dashboard` / `region` / `database` / `remote` |
| JeePlus 正式路由 | `/#/agrimonitor/Dashboard` 等 | 需要后端菜单或静态路由，已注册在 `staticRoutes.js` |

跑逻辑测试：

```bash
npm run test:monitor      # 48 项，退出码 0 表示全过
npm run test:gis         # 1号 GIS 模块的 47 项，两个互不影响
```

> `monitor.html` 与 `gis.html` 一样，**只在非生产构建产出**
> （`vue.config.js` 的 `buildPages()` 里按 `NODE_ENV` gate 掉），
> 正式部署的 dist 里不存在这个入口。

---

## 2. 页面 1 —— 首页监控大屏（`Dashboard.vue`）

### 2.1 双视图

| 视图 | 组件 | 说明 |
| --- | --- | --- |
| **天气图层（默认）** | `components/WeatherMap.vue` | 天气 App 风格的**栅格热力地图** |
| 3D 地形 | `components/China3DMap.vue` | echarts-gl `map3D` 中国地图，按省填色 |

### 2.2 天气图层视图做了什么

需求原话是「做成天气 App 的那种空气质量地图、降水地图实时变化图，
可以像 iPhone 里一样切换」，且「太粗略了，只有省份，精确到第三级」。对应实现：

| 需求要素 | 实现 |
| --- | --- |
| 连续色彩（不是行政边界填色） | **逐像素着色的栅格位图**贴在 geo 上（`custom` 系列 + `api.coord()`） |
| 像天气 App 一样切换图层 | 顶部 10 个图层胶囊：环境 7 个 + 业务 3 个 |
| 实时变化 | 25 帧时间轴（过去 9h ~ 未来 15h，每小时 1 帧），可播放/拖动 |
| 雨的"团"会移动 | 场函数 = 基础地理梯度 + 6~9 个**沿时间轴单调平移的高斯中心** |
| 精确到第三级 | 全国 → 省 → 市 逐级下钻；站点与区划离线内置到区县（2728 个） |
| 悬浮看某个地区 | 悬浮省份/地市显示**该行政区内格点的真实均值与峰值**（不是中心点采样） |

### 2.2.1 三个已修的坑（都是"看起来对、其实不对"的问题）

这三处都不是笔误，而是**默认写法在这个场景下就是错的**，记下来避免以后重犯：

**① 用 ECharts `heatmap` 画连续场 → 整张图一个颜色**

`heatmap` 的实现是「每个数据点画一个**带模糊半径的圆**再叠加混色」。
最初的 `pointSize:11 / blurSize:18` 打在 0.35° 网格上，屏幕上点距约 5px，
于是一个像素被约 **36 个点**覆盖 —— 颜色全被平均掉，只剩一片中间调，
**整张图看起来是一个颜色**。把 blur 调小又会在放大时露出点与点之间的空隙。

改成：直接算出一张**逐像素着色**的栅格位图（`buildRasterRGBA()`），
用 `custom` 系列的 `renderItem` 通过 `api.coord()` 贴到 geo 上。
好处是逐像素精确、缩放平移时跟着 `api.coord` 走不会错位、
陆地之外由掩膜裁掉不会溢到海上。

**② `china.json` 是 echarts 旧版压缩坐标 → 全国视图的悬浮判定全部失效**

`public/geo/china.json` 的 `geometry.coordinates` 存的是**编码字符串**，
真值在 `geometry.encodeOffsets`（要靠「字符码−64 → ZigZag → 差分 → /1024」还原）。
`echarts.registerMap()` 内部会自己解码，所以**画底图没问题**；
但只要自己拿 `coordinates` 做点在多边形内判定，拿到的就是字符串 ——
字符串的 `.length` 大于 4 能骗过"环是否合法"的长度检查，
然后逐字符当坐标用，比较全变 `NaN`，**任何点都判为界外，而且不报任何错**。

表现就是「全国视图鼠标悬浮省份没有任何反应」。下钻后的 DataV 边界是普通 GeoJSON，
所以只有全国那一级坏 —— 这种"一半好一半坏"最难发现。
现在统一由 `@/utils/geo/geojson.js` 的 `ensurePlainGeoJson()` 兜底，
并且 `ringsOfGeometry()` 会在拿到非数值坐标时**直接跳过并报警**，不再静默产出错的 bbox。

**③ 高斯中心用 `sin(phase·2π)` 漂移 → 时间轴最后一帧和第一帧逐像素相同**

相位 0 与相位 1 的正弦值完全一样，于是 25 帧是"荡出去再荡回来"，
第 25 帧和第 1 帧**一模一样**。天气系统是持续移动的，
改成沿时间轴**单调平移**（`phase 0 → 起点，phase 1 → 终点`）。
这条已经写进测试断言：**首帧与末帧必须有 >10% 的像素不同**。

### 2.2.2 怎么客观验证"颜色不是一样的"

"看起来糊不糊"不能靠肉眼，所以做了两层可复现的验证：

- **`npm run test:monitor` 里的断言**（直接算像素）：
  - 每个图层至少 40 种颜色、亮度标准差 ≥ 8；
  - 掩膜外的像素 alpha 必须全为 0；
  - 同图层同帧两次生成的像素**逐字节一致**；
  - 首帧 vs 末帧、首帧 vs 中间帧的差异像素占比下限。
- **浏览器渲染探针**：带 `?probe=1` 打开页面，每帧把统计写到
  `<body data-weather-probe="...">`，无头浏览器 `--dump-dom` 就能读到。
  它同时给出**源栅格缓冲区**和**真实渲染画布**（直接抽样 canvas 像素）两组数字 ——
  后者才是"用户实际看到的"。实测（降水图层、全国视图）：

  ```json
  {"level":"nation","regions":33,"gridPoints":7871,
   "rasterSize":"396x234","rasterPixels":37663,
   "srcDistinctColors":843,"srcStdevLuma":19.3,
   "canvasColors":4729,"canvasStdev":22.3,"canvasMinLuma":29,"canvasMaxLuma":246.5}
  ```

  渲染画布 **4729 种颜色、亮度标准差 22.3、区间 29→246.5**，层次明确。
  `regions: 33` 也顺带证明了全国 33 个省级区域的索引都建好了（坑 ② 的效果）。


**图层清单**（`mock/agrimonitor/weatherField.js`）

| 分组 | 图层 | 单位 | 口径 |
| --- | --- | --- | --- |
| 环境 | 降水 | mm/h | 气象惯例蓝→绿→黄→橙→红→紫 |
| 环境 | 气温 | °C | 蓝冷红热 |
| 环境 | 空气质量 | AQI | 中国《环境空气质量指数技术规定》六级配色 |
| 环境 | PM2.5 | µg/m³ | 六级配色 |
| 环境 | 云量 | % | 深蓝→白 |
| 环境 | 风速 | m/s | 浅青→深青 |
| 环境 | 土壤湿度 | % | 棕→绿松石 |
| 业务 | 采样点密度 | 个/万公顷 | 对应 **M1** |
| 业务 | 终端在线率 | % | 对应 **M3** |
| 业务 | 预警密度 | 条/万公顷 | 对应 **M4** |

每个图层都带一句「农事结论」（`HOOK_TEXT`），把颜色翻译成能直接执行的动作，
例如「降水 > 25mm/h：暂停采样，注意田间排水」。

**数值口径**：`field01` 是通用场函数（基础地理梯度 + 6~9 个会漂移的高斯中心），
如果所有图层都用同一套高斯中心，高值区会把全国铺满并顶到色阶上限，
图例上就会出现「全国均值 19mm/h 降水」「AQI 均值 156」这类明显不合理的数字，
而且大片区域被钳在色阶顶端后**图上反而看不出差异**（在线率那一层会整片全绿）。
所以每个图层的色阶范围与高斯强度都单独收口，并用
`public/geo/cn-grid-mask.json` 的 7871 个格点 × 25 帧**复算校验**：

| 图层 | 单位 | 色阶范围 | 全帧均值 | 实际区间 | 顶上界占比 |
| --- | --- | --- | --- | --- | --- |
| 降水 | mm/h | 0~40 | 7.9 | 1.6 ~ 26.4 | 0% |
| 气温 | °C | -5~40 | 17.9 | -5 ~ 40 | 3.3% |
| 空气质量 | AQI | 0~300 | 85.8 | 0 ~ 251 | 0% |
| PM2.5 | µg/m³ | 0~200 | 42.9 | 0 ~ 111 | 0% |
| 云量 | % | 0~100 | 55.6 | 21 ~ 100 | 1.2% |
| 风速 | m/s | 0~20 | 5.7 | 2.4 ~ 19.3 | 0% |
| 土壤湿度 | % | 5~60 | 38.1 | 13.3 ~ 60 | 4.1% |
| 采样点密度 | 个/万公顷 | 0~60 | 28.0 | 0 ~ 60 | 0.5% |
| 终端在线率 | % | 70~100 | 93.5 | 84.5 ~ 99.8 | 0% |
| 预警密度 | 条/万公顷 | 0~20 | 8.6 | 0 ~ 20 | 1.3% |

> 校验脚本 `_probe_layers.mjs`（放在工作区，不属于交付物）会在
> 「均值跑到色阶范围的 15%~85% 之外」或「超过 5% 的格点被钳在上下界」时报警。
> 当前 10 个图层全部通过。

### 2.3 数据与资源

| 资源 | 体积 | 内容 |
| --- | --- | --- |
| `public/geo/china.json` | 61 KB | 34 个省级 GeoJSON（echarts 4.9 官方格式），用于注册底图 |
| `public/geo/cn-divisions.json` | 220 KB | 全国三级行政区划：33 省 / 475 市 / 2728 区县，含中心坐标 |
| `public/geo/cn-grid-mask.json` | 3.4 KB | 0.35° 栅格掩膜位图（181×107），预计算 7871 个境内格点 |

> 三个文件都放在 `public/` 下，**由 webpack 原样拷贝**，不进业务 bundle，
> 也不依赖运行时 CDN。下钻用的市级/区县**边界**体积太大（全国约 15 MB），
> 改为按需从 DataV 拉取并缓存；**拉取失败会明确提示并保留当前层级，不会白屏**。

### 2.4 底部「任务书指标区」（`components/TaskBookPanel.vue`）

四张卡，数字**都是现算的**，不是写死的：

| 卡 | 内容 |
| --- | --- |
| 任务书条目对照 | M1~M4 必做任务、E1~E4 扩展任务、T1/T2/T3/T5 验收要点，逐条标注负责岗位与前端交付内容 |
| 数据回传帧 · 19 字节 | 字节尺 + 真实编码的十六进制 + 解码值 + CRC；带「演示 CRC 拦截」按钮 |
| E1 布点策略效果评估 | 三种策略各 20 点 + IDW 估计误差 + 田块散点预览 |
| E2 路线优化算法对比 | 最近邻 / 2-opt / 模拟退火 / 遗传算法，最终距离 + 收敛曲线 + 复杂度 |

> **T4 说明**：任务书「测试用例与验收要点」一节的编号是 T1、T2、T3、T5，
> **没有 T4**。面板里保留了这个位置并显式标注，避免答辩时被误认为漏做。

---

## 3. 数据回传帧（`src/utils/udpFrame.js`）

严格按任务书 §2 的表格实现，**共 19 字节，大端序**：

| 偏移 | 长度 | 字段 | 编码 |
| --- | --- | --- | --- |
| 0 | 2B | 帧头 | `0xFF 0x55` |
| 2 | 2B | 采样点ID | uint16 BE，0~65535 |
| 4 | 4B | 纬度 LAT | int32 BE，度 ×1e7 |
| 8 | 4B | 经度 LON | int32 BE，度 ×1e7 |
| 12 | 1B | 土壤温度 | int8，°C |
| 13 | 1B | 土壤湿度 | uint8，% |
| 14 | 1B | 空气温度 | int8，°C |
| 15 | 1B | 空气湿度 | uint8，% |
| 16 | 1B | 土壤深度 | uint8，cm |
| 17 | 2B | CRC | CRC-16/MODBUS，覆盖前 17 字节 |

**这个模块是真实可用的编解码逻辑，不是展示占位。** `npm run test:monitor` 里有：

- CRC-16/MODBUS 标准自测向量（`"123456789"` → `0x4B37`）
- 编码 → 解码 字节级与数值级往返一致（坐标 7 位小数无损）
- **非法输入一律抛错，不静默兜底**：帧头错 / 长度错 / CRC 错 / 采样点 ID 越界 /
  坐标缺失（`null`、`undefined`）/ 1 字节指标越界
- 边界值可通过：ID=65535、湿度 0/100、温度 -128/127

### 3.1 需要和 2号 / 5号 对齐的两处（任务书未写明）

| # | 事项 | 本实现的选择 | 怎么改 |
| --- | --- | --- | --- |
| 1 | **CRC 字节序** | 低字节在前（Modbus 常规） | 改 `CRC_BYTE_ORDER` 为 `'big'` |
| 2 | **1 字节温度的负值表示** | int8 二进制补码（-128~127°C） | 若对方用「+40 偏移」方案，改 `TEMP_ENCODING` 为 `'offset40'` |

两处都收敛在一个常量上，**改一行即可**，不会散落在业务代码里。

> ⚠️ 前端**只做编解码演示，不发送 UDP、不写数据库**。
> 封包是 2号 的岗位，UDP 接收与入库是 5号 / 4号 的岗位。

---

## 4. 扩展实验（`src/mock/agrimonitor/experiments.js`）

### 4.1 E1 布点策略效果评估

- **真实土壤养分分布场**：两个高斯高值区 + 缓变背景（任务书原文举例），值域约 18~62
- **田块**：300m × 200m，右上角带**凹口**（对应 T5），内部有 **禁入区**（池塘，对应 E3）
- **三种策略**各取 20 点：随机布点 / 规则网格 / S 形（蛇形）
- **误差评估**：用 **IDW 反距离权重**（p=2）在密网格上估计整块田均值，与真值比较
- 同时给出**最小间距 / 平均间距 / 界外点数**（对应 T1 的三项验证要求）

结果（`npm run test:monitor` 实测，固定种子 `20260917`）：

| 策略 | 界外点 | 最小间距 | IDW 估计 | 相对误差 | 排名 |
| --- | --- | --- | --- | --- | --- |
| 随机布点 | 0 | 10.9 m | — | 3.73% | #3 |
| 规则网格 | 0 | 35.5 m | — | 0.19% | #1 |
| S 形布点 | 0 | 40.0 m | — | 2.72% | #2 |
| 真值 | — | — | 25.9 | — | — |

> 界外点恒为 0，正好是 T1「所有点落在多边形内部（无界外点）」的证明。
> 随机布点用固定种子，两次运行结果逐点完全一致，对应 T1 的「随机种子可复现」。

### 4.2 E2 路线优化算法对比

同一组 20 点集（取 E1 的规则网格布点）上对比 4 种算法：

| 算法 | 最终距离 | 相对差距 | 迭代量 | 时间复杂度 |
| --- | --- | --- | --- | --- |
| 最近邻（贪心） | 1240.4 m | 20.0% | 一次构造 | O(n²) |
| 2-opt 局部搜索 | 1099.0 m | 6.32% | 10 次改进 | 每轮 O(n²)，共 k 轮 |
| 模拟退火 | 1033.7 m | 0% | 17200+ 次迭代 | O(iter · n) |
| 遗传算法（OX 交叉） | 1046.8 m | 1.27% | 200 代 × 60 个体 | O(gen · pop · n) |

参照基准取**各算法本轮的最好结果**（不做任何"某个算法一定更优"的预设）。
收敛曲线只记录出现改进的时刻，因此严格单调不增。

> ⚠️ **职责边界**：生产用的布点与路径算法是 **3号** 的岗位，前端只**展示**
> 5号 下发的 `routeGeoJson`，业务链路里没有任何前端路径优化代码。
> 这里的 E1/E2 是任务书第 4 节要求的**评估实验**，只用于答辩对比展示。

---

## 5. 页面 2/3/4（简述）

| 页面 | 组件 | 内容 | 与数据库的关系 |
| --- | --- | --- | --- |
| 地区监控 | `RegionMonitor.vue` | 省/市/区三级选择 + 详细地点介绍；四个标签：① 数据报表（历史/实时图表/生成报表/自动预警）② 路线规划（算法模块预留）③ 监控（设备总览 + 实时 + YOLO 接入位）④ 自动与手动预警 | 只读界面，数据来自 mock |
| 数据库管理 | `DatabaseManage.vue` | 备份设置 / 备份记录 / 运维配置 / 库健康 / 表清单 | **纯界面**：无连接、无 SQL；按钮只改前端状态，页面顶部有红色安全横幅 |
| 遥感分析 | `RemoteSensing.vue` | 北斗/GNSS 卫星星历、可见性、过境预报、信噪比、影像列表 | 只读界面，数据来自 mock |

YOLO 接入位：`DeviceOverviewPanel.subscribeDetections()`（约 20 行），
检测结果用归一化 `bbox:[x,y,w,h]`（0~1），视频走 `videoUrl`（HLS/FLV，
工程已内置 `hls.js` / `flv.js`）。

---

## 6. 测试

```bash
npm run test:monitor
```

覆盖 48 项断言，分四组：

| 组 | 数量 | 内容 |
| --- | --- | --- |
| A | 25 | 回传帧编解码 + 非法输入拒绝 + CRC 拦截 + 帧流可复现 |
| B | 9 | E1 布点策略（界外点、点间距、IDW 误差、种子可复现） |
| C | 8 | E2 路线算法（不劣于贪心、收敛曲线单调、复杂度、可复现、几何自洽） |
| D | 6 | 任务书条目对照表完整性（M1~M4 / E1~E4 / T1~T5 / T4 占位） |

测试脚本沿用 `tests/gis/run.mjs` 的做法：把被测源码复制到临时目录、补上
webpack 别名与省略的扩展名，再动态 `import`，**被测的是源码本身**。

---

## 7. 新增文件清单

```
src/utils/geo/chinaMapLoader.js              中国地图 GeoJSON 加载与注册（GIS 模块已有）
src/utils/geo/divisions.js                   ★ 三级区划 + 栅格掩膜 + 按需下钻
src/utils/udpFrame.js                        ★ 19 字节回传帧编解码 + CRC-16/MODBUS
src/mock/agrimonitor/weatherField.js         ★ 10 个图层的数据场 + 25 帧 + AQI 分级
src/mock/agrimonitor/experiments.js          ★ E1/E2 真实复现实验
src/mock/agrimonitor/frameStream.js          ★ 回传帧流（真编码真解码）
src/mock/agrimonitor/taskData.js             ★ 任务书条目对照表
src/mock/agrimonitor/{geoData,monitorData,opsData,satelliteData,index}.js
src/views/modules/agrimonitor/Dashboard.vue         首页监控大屏
src/views/modules/agrimonitor/RegionMonitor.vue     地区监控
src/views/modules/agrimonitor/DatabaseManage.vue    数据库管理（纯界面）
src/views/modules/agrimonitor/RemoteSensing.vue     遥感分析
src/views/modules/agrimonitor/components/WeatherMap.vue        ★ 天气 App 风格栅格热力地图
src/views/modules/agrimonitor/components/China3DMap.vue        3D 地形
src/views/modules/agrimonitor/components/TaskBookPanel.vue     ★ 任务书指标区
src/views/modules/agrimonitor/components/{MiniTrendChart,DataReportPanel,
  WarningCenterPanel,DeviceOverviewPanel,RoutePlanningPanel,SkyPlotChart}.vue
src/monitordemo/{index.html,main.js,Shell.vue}                 独立演示入口
frontend/public/geo/{china,cn-divisions,cn-grid-mask}.json     地图静态资源（共 283 KB）
tests/monitor/run.mjs                        48 项逻辑回归测试
```

**共享文件改动**（都是追加，评审时重点看这两处）：

| 文件 | 改动 | 风险 |
| --- | --- | --- |
| `src/router/staticRoutes.js` | 追加 4 条 `/agrimonitor/*` 静态路由 | 无。若 5号 在 `sys_menu` 配了同名 href，`dynamicRoutes.js` 会自动跳过 |
| `vue.config.js` | `pages` 追加 `monitor` 入口（同样按 `NODE_ENV` gate） | 无，与已有 `gis` / `aivideo` 写法一致 |
| `package.json` | `scripts` 追加 `test:monitor` | 无 |

未改动 `backend/**`、`simulator/**`、任何算法文件、任何 SQL、任何其他人的 views/api。
