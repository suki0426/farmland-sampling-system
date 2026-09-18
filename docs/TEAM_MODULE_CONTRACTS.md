# 五人模块级接口契约（V1.0）

> 本文补充 `TEAM_DEVELOPMENT_STANDARD.md`，只冻结模块边界、接口和 DTO；不代表已经创建任何业务表、Controller、Service、Mapper、SQL 或页面。所有模块复用 DDevice 的 `ResponseEntity`、权限、分页和 EasyExcel 基线。

## 1. 公共标识、时间与调用规则

| 字段 | Java 类型 | 所有者 | 唯一语义 |
| --- | --- | --- | --- |
| `farmlandId` | `String` | A | 农田主键。 |
| `samplingPointId` | `String` | A | 采样点主键。 |
| `deviceId` | `String` | B | 设备主键。 |
| `deviceCode` | `String` | B | 人与外部设备使用的唯一设备编码；关联仍只用 `deviceId`。 |
| `taskId` | `String` | C | 采样任务主键。 |
| `longitude`、`latitude` | `BigDecimal` | 坐标提供模块 | 坐标成对出现，并同时给出 `coordinateSystem`。 |
| `coordinateSystem` | `String` | 坐标提供模块 | 仅 `GCJ02`、`WGS84`、`BD09`；未知时拒绝猜测转换。 |
| `sampleTime` | `Date` | C | 现场完成采样动作的业务时间，仅任务完成动作写入。 |
| `collectTime` | `Date` | D | 设备实际采集监测数据的时间，仅监测记录写入。 |
| `createDate`、`updateDate` | `Date` | 各模块 | 审计时间，不替代业务时间；格式 `yyyy-MM-dd HH:mm:ss`、时区 `GMT+8`。 |

- 禁止另建 `fieldId`、`farmId`、`pointId`、`equipmentId`、`lng`、`lon` 等公共概念同义字段。
- 同一 Spring Boot 内，跨模块后端调用只通过被调用模块公开的 **Service + DTO**；调用方不得自调 HTTP，Controller 不得调用 Controller。REST 仅用于前端、外部或远程边界。
- 任何模块不得直接使用其他模块的 Entity、Mapper、Mapper XML 或数据表。依赖模块未合并时，调用方使用下文冻结 DTO 的 mock，不得被阻塞。
- 标准 CRUD 为 `GET list`、`GET queryById`、`POST save`、`DELETE delete`、`GET export`、`POST import`、`GET import/template`。列表兼容 `current`、`size`、`orders`，响应为 `IPage<DTO>`，保留 `records`、`total`、`current`、`size`、`pages`。

## 2. A：农田与采样点 GIS

| 项目 | 契约 |
| --- | --- |
| 负责人 / 分支 | A / `feature/gis-sampling-point` |
| Controller 根路径 | `/farmland/farmland`、`/samplingpoint/samplingPoint` |
| 前端 Service | `src/api/farmland/farmlandService.js`、`src/api/samplingpoint/samplingPointService.js` |
| Entity / DTO / Brief DTO | `Farmland` / `FarmlandDTO` / `FarmlandBriefDTO`；`SamplingPoint` / `SamplingPointDTO` / `SamplingPointBriefDTO`、`SamplingPointMapDTO` |
| 表所有权 | `farmland`、`sampling_point`；只有 A 修改表结构、Entity、Mapper、XML。 |

核心字段：`Farmland(id, farmlandName, farmlandCode, area:BigDecimal, boundaryGeoJson, status)`；`SamplingPoint(id, farmlandId, pointCode, pointName, longitude:BigDecimal, latitude:BigDecimal, coordinateSystem, status)`。

| API / 公开 Service | 请求 | 响应 | 可见性与权限 |
| --- | --- | --- | --- |
| 农田、采样点标准 CRUD | DTO / `id` / `ids` / 分页筛选 | DTO、`IPage<DTO>` | 对外；`farmland:farmland:*`、`samplingpoint:samplingPoint:*` |
| `GET /samplingpoint/samplingPoint/listByFarmland` / `SamplingPointQueryService.listByFarmland` | `farmlandId` | `List<SamplingPointBriefDTO>`：ID、农田 ID、名称、编码、坐标、坐标系、状态 | C、D、E；`samplingpoint:samplingPoint:list` |
| `GET /samplingpoint/samplingPoint/mapData` / `SamplingPointQueryService.mapData` | `farmlandId`、可选 `status` | `List<SamplingPointMapDTO>`：ID、名称、坐标、坐标系、状态 | C、E；`samplingpoint:samplingPoint:list` |
| `GET /farmland/farmland/briefByIds` / `FarmlandQueryService.briefByIds` | `ids` | `List<FarmlandBriefDTO>`：ID、名称、编码 | B、C、D、E；`farmland:farmland:list` |

