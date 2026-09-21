"""路线规划：蛇形、最近邻、2-opt，以及导航用的最近未采样点。

对外主入口 plan_route(points, start_point=None, method="2opt") -> RouteResult。
本模块只做排序与距离计算，不做任何坐标系转换。
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Dict, List, Optional, Sequence, Tuple

from .errors import AlgorithmParameterError, OptimizationError
from .geometry import (
    SamplingPoint,
    parse_point,
    parse_points,
    points_to_dicts,
)
from .geodesy import distance_m
from .types import (
    FIELD_COORDINATE_SYSTEM,
    FIELD_LATITUDE,
    FIELD_LONGITUDE,
    call_args,
    dumps,
    normalize_coordinate_system,
    optional_bool,
)

#: 2-opt 候选邻居数量上限（加速用，不改变结果定义）。
TWO_OPT_CANDIDATES = 16

#: 2-opt 最大滑窗轮数，防止极端输入下退化。
TWO_OPT_MAX_SWEEPS = 400

#: 允许的 method 取值。
ALLOWED_METHODS = ("snake", "nearest", "2opt")

#: 评估全部算法并取最优时的 method 取值。
BEST_METHOD = "best"

#: 缺省方法（与接口约束一致）。
DEFAULT_METHOD = "2opt"

_METHOD_ALIASES = {
    "snake": "snake",
    "serpentine": "snake",
    "boustrophedon": "snake",
    "row": "snake",
    "nearest": "nearest",
    "nearestneighbor": "nearest",
    "nn": "nearest",
    "greedy": "nearest",
    "2opt": "2opt",
    "twoopt": "2opt",
    "two_opt": "2opt",
    "2optimum": "2opt",
}


def _distance_matrix(points: Sequence[SamplingPoint]) -> List[List[float]]:
    """预计算点与点之间的距离矩阵（米）。点数过大时由调用方限制。"""
    size = len(points)
    matrix: List[List[float]] = [[0.0] * size for _ in range(size)]
    for i in range(size):
        point_i = points[i]
        row = matrix[i]
        for j in range(i + 1, size):
            point_j = points[j]
            value = distance_m(
                point_i.longitude, point_i.latitude, point_j.longitude, point_j.latitude
            )
            row[j] = value
            matrix[j][i] = value
    return matrix


def route_distance_m(points, order: Sequence[int], *, _parsed: bool = False) -> float:
    """按给定顺序计算路线总长度（米）。points 可以是 dict 列表或 SamplingPoint 列表。"""
    parsed = points if _parsed else parse_points(points, where="points")
    total = 0.0
    for index in range(len(order) - 1):
        total += distance_m(
            parsed[order[index]].longitude,
            parsed[order[index]].latitude,
            parsed[order[index + 1]].longitude,
            parsed[order[index + 1]].latitude,
        )
    return total


def _median_row_height(points: Sequence[SamplingPoint]) -> float:
    """用最近邻距离的中位数估计行高（米）。"""
    size = len(points)
    if size < 2:
        return 0.0
    gaps: List[float] = []
    for i in range(size):
        best = None
        for j in range(size):
            if i == j:
                continue
            gap = distance_m(
                points[i].longitude,
                points[i].latitude,
                points[j].longitude,
                points[j].latitude,
            )
            if best is None or gap < best:
                best = gap
        if best is not None and best > 0.0:
            gaps.append(best)
    if not gaps:
        return 0.0
    gaps.sort()
    middle = len(gaps) // 2
    if len(gaps) % 2 == 1:
        return gaps[middle]
    return 0.5 * (gaps[middle - 1] + gaps[middle])


def _snake_order(points: Sequence[SamplingPoint]) -> List[int]:
    """蛇形（boustrophedon）路线：按行分组，行内按经度排序，相邻行方向相反。"""
    size = len(points)
    if size <= 1:
        return list(range(size))
    by_latitude = sorted(range(size), key=lambda index: (-points[index].latitude, index))
    tolerance = _median_row_height(points) / 2.0
    if tolerance <= 0.0:
        tolerance = 1e-12

    rows: List[List[int]] = []
    anchor: Optional[float] = None
    for index in by_latitude:
        latitude = points[index].latitude
        if anchor is None or abs(latitude - anchor) > tolerance:
            rows.append([index])
            anchor = latitude
        else:
            rows[-1].append(index)

    order: List[int] = []
    for row_index, row in enumerate(rows):
        row.sort(key=lambda index: points[index].longitude, reverse=bool(row_index % 2))
        order.extend(row)
    return order


def _knn_indices(matrix: Sequence[Sequence[float]], point_index: int, size: int) -> List[int]:
    """取某点的最近邻候选下标（按距离升序）。"""
    others = [index for index in range(size) if index != point_index]
    others.sort(key=lambda index: (matrix[point_index][index], index))
    return others[: max(1, min(TWO_OPT_CANDIDATES, len(others)))]


def _two_opt(matrix: Sequence[Sequence[float]], order: Sequence[int]) -> List[int]:
    """2-opt 局部搜索（带最近邻候选剪枝），结果保证不劣于输入顺序。"""
    size = len(order)
    if size < 4:
        return list(order)
    candidates = [_knn_indices(matrix, order[position], size) for position in range(size)]
    tour = list(order)
    sweeps = 0
    while sweeps < TWO_OPT_MAX_SWEEPS:
        improved = False
        for position in range(1, size - 1):
            current = tour[position]
            following = tour[position + 1]
            for candidate in candidates[position]:
                if candidate == current or candidate == following:
                    continue
                neighbor = (candidate + 1) % size
                if neighbor == position or neighbor == current:
                    continue
                gain = (
                    matrix[current][following]
                    + matrix[tour[candidate]][tour[neighbor]]
                    - matrix[current][tour[candidate]]
                    - matrix[following][tour[neighbor]]
                )
                if gain <= 1e-12:
                    continue
                if position < candidate:
                    tour[position + 1 : candidate + 1] = reversed(tour[position + 1 : candidate + 1])
                else:
                    tour[candidate + 1 : position + 1] = reversed(tour[candidate + 1 : position + 1])
                improved = True
                break
            if improved:
                break
        if not improved:
            break
        sweeps += 1
    return tour


def _nearest_order(
    points: Sequence[SamplingPoint],
    matrix: Sequence[Sequence[float]],
    start_index: int,
) -> List[int]:
    """贪心最近邻路线。"""
    size = len(points)
    visited = [False] * size
    order: List[int] = []
    current = start_index
    for _ in range(size):
        visited[current] = True
        order.append(current)
        best: Optional[int] = None
        best_gap = float("inf")
        row = matrix[current]
        for index in range(size):
            if visited[index]:
                continue
            gap = row[index]
            if gap < best_gap:
                best_gap = gap
                best = index
        if best is None:
            break
        current = best
    if len(order) != size:
        raise OptimizationError("最近邻路线构建失败：存在未访问点")
    return order


def _find_position(points: Sequence[SamplingPoint], anchor: SamplingPoint) -> Optional[int]:
    """在点集中定位与 anchor 坐标一致的点：先精确匹配，再按 1e-9 容差匹配。"""
    for index, point in enumerate(points):
        if point.longitude == anchor.longitude and point.latitude == anchor.latitude:
            return index
    for index, point in enumerate(points):
        if (
            abs(point.longitude - anchor.longitude) <= 1e-9
            and abs(point.latitude - anchor.latitude) <= 1e-9
        ):
            return index
    return None


def _rotate_to_nearest(order: Sequence[int], points: Sequence[SamplingPoint], target: int) -> List[int]:
    """把固定顺序旋转到离 target 点最近的位置（保持路线走向不变）。"""
    if not order:
        return []
    best_position = 0
    best_gap = float("inf")
    anchor = points[target]
    for position, index in enumerate(order):
        gap = distance_m(
            anchor.longitude,
            anchor.latitude,
            points[index].longitude,
            points[index].latitude,
        )
        if gap < best_gap:
            best_gap = gap
            best_position = position
    return list(order[best_position:]) + list(order[:best_position])


def route_order(
    points,
    method: str = DEFAULT_METHOD,
    *,
    start_point=None,
    coordinate_system: Optional[str] = None,
    _parsed: bool = False,
) -> List[int]:
    """返回给定算法下的点序号列表（内部与高级用法）。

    method: "snake" / "nearest" / "2opt"；未知取值明确抛参数错误。
    """
    method_key, _ = _normalize_method(method)
    parsed = points if _parsed else parse_points(points, where="points", coordinate_system=coordinate_system)
    size = len(parsed)
    if size == 0:
        return []

    start_index = 0
    if start_point is not None:
        anchor = parse_point(start_point, where="start_point", coordinate_system=coordinate_system)
        position = _find_position(parsed, anchor)
        if position is not None:
            start_index = position

    if method_key == "snake":
        order = _snake_order(parsed)
        if start_point is not None:
            order = _rotate_to_nearest(order, parsed, start_index)
        return order
    if method_key == "nearest":
        matrix = _distance_matrix(parsed)
        return _nearest_order(parsed, matrix, start_index)
    if method_key == "2opt":
        matrix = _distance_matrix(parsed)
        initial = _nearest_order(parsed, matrix, start_index)
        return _two_opt(matrix, initial)
    return _snake_order(parsed)


def _normalize_method(method) -> Tuple[str, bool]:
    """解析 method 参数，返回 (算法名, 是否 best)。"""
    if isinstance(method, bool) or not isinstance(method, str):
        raise AlgorithmParameterError(
            f"method 必须是字符串，收到 {type(method).__name__}；只允许 {list(ALLOWED_METHODS)} 或 best"
        )
    text = method.strip().lower()
    if text == BEST_METHOD:
        return BEST_METHOD, True
    compact = text.replace("-", "").replace("_", "").replace(" ", "")
    if text in _METHOD_ALIASES:
        return _METHOD_ALIASES[text], False
    if compact in _METHOD_ALIASES:
        return _METHOD_ALIASES[compact], False
    raise AlgorithmParameterError(
        f"未知 method {method!r}；只允许 {list(ALLOWED_METHODS)} 或 {BEST_METHOD}，不会暗中切换算法"
    )


def _normalize_methods(method) -> Tuple[List[str], bool]:
    """把 method 参数规范成算法列表，并标记是否处于 best 模式。"""
    if isinstance(method, (list, tuple)):
        if not method:
            raise AlgorithmParameterError("method 列表不能为空")
        resolved: List[str] = []
        for item in method:
            key, is_best = _normalize_method(item)
            if is_best:
                for candidate in ALLOWED_METHODS:
                    if candidate not in resolved:
                        resolved.append(candidate)
            elif key not in resolved:
                resolved.append(key)
        return resolved, len(resolved) > 1
    key, is_best = _normalize_method(method)
    if is_best:
        return list(ALLOWED_METHODS), True
    return [key], False


def _route_geojson(points: Sequence[SamplingPoint], coordinate_system: str, closed: bool) -> dict:
    coordinates = [[point.longitude, point.latitude] for point in points]
    if closed and coordinates:
        coordinates = coordinates + [coordinates[0]]
    return {
        "type": "LineString",
        "coordinates": coordinates,
        "coordinateSystem": coordinate_system,
        "closed": bool(closed and len(points) > 1),
    }


def _build_route_result(
    ordered: Sequence[SamplingPoint],
    *,
    coordinate_system: str,
    real_method: str,
    distance: float,
    baseline_distance: float,
    evaluations: Sequence[dict],
    comparison: Sequence[Tuple[str, float]],
    closed: bool,
    start_point_used: bool,
    requested_method: Optional[str] = None,
    applied: bool = False,
) -> "RouteResult":
    route_geojson = _route_geojson(ordered, coordinate_system, closed)
    baseline = float(baseline_distance)
    current = float(distance)
    if baseline > 0.0:
        improvement = (baseline - current) / baseline * 100.0
    else:
        improvement = 0.0
    result_method = real_method
    if requested_method == "2opt":
        # 显式请求 2-opt 时 method 记为 2opt，是否真正发生交换由 applied 说明。
        result_method = "2opt"
    diagnostics = {
        "initialDistance": round(baseline, 2),
        "optimizedDistance": round(current, 2),
        "improvement": round(improvement, 4),
        "methods": [result_method],
        "method": result_method,
        "realMethod": real_method,
        "applied": bool(applied),
        "evaluations": list(evaluations) if len(evaluations) > 1 else [],
        "comparison": [
            {"method": name, "distance": round(value, 2)} for name, value in comparison
        ],
        "pointCount": len(ordered),
        "coordinateSystem": coordinate_system,
        "startPointUsed": bool(start_point_used),
        "closed": bool(closed and len(ordered) > 1),
        "unit": "meter",
    }
    return RouteResult(
        orderedPoints=list(ordered),
        routeGeoJson=route_geojson,
        distance=round(current, 2),
        method=result_method,
        diagnostics=diagnostics,
    )


@dataclass
class RouteResult:
    """路线规划结果。既是映射（可直接 json.dumps），也提供属性访问。"""

    orderedPoints: List[SamplingPoint]
    routeGeoJson: dict
    distance: float
    method: str
    diagnostics: dict
    baselineDistance: float = 0.0
    improvement: float = 0.0

    def to_dict(self) -> dict:
        return {
            "orderedPoints": points_to_dicts(self.orderedPoints),
            "routeGeoJson": dumps(self.routeGeoJson),
            "distance": self.distance,
            "method": self.method,
            "diagnostics": self.diagnostics,
        }

    # --- 便利访问 -------------------------------------------------------
    def keys(self):
        return self.to_dict().keys()

    def get(self, key, default=None):
        return self.to_dict().get(key, default)

    def __getitem__(self, key):
        return self.to_dict()[key]

    def __contains__(self, key) -> bool:
        return key in self.to_dict()

    def __iter__(self):
        return iter(self.orderedPoints)

    def __len__(self) -> int:
        return len(self.orderedPoints)

    def geojson(self) -> dict:
        """routeGeoJson 的解析结果（dict），省去调用方再次 json.loads。"""
        return self.routeGeoJson

    def coords(self) -> List[List[float]]:
        """路线坐标数组 [[lon, lat], ...]。"""
        return [list(pair) for pair in self.routeGeoJson.get("coordinates", [])]


def plan_route(*args, **kwargs) -> RouteResult:
    """plan_route(points, start_point=None, method="2opt") -> RouteResult

    对采样点做路线规划，返回不漏点、不重复的有序路线。

    可选关键字参数：
        coordinate_system: 点集的坐标系（应与点位自身一致）。
        closed: 是否把 routeGeoJson 画成闭合环线（默认 False）。
    """
    options = call_args(args, kwargs, where="plan_route")
    points_value = options.pop("points", None)
    if points_value is None:
        raise AlgorithmParameterError("plan_route 缺少 points")

    start_value = options.pop("start_point", None)
    method_value = options.pop("method", DEFAULT_METHOD)
    coordinate_system = options.pop("coordinate_system", None)
    closed = optional_bool(options.pop("closed", None), field="closed", where="plan_route")
    if options:
        raise AlgorithmParameterError(f"plan_route 收到未知参数 {sorted(options)}")

    if coordinate_system is not None:
        coordinate_system = normalize_coordinate_system(coordinate_system)
    methods, is_best = _normalize_methods(method_value)

    parsed = parse_points(points_value, where="points", coordinate_system=coordinate_system)
    size = len(parsed)
    resolved_system = coordinate_system or (parsed[0].coordinateSystem if parsed else "")
    if not resolved_system:
        resolved_system = "GCJ02"

    anchor: Optional[SamplingPoint] = None
    anchor_index: Optional[int] = None
    if start_value is not None:
        anchor = parse_point(start_value, where="start_point", coordinate_system=coordinate_system)
        if parsed and anchor.coordinateSystem != parsed[0].coordinateSystem:
            raise AlgorithmParameterError(
                "start_point 的 coordinateSystem="
                f"{anchor.coordinateSystem} 与 points 的 {parsed[0].coordinateSystem} 不一致"
            )
        anchor_index = _find_position(parsed, anchor)

    if size == 0:
        empty = _build_route_result(
            [],
            coordinate_system=resolved_system,
            real_method=methods[0],
            distance=0.0,
            baseline_distance=0.0,
            evaluations=[],
            comparison=[],
            closed=closed,
            start_point_used=False,
            requested_method=methods[0],
            applied=False,
        )
        if anchor is not None:
            empty.orderedPoints = [anchor]
            empty.routeGeoJson = _route_geojson([anchor], resolved_system, closed)
            empty.diagnostics["pointCount"] = 1
        return empty

    sequence_distance = route_distance_m(parsed, list(range(size)), _parsed=True)
    baseline_distance = route_distance_m(parsed, _snake_order(parsed), _parsed=True)

    if size > 1:
        matrix = _distance_matrix(parsed)
        start_index = 0
        if anchor_index is not None:
            start_index = anchor_index
        nearest_initial = _nearest_order(parsed, matrix, start_index)
        nearest_distance = route_distance_m(parsed, nearest_initial, _parsed=True)
        snake_initial = _snake_order(parsed)
        if anchor_index is not None:
            snake_initial = _rotate_to_nearest(snake_initial, parsed, start_index)
        snake_distance = route_distance_m(parsed, snake_initial, _parsed=True)

        evaluations: List[dict] = []
        orders: Dict[str, List[int]] = {}
        distances: Dict[str, float] = {}
        initial_map: Dict[str, float] = {}
        real_map: Dict[str, str] = {}
        applied_map: Dict[str, bool] = {}

        for name in methods:
            if name == "snake":
                order = snake_initial
                initial_value = snake_distance
                real_name = "snake"
                applied = False
            elif name == "nearest":
                order = nearest_initial
                initial_value = nearest_distance
                real_name = "nearest"
                applied = False
            else:
                optimized = _two_opt(matrix, nearest_initial)
                optimized_distance = route_distance_m(parsed, optimized, _parsed=True)
                applied = bool(optimized != nearest_initial)
                if optimized_distance <= nearest_distance + 1e-9:
                    order = optimized
                    real_name = "2opt"
                else:
                    order = nearest_initial
                    real_name = "nearest"
                initial_value = nearest_distance
            value = route_distance_m(parsed, order, _parsed=True)
            orders[name] = order
            distances[name] = value
            initial_map[name] = initial_value
            real_map[name] = real_name
            applied_map[name] = applied
            evaluations.append(
                {
                    "method": name,
                    "realMethod": real_name,
                    "initialDistance": round(initial_value, 2),
                    "distance": round(value, 2),
                    "applied": applied,
                }
            )

        best_name = min(methods, key=lambda name: (distances[name], methods.index(name)))
        chosen = orders[best_name]
        chosen_distance = distances[best_name]
        if "2opt" in methods:
            two_opt_distance = distances["2opt"]
            if two_opt_distance > nearest_distance + 1e-9:
                raise OptimizationError(
                    f"内部一致性检查失败：2-opt 结果 {two_opt_distance:.2f}m "
                    f"劣于最近邻 {nearest_distance:.2f}m，已中止输出"
                )
        chosen_method = best_name if is_best else methods[0]
        applied = applied_map.get(chosen_method, False)
        comparison = [(name, distances[name]) for name in methods]
    else:
        chosen = [0]
        chosen_distance = 0.0
        evaluation = {
            "method": methods[0],
            "realMethod": methods[0],
            "initialDistance": 0.0,
            "distance": 0.0,
            "applied": False,
        }
        evaluations = [evaluation]
        comparison = [(methods[0], 0.0)]
        real_map = {methods[0]: methods[0]}
        chosen_method = methods[0]
        applied = False

    ordered: List[SamplingPoint] = []
    start_point_used = False
    anchor_added = False
    if anchor is not None:
        if anchor_index is None:
            # 起点不在点集里：作为新起点加入，输入点一个不少。
            ordered.append(anchor)
            start_point_used = True
            anchor_added = True
        elif anchor_index in chosen:
            offset = chosen.index(anchor_index)
            if offset > 0:
                chosen = chosen[offset:] + chosen[:offset]
            start_point_used = True
    ordered.extend(parsed[index] for index in chosen)

    # 输入点必须一个不少；仅当起点不在点集内时，结果才会多出 1 个点。
    expected_size = size + (1 if anchor_added else 0)
    if len(ordered) != expected_size or len(set(chosen)) != size:
        raise OptimizationError("内部一致性检查失败：路线点数与输入点数不匹配")

    result = _build_route_result(
        ordered,
        coordinate_system=resolved_system,
        real_method=real_map.get(chosen_method, chosen_method),
        distance=chosen_distance,
        baseline_distance=baseline_distance,
        evaluations=evaluations,
        comparison=comparison,
        closed=closed,
        start_point_used=start_point_used,
        requested_method=chosen_method,
        applied=applied,
    )
    result.baselineDistance = round(sequence_distance, 2)
    result.improvement = round(
        ((sequence_distance - chosen_distance) / sequence_distance * 100.0)
        if sequence_distance > 0.0
        else 0.0,
        4,
    )
    result.diagnostics["sequenceDistance"] = result.baselineDistance
    result.diagnostics["sequenceImprovement"] = result.improvement
    return result


def nearest_unvisited_point(
    points,
    current_point,
    coordinate_system: Optional[str] = None,
    exclude=None,
) -> Optional[dict]:
    """返回离当前位置最近的未采样点（导航用）。

    exclude: 已采样点的下标集合或采样点 ID 集合；不在集合内的点才参与选择。
    没有任何可用点时返回 None。
    """
    parsed = parse_points(points, where="points", coordinate_system=coordinate_system)
    if not parsed:
        return None
    current = parse_point(current_point, where="current_point", coordinate_system=coordinate_system)
    if parsed and current.coordinateSystem != parsed[0].coordinateSystem:
        raise AlgorithmParameterError(
            "current_point 的 coordinateSystem="
            f"{current.coordinateSystem} 与 points 的 {parsed[0].coordinateSystem} 不一致"
        )

    excluded_indexes = set()
    excluded_ids = set()
    if exclude is not None:
        if isinstance(exclude, (str, bytes)):
            excluded_ids.add(exclude)
        else:
            try:
                items = list(exclude)
            except TypeError:
                raise AlgorithmParameterError(
                    "exclude 必须是可迭代的下标集合或采样点 ID 集合"
                ) from None
            for item in items:
                if isinstance(item, bool):
                    raise AlgorithmParameterError("exclude 中的下标不能是布尔值")
                if isinstance(item, int):
                    excluded_indexes.add(item)
                elif isinstance(item, str):
                    excluded_ids.add(item)
                else:
                    raise AlgorithmParameterError(
                        f"exclude 只接受 int 下标或 str 采样点 ID，收到 {type(item).__name__}"
                    )

    best_point: Optional[SamplingPoint] = None
    best_distance = float("inf")
    for index, point in enumerate(parsed):
        if index in excluded_indexes:
            continue
        if point.samplingPointId is not None and point.samplingPointId in excluded_ids:
            continue
        gap = distance_m(
            current.longitude, current.latitude, point.longitude, point.latitude
        )
        if gap < best_distance:
            best_distance = gap
            best_point = point
    if best_point is None:
        return None
    payload = best_point.to_dict()
    payload["distance"] = round(best_distance, 2)
    return payload


__all__ = [
    "RouteResult",
    "plan_route",
    "route_order",
    "route_distance_m",
    "nearest_unvisited_point",
    "ALLOWED_METHODS",
    "BEST_METHOD",
    "DEFAULT_METHOD",
]
