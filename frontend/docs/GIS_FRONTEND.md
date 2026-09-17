# 1号 · 前端 GIS 负责人 —— 交付说明

> 课题：第12课题《星穹耕界——基于北斗/GIS与多终端协同的农田智能采样系统》
> 岗位：1号 前端 GIS 负责人（刘建鑫） · 固定分支 `feature/frontend-gis`
> 岗位边界：**只负责前端展示**。不写 UDP（2号）、不写路径优化算法（3号）、不设计数据库（4号）、不写后端业务（5号）。

---

## 一、这份代码做了什么

| 老师任务书 / 岗位要求 | 实现位置 | 状态 |
| --- | --- | --- |
| 主页面：可运行的完整前端页面，布局清晰，视觉统一 | `views/modules/farmland/FarmlandGis.vue` | ✅ |
| 高德地图：初始化、缩放、定位、图层管理 | `utils/gis/amapLoader.js`、`utils/gis/amapAdapter.js`、`components/LayerControl.vue` | ✅（需填 Key） |
| 农田边界：GeoJSON 绘制与选中效果 | `utils/gis/sceneModel.js`、`vectorAdapter.js#_drawBoundary` | ✅ |
| 采样点：农田内手动选 3~4 点 + PIP 校验 + 状态样式 + 点击信息 | `FarmlandGis.vue#onMapClick`、`utils/gis/geometry.js`、`components/SamplingPointPanel.vue` | ✅ |
| 设备实时位置：≥3 台设备实时/准实时更新 | `components/DevicePanel.vue`、`FarmlandGis.vue#advanceDevices` | ✅ |
| 到达采样点 → 标记已采样 + 弹窗显示 5 项采样数据（M3） | `FarmlandGis.vue#handleArrival`、`components/SampleDataDialog.vue` | ✅ |
| 设备轨迹：历史轨迹折线/轨迹点显示 | `FarmlandGis.vue#loadHistoricalTracks`、`utils/gis/vectorAdapter.js#_drawTrajectories` | ✅ |
| 路线展示：显示 3号 算法路线 + 提示当前最近未采样点 | `components/RoutePanel.vue`、`FarmlandGis.vue#guidance` | ✅ |
| 统计展示：接收后端统计数据渲染 ECharts | `components/StatsChart.vue`（v-charts / ECharts） | ✅ |
| 接口断开时有合理提示 | `api/gis/gisGateway.js`、`components/GisDiagnostics.vue` | ✅ |
| 接口未完成时用字段完全一致的 mock，只换请求地址不重写页面 | `mock/gis/**`、`api/gis/gisGateway.js` | ✅ |

额外做了两件对验收有直接帮助的事：

1. **内置离线矢量地图**（`utils/gis/vectorAdapter.js`）：纯 Canvas 实现，带缩放/平移/比例尺/指北针，**不需要任何 Key 和网络**。高德 Key 没配置或加载失败时自动降级到它，保证页面在任何机器上都能完整演示；地图层做了统一接口，切回高德不需要改一行页面代码。
2. **前端自检面板**（`components/GisSelfCheck.vue`）：一键运行 13 项前端正确性检查（坐标系往返精度、凹多边形 PIP、禁入区排除、轨迹连续性、ChartDataDTO 列一致性等），直接产出可写进答辩记录的测试结果。

---

## 二、新增 / 修改文件清单

### 新增（全部属于 1号 岗位范围）