内部接口：边界 GeoJSON 校验、坐标转换、点位批量生成。A 不依赖其他业务表；B/C/D/E 禁止直读 `farmland`、`sampling_point`。Mock：固定 Brief DTO JSON/内存实现。验收：CRUD、逻辑删除、坐标系校验、地图与 Brief DTO 可独立联调。

## 3. B：设备管理

| 项目 | 契约 |
| --- | --- |
| 负责人 / 分支 | B / `feature/device-management` |
| Controller 根路径 | `/ddevice/dDevice`（沿用 DDevice） |
| 前端 Service | `src/api/ddevice/dDeviceService.js`（沿用） |
| Entity / DTO / Brief DTO | `DDevice` / `DDeviceDTO` / `DeviceBriefDTO` |
| 表所有权 | `d_device`；只有 B 修改设备字段、Mapper、XML、设备字典。 |

核心字段：`id`、`deviceCode`、`deviceName`、`category`、`model`、`manufacturer`、`status`、`scenariosJson`、`attrsJson`。现有 DDevice 没有 `farmlandId`，设备契约不新增也不接受该筛选或关联字段。

| API / 公开 Service | 请求 | 响应 | 可见性与权限 |
| --- | --- | --- | --- |
| 设备标准 CRUD | DTO / `id` / `ids` / 分页筛选 | `DDeviceDTO`、`IPage<DDeviceDTO>` | 对外；`ddevice:dDevice:*` |
| `GET /ddevice/dDevice/briefByIds` / `DeviceQueryService.briefByIds` | `ids` | `List<DeviceBriefDTO>`：`deviceId`、`deviceCode`、`deviceName`、`category`、`status` | C、D、E；`ddevice:dDevice:list` |
| `GET /ddevice/dDevice/listUsable` / `DeviceQueryService.listUsable` | 可选 `category`、`status` | `List<DeviceBriefDTO>` | C、D；`ddevice:dDevice:list` |
| `GET /ddevice/dDevice/queryByCode` / `DeviceQueryService.queryByCode` | `deviceCode` | `DeviceBriefDTO` | D 接入适配；其他模块关联不得以编码代替 ID |

内部接口：协议参数、`attrsJson` 解析、接入凭据。B 不依赖农田、任务、监测表；A/C/D/E 禁止直读 `d_device`，C/D 仅保存 `deviceId`。Mock：固定可用/停用 `DeviceBriefDTO`。验收：DDevice CRUD 不回归，编码唯一，Brief 不泄露协议参数，分页/Excel 符合基线。

## 4. C：采样任务与导航

| 项目 | 契约 |
| --- | --- |
| 负责人 / 分支 | C / `feature/task-navigation` |
| Controller 根路径 | `/samplingtask/samplingTask`、`/navigation/navigationRoute` |
| 前端 Service | `src/api/samplingtask/samplingTaskService.js`、`src/api/navigation/navigationRouteService.js` |
| Entity / DTO / Brief DTO | `SamplingTask` / `SamplingTaskDTO` / `SamplingTaskBriefDTO`；`NavigationRoute` / `NavigationRouteDTO` |
| 表所有权 | `sampling_task`、`navigation_route`、`navigation_route_point`。 |

核心字段：`SamplingTask(id, taskCode, farmlandId, samplingPointId, deviceId, taskStatus, plannedTime:Date, sampleTime:Date, operatorId)`；`NavigationRoute(id, taskId, routeGeoJson, distance:BigDecimal, durationSeconds:Integer, coordinateSystem)`。

| API / 公开 Service | 请求 | 响应 | 可见性与权限 |
| --- | --- | --- | --- |
| 任务、路线标准 CRUD | DTO / `id` / `ids` / 分页筛选 | DTO、`IPage<DTO>` | 对外；`samplingtask:samplingTask:*`、`navigation:navigationRoute:*` |
| `POST /samplingtask/samplingTask/assignDevice` | `taskId`、`deviceId` | `SamplingTaskDTO` | C 内部动作；`samplingtask:samplingTask:edit` |
| `POST /samplingtask/samplingTask/complete` | `taskId`、`sampleTime`、可选 `remarks` | `SamplingTaskDTO` | C 授权入口；D/E 仅读；`samplingtask:samplingTask:edit` |
| `GET /samplingtask/samplingTask/briefByIds` / `SamplingTaskQueryService.briefByIds` | `ids` | `List<SamplingTaskBriefDTO>`：任务 ID、状态、农田/点位/设备 ID、计划/完成时间 | D、E；`samplingtask:samplingTask:list` |
| `GET /navigation/navigationRoute/byTaskId` / `NavigationRouteQueryService.byTaskId` | `taskId` | `NavigationRouteDTO` | A、E；`navigation:navigationRoute:view` |

