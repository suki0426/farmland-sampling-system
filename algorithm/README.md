# 3 号岗位：自动采样点与路线算法模块

本目录是 3 号（算法负责人）在 `feature/sampling-algorithm` 分支上的独立交付物，对应《第12课题五人岗位字段与公共接口约束 V2.1》第五章。

交付一个**可被 5 号直接 `import` 的纯 Python 算法模块**：只接收和返回普通 dict / list，不启动 FastAPI，不连接数据库，不操作地图 UI。

> 另见 [`ALGORITHM_AND_INTEGRATION.md`](ALGORITHM_AND_INTEGRATION.md)：算法实现说明、常量与复杂度、给前端的可选参数、5 号集成清单、实测结果与待确认事项。

## 1. 目录结构

```text
algorithm/
├── README.md                       # 本文件：接口与用法
├── ALGORITHM_AND_INTEGRATION.md    # 算法实现说明与集成清单
├── demo.py                         # 可运行演示（打印并比较各算法总距离）
├── sampling_algorithm/             # 算法包（唯一交付物）
│   ├── __init__.py                 # 公共入口与导出
│   ├── errors.py                   # 异常类型
│   ├── types.py                    # 公共字段名、坐标系常量、参数解析
│   ├── geodesy.py                  # 米制距离、局部平面投影、度分秒解析
│   ├── geometry.py                 # GeoJSON 边界校验与 Point-in-Polygon
│   ├── sampling.py                 # 自动布点 generate_sampling_points
│   ├── routing.py                  # 路线规划 plan_route / nearest_unvisited_point
│   └── partition.py                # 可选的三人分区
└── tests/
    └── test_sampling_algorithm.py   # 可复现单元测试
```

无第三方依赖，只用 Python 标准库（需要 Python 3.7+，当前开发环境为 3.10）。

## 2. 两个固定函数入口

签名按约束文档 5.1 节冻结，不得改动：

```python
generate_sampling_points(boundary_geojson, count=None, spacing=None) -> list[Point]
plan_route(points, start_point=None, method="2opt") -> RouteResult
```

本模块另外提供两个辅助入口（不替代上面两个）：

```python
nearest_unvisited_point(points, current_point, coordinate_system=None, exclude=None)
partition_and_plan(points, boundary_geojson=None, partitions=3, method="2opt", start_points=None)
```

## 3. 公共字段（与约束文档第一章一致）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `longitude` | number | 经度，至少 6 位小数；必须与 `latitude` 成对出现 |
| `latitude` | number | 纬度，至少 6 位小数 |
| `coordinateSystem` | string | 只允许 `GCJ02`、`WGS84`、`BD09`；未知时拒绝处理，不做转换猜测 |
| `samplingPointId` | string，可选 | 系统内部采样点主键；算法新生成的点可不带，入库后由 A/C 模块生成 |

禁止使用 `farmId`、`pointId`、`lng`、`lon`、`timestamp` 等第二套同义字段：出现即抛 `AlgorithmParameterError`。

## 4. 输入输出

### 4.1 `Point`

```python
Point = {"longitude": 112.123456, "latitude": 37.123456, "coordinateSystem": "GCJ02"}
```

额外字段（如 `samplingPointId`、`pointCode`）会被原样保留在输出里，不会被丢掉。

### 4.2 `boundary_geojson`

标准 GeoJSON `Polygon` 或 `MultiPolygon`（`Feature` 与 `FeatureCollection` 也接受）：

```python
{
  "type": "Polygon",
  "coordinates": [[[112.100000, 37.100000], [112.130000, 37.100000],
                   [112.130000, 37.120000], [112.100000, 37.120000],
                   [112.100000, 37.100000]]]
}
```

校验规则：类型必须是 `Polygon` / `MultiPolygon`；每个环至少 4 个点且**必须闭合**（首尾相同）；经纬度必须是数值且在合法范围内；外环面积不得为 0。不合法直接抛异常，不做静默修正。

### 4.3 `RouteResult`

```python
{
  "orderedPoints": [Point, Point],
  "routeGeoJson": "{...}",          # GeoJSON LineString 的 JSON 字符串
  "distance": 128.45,               # 米
  "method": "2opt",                 # 实际使用的算法
  "diagnostics": {"initialDistance": 154.20, "optimizedDistance": 128.45}
}
```

`orderedPoints` 与输入点一一对应，不漏点、不重复；`distance` 为米（数值）。

### 4.4 `generate_sampling_points` 的返回值

签名要求返回 `list[Point]`，但 5 号还需要知道实际用的间距和点数。因此返回值是一个**既是映射、也像列表**的对象：