```
frontend/src/utils/gis/
  coordinate.js       坐标系白名单与 GCJ02/WGS84/BD09 互转（未知坐标系直接拒绝，不猜测）
  geometry.js         PIP（射线法，支持凹多边形与内环）、球面距离、方位角、最近未采样点
  gisDict.js          状态/坐标系/指标字典（平台字典优先，未配置时用兜底标签）
  amapLoader.js       高德 JS API 2.0 动态加载（Key + 安全密钥），失败返回结构化错误
  mapBase.js          适配器基类 + 图层 key + 配色常量（单独成文件用于打断循环依赖）
  mapAdapter.js       适配器工厂（只做工厂，避免与两个实现形成环）
  amapAdapter.js      高德实现（Polygon / Polyline / Marker / Text / 事件）
  vectorAdapter.js    内置离线矢量地图实现（Canvas）
  sceneModel.js       DTO → 视图模型（统一坐标转换 + 可读错误收集）

frontend/src/api/
  farmland/farmlandService.js
  samplingpoint/samplingPointService.js
  ddevice/dDeviceGisService.js          新增文件，未改动既有 dDeviceService.js
  navigation/navigationRouteService.js
  monitor/monitorGisService.js
  analysis/analysisGisService.js
  gis/gisGateway.js                     统一网关：真实接口 + 熔断 + mock 降级 + 诊断

frontend/src/mock/gis/
  scene.js            农田边界（凹多边形 + 禁入区内环）、4 个采样点、路线、监测、统计
  devices.js          3 台设备 + 确定性生成的连续轨迹（共 300+ 点，可复现）
  index.js            mock 入口（返回结构与后端 DTO 完全一致）

frontend/src/views/modules/farmland/
  FarmlandGis.vue                     主页面（编排 + 定时推进 + 到达判定 + 手动选点）
  components/GisMap.vue               地图容器（适配器挂载、图层、事件、图例）
  components/LayerControl.vue         图层管理
  components/FarmlandInfoPanel.vue    农田信息与边界状态
  components/SamplingPointPanel.vue   采样点列表 / 手动选点 / 提交
  components/DevicePanel.vue          3 台设备卡片 + 演示推进 + 离线模拟
  components/RoutePanel.vue           路线信息 + 最近未采样点指引
  components/SampleDataDialog.vue     到达弹窗（5 项采样指标）
  components/StatsChart.vue           ECharts 统计图
  components/GisDiagnostics.vue       接口来源与降级原因
  components/GisSelfCheck.vue         前端自检（13 项）

frontend/src/gisdemo/
  index.html          独立演示页模板
  main.js             独立演示入口（无需登录/后端菜单）

frontend/tests/gis/
  run.mjs             纯逻辑回归测试（33 项，node tests/gis/run.mjs）
```

### 修改（都是「必要的公共接口文件」，且均为**追加**，没有重构任何成员模块）

| 文件 | 改动 | 原因 |
| --- | --- | --- |
| `frontend/src/router/staticRoutes.js` | 追加 1 条静态路由 `/farmland/FarmlandGis` | 后端 `sys_menu` 还没配，先让页面可直达；若 5号 之后配同名菜单，`dynamicRoutes.js` 会检测到同 path 并跳过，不冲突 |
| `frontend/vue.config.js` | `pages` 追加 `gis` 入口 | 提供无需登录的独立演示入口 `gis.html` |
| `frontend/.env.development` / `.env.production` | 追加 `VUE_APP_AMAP_KEY` 等 3 个变量 | 高德 Key 属于环境配置，不写死在代码里 |
| `frontend/package.json` | `scripts` 追加 `test:gis` | 一条命令跑 GIS 回归测试 |
| `frontend/src/api/ddevice/dDeviceGisService.js` | 新增文件 | 未改动 `dDeviceService.js`，其他成员的设备管理页面不受影响 |

**没有改动**：`backend/**`、`simulator/**`、任何算法文件、任何 SQL、其他成员的 views/api。

---

## 三、启动方式

```bash
cd frontend
npm install                # 首次
npm run serve              # 开发
```

两个入口：

| 入口 | 地址 | 是否需要后端 / 登录 |
| --- | --- | --- |
| **独立演示（推荐先看这个）** | `http://localhost:3000/gis.html` | 不需要，自动使用 mock |
| JeePlus 正式页面 | `http://localhost:3000/#/farmland/FarmlandGis` | 需要 5号 后端可登录（或后端配好菜单） |

生产构建：`npm run build`（Node 17+ 需加 `NODE_OPTIONS=--openssl-legacy-provider`，因为工程用的是 webpack 4）。

回归测试：`npm run test:gis`（33 项纯逻辑断言，不需要浏览器，退出码可直接接 CI）。

---

## 四、高德地图 Key 怎么插（三步）

> 说明：仓库里**没有任何高德 Key**（只有旧的百度/天地图 Key），桌面上的 `高德地图api获取.doc` 是「怎么申请 Key」的截图教程，不含 Key。所以 Key 的位置已经留好，拿到后填一行即可。