内部接口：路线计算、状态机、路线点明细。C 通过 A/B 公开 Query Service 校验关联，不读 A/B 表；D/E 禁止直读 C 表。Mock：A/B Brief DTO 和 `SamplingTaskBriefDTO` 固定桩。验收：关联只用公共 ID，`sampleTime` 仅完成动作写入，路线坐标含坐标系，对外 Brief/路线可独立联调。

## 5. D：监测、阈值与预警

| 项目 | 契约 |
| --- | --- |
| 负责人 / 分支 | D / `feature/monitor-warning` |
| Controller 根路径 | `/monitor/monitorRecord`、`/warning/warningRule`、`/warning/warningRecord` |
| 前端 Service | `src/api/monitor/monitorRecordService.js`、`src/api/warning/warningService.js` |
| Entity / DTO / Brief DTO | `MonitorRecord` / `MonitorRecordDTO` / `MonitorRecordBriefDTO`、`MonitorLatestDTO`；`WarningRule` / `WarningRuleDTO`；`WarningRecord` / `WarningRecordDTO`、`WarningBriefDTO` |
| 表所有权 | `monitor_record`、`warning_rule`、`warning_record`。 |

核心字段：`MonitorRecord(id, deviceId, samplingPointId, taskId?:String, metricCode, metricValue:BigDecimal, metricUnit, collectTime:Date, dataSource)`；`WarningRule(id, metricCode, thresholdMin:BigDecimal, thresholdMax:BigDecimal, level, status)`；`WarningRecord(id, monitorRecordId, deviceId, samplingPointId, taskId, warningRuleId, warningLevel, warningStatus, warningTime)`。

| API / 公开 Service | 请求 | 响应 | 可见性与权限 |
| --- | --- | --- | --- |
| 预警规则标准 CRUD | DTO / `id` / `ids` / 分页筛选 | `WarningRuleDTO`、`IPage<WarningRuleDTO>` | 对外；`warning:warningRule:*` |
| `POST /monitor/monitorRecord/ingest` | `MonitorIngestRequest`：设备/点位/可选任务 ID、指标数组、`collectTime` | `MonitorIngestResultDTO`：接收、拒绝条数、记录 ID | D 接入边界；其他模块不可写；`monitor:monitorRecord:import` |
| `GET /monitor/monitorRecord/latestByPoint` / `MonitorRecordQueryService.latestByPoint` | `samplingPointId`、可选 `metricCodes` | `List<MonitorLatestDTO>` | A、C、E；`monitor:monitorRecord:list` |
| `GET /monitor/monitorRecord/history` / `MonitorRecordQueryService.history` | `deviceId`、`samplingPointId`、`taskId`、`metricCode` 或 `metricCodes`、`startTime`、`endTime`、`current`、`size`、`orders` | `IPage<MonitorRecordDTO>` | E 历史展示/统计、前端；`monitor:monitorRecord:list` |
| `GET /warning/warningRecord/listOpen` / `WarningRecordQueryService.listOpen` | 可选 `farmlandId`、`samplingPointId`、`deviceId`、分页参数 | `IPage<WarningRecordDTO>` | A、B、C、E；`warning:warningRecord:list` |
| `POST /warning/warningRecord/acknowledge` | `id`、`remark` | `WarningRecordDTO` | D 内部/值班入口；`warning:warningRecord:edit` |

内部接口：报文解析、阈值计算、预警生成/确认状态机。D 通过 A/B/C 公开 Query Service 校验关联；A/B/C/E 禁止直读 D 表。E 后端只调用 `MonitorRecordQueryService.history` 等 Service + DTO，不能 HTTP 回调或使用 D Mapper。Mock：A/B/C Brief DTO、`IPage<MonitorRecordDTO>` 固定桩。验收：`collectTime` 不替代 `sampleTime`，接入有幂等说明，最新/开放预警/历史分页可独立联调。

## 6. E：历史数据、统计分析与展示

| 项目 | 契约 |
| --- | --- |
| 负责人 / 分支 | E / `feature/data-analysis` |
| Controller 根路径 | `/historydata/historyData`、`/analysis/analysis` |
| 前端 Service | `src/api/historydata/historyDataService.js`、`src/api/analysis/analysisService.js` |
| Entity / DTO / Brief DTO | `HistoryData` / `HistoryDataDTO` / `HistoryDataBriefDTO`；`AnalysisQueryDTO`、`ChartDataDTO`、`AnalysisSummaryDTO`；不建跨模块 Entity。 |
| 表所有权 | `history_data`；只有 E 创建和维护归档表。 |

