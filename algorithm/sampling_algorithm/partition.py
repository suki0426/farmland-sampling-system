"""可选的加分项：把采样点分给多个采样员，并分别规划路线。

对外主入口 partition_and_plan(points, boundary_geojson=None, partitions=3,
method="2opt", start_points=None)。
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import List, Optional, Sequence

from .errors import AlgorithmParameterError, EmptyPointSetError
from .geometry import (
    SamplingPoint,
    parse_point,
    parse_points,
    points_to_dicts,
    validate_boundary,
)
from .geodesy import distance_m, lonlat_to_local
from .routing import RouteResult, plan_route
from .types import (
    call_args,
    dumps,
    normalize_coordinate_system,
)

#: 可用的分区方式。
ALLOWED_METHODS = ("angular", "balanced")

#: 默认分区方式。
DEFAULT_METHOD = "balanced"

#: 分区数量上限（演示场景为 3 人）。
MAX_PARTITIONS = 8


@dataclass
class PartitionResult:
    """多人分区规划结果。既是映射（可直接 json.dumps），也提供属性访问。"""

    partitions: List[RouteResult]
    plan: dict
    coordinateSystem: str

    def to_dict(self) -> dict:
        routes = [route.to_dict() for route in self.partitions]
        plan = dict(self.plan)
        plan["routes"] = routes
        plan["coordinateSystem"] = self.coordinateSystem
        plan["partitionCount"] = len(self.partitions)
        plan["distances"] = [route.distance for route in self.partitions]
        plan["totalDistance"] = round(sum(route.distance for route in self.partitions), 2)
        plan["pointCounts"] = [len(route.orderedPoints) for route in self.partitions]
        return {
            "plan": plan,
            "partitions": [
                {
                    "index": index,
                    "pointCount": len(route.orderedPoints),
                    "distance": route.distance,
                    "method": route.method,
                    "orderedPoints": points_to_dicts(route.orderedPoints),
                    "routeGeoJson": dumps(route.routeGeoJson),
                    "diagnostics": route.diagnostics,
                }
                for index, route in enumerate(self.partitions)
            ],
            "routeGeoJson": plan.get("routeGeoJson", {}),
        }

    # --- 映射协议 -------------------------------------------------------
    def keys(self):
        return self.to_dict().keys()

    def get(self, key, default=None):
        return self.to_dict().get(key, default)

    def __getitem__(self, key):
        return self.to_dict()[key]

    def __contains__(self, key) -> bool:
        return key in self.to_dict()

    def __iter__(self):
        return iter(self.partitions)

    def __len__(self) -> int:
        return len(self.partitions)


def _spread_seeds(points: Sequence[SamplingPoint], count: int) -> List[int]:
    """贪心挑选互相距离最远的 count 个点作为种子。"""
    size = len(points)
    seeds = [0]
    while len(seeds) < count and len(seeds) < size:
        best_index = -1
        best_metric = -1.0
        for index in range(size):
            if index in seeds:
                continue
            nearest = min(
                distance_m(
                    points[index].longitude,
                    points[index].latitude,
                    points[seed].longitude,
                    points[seed].latitude,
                )
                for seed in seeds
            )
            if nearest > best_metric:
                best_metric = nearest
                best_index = index
        if best_index < 0:
            break
        seeds.append(best_index)
    return seeds


def _seed_distances(points: Sequence[SamplingPoint], seed: int) -> List[float]:
    return [
        distance_m(
            points[index].longitude,
            points[index].latitude,
            points[seed].longitude,
            points[seed].latitude,
        )
        for index in range(len(points))
    ]


def _balanced_partition(points: Sequence[SamplingPoint], partitions: int) -> List[List[int]]:
    """按最大分散种子点做均衡贪心分区：优先保证各分区点数均衡。"""
    size = len(points)
    seeds = _spread_seeds(points, partitions)
    if len(seeds) < partitions:
        raise AlgorithmParameterError(
            f"点数 {size} 少于分区数 {partitions}，无法为每人分配至少一个点"
        )
    per_partition = [size // partitions] * partitions
    for index in range(size % partitions):
        per_partition[index] += 1

    metric_columns = [_seed_distances(points, seed) for seed in seeds]
    buckets: List[List[int]] = [[seed] for seed in seeds]
    assigned = {seed: position for position, seed in enumerate(seeds)}

    for index in range(size):
        if index in assigned:
            continue
        open_slots = [slot for slot in range(partitions) if len(buckets[slot]) < per_partition[slot]]
        if not open_slots:
            open_slots = list(range(partitions))
        best_slot = open_slots[0]
        best_rank = None
        for slot in open_slots:
            rank = (metric_columns[slot][index], len(buckets[slot]), slot)
            if best_rank is None or rank < best_rank:
                best_rank = rank
                best_slot = slot
        buckets[best_slot].append(index)

    for bucket in buckets:
        bucket.sort()
    return buckets


def _angular_partition(
    points: Sequence[SamplingPoint],
    partitions: int,
    center,
) -> List[List[int]]:
    """按质心方位角把四周均分成扇形，每个采样员负责一个扇区。"""
    lon0, lat0 = center
    buckets: List[List[int]] = [[] for _ in range(partitions)]
    for index, point in enumerate(points):
        x, y = lonlat_to_local(point.longitude, point.latitude, lon0, lat0)
        angle = math.atan2(y, x)
        if angle < 0.0:
            angle += 2.0 * math.pi
        slot = int(angle / (2.0 * math.pi) * partitions) % partitions
        buckets[slot].append(index)
    for bucket in buckets:
        bucket.sort()
    return buckets


def _boundary_center(boundary_geojson, coordinate_system: Optional[str]):
    from .geometry import validate_boundary

    boundary = validate_boundary(boundary_geojson, coordinate_system=coordinate_system)
    return boundary.center, boundary


def _route_geojson_collection(
    partners: Sequence[RouteResult],
    coordinate_system: str,
    seeds: Sequence[SamplingPoint],
) -> dict:
    features = []
    for index, route in enumerate(partners):
        properties = {
            "partitionIndex": index,
            "distance": route.distance,
            "method": route.method,
            "pointCount": len(route.orderedPoints),
            "coordinateSystem": coordinate_system,
        }
        if index < len(seeds):
            properties["seed"] = {
                "longitude": seeds[index].longitude,
                "latitude": seeds[index].latitude,
            }
        features.append(
            {
                "type": "Feature",
                "geometry": route.routeGeoJson,
                "properties": properties,
            }
        )
    return {"type": "FeatureCollection", "features": features}


def partition_and_plan(*args, **kwargs) -> PartitionResult:
    """partition_and_plan(points, boundary_geojson=None, partitions=3,
    method="2opt", start_points=None) -> PartitionResult

    把采样点分给多个采样员，并对每个分区分别规划路线。

    可选关键字参数：
        coordinate_system、closed 会透传给 plan_route；
        partition_method: "balanced"（默认，均衡且就近）或 "angular"（按质心方位角）。
    """
    options = call_args(args, kwargs, where="partition_and_plan")
    points_value = options.pop("points", None)
    if points_value is None:
        raise AlgorithmParameterError("partition_and_plan 缺少 points")
    boundary_geojson = options.pop("boundary_geojson", None)
    partitions_value = options.pop("partitions", 3)
    method_value = options.pop("method", "2opt")
    start_points_value = options.pop("start_points", None)
    coordinate_system = options.pop("coordinate_system", None)
    closed = options.pop("closed", False)
    partition_method = options.pop("partition_method", DEFAULT_METHOD)
    if options:
        raise AlgorithmParameterError(f"partition_and_plan 收到未知参数 {sorted(options)}")

    if coordinate_system is not None:
        coordinate_system = normalize_coordinate_system(coordinate_system)
    if isinstance(partitions_value, bool) or not isinstance(partitions_value, int):
        raise AlgorithmParameterError(
            f"partitions 必须是整数，收到 {type(partitions_value).__name__}"
        )
    if partitions_value < 2:
        raise AlgorithmParameterError(f"partitions 至少为 2，收到 {partitions_value}")
    if partitions_value > MAX_PARTITIONS:
        raise AlgorithmParameterError(f"partitions 超过上限 {MAX_PARTITIONS}")

    partition_key = str(partition_method).strip().lower()
    if partition_key not in ALLOWED_METHODS:
        raise AlgorithmParameterError(
            f"partition_method 取值为 {partition_method!r}，只允许 {list(ALLOWED_METHODS)}"
        )

    points = parse_points(points_value, where="points", coordinate_system=coordinate_system)
    if not points:
        raise EmptyPointSetError("partition_and_plan 的 points 不能为空")

    resolved_system = coordinate_system or points[0].coordinateSystem

    center: Optional[tuple] = None
    boundary = None
    if boundary_geojson is not None:
        center, boundary = _boundary_center(boundary_geojson, coordinate_system)
    else:
        lon_sum = sum(point.longitude for point in points) / len(points)
        lat_sum = sum(point.latitude for point in points) / len(points)
        center = (lon_sum, lat_sum)

    if partition_key == "angular":
        buckets = _angular_partition(points, partitions_value, center)
    else:
        buckets = _balanced_partition(points, partitions_value)

    start_points: List[Optional[SamplingPoint]] = [None] * partitions_value
    if start_points_value is not None:
        if isinstance(start_points_value, (str, bytes)) or not isinstance(
            start_points_value, (list, tuple)
        ):
            raise AlgorithmParameterError("start_points 必须是坐标数组")
        if len(start_points_value) != partitions_value:
            raise AlgorithmParameterError(
                f"start_points 需要 {partitions_value} 个，收到 {len(start_points_value)} 个"
            )
        for index, raw in enumerate(start_points_value):
            start_points[index] = parse_point(
                raw, where=f"start_points[{index}]", coordinate_system=coordinate_system
            )

    routes: List[RouteResult] = []
    seeds: List[SamplingPoint] = []
    assignment: List[int] = [0] * len(points)
    for bucket_index, bucket in enumerate(buckets):
        for index in bucket:
            assignment[index] = bucket_index
        seed_index = bucket[0] if bucket else 0
        seeds.append(points[seed_index])
        routes.append(
            plan_route(
                [points[index] for index in bucket],
                start_point=start_points[bucket_index],
                method=method_value,
                coordinate_system=resolved_system,
                closed=closed,
            )
        )

    assigned_total = sum(len(bucket) for bucket in buckets)
    if assigned_total != len(points):
        raise AlgorithmParameterError(
            f"内部分区校验失败：{assigned_total} 个点被分配，实际 {len(points)} 个"
        )

    plan = {
        "partitionMethod": partition_key,
        "partitionCount": partitions_value,
        "method": method_value,
        "center": {
            "longitude": center[0],
            "latitude": center[1],
            "coordinateSystem": resolved_system,
        },
        "partitionSizes": [len(bucket) for bucket in buckets],
        "seeds": points_to_dicts(seeds),
        "boundary": boundary.to_dict() if boundary is not None else None,
        "routeGeoJson": _route_geojson_collection(routes, resolved_system, seeds),
        "assignment": assignment,
    }
    return PartitionResult(partitions=routes, plan=plan, coordinateSystem=resolved_system)


__all__ = [
    "PartitionResult",
    "partition_and_plan",
    "ALLOWED_METHODS",
    "DEFAULT_METHOD",
    "MAX_PARTITIONS",
]