1. 到 <https://console.amap.com/dev/key/app> 创建应用，添加 Key，**服务平台必须选「Web端 (JS API)」**。
2. 打开 `frontend/.env.development`，填两行：

```ini
VUE_APP_AMAP_KEY = 你的32位Key
VUE_APP_AMAP_SECURITY_CODE = 你的安全密钥
```

   （2021-12-02 之后申请的 Key 必须同时配安全密钥，否则高德会拒绝加载。）
3. 重启 `npm run serve`。

验证方式：页面右上角标签从「内置离线地图」变成「高德地图 JS API 2.0」即成功。
如果加载失败，页面顶部会给出具体原因（未配置 Key / 网络不可达 / Key 无权限），并自动降级到离线地图，不会白屏。

> 临时调试不想改 env：可在浏览器控制台执行
> `localStorage.setItem('gisAmapKey','你的Key')`，再刷新页面。

---

## 五、调用的接口清单

前端唯一允许调用的 REST 清单（字段与公共接口约束 V2.1 §3.2），以及本模块的映射：

| 用途 | 方法与路径 | 前端文件 |
| --- | --- | --- |
| 农田简要信息 | `GET /farmland/farmland/briefByIds` | `api/farmland/farmlandService.js` |
| 农田列表（选择器） | `GET /farmland/farmland/list` | 同上 |
| 采样点列表 | `GET /samplingpoint/samplingPoint/listByFarmland` | `api/samplingpoint/samplingPointService.js` |
| 地图点位 | `GET /samplingpoint/samplingPoint/mapData` | 同上 |
| 手动选点提交 | `POST /samplingpoint/samplingPoint/saveBatch` | 同上 |
| 设备简要信息 | `GET /ddevice/dDevice/briefByIds` | `api/ddevice/dDeviceGisService.js` |
| 可用设备列表 | `GET /ddevice/dDevice/listUsable` | 同上 |
| 任务路线 | `GET /navigation/navigationRoute/byTaskId` | `api/navigation/navigationRouteService.js` |
| 点位最新监测 | `GET /monitor/monitorRecord/latestByPoint` | `api/monitor/monitorGisService.js` |
| 设备历史轨迹 | `GET /monitor/monitorRecord/history` | 同上（见接口问题单 Q2） |
| 历史统计图 | `GET /analysis/analysis/chart` | `api/analysis/analysisGisService.js` |

**前端没有**直连 MySQL、没有直连 UDP 端口、没有调用任何 Python 算法文件、没有自己实现路线优化。

### 使用的公共字段（冻结，未改名、未新增同义字段）

`farmlandId`、`farmlandName`、`farmlandCode`、`boundaryGeoJson`、`status`、
`samplingPointId`、`pointCode`、`pointName`、`longitude`、`latitude`、`coordinateSystem`、
`deviceId`、`deviceCode`、`deviceName`、`category`、`collectTime`、`taskId`、
`routeGeoJson`、`distance`、`durationSeconds`、`soilTemperature`、`soilMoisture`、
`airTemperature`、`airHumidity`、`soilDepth`、`columns`、`rows`。

未使用 `lng`/`lon`/`pointId`/`farmId`/`equipmentId`/`timestamp` 等第二套字段。

---

## 六、测试结果

### 1）构建

```bash
cd frontend
NODE_OPTIONS=--openssl-legacy-provider npm run build
```

结果：`DONE  Build complete.`，3 个入口全部产出（`index` / `aivideo` / `gis`），
其中 `gis` 入口 = `dist/js/gis.<hash>.js`（135.8 KiB，gzip 39.4 KiB）+ `dist/css/gis.<hash>.css`。
只有原有的「asset size limit / entrypoint size limit」体积告警（老工程本身就有），**没有编译错误**。

> Node 17+ 需要 `--openssl-legacy-provider`，因为工程用的是 webpack 4（用 md4 摘要）。

### 2）纯逻辑回归测试：`npm run test:gis` → 33 项全部通过

命令会输出完整的 PASS/FAIL 表格，退出码为 0（有失败则非 0，可直接接 CI）。