`history_data` 字段：`id`、`deviceId`、`samplingPointId`、可空 `taskId`、`metricCode`、`metricValue:BigDecimal`、`metricUnit`、`collectTime`、`sourceRecordId`、`sourceType`。分析筛选：`farmlandId`、`samplingPointId`、`deviceId`、`taskId`、`metricCodes`、`startTime`、`endTime`、`granularity`；不得把 `sampleTime` 当采集时间。

| API / 公开 Service | 请求 | 响应 | 可见性与权限 |
| --- | --- | --- | --- |
| 历史归档标准 CRUD（若启用） | DTO / `id` / `ids` / 分页筛选 | `HistoryDataDTO`、`IPage<HistoryDataDTO>` | E 内部管理；`historydata:historyData:*` |
| `GET /historydata/historyData/list` | 公共 ID、`metricCode`、`startTime`、`endTime`、分页参数 | `IPage<HistoryDataDTO>` | 前端，D 复核；`historydata:historyData:list` |
| `GET /analysis/analysis/chart` | `AnalysisQueryDTO` | `ChartDataDTO`：`columns:String[]`、`rows:List<Map<String,Object>>` | 前端、A-D；`analysis:analysis:list` |
| `GET /analysis/analysis/summary` | `AnalysisQueryDTO` | `AnalysisSummaryDTO`：指标 code、聚合值、区间、样本数 | A-D；`analysis:analysis:list` |
| `GET /analysis/analysis/export` | `AnalysisQueryDTO`、`ExcelOptions` | Excel 二进制流 | 前端；`analysis:analysis:export` |

内部接口：ETL/聚合、图表配置、缓存键。E 通过 D 的 `MonitorRecordQueryService.history` 获取监测历史，通过 A/B/C Brief/Query Service 补充关联信息；禁止直读 `monitor_record`、`warning_record`、`sampling_task`、`sampling_point`、`d_device`。D 是监测原始数据唯一写入者，E 归档不得反向修改 D。Mock：监测分页、各 Brief DTO、`columns + rows` 图表桩。验收：时间语义清楚，图表格式固定，Excel/分页符合基线，聚合不泄露实体字段。

## 7. 模块依赖矩阵

| 调用方 | 被调用方 | 数据 / Service / REST API | 是否阻塞 | Mock 策略 |
| --- | --- | --- | --- | --- |
| A | 无 | 自有农田、点位数据 | 否 | 自测数据。 |
| B | 无 | 自有设备数据；不建农田绑定 | 否 | DDevice 本地数据。 |
| C | A | `SamplingPointQueryService.listByFarmland/mapData`；点位 REST | 否 | 固定 `SamplingPointBriefDTO` / `SamplingPointMapDTO`。 |
| C | B | `DeviceQueryService.listUsable/briefByIds`；设备 REST | 否 | 固定 `DeviceBriefDTO`。 |
| D | A | `SamplingPointQueryService`；点位 REST | 否 | 固定 `SamplingPointBriefDTO`。 |
| D | B | `DeviceQueryService`；设备 REST | 否 | 固定 `DeviceBriefDTO`。 |
| D | C | `SamplingTaskQueryService.briefByIds`；任务 REST | 否 | 固定 `SamplingTaskBriefDTO`。 |
| E | A | 农田/点位 Query Service；对应 REST | 否 | 固定 A Brief DTO。 |
| E | B | `DeviceQueryService.briefByIds`；设备 REST | 否 | 固定 `DeviceBriefDTO`。 |
| E | C | `SamplingTaskQueryService.briefByIds`、`sampleTime`；任务 REST | 否 | 固定 `SamplingTaskBriefDTO`。 |
| E | D | `MonitorRecordQueryService.history/latestByPoint`、`WarningRecordQueryService.listOpen`；监测/预警 REST | 否 | 固定监测/预警分页与最新值 DTO。 |

后端采用上述公开 Service + DTO；列出的 REST 仅供前端、远程或外部系统。被调用模块合并后只替换 mock 实现，不改字段名、时间语义或表归属。

## 8. 合并前联合验收

- PR 必须写明新增/变更 API、请求字段、响应 DTO、权限、字典 code、SQL、对外依赖和 mock 替换点。
- 新增公共 ID、跨模块 DTO、路径或权限前，先更新本文并获得 A-E 负责人确认；未确认不得编码。
- 直接跨表访问、跨 Mapper 注入、复制对方主数据、混用 `collectTime`/`sampleTime`、将同进程 Service 改为自调用 HTTP 的变更不得合并。
- 本文未列出的跨模块访问默认禁止；新增需求先更新契约，再实现。
