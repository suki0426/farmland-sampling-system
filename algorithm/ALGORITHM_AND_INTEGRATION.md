# 3 号岗位：算法模块实现说明与集成清单

> 适用对象：3 号（算法）、5 号（后端集成）、1 号（前端 GIS）、组长 / 评审。
> 对应提交：`feature/sampling-algorithm` 分支 commit `40b63e5`。
> 契约依据：《第12课题五人岗位字段与公共接口约束 V2.1》第五章（3 号岗位）、第六章第 8 节（跨岗位接口依赖矩阵）。

---

## 一、模块定位与边界

**是什么**：一个可被 5 号直接 `import` 的纯 Python 算法模块，只接收和返回普通 dict / list，无第三方依赖（只用标准库，Python 3.7+，当前环境 3.10）。

**不做什么**（契约明确禁止）：

- 不启动 FastAPI / 任何服务，不写 REST 路由
- 不连接数据库，不写 SQL
- 不操作地图 UI、不画图
- 不做坐标系转换或猜测：调用方给什么 `coordinateSystem` 就原样透传
- 不生成正式的 `samplingPointId`：算法新生成的点不带 ID，入库后由 A/C 模块生成
- 不允许前端直接调用本模块（约束文档：3/4 → 1 不得直接耦合；1 号不得直接请求 Python 算法文件）

**交付形态**：`algorithm/` 目录，5 号通过 adapter 调用两个函数，**不复制算法源码**。

---

## 二、两个固定入口

签名与契约 5.1 节完全一致，不得改动：

```python
generate_sampling_points(boundary_geojson, count=None, spacing=None) -> list[Point]
plan_route(points, start_point=None, method="2opt") -> RouteResult
```

另有三个辅助入口（不替代上面两个）：

```python
nearest_unvisited_point(points, current_point, ...)      # 导航：最近未采样点
partition_and_plan(points, boundary_geojson=None, ...)   # 可选加分项：三人分区
route_order(points, method, ...)                         # 只要序号序列的高级用法
```

调用约定：首参可用位置参数，其余必须用关键字（`generate_sampling_points(boundary, count=12)`）。

---

## 三、已实现的算法

| # | 算法 | 代码位置 | 要点 |
| --- | --- | --- | --- |
| 1 | Point-in-Polygon（射线法） | `geometry.point_in_ring` / `point_in_polygon` | 支持孔洞与 MultiPolygon |
| 2 | 边界校验 | `geometry.validate_boundary` | 类型、闭合、点数、经纬度范围、面积、跨度 |
| 3 | 自动布点（行式网格） | `sampling.generate_sampling_points` | 局部米制平面，点保证落在界内 |
| 4 | 蛇形路线 | `routing.route_order("snake")` | boustrophedon，与布点行列对齐 |
| 5 | 最近邻路线 | `routing.route_order("nearest")` | 贪心 NN，支持指定起点 |
| 6 | 2-opt | `routing._two_opt` | k 近邻剪枝，结果保证不劣化 |
| 7 | 最近未采样点 | `routing.nearest_unvisited_point` | 导航用，支持排除已采样 |
| 8 | 三人分区 | `partition.partition_and_plan` | balanced / angular 两种划分 |
| 9 | 米制几何工具 | `geodesy` | haversine 距离、局部平面投影、度分秒解析 |

### 3.1 Point-in-Polygon（射线法）

对环的每条边做穿越测试：

```python
if (y_a > y) != (y_b > y):
    x_cross = (x_b - x_a) * (y - y_a) / (y_b - y_a) + x_a
    if x < x_cross:
        inside = not inside
```

孔洞处理：**在外环内 且 不在任何孔洞内**；MultiPolygon 逐块判定后取「或」。

`validate_boundary` 的校验规则（不合法直接抛 `BoundaryValidationError`，不做静默修正）：

- 类型必须是 `Polygon` / `MultiPolygon`（`Feature`、`FeatureCollection` 也接受），其他类型报错
- 每个环至少 4 个坐标点，且**首尾坐标必须相同（闭合）**，容差 1e-7
- 经纬度必须是数值且在 `[-180, 180]` / `[-90, 90]` 内
- 外环面积不得为 0
- 经纬跨度上限 20°（面向农田尺度，防误传省级/全国数据）