| # | 用例 | 覆盖的验收点 |
| --- | --- | --- |
| 1 | GCJ02/WGS84 往返转换可逆（误差 < 1e-5 度） | 坐标系正确性 |
| 2 | WGS84→GCJ02 偏移量在合理区间（50~1000 m） | 坐标系正确性 |
| 3 | GCJ02/BD09 往返转换可逆 | 坐标系正确性 |
| 4 | `convert()` 与直接转换结果一致 | 转换实现一致 |
| 5 | 缺失/白名单外坐标系被拒绝，不猜测 | 约束「不得自行猜坐标系」 |
| 6 | 经纬度为 `null` 时抛错（不会被静默当成 0,0） | 数据健壮性 |
| 7 | 小写坐标系可规范化 | 字段容错 |
| 8 | 边界 GeoJSON 解析正确（外环 + 内环） | 边界绘制 |
| 9 | 4 个采样点全部落在农田多边形内 | **T1 布点有效性** |
| 10 | 凹多边形凹口内的点判为界外 | **T5 凹多边形地块** |
| 11 | 禁入区（水塘内环）内的点判为界外 | 扩展任务 E3 |
| 12 | 明显界外的点被拒绝添加 | 手动选点 PIP 校验 |
| 13 | 界内的点被接受 | 手动选点 PIP 校验 |
| 14 | 手动选点缺少坐标系时拒绝校验 | 约束「不得自行猜坐标系」 |
| 15 | 最近未采样点计算正确（跳过已采样点） | **M3 动态指引** |
| 16 | 全部采样完成后不再返回指引目标 | M3 边界情况 |
| 17 | 最近未采样点与穷举结果一致 | 贪心正确性 |
| 18 | 3 台设备轨迹连续、无随机跳点（最大位移 5.8 m） | 验收「轨迹连续」 |
| 19 | 轨迹点均含 coordinateSystem 与 collectTime | 字段完整性 |
| 20 | 轨迹采集时间单调递增 | 时序正确性 |
| 21 | 轨迹生成可复现（同种子结果一致） | **T1 随机种子可复现** |
| 22 | 轨迹视图模型可转换 | 渲染链路 |
| 23 | 路线 routeGeoJson 可解析、点数正确 | 路线展示 |
| 24 | 路线距离与接口下发值一致（几何 545.8 m vs 下发 545.8 m） | 数据自洽 |
| 25 | 路线缺少 coordinateSystem 时拒绝推测显示 | 约束「不得自行猜坐标系」 |
| 26 | 2-opt 结果不劣化（初始 576.8 m → 优化 545.8 m） | 路线优化不劣化 |
| 27 | 农田边界视图模型构建成功（10.60 公顷） | 渲染链路 |
| 28 | 边界未声明坐标系且场景也未声明时拒绝绘制 | 约束「不得自行猜坐标系」 |
| 29 | 采样点视图模型字段完整 | 字段完整性 |
| 30 | 设备视图模型转换成功（3 台） | 渲染链路 |
| 31 | 单台设备位置无效时不影响整图加载 | 错误隔离 |
| 32 | 统计 columns 与 rows key 完全一致 | ChartDataDTO 约束 |
| 33 | 最新监测返回老师规定的 5 项采样指标 | 回传指标对应 |

### 3）真实浏览器端到端验证（无控制台报错）

用无头 Edge 打开**生产构建产物**的 `gis.html?selfcheck=1` 并检查渲染后的 DOM：

| 验证项 | 结果 |
| --- | --- |
| 浏览器控制台报错 | **0 条** |
| 页面内自检（「前端自检」面板） | `total=14;passed=14;failed=0` |
| 农田边界 | 渲染出「中北大学试验田A区 / FL20260917001 / ZB-TA-001 / 10.60 公顷」 |
| 采样点 | 「采样点(4)」，P1~P4 全部上屏，已采样/未采样状态样式区分 |
| 设备 | 「设备(3)」，DEV001 / DEV002 / DEV003 三张卡片 |
| 地图降级 | 标签显示「内置离线地图（未启用高德 Key）」，地图 `<canvas>` 正常绘制 |
| 接口降级提示 | 顶部出现 `【NO_KEY】未配置高德地图 Key，已切换到内置离线地图…`，诊断面板显示「模拟数据」 |
| 统计图 | `ve-line` + ECharts canvas 正常渲染 |
| **M3 到达弹窗** | 演示推进过程中真实触发：`DEV002 已到达采样点 P4，采集时间 2026-09-17 14:50:37`，弹窗内 5 项指标全部渲染（土壤温度 25°C、土壤湿度 36%、空气温度 27°C、空气湿度…） |

