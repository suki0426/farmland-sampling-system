# 五人团队开发标准（V1.0）

> 适用分支：`develop`。本文件以当前 JeePlus 代码为唯一基线；遇到旧代码与本文不一致时，先在 PR 中说明并由组长确认，禁止各自引入第二套架构。

## 1. 技术栈与公共入口

- 前端：Vue 2、Element UI、VXE Table、Axios、v-charts/ECharts；开发地址由 `.env.development` 的 `VUE_APP_BASE_API=/api` 和 `VUE_APP_SERVER_URL` 控制。
- 后端：Java 8、Spring Boot、Spring Security、JeePlus、MyBatis-Plus、MapStruct、EasyExcel、MySQL、Redis。
- 前端请求统一从 `frontend/src/utils/httpRequest.js` 发出；它自动追加 `/api`、附带 Cookie 中的 `token`，并处理 HTTP 错误。业务 Service 不得自行创建 Axios 实例，也不得在 URL 中手工写 `/api`。

## 2. 目录与分层

```text
backend/jeeplus-module/jeeplus-teaching/src/main/java/com/jeeplus/teaching/<module>/
  controller/        <Resource>Controller.java
  domain/            <Resource>.java                 # 持久化 Entity
  service/           <Resource>Service.java
  service/dto/       <Resource>DTO.java               # 接口输入/输出/查询
  service/mapstruct/ <Resource>Wrapper.java            # DTO <-> Entity
  mapper/            <Resource>Mapper.java
  mapper/xml/        <Resource>Mapper.xml
frontend/src/api/<module>/<resource>Service.js
frontend/src/views/modules/<module>/<Resource>List.vue
frontend/src/views/modules/<module>/<Resource>Form.vue
```

- `domain` 只对应表和持久化；Controller 不直接返回 Entity。
- CRUD 的 DTO 继承 `BaseDTO`，Entity 继承 `BaseEntity`；两者用 MapStruct `EntityWrapper` 转换。
- Controller 不写 SQL，Service 不拼接 HTTP 响应，Mapper XML 承担复杂查询和列别名。
- 同一 Spring Boot 后端的跨模块调用优先且默认使用公开 Service + DTO；REST 仅用于前端、外部或远程边界。禁止 Controller 调 Controller，禁止直接引用其他模块的 Mapper/XML/表结构。

## 3. 数据库规范

- MySQL 表、字段、索引全部使用小写 `snake_case`；Java/JSON 使用 `camelCase`。Mapper XML 必须用 `AS "camelCase"` 显式映射。
- 主键统一为 `varchar(64)`，Java 类型为 `String`，沿用 `BaseEntity.id`；不得混入自增整型 ID。
- 业务表默认包含 `id`、`create_by`、`create_date`、`update_by`、`update_date`、`del_flag`，并使用逻辑删除。
- 为所有高频筛选、排序、关联字段建命名明确的索引；避免冗余索引、超长复合索引和在索引列上套函数。
- 金额、浓度、经纬度等精确数值使用 `decimal` / Java `BigDecimal`；不使用 `float` / `double` 存储关键业务值。
- 新表 SQL 以独立、可重复执行的脚本提交到 `backend/db/`，命名为递增序号加语义，例如 `04_sampling_point.sql`；SQL 内不得出现真实账号、密码、Token 或生产数据。

## 4. 后端编码与 DTO 规范

- Controller 使用 `@RestController`、类级 `@RequestMapping("/<module>/<camelResource>")`、Swagger `@Api`；写操作与关键读取加 `@ApiLog`。
- 列表查询使用 `DTO + Page<DTO>`，通过 `QueryWrapperGenerator.buildQueryCondition(dto, DTO.class)` 和 `@Query(type = QueryType.XXX)`。可用类型：`EQ`、`LIKE`、`BETWEEN`、`GE`、`LE` 等。
- DTO 中仅放接口需要的字段。复合请求可单独建立 `*Request`/`*VO`，但必须有明确理由，不能用 `Map` 代替稳定 DTO。
- 时间字段使用 `Date`；JSON 输入/输出固定为 `yyyy-MM-dd HH:mm:ss`、`GMT+8`，与当前 `JsonMapper`、`StringToDateConverter` 一致。
- 新 GIS 对象统一使用 `longitude`、`latitude`、`coordinateSystem`：前两者为 `BigDecimal`，后者为字符串枚举值（`GCJ02`、`WGS84`、`BD09`）。不得混用 `lon/lng`，坐标系缺失时不得猜测转换。
- 状态字段优先使用系统字典的字符串 code；前端以 `$dictUtils` 显示标签，Excel 使用 `@ExcelDictProperty`。只有跨模块、不可配置且有明确语义的固定集合才新增 Java `constant/enums` 下的 `*Enum`。