### 3.2 自动布点

**为什么用局部米制平面**：直接按经纬度铺网格，格距会随纬度变化（同样 0.001° 经度在赤道和北纬 37° 差 20%）。所以以边界中心为原点，按 WGS84 椭球在该纬度的子午圈 / 卯酉圈曲率半径做等距圆柱近似，在米制平面上布点再转回经纬度——这样 `spacing` 是**真实的米**。

```python
steps_x = floor(2 * half_width  / spacing) + 2
steps_y = floor(2 * half_height / spacing) + 2
# 网格中心与边界中心对齐，逐点 PIP 过滤，落在孔洞与界外的点丢弃
```

**`spacing` 模式**：直接用给定间距铺网格，只保留界内点。原间距过细导致无法完整枚举时，会尝试 2× / 4× 间距；仍不行就明确报错，**不会静默少给点**。

**`count` 模式**：先按 `spacing ≈ √(面积 / count)` 估算，然后两段式收缩：

1. **二分**：在 `[估算/64, 估算×16]` 内找「点数仍不少于 count」的**最大**间距。常规农田上「间距越大点数越少」单调成立，一次就能命中间距合适的解（点更均匀）。
2. **从粗到细兜底**：断开的 MultiPolygon 上单调性不成立，二分可能落空；此时按 2 的幂次逐级放细，取第一个点数达标的层级。

数量调整：

- 多了 → `_thin`：反复剔除「与自己最近邻距离最小」的点（最冗余的点），直到目标数量
- 少了 → `_densify`：用更细网格补点，每次挑「离已选点最远」的候选

最后有一道**内部一致性检查**：所有生成点重新做一次 PIP，只要有一个在界外就拒绝输出（抛 `SamplingError`）。

### 3.3 蛇形路线（boustrophedon）

1. 用最近邻距离的**中位数**估计行高（比用固定阈值更抗不均匀点集）
2. 按纬度降序分组，容差 = 行高 / 2
3. 行内按经度排序，**相邻行方向相反**

这个顺序与布点的行式网格天然对齐，也是局部搜索类算法的好初值。

### 3.4 最近邻（贪心 NN）

从起点出发，每步选距当前位置最近的未访问点。用预计算的**距离矩阵**避免重复算距离（n ≤ 数百时性价比最高）。

`start_point` 处理：
- 命中点集中已有的点 → 从该点出发（排到最前）
- 不在点集中 → 作为新起点前置，原输入点一个不少

### 3.5 2-opt（带候选剪枝）

在最近邻初始解上做局部搜索，逆转子路径消除交叉：

```
gain = d(c_i, c_i+1) + d(c_j, c_j+1) - d(c_i, c_j) - d(c_i+1, c_j+1)
gain > 0 → 逆转 i+1..j
```

工程处理：

- **候选剪枝**：每个位置只对最近的 16 个邻居做候选（`_knn_indices`），把 O(n²) 的邻域检查压下来
- 最大滑窗 400 轮，防止极端输入下退化
- **取优不取新**：算完比较 `optimized ≤ nearest + 1e-9`，更差就退回最近邻 —— 所以 **2-opt 在数学上不可能劣化**
- 耗时 O(n²·n_cand)，n=200 量级在秒级

### 3.6 最近未采样点（导航）

输入当前位置与已采样集合（`exclude` 支持 int 下标或 `samplingPointId` 字符串），返回距离最小的未采样点，附 `distance` 字段；全部采完返回 `None`。

### 3.7 三人分区（可选加分项）

| 方式 | 划分逻辑 | 适用 |
| --- | --- | --- |
| `balanced`（默认） | 贪心挑互相距离最远的点作种子，其余点按「到各种子距离 → 分区已有点数 → 分区号」排序就近分配，同时保证各区点数均衡 | 常规农田，三点分散 |
| `angular` | 按边界质心方位角均分成扇形，每人一个扇区 | 需要「各管一片」的直观划分 |

每区独立调用 `plan_route`，可用 `start_points` 给三个采样员各自的出发位置。

### 3.8 米制几何工具

- 距离：haversine，地球半径 6371008.8 m（IUGG 平均半径），农田尺度下与椭球模型差异可忽略
- 投影：WGS84 椭球在给定纬度的曲率半径 → 每度纬 / 经的米数
- `parse_dms`：`112°07'23.4"` / `37 06 00` → 十进制度（只做格式转换，不做坐标系转换）