### 4）验证过程中发现并修掉的 2 个真实缺陷

记录下来是因为它们都只有在真跑起来才会暴露，编译期完全看不出来：

1. **`mapAdapter.js` 与两个地图实现之间存在循环依赖**，导致
   `Uncaught TypeError: Super expression must either be null or a function`，页面直接白屏。
   修法：把基类/常量抽到独立的 `mapBase.js`，让 `mapAdapter.js` 只做工厂，依赖方向变成单向。
2. **`Number(null) === 0`** 导致「缺失的经纬度」被静默当成 `(0, 0)`（几内亚湾），
   设备会显示在非洲而不是提示「位置未知」。修法：`coordinate.js` 增加严格的
   `toFiniteNumber()`，显式排除 `null` / `undefined` / 空串。

另外顺手修掉一处会拖慢演示的问题：`shared/api/request.js` 的全局超时是 100 秒，
后端未启动且被防火墙丢包时页面会一直转圈；现在 GIS 网关统一收口到 **8 秒**，超时即降级并给出原因。

---

## 七、接口问题单（需要 5号 确认）

在联调前请 5号 确认以下 3 点，确认后前端只需改对应的一处实现：

**Q1｜设备实时位置由哪个接口提供？**
V2.1 §3.2 的冻结清单里，「设备位置」写的是 `DeviceBriefDTO + MonitorLatestDTO/轨迹 DTO`，但没有单列实时位置接口。
当前实现：列表用 `GET /ddevice/dDevice/listUsable`；若返回的 `DeviceBriefDTO` 不带 `longitude/latitude`，请补充一个实时位置接口（例如 `GET /monitor/monitorRecord/latestByDevice`）。
改动位置：`api/ddevice/dDeviceGisService.js` 一处。

**Q2｜设备历史轨迹用哪个接口？**
§3.2 清单里没有轨迹接口，但 1号 交付物要求画历史轨迹。当前按 §6.2「输入 deviceId + startTime + endTime，输出按 collectTime 排序的坐标点」的规定，复用 `GET /monitor/monitorRecord/history`。
若 5号 提供专用轨迹接口，只需改 `api/monitor/monitorGisService.js#trajectory` 一处。

**Q3｜农田边界 `boundaryGeoJson` 的坐标系怎么声明？**
§3.1 的 FarmlandBriefDTO 字段列表里没有 `coordinateSystem`，无法判断边界 GeoJSON 是 GCJ02 还是 WGS84。
当前实现：优先读 `farmland.coordinateSystem`；缺失时退回场景坐标系（取采样点/路线声明的坐标系），**并在页面上显示黄色提示**「按 XX 处理」，不静默猜测。
建议 5号 在 FarmlandBriefDTO 上补 `coordinateSystem` 字段。

**另需 5号 在平台字典（sys_dict）中建 4 个字典类型**（未建时前端使用内置兜底标签，不影响运行）：
`gis_device_status`（online/offline/fault）、`gis_sampling_point_status`（pending/sampled/skipped）、`gis_coordinate_system`、`gis_metric`。

---

## 八、已知限制

1. **高德底图需要 Key**。Key 未配置时页面使用内置离线矢量地图，功能完整但不是真实卫星/街道底图。答辩演示建议提前配好 Key。
2. **演示推进模式**（默认开启）是在 2号 设备模拟器与 5号 UDP 接收尚未联调通的情况下，为了让「设备在移动 → 到达 → 弹窗」这条 M3 流程可演示而做的前端模拟；它只在数据来自 mock 时用于演示，**不会伪造后端入库**。真机联调时把「刷新」轮询指向真实接口即可，页面逻辑不变。
3. 前端「最近未采样点」只用于**界面提示**（`geometry.js#findNearestUnsampledPoint`），正式路线的生成仍是 3号 算法职责，前端不实现 2-opt/最近邻优化。
4. 手动选点在界外时会被直接拒绝（PIP 校验），这是老师任务书 M1 的硬性要求；若需要「先允许放置、后提示」的交互，请说明。