```python
result = generate_sampling_points(boundary, count=12)

result["points"]        # list[Point]，与签名一致
result["count"]         # 实际点位数
result["spacing"]       # 实际间距（米）
result["strategy"]      # "count" 或 "spacing"
result["boundary"]      # 校验后的边界摘要（area/center/coordinateSystem）
result.points           # 同样可用属性访问
len(result)             # 点位数
[dict(p) for p in result]  # 可直接迭代
json.dumps(dict(result), ensure_ascii=False)   # 可直接序列化
```

兼容性说明：`isinstance(result, list)` 为 `False`。需要严格 `list[Point]` 时用 `result["points"]` 或 `list(result)`。`RouteResult` 与 `partition_and_plan` 的返回值同样是可直接 `json.dumps` 的映射对象。

## 5. 算法能力

| 能力 | 位置 | 说明 |
| --- | --- | --- |
| Point-in-Polygon | `geometry.point_in_boundary` | 射线法，支持多边形孔洞与 MultiPolygon |
| 自动布点 | `sampling.generate_sampling_points` | 局部米制平面上的行式网格，保证点全部落在边界内部；支持按数量或按间距 |
| 蛇形路线 | `routing.route_order("snake")` | 按行蛇形（boustrophedon）遍历，简单可解释，与布点行列天然对齐 |
| 最近邻 | `routing.route_order("nearest")` | 贪心最近邻；支持从 `start_point` 出发 |
| 2-opt | `routing.route_order("2opt")` | 在最近邻解上做 2-opt 局部搜索，**结果保证不劣于初始解** |
| 最近未采样点 | `routing.nearest_unvisited_point` | 导航用：给定当前位置返回最近的未采样点 |
| 三人分区（可选） | `partition.partition_and_plan` | 按质心方位角分区，或按最大分散种子点做均衡分区，每区独立规划路线 |

特殊 `method` 值：

- `"nearest"`、`"2opt"`、`"snake"`：单一算法，`diagnostics.methods` 记录实际算法名。
- `"best"`：依次评估三种算法，`distance` 取最小值，`method` 记录胜出者。
- 未知 method（如 `"genetic"`）明确抛 `AlgorithmParameterError`，**不会暗中切换到别的算法**。
- 也可以传列表：`method=["snake", "nearest", "2opt"]`，返回其中距离最小的那条路线。

## 6. 用法示例

```python
import sys
sys.path.insert(0, "algorithm")        # 或把 algorithm/ 加入 PYTHONPATH

from sampling_algorithm import generate_sampling_points, plan_route

boundary = {
    "type": "Polygon",
    "coordinates": [[[112.100000, 37.100000], [112.130000, 37.100000],
                     [112.130000, 37.120000], [112.100000, 37.120000],
                     [112.100000, 37.100000]]],
}

result = generate_sampling_points(boundary, count=12)
points = result["points"]

route = plan_route(points, start_point={"longitude": 112.1005, "latitude": 37.1005,
                                        "coordinateSystem": "GCJ02"},
                   method="2opt")
print(route["distance"], route["method"], route["diagnostics"])
```

## 7. 运行测试与演示

```bash
# 单元测试（53 项，只用标准库，无第三方依赖）
python algorithm/tests/test_sampling_algorithm.py

# 演示：打印边界信息、布点结果，并比较蛇形 / 最近邻 / 2-opt 的总距离
python algorithm/demo.py
python algorithm/demo.py --count 20 --spacing 400 --json
```

Windows 控制台若是 GBK 代码页，先执行 `set PYTHONIOENCODING=utf-8`（demo 内部也会尝试把输出流切到 UTF-8），否则面积单位 `m²`、`°` 等符号会报编码错误。

## 8. 异常类型

| 异常 | 触发场景 |
| --- | --- |
| `AlgorithmParameterError` | 参数缺失、类型错误、`count`/`spacing` 冲突、未知 method、出现同义替代字段 |
| `BoundaryValidationError` | GeoJSON 类型错误、环未闭合、点数不足、坐标为非法值或越界、面积为零 |
| `CoordinateSystemError` | 坐标系缺失、不在 `GCJ02`/`WGS84`/`BD09` 内、或同一组点坐标系不一致 |
| `EmptyPointSetError` | 点集为空 |
| `SamplingError` | 边界过小、间距过大导致无法在内部分布任何点，或点数不足 |
| `OptimizationError` | 优化过程中出现异常状态（正常输入不会触发） |

## 9. 边界与不做的事

- 不做任何坐标系转换或猜测；调用方给的 `coordinateSystem` 原样透传。
- 不生成 `samplingPointId`：算法生成的新点不带正式 ID，入库后由 A/C 模块生成。
- 不写 REST、不写数据库、不启服务；5 号通过 adapter 调用本模块，不复制算法源码。
- 距离单位统一为米，采用 haversine（地球半径 6371008.8 m）；农田尺度下与椭球模型差异可忽略。