---

## 四、输入输出规格

### 4.1 公共字段（与契约第一章一致，禁止同义替代）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `longitude` | number | 经度，至少 6 位小数；必须与 `latitude` 成对出现 |
| `latitude` | number | 纬度，至少 6 位小数 |
| `coordinateSystem` | string | 只允许 `GCJ02`、`WGS84`、`BD09`；未知时拒绝处理 |
| `samplingPointId` | string，可选 | 系统内部主键；算法新生成的点不带 |

出现 `lng` / `lon` / `pointId` / `farmId` / `fieldId` / `equipmentId` / `timestamp` 等第二套同义字段时，**直接抛 `AlgorithmParameterError`**。同一组点坐标系不一致同样报错。

### 4.2 `Point`

```python
{"longitude": 112.123456, "latitude": 37.123456, "coordinateSystem": "GCJ02"}
```

额外字段（`samplingPointId`、`pointCode` 等）原样保留在输出中，不会被丢弃。

### 4.3 `boundary_geojson`

```python
{"type": "Polygon",
 "coordinates": [[[112.100000, 37.100000], [112.130000, 37.100000],
                  [112.130000, 37.120000], [112.100000, 37.120000],
                  [112.100000, 37.100000]]]}
```

GeoJSON 坐标顺序固定是 `[经度, 纬度]`。

### 4.4 `generate_sampling_points` 返回值

签名要求 `list[Point]`，但 5 号还需要知道实际用的间距，所以返回一个**既是映射、也像列表**的对象：

```python
result = generate_sampling_points(boundary, count=12)

result["points"]          # list[Point]，与签名一致
result["count"]           # 实际点位数
result["spacing"]         # 实际间距（米）
result["strategy"]        # "count" 或 "spacing"
result["order"]           # "snake" / "row" / "none"
result["boundary"]        # 校验后的边界摘要（area / center / bbox / coordinateSystem）

result.points             # 属性访问同样可用
len(result)               # 点位数
[dict(p) for p in result] # 可迭代
result.to_geojson()       # GeoJSON FeatureCollection（Point），前端可直接加 Marker
json.dumps(dict(result), ensure_ascii=False)   # 可直接序列化
```

> 兼容性提醒：`isinstance(result, list)` 为 `False`。需要严格列表时用 `result["points"]` 或 `list(result)`。

### 4.5 `RouteResult`

```python
{
  "orderedPoints": [Point, Point],      # 不漏点、不重复
  "routeGeoJson": "{...}",              # GeoJSON LineString 的 JSON 字符串
  "distance": 128.45,                   # 米
  "method": "2opt",                     # 实际使用的算法
  "diagnostics": {
      "initialDistance": 154.20,        # 初始路线距离（最近邻 / 蛇形）
      "optimizedDistance": 128.45,      # 优化后距离
      "improvement": 16.72,             # 相对初始路线的优化幅度 %
      "method": "2opt",
      "realMethod": "2opt",             # 实际生效的算法
      "applied": true,                  # 是否真正发生了交换
      "comparison": [{"method": "snake", "distance": ...}, ...],
      "sequenceDistance": 4371.01,      # 输入原始顺序的距离（基线）
      "sequenceImprovement": 13.7,      # 相对原始顺序的优化幅度 %
      "pointCount": 12, "coordinateSystem": "GCJ02",
      "startPointUsed": true, "closed": false, "unit": "meter"
  }
}
```

`RouteResult` 也是可直接 `json.dumps` 的映射对象，另有 `result.geojson()`（已解析的 dict）和 `result.coords()` 便利方法。

---

## 五、给前端可选的参数（需 5 号包成 REST）

**前提**：前端不直接调用本模块。下面「前端选项」必须由 5 号在 REST 参数里暴露，再转成「模块参数」调用。

### 5.1 自动布点

| 前端选项 | REST 参数建议 | 模块参数 | 说明 |
| --- | --- | --- | --- |
| 布点方式 | `mode=count` / `mode=spacing` | 二选一 | 同时给 `count` 和 `spacing` 会报错 |
| 采样点数量 | `count=12` | `count` | 1 ~ 100000，必须是整数 |
| 采样间距（米） | `spacing=400` | `spacing` | 单位是**米**，不是度 |
| 生长顺序 | `order=snake` | `order` | `snake`（默认）/ `row` / `none`；一般不必露给用户 |
| 坐标系 | `coordinateSystem=GCJ02` | `coordinateSystem` | 跟随农田；只接受三个枚举值 |

