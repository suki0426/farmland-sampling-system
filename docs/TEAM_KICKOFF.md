# 五人团队开工说明（V1.0）

本说明以 `develop`、`TEAM_DEVELOPMENT_STANDARD.md` 与 `TEAM_MODULE_CONTRACTS.md` 为唯一公共基线。开始业务开发前，所有成员先完整阅读这两份文档，并阅读现有 DDevice CRUD 作为代码参考。

## 1. 创建自己的工作分支

先同步公共分支：

```bash
git checkout develop
git pull origin develop
```

随后只创建并推送自己的分支：

```bash
# A：农田与采样点 GIS
git checkout -b feature/gis-sampling-point
git push -u origin feature/gis-sampling-point

# B：设备管理
git checkout -b feature/device-management
git push -u origin feature/device-management

# C：采样任务与导航
git checkout -b feature/task-navigation
git push -u origin feature/task-navigation

# D：监测、阈值与预警
git checkout -b feature/monitor-warning
git push -u origin feature/monitor-warning

# E：历史数据、统计分析与展示
git checkout -b feature/data-analysis
git push -u origin feature/data-analysis
```

禁止直接向 `main` 或 `develop` 提交。每人只能向自己的 feature 分支推送，通过 PR 合并至 `develop`。

## 2. 推荐开发顺序

每个模块依照以下顺序完成最小闭环：

1. SQL 与索引设计。
2. Entity、DTO 和 MapStruct Wrapper。
3. Mapper、Mapper XML。
4. Service 与公开的 Query Service / Brief DTO。
5. Controller、权限和 `@ApiLog`。
6. 前端 API Service。
7. 基础列表/表单页面。
8. 前后端联调、Excel/图表（适用时）和 PR。

先完成可联调的数据闭环，不要先投入大量时间打磨页面视觉效果。跨模块依赖尚未合并时，按模块契约使用 mock DTO 开发，之后只替换实现。

## 3. 必须遵守的边界

- 不修改其他成员拥有的数据表、Entity、Mapper、XML 或前端模块。
- 同一 Spring Boot 内跨模块只调用对方公开的 Service + DTO；不注入对方 Mapper，不直接访问对方表，不让 Controller 调 Controller，也不做自调用 HTTP。
- 不私自改公共字段、URL、权限字符串、分页结构、DTO 名称或模块契约。确有需要时，先提出变更，更新 `TEAM_MODULE_CONTRACTS.md`，取得相关负责人确认，再开始编码。
- 不提交 `node_modules`、`target`、`dist`、jar/war、IDE 文件、真实密码、Token、Secret 或本地配置。

## 4. PR 模板要求

每个 PR 必须明确写出：

- 功能范围与不包含的范围；
- 新增或变更的数据库 SQL、接口、DTO、权限和字典；
- 依赖的模块、所用 mock，以及联调方式；
- 后端编译/测试与前端构建结果；
- 页面或接口截图（适用时）；
- 已知风险和可行的回滚方式。

至少由一名非作者成员审查后合并。发现接口契约冲突时，先暂停合并并按上一节流程修正文档；不得以代码临时兼容多个同义字段。

## 5. 提交前最短清单

- [ ] 已从最新 `develop` 创建或同步自己的 feature 分支。
- [ ] 变更只落在本人模块边界内，跨模块调用只通过公开 Service + DTO。
- [ ] 所有公共 ID、时间字段、分页、权限、Excel/图表格式均符合团队标准。
- [ ] SQL、后端、前端 API Service 与基础页面已形成可验证闭环。
- [ ] 已运行相关后端编译、前端构建/检查，且 `git diff --check` 无错误。
- [ ] PR 描述已包含范围、接口/SQL、依赖、测试、截图、风险和回滚；未包含构建产物或敏感凭据。