## 5. API 接口契约

### URL 与 HTTP 方法

当前生成式 CRUD 的固定基线是：

| 用途 | 方法 | 路径后缀 |
| --- | --- | --- |
| 分页列表 | GET | `list` |
| 单条查询 | GET | `queryById?id=...` |
| 新增/编辑 | POST | `save` |
| 批量逻辑删除 | DELETE | `delete?ids=id1,id2` |
| 导出 | GET | `export` |
| 导入 | POST | `import` |
| 下载导入模板 | GET | `import/template` |

V1 业务模块沿用上述 DDevice 约定。当前仓库没有 PUT 的统一 CRUD 基线，因此不为普通保存另创 PUT 端点；只有经团队评审的幂等、资源化更新接口才能使用 `PUT /<module>/<resource>/{id}`。

### 返回与异常

- 成功响应直接使用 `ResponseEntity<T>`，不包一层新的 `{ code, msg, data }`。列表返回原始 `IPage<DTO>`，详情返回 DTO，保存/删除返回文本，文件接口返回二进制流。
- 现有 `ExceptionTranslator` 以 HTTP 状态码和消息表达异常：400 参数/校验失败、401 未认证、403 无权限、500 未知异常。404 由 Spring 路由处理。前端拦截器已按 HTTP 状态统一提示。
- 禁止在业务接口返回 HTTP 200 却在 body 中伪造失败码；禁止吞异常后返回空对象。

### 分页与排序

请求必须兼容：

```text
current=1&size=10&orders[0][column]=create_date&orders[0][asc]=false
```

响应必须保留 MyBatis-Plus 的 `records`、`total`、`current`、`size`、`pages`；前端列表至少使用 `records` 和 `total`。排序 column 使用数据库下划线字段名，且 Service/Mapper 必须限制为允许排序字段，不能把未经校验的字符串直接拼入 SQL。

### 最小后端模板（仅复制后改名）

```java
@RestController
@RequestMapping("/example/exampleResource")
public class ExampleResourceController {
    @Autowired private ExampleResourceService service;

    @ApiLog("查询示例资源")
    @PreAuthorize("hasAuthority('example:exampleResource:list')")
    @GetMapping("list")
    public ResponseEntity<IPage<ExampleResourceDTO>> list(
            ExampleResourceDTO dto, Page<ExampleResourceDTO> page) throws Exception {
        QueryWrapper query = QueryWrapperGenerator.buildQueryCondition(dto, ExampleResourceDTO.class);
        return ResponseEntity.ok(service.findPage(page, query));
    }
}
```

## 6. 权限规范

- 权限字符串格式：`<module>:<CamelResource>:<action>`，例如 `sampling:samplePoint:list`。
- 标准 action：`list`、`view`、`add`、`edit`、`del`、`import`、`export`。Controller 的 `@PreAuthorize` 与前端 `hasPermission()` 使用完全相同的字符串。
- 菜单、按钮权限和角色配置由负责系统配置的成员在独立 PR 中维护；业务成员不得绕过鉴权或写死管理员判断。

## 7. Excel 规范

- 复用 `EasyExcelUtils.newInstance(service, wrapper)`；DTO 用 `@ExcelProperty` 标记可导入/导出列。
- 导出复用 `ExcelOptions` 的 `mode`（`current`、`selected`、`all`）、`selectIds`、`exportFields`、`filename`、`sheetName`。
- 接口提供 `export`、`import`、`import/template` 三件套；前端文件请求必须设置 `responseType: 'blob'`。
- 导入必须校验必填项、枚举/字典值和数值范围；错误信息应给出行号与字段，不得部分静默失败。

## 8. ECharts / 报表数据规范

- 常规图表接口直接返回：`{ "columns": ["date", "count"], "rows": [{ "date": "2026-09-17", "count": 12 }] }`。
- `columns` 中第一个维度字段是 x 轴/分类字段，后续字段为指标；`rows` 的 key 必须与 `columns` 对应，字段保持 camelCase。
- ECharts 页面仅通过 `src/api/<module>/` Service 获取数据；图表接口负责聚合，不返回 Entity 大字段、文件内容或无关明细。
- 现有图表设计器曾使用 `data.chartData`，新模块需要该外层时必须在接口说明中明确，不能混用两种格式。