### 5.2 路线规划

| 前端选项 | REST 参数建议 | 模块参数 | 说明 |
| --- | --- | --- | --- |
| 算法 | `method=snake\|nearest\|2opt\|best` | `method` | `best` = 三种各跑一遍取最短；未知值明确报错，不暗中切换 |
| 多方案对比 | `method=snake,nearest,2opt` | 传列表 | 返回最短的一条，`diagnostics.comparison` 带三种距离 |
| 起点（采样员当前位置） | `startPoint={...}` | `start_point` | 可选；坐标系必须与点集一致 |
| 是否闭环 | `closed=true` | `closed` | 只影响 `routeGeoJson`，`orderedPoints` 不重复首点 |

### 5.3 导航与分区

| 能力 | 模块参数 | 说明 |
| --- | --- | --- |
| 下一个采样点 | `nearest_unvisited_point(points, current_point=..., exclude=[...])` | 返回最近未采样点 + `distance`；全采完返回 `None` |
| 三人分区 | `partitions=3`、`partition_method=balanced\|angular`、`start_points=[...]` | `partitions` ≥ 2 且 ≤ 8；`start_points` 数量必须等于分区数 |

### 5.4 完整调用示例

```python
import sys
sys.path.insert(0, "algorithm")
from sampling_algorithm import generate_sampling_points, plan_route

boundary = { ... GeoJSON Polygon ... }

sampling = generate_sampling_points(boundary, count=12, coordinate_system="GCJ02")
route = plan_route(
    sampling["points"],
    start_point={"longitude": 112.1005, "latitude": 37.1005, "coordinateSystem": "GCJ02"},
    method="best",
    coordinate_system="GCJ02",
)
print(route["distance"], route["method"], route["diagnostics"]["comparison"])
```

---

## 六、5 号集成清单

1. **adapter 调用，不复制源码**：在集成层 import `sampling_algorithm`，不要把这几个 .py 抄进后端模块。
2. **参数校验在 adapter 做**：`mode` 二选一、`count` 是整数、`spacing` > 0、`method` 在白名单内（`snake` / `nearest` / `2opt` / `best`），非法值转 **HTTP 400**，别把 `AlgorithmParameterError` 漏成 500。
3. **坐标系必须透传**：从农田 / 点位取 `coordinateSystem` 传进来，不要硬编码 GCJ02；缺少该字段我的模块会直接报错（这是有意的，避免猜测转换）。
4. **`routeGeoJson` 是字符串**：契约里就是字符串，写入 `NavigationRouteDTO.routeGeoJson` 时直接用，不需要二次 `json.dumps`；要嵌套进别的 JSON 时先 `json.loads`。
5. **`orderedPoints` 里的点是 dict**：需要赋正式 `samplingPointId` 时由 A/C 模块在入库后回填，我的模块不生成 ID。
6. **错误语义**：`AlgorithmParameterError` → 400；`BoundaryValidationError` / `CoordinateSystemError` / `SamplingError` → 400；`EmptyPointSetError` → 400；`OptimizationError` → 500（正常输入不会出现，属于内部断言）。
7. **单位**：所有距离都是**米**；`routeGeoJson` 的坐标系与输入点集一致。
8. **性能预期**：12 ~ 200 点的一批，`count` 布点 + `2opt` 路线在 1 秒内；1000 点布点约 2 秒；三人分区约为单个分区之和。每次请求现算即可，不必缓存。
9. **导入方式**：`algorithm/` 加入 `sys.path` 后 `import sampling_algorithm`；或由后端配置 `PYTHONPATH`。若后端以子进程方式调用，用 `sys.executable`、`cwd` 指向仓库根目录。

---

## 七、验证结果

### 7.1 命令

```bash
python algorithm/tests/test_sampling_algorithm.py    # 53 项单测
python algorithm/demo.py                             # 演示
python algorithm/demo.py --count 20 --spacing 400 --json
```

