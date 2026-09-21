"""自动布点：农田边界 → 均匀采样点（全部落在边界内部）。

对外入口 generate_sampling_points(boundary_geojson, count=None, spacing=None)。
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import List, Optional, Sequence, Tuple

from .errors import AlgorithmParameterError, SamplingError
from .geometry import (
    SamplingPoint,
    ValidatedBoundary,
    point_in_boundary,
    points_to_dicts,
    validate_boundary,
)
from .geodesy import local_to_lonlat, radii
from .types import (
    DEFAULT_COORDINATE_SYSTEM,
    call_args,
    normalize_coordinate_system,
    optional_number,
)

#: 单次候选网格枚举允许保留的最大点数。
MAX_CANDIDATES = 200_000

#: 单级候选网格枚举允许访问的最大网格点数（含抽稀前的计数）。
MAX_SCAN_VISITS = 600_000

#: count 搜索过程中允许的累计扫描工作量（跨层级累加）。
MAX_TOTAL_SCAN_WORK = 1_500_000

#: 单条候选网格轴向上的最大步数。
MAX_AXIS_STEPS = 4000

#: count 模式下的点数上限。
MAX_COUNT = 100_000

#: 生成点的默认排序方式。
DEFAULT_ORDER = "snake"
ALLOWED_ORDERS = ("snake", "row", "none")


@dataclass
class SamplingPointsResult:
    """布点结果。既是映射（可直接 json.dumps），也提供属性与迭代访问。

    签名要求返回 list[Point]，用 result["points"] / list(result) 即可取得。
    """

    points: List[SamplingPoint]
    count: int
    spacing: float
    strategy: str
    order: str
    boundary: Optional[dict] = None

    # --- 映射协议 -------------------------------------------------------
    def to_dict(self) -> dict:
        payload = {
            "points": points_to_dicts(self.points),
            "count": self.count,
            "spacing": self.spacing,
            "strategy": self.strategy,
            "order": self.order,
        }
        if self.boundary is not None:
            payload["boundary"] = self.boundary
        return payload

    def keys(self):
        return self.to_dict().keys()

    def get(self, key, default=None):
        return self.to_dict().get(key, default)

    def __getitem__(self, key):
        return self.to_dict()[key]

    def __contains__(self, key) -> bool:
        return key in self.to_dict()

    def __iter__(self):
        return iter(self.points)

    def __len__(self) -> int:
        return len(self.points)

    def to_geojson(self) -> dict:
        """把采样点输出为 GeoJSON FeatureCollection（供前端直接展示）。"""
        features = []
        for index, point in enumerate(self.points):
            properties = {
                "index": index,
                "coordinateSystem": point.coordinateSystem,
            }
            if point.samplingPointId is not None:
                properties["samplingPointId"] = point.samplingPointId
            if point.extra:
                for key, value in point.extra.items():
                    properties.setdefault(key, value)
            features.append(
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [point.longitude, point.latitude],
                    },
                    "properties": properties,
                }
            )
        return {"type": "FeatureCollection", "features": features}


def _scan_grid(
    boundary: ValidatedBoundary,
    spacing: float,
    budget: int,
) -> Tuple[List[Tuple[SamplingPoint, float, float]], bool]:
    """按 spacing 在局部米制平面上扫描候选网格，返回 (落在边界内的点, 是否被预算截断)。

    只对落在边界纬度带内的行做 PIP 判断；网格点数远大于 budget 时按等步长抽稀，
    保证候选点仍然均匀分布在整块农田上，而不是集中在某个角落。
    """
    if spacing <= 0.0:
        raise AlgorithmParameterError(f"spacing 必须为正数，收到 {spacing}")

    lon0, lat0 = boundary.center
    m_per_deg_lat, m_per_deg_lon = radii(lat0)
    min_lon, min_lat, max_lon, max_lat = boundary.bbox
    half_width = (max_lon - min_lon) * m_per_deg_lon / 2.0
    half_height = (max_lat - min_lat) * m_per_deg_lat / 2.0

    steps_x = int(math.floor((2.0 * half_width) / spacing)) + 2
    steps_y = int(math.floor((2.0 * half_height) / spacing)) + 2
    if steps_x < 1 or steps_y < 1:
        raise SamplingError(f"spacing={spacing} 相对边界过大，无法在边境内布点")
    if steps_x > MAX_AXIS_STEPS or steps_y > MAX_AXIS_STEPS:
        raise SamplingError(
            f"spacing={spacing} 相对边界过小：候选网格 {steps_x}×{steps_y} 超过单轴上限 {MAX_AXIS_STEPS}"
        )

    total = steps_x * steps_y
    # 用边界面积占比预估边界内的网格点数，据此选择抽稀步长，避免细网格白算。
    cell = spacing * spacing
    estimated_inside = boundary.area / cell if cell > 0.0 else 0.0
    stride = max(1, total // max(1, budget))
    if estimated_inside > budget:
        stride = max(stride, int(estimated_inside / float(budget)))
    if total // stride > MAX_SCAN_VISITS:
        # 该间距太细，连抽稀后的访问量都超预算：交给调用方按"过细"跳过。
        raise SamplingError(
            f"spacing={spacing} 过细：抽稀后仍需访问 {total // stride} 个网格点，超过上限 {MAX_SCAN_VISITS}"
        )
    start_x = -((steps_x - 1) * spacing) / 2.0
    start_y = -((steps_y - 1) * spacing) / 2.0

    candidates: List[Tuple[SamplingPoint, float, float]] = []
    seen = 0
    for row in range(steps_y):
        y = start_y + row * spacing
        row_lat = lat0 + y / m_per_deg_lat
        if row_lat < min_lat or row_lat > max_lat:
            # 整行都在边界纬度范围之外，直接跳过。
            seen += steps_x
            continue
        for column in range(steps_x):
            seen += 1
            if stride > 1 and seen % stride:
                continue
            x = start_x + column * spacing
            lon, lat = local_to_lonlat(x, y, lon0, lat0)
            if not point_in_boundary((lon, lat), boundary):
                continue
            candidates.append(
                (
                    SamplingPoint(longitude=lon, latitude=lat, coordinateSystem=""),
                    x,
                    y,
                )
            )
    return candidates, stride > 1


def _grid_candidates(
    boundary: ValidatedBoundary,
    spacing: float,
) -> List[Tuple[SamplingPoint, float, float]]:
    """默认预算下的候选网格点（间距过细时会被抽稀）。

    生成点的入口请用 generate_sampling_points；本函数只供内部与调试使用。
    """
    candidates, _ = _scan_grid(boundary, spacing, MAX_CANDIDATES)
    return candidates


def _ordered_snake(
    candidates: Sequence[Tuple[SamplingPoint, float, float]],
) -> List[Tuple[SamplingPoint, float, float]]:
    """按行蛇形排序：行内按 x 递增，相邻行方向相反。"""
    ordered = sorted(candidates, key=lambda item: (-item[2], item[1]))
    rows: List[List[Tuple[SamplingPoint, float, float]]] = []
    for item in ordered:
        if rows and abs(rows[-1][0][2] - item[2]) <= 1e-9:
            rows[-1].append(item)
        else:
            rows.append([item])
    result: List[Tuple[SamplingPoint, float, float]] = []
    for index, row in enumerate(rows):
        row.sort(key=lambda item: item[1], reverse=bool(index % 2))
        result.extend(row)
    return result


def _apply_order(
    candidates: Sequence[Tuple[SamplingPoint, float, float]],
    order: str,
) -> List[Tuple[SamplingPoint, float, float]]:
    if order == "none":
        return list(candidates)
    if order == "row":
        return sorted(candidates, key=lambda item: (-item[2], item[1]))
    return _ordered_snake(candidates)


#: _thin 允许的输入规模上限；超过时先用等步长抽稀，避免 O(n²) 爆炸。
MAX_THIN_INPUT = 20_000


def subsample(
    candidates: Sequence[Tuple[SamplingPoint, float, float]],
    limit: int,
) -> List[Tuple[SamplingPoint, float, float]]:
    """等步长抽稀候选点，保持点在整块农田上均匀分布。"""
    items = list(candidates)
    if limit <= 0 or len(items) <= limit:
        return items
    stride = int(math.ceil(len(items) / float(limit)))
    return items[::stride]


def _thin(
    selected: Sequence[Tuple[SamplingPoint, float, float]],
    target: int,
) -> List[Tuple[SamplingPoint, float, float]]:
    """从网格点中剔除 k 个最"多余"的点：优先去掉与邻居距离最小的点。

    输入过大时先等步长抽稀，既控制计算量，也保持点分布均匀。
    """
    if target >= len(selected):
        return list(selected)
    if target < 1:
        raise SamplingError("目标点数必须至少为 1")
    remaining = list(selected)
    if len(remaining) > MAX_THIN_INPUT:
        remaining = subsample(remaining, max(MAX_THIN_INPUT, 4 * target))
    while len(remaining) > target:
        nearest_gap: List[Tuple[float, int]] = []
        for index, (_, x, y) in enumerate(remaining):
            best = None
            for other_index, (_, ox, oy) in enumerate(remaining):
                if other_index == index:
                    continue
                gap = math.hypot(x - ox, y - oy)
                if best is None or gap < best:
                    best = gap
            nearest_gap.append((best if best is not None else 0.0, index))
        nearest_gap.sort(key=lambda item: (item[0], item[1]))
        del remaining[nearest_gap[0][1]]
    return remaining


def _densify(
    boundary: ValidatedBoundary,
    lon0: float,
    lat0: float,
    spacing: float,
    selected: Sequence[Tuple[SamplingPoint, float, float]],
    target: int,
) -> List[Tuple[SamplingPoint, float, float]]:
    """网格点数不足时，用更细的网格补点：每次挑离已选点最远的候选点。"""
    if target <= len(selected):
        return list(selected)
    needed = target - len(selected)
    extra_candidates: List[Tuple[SamplingPoint, float, float]] = []
    factor = 1.0
    max_rounds = 3
    budget = max(4 * (needed + len(selected)), MAX_CANDIDATES)
    for _ in range(max_rounds):
        factor *= 0.5
        try:
            extra_candidates, truncated = _scan_grid(boundary, spacing * factor, budget)
        except SamplingError:
            continue
        if not truncated and len(extra_candidates) >= needed + len(selected):
            break
    if not extra_candidates:
        raise SamplingError(
            f"无法在边境内生成 {target} 个点：可用候选点不足（边界过小或孔洞过多）"
        )

    chosen = list(selected)
    used = {(round(item[0].longitude, 12), round(item[0].latitude, 12)) for item in chosen}
    min_gaps = [
        min(
            (math.hypot(item[1] - other[1], item[2] - other[2]) for other in chosen),
            default=float("inf"),
        )
        for item in extra_candidates
    ]
    while len(chosen) < target:
        best_index = -1
        best_gap = -1.0
        for index, gap in enumerate(min_gaps):
            if gap <= best_gap:
                continue
            key = (
                round(extra_candidates[index][0].longitude, 12),
                round(extra_candidates[index][0].latitude, 12),
            )
            if key in used:
                continue
            best_gap = gap
            best_index = index
        if best_index < 0:
            raise SamplingError(
                f"无法在边境内生成 {target} 个点：候选点已用尽（边界过小或孔洞过多）"
            )
        picked = extra_candidates[best_index]
        chosen.append(picked)
        used.add(
            (round(picked[0].longitude, 12), round(picked[0].latitude, 12))
        )
        for index, item in enumerate(extra_candidates):
            gap = math.hypot(item[1] - picked[1], item[2] - picked[2])
            if gap < min_gaps[index]:
                min_gaps[index] = gap
    return chosen


def _estimate_spacing(boundary: ValidatedBoundary, count: int) -> float:
    """按面积均分估算初始间距。"""
    spacing = math.sqrt(boundary.area / float(count))
    if spacing <= 0.0 or not math.isfinite(spacing):
        raise SamplingError("无法估算布点间距，请检查边界面积")
    return spacing


def _search_spacing_for_count(
    boundary: ValidatedBoundary,
    count: int,
) -> Tuple[float, List[Tuple[SamplingPoint, float, float]]]:
    """找到能产出 count 个点的合适间距。

    两段式策略：
    1. 常规农田上"间距越大点数越少"成立，先用二分快速命中较大间距（点位更均匀）；
    2. 断开的 MultiPolygon 上该单调性不成立，二分可能落空，此时退化为从粗到细
       逐级扫描，取第一个点数不少于 count 的层级。

    候选枚举带预算（MAX_CANDIDATES / MAX_SCAN_VISITS），因此任何一段都不会失控。
    """
    estimate = _estimate_spacing(boundary, count)

    def try_spacing(spacing: float) -> Optional[List[Tuple[SamplingPoint, float, float]]]:
        try:
            candidates, truncated = _scan_grid(boundary, spacing, MAX_CANDIDATES)
        except SamplingError:
            return None
        if truncated or len(candidates) < count:
            return None
        return candidates

    # 第一段：二分找"点数仍然足够"的最大间距。
    low = estimate / 64.0
    high = estimate * 16.0
    best: Optional[Tuple[float, List[Tuple[SamplingPoint, float, float]]]] = None
    for _ in range(32):
        middle = (low + high) / 2.0
        candidates = try_spacing(middle)
        if candidates is None:
            high = middle
        else:
            best = (middle, candidates)
            low = middle

    # 第二段：二分落空或结果过大时，从粗到细逐级扫描。
    if best is None or len(best[1]) > max(3 * count, count + 50):
        for step in range(-4, 26):
            level_spacing = estimate * (2.0 ** step)
            candidates = try_spacing(level_spacing)
            if candidates is None:
                continue
            if best is None or len(candidates) < len(best[1]):
                best = (level_spacing, candidates)
            if len(candidates) <= max(3 * count, count + 50):
                break

    if best is None:
        raise SamplingError(
            f"无法在边境内生成 {count} 个点：边界过小或孔洞过多，请减小 count 或改用 spacing"
        )

    spacing, selected = best
    if len(selected) > max(3 * count, count + 50):
        # 点数明显偏多：先等步长抽稀到目标量级，再剔除多余的点。
        selected = subsample(selected, max(3 * count, count + 50))
    if len(selected) > count:
        selected = _thin(selected, count)
    if len(selected) < count:
        selected = _densify(
            boundary, boundary.center[0], boundary.center[1], spacing, selected, count
        )
    return spacing, selected


def generate_sampling_points(*args, **kwargs) -> SamplingPointsResult:
    """generate_sampling_points(boundary_geojson, count=None, spacing=None) -> list[Point]

    按数量或按间距在农田边界内部生成较均匀的采样点；点保证落在边界内。

    可选关键字参数：
        coordinate_system: 边界坐标的坐标系（GCJ02 / WGS84 / BD09）。缺省时若
            boundary_geojson 自身带 coordinateSystem 则采用之，否则用 GCJ02 写入输出。
        order: 生成顺序，snake（默认，行式蛇形）/ row / none。

    孔洞区域一律视为不可布点区域（MultiPolygon 的每个多边形同样独立判断）。
    """
    options = call_args(args, kwargs, where="generate_sampling_points")
    boundary_geojson = options.pop("boundary_geojson", None)
    if boundary_geojson is None:
        raise AlgorithmParameterError("generate_sampling_points 缺少 boundary_geojson")

    count_value = options.pop("count", None)
    spacing_value = options.pop("spacing", None)
    coordinate_system = options.pop("coordinate_system", None)
    order = options.pop("order", DEFAULT_ORDER)
    if options:
        raise AlgorithmParameterError(
            f"generate_sampling_points 收到未知参数 {sorted(options)}"
        )

    count = optional_number(count_value, field="count", where="generate_sampling_points")
    spacing = optional_number(spacing_value, field="spacing", where="generate_sampling_points")
    if count is None and spacing is None:
        raise AlgorithmParameterError("generate_sampling_points 必须给出 count 或 spacing 之一")
    if count is not None and spacing is not None:
        raise AlgorithmParameterError("generate_sampling_points 的 count 与 spacing 互斥，只能给一个")
    if count is not None:
        if count != int(count):
            raise AlgorithmParameterError(f"count 必须是整数，收到 {count}")
        count = int(count)
        if count < 1:
            raise AlgorithmParameterError(f"count 必须至少为 1，收到 {count}")
        if count > MAX_COUNT:
            raise AlgorithmParameterError(f"count 超过上限 {MAX_COUNT}")
    if spacing is not None and spacing <= 0.0:
        raise AlgorithmParameterError(f"spacing 必须为正数，收到 {spacing}")

    order_key = str(order).strip().lower()
    if order_key not in ALLOWED_ORDERS:
        raise AlgorithmParameterError(
            f"order 取值为 {order!r}，只允许 {list(ALLOWED_ORDERS)}"
        )

    if coordinate_system is not None:
        coordinate_system = normalize_coordinate_system(coordinate_system)

    boundary = validate_boundary(boundary_geojson, coordinate_system=coordinate_system)
    resolved_system = boundary.coordinateSystem or coordinate_system or DEFAULT_COORDINATE_SYSTEM

    if count is not None:
        strategy = "count"
        used_spacing, selected = _search_spacing_for_count(boundary, count)
    else:
        strategy = "spacing"
        used_spacing = spacing
        selected = None
        # 候选枚举带预算；一旦被预算截断，说明间距过细，宁可明确失败也不能少给点。
        for factor in (1.0, 2.0, 4.0):
            try:
                candidates, truncated = _scan_grid(boundary, spacing * factor, MAX_CANDIDATES)
            except SamplingError:
                continue
            if truncated:
                continue
            selected = candidates
            used_spacing = spacing * factor
            break
        if selected is None:
            raise SamplingError(
                f"spacing={spacing} 米在边境内无法完整枚举候选点：间距过细，"
                "请增大 spacing 或改用 count"
            )
        if not selected:
            raise SamplingError(
                f"spacing={spacing} 米在边境内没有分布任何点；请减小 spacing 或检查边界"
            )

    ordered = _apply_order(selected, order_key)
    points = [
        SamplingPoint(
            longitude=item[0].longitude,
            latitude=item[0].latitude,
            coordinateSystem=resolved_system,
        )
        for item in ordered
    ]

    outside = [point for point in points if not point_in_boundary(point.position(), boundary)]
    if outside:
        raise SamplingError(
            f"内部一致性检查失败：有 {len(outside)} 个生成点落在边界外，已中止输出"
        )

    return SamplingPointsResult(
        points=points,
        count=len(points),
        spacing=round(float(used_spacing), 2),
        strategy=strategy,
        order=order_key,
        boundary=boundary.to_dict(),
    )


__all__ = [
    "SamplingPointsResult",
    "generate_sampling_points",
    "MAX_COUNT",
    "MAX_CANDIDATES",
    "DEFAULT_ORDER",
]