## 9. MyBatis 规范

- Mapper 继承 `BaseMapper<Entity>`；自定义分页方法使用 `Page<DTO>`、`IPage<DTO>` 和 `@Param(Constants.WRAPPER) QueryWrapper`。
- XML 文件放在 `mapper/xml`，namespace 与 Mapper 全限定名一致；表使用别名 `a`，查询列显式列出，禁止 `SELECT *`。
- Service 统一加 `a.del_flag = 0`，XML 的详情和聚合查询也要排除逻辑删除记录。
- 只能使用 `#{}` 绑定用户参数；`${}` 仅限项目既有的 `ew.customSqlSegment`，严禁自行拼接请求参数。

## 10. 前端调用规范与最小模板

```js
import request from '@/utils/httpRequest'

const root = '/example/exampleResource'
export default {
  list (params) { return request({ url: `${root}/list`, method: 'get', params }) },
  queryById (id) { return request({ url: `${root}/queryById`, method: 'get', params: { id } }) },
  save (data) { return request({ url: `${root}/save`, method: 'post', data }) },
  delete (ids) { return request({ url: `${root}/delete`, method: 'delete', params: { ids } }) },
  exportExcel (params) { return request({ url: `${root}/export`, method: 'get', params, responseType: 'blob' }) }
}
```

- 页面查询参数使用 `current`、`size`、`orders`；列表读取 `response.data.records`、`response.data.total`。
- 只在 API Service 中写接口路径；页面不得散落 `request(...)` 调用。
- 前端不得把字典 code 直接展示给用户；不得把经纬度、状态、权限名称自行硬编码成多套含义。

## 11. 五人分支与边界

公共分支固定为 `develop`，禁止直接提交。功能分支命名：`feature/<area>-<short-name>`，例如：

| 成员 | 建议边界 | 分支示例 |
| --- | --- | --- |
| A | 农田与采样点 GIS 页面/接口 | `feature/gis-sampling-point` |
| B | 设备接入与设备台账 | `feature/device-management` |
| C | 采样任务与导航路径 | `feature/task-navigation` |
| D | 监测、阈值与预警 | `feature/monitor-warning` |
| E | 历史数据、统计与展示页面 | `feature/data-analysis` |

共享 DTO、字典、菜单、公共文档的改动先在团队群说明；跨边界需求通过 API/DTO 契约协商，不能直接等待另一个模块的未合并代码。

## 12. Git、Commit、PR 与审查

- 从最新 `develop` 创建 feature 分支；只向自己的 feature 分支推送；通过 PR 合并回 `develop`。
- Commit 格式：`feat(scope): ...`、`fix(scope): ...`、`docs: ...`、`refactor(scope): ...`、`chore: ...`。一项 commit 只处理一类可审查变更。
- PR 必须说明：功能范围、接口/SQL 变化、联调方式、截图或测试结果、风险及回滚方式。至少一名非作者成员审查后合并。
- 禁止强推共享分支、`reset --hard`、改写已共享历史、提交 `node_modules`、`target`、`dist`、jar/war、IDE 文件或凭据。

## 13. 开发 Checklist

### 开发前

- [ ] 已拉取最新 `develop`，在正确 feature 分支工作。
- [ ] 已确认模块边界、URL、DTO、权限和数据库字段，不与其他成员重复。
- [ ] 新坐标字段已声明 `coordinateSystem`，新状态字段已确定字典或枚举归属。

### 提交前

- [ ] 后端分层、Mapper XML、逻辑删除、权限与 `@ApiLog` 完整。
- [ ] 分页仍兼容 `current/size/orders/records/total`，异常使用正确 HTTP 状态。
- [ ] Excel、图表接口遵守本文格式；API Service 未绕过 Axios 封装。
- [ ] 已运行相关后端编译与前端构建/检查，`git diff --check` 无错误。
- [ ] SQL 可重复执行并包含必要索引；无真实密码、Token、Secret 或本地构建产物。
- [ ] PR 描述已写清联调契约，未顺手修改其他成员模块。

## 14. 本阶段明确不实现的内容

本标准不创建也不实现农田、设备、采样任务、导航、历史数据、数据报表、监测或预警模块。上述工作由各成员在自己的 feature 分支按本契约开发。