Windows GBK 控制台先 `set PYTHONIOENCODING=utf-8`（demo 内部也会尝试把输出流切到 UTF-8）。

### 7.2 实测数值（demo 默认农田，约 606.64 公顷）

| 项目 | 结果 |
| --- | --- |
| 按数量布点 | 请求 12，实际 12，实际间距 666.61 m，全部在界内、无重复 |
| 按间距布点 | 请求 667 m，实际 11 点，全部在界内 |
| 蛇形 | 9819.80 m（初始距离基线） |
| 最近邻 | 7321.25 m（优化 25.44%） |
| 2-opt | 7321.25 m（不劣于初始路线） |
| 三人分区（balanced） | 4 / 4 / 4 点，合计 6936.58 m |

### 7.3 测试覆盖的验收点

- 有效矩形 / 带孔洞 / MultiPolygon 边界都能布点，且点全部在界内
- 未闭合环、点数不足、非法经纬度、不支持的 GeoJSON 类型、未知坐标系 → 明确报错
- 孔洞内不出现采样点
- 三种方法路线都不漏点、不重复、坐标齐全；未知 `method` 报错；空点集返回空路线而不是崩溃
- 2-opt 不劣于初始路线；在交叉输入上确实缩短距离（`applied=true`）
- `start_point` 命中/未命中两种路径都正确，且输入点一个不少
- 同义字段（`lng` 等）出现即报错；坐标系不一致报错
- 分区覆盖全部点、分区之间不重复分配；三区起点各自生效
- 输出可 `json.dumps`；`routeGeoJson` 是合法 LineString
- 距离量级正确（北纬 37.1° 上 0.01° 经度 ≈ 880 m）；度分秒解析正确

### 7.4 失败路径与安全上限

| 场景 | 行为 |
| --- | --- |
| `spacing` 过大（界内无点） | `SamplingError`，提示减小 spacing |
| `spacing` 过细（候选无法完整枚举） | `SamplingError`，提示增大 spacing 或改用 count |
| `count` 相对边界过大 | `SamplingError`（不会无限逼近或静默少给点） |
| `count` > 100000 | `AlgorithmParameterError` |
| `count` 与 `spacing` 同时给 / 都不给 | `AlgorithmParameterError` |
| 生成点内部校验失败 | `SamplingError`，拒绝输出 |

内部预算常量（`sampling.py`）：单次枚举保留 ≤ 200000 点、单级访问 ≤ 600000 网格点、累计扫描 ≤ 1500000 点；`MAX_THIN_INPUT = 20000` 用于避免剔除阶段 O(n²) 爆炸。

---

## 八、待确认事项（属 5 号 / 团队决策，未擅自实现）

1. **REST 返回单条路线还是多方案**：契约给前端的 `NavigationRouteDTO` 是单条路线，最省事的做法是前端传 `method`、后端调一次返回一条。若要展示「蛇形 vs 2-opt 省了多少米」，需要后端把 `diagnostics.comparison` 一起透出——这属于 5 号的 REST 设计范围。
2. **`generate_sampling_points` 的返回值形态**：契约签名写的是 `-> list[Point]`，但 5 号需要 `spacing` / `strategy` 等元信息，所以本模块返回可当映射用的结果对象（`result["points"]` 即列表）。若 5 号希望严格返回裸列表，可在 adapter 里取 `result["points"]`，不需要改我的模块。
3. **是否需要更贴前端的入口**（例如直接输出 `NavigationRouteDTO` 字段的 `plan_route_for_api(...)`）：属于额外接口，需先与 5 号对齐后再实现。
4. **三人分区是否进最终演示**：目前作为可选加分项已实现，是否需要前端页面支持由 1 号 / 组长定。

---

## 九、交付状态

| 项目 | 状态 |
| --- | --- |
| 代码 | 已完成，提交在 `feature/sampling-algorithm`（commit `40b63e5`） |
| 测试 | 53 项全部通过 |
| 演示 | 可运行，输出三种算法距离对比 |
| push | **待本地执行**：`git push -u origin feature/sampling-algorithm` |
| PR | 待创建，base 选 `main`，由组长检查后合并 |

> 注：本机环境 push 失败（代理下 Schannel 报 `SEC_E_NO_CREDENTIALS`，OpenSSL 后端又拿不到凭据），commit 已在本地分支就绪。
