"""3 号算法模块公共入口。

固定交付签名（与《第12课题五人岗位字段与公共接口约束 V2.1》5.1 节一致，不得改动）：

    generate_sampling_points(boundary_geojson, count=None, spacing=None) -> list[Point]
    plan_route(points, start_point=None, method="2opt") -> RouteResult

辅助入口：

    nearest_unvisited_point(points, current_point, ...)
    partition_and_plan(points, boundary_geojson=None, partitions=3, ...)

本模块只接收和返回普通 dict / list，不启动服务、不连接数据库、不操作地图 UI。
"""

from __future__ import annotations

from .errors import (
    AlgorithmError,
    AlgorithmParameterError,
    BoundaryValidationError,
    CoordinateSystemError,
    EmptyPointSetError,
    OptimizationError,
    SamplingError,
)
from .geometry import (
    SamplingPoint,
    ValidatedBoundary,
    parse_point,
    parse_points,
    point_in_boundary,
    point_in_polygon,
    point_in_ring,
    points_in_boundary,
    points_to_dicts,
    validate_boundary,
)
from .geodesy import distance_m, local_to_lonlat, lonlat_to_local, parse_dms, radii
from .partition import PartitionResult, partition_and_plan
from .routing import (
    ALLOWED_METHODS,
    BEST_METHOD,
    DEFAULT_METHOD,
    RouteResult,
    nearest_unvisited_point,
    plan_route,
    route_distance_m,
    route_order,
)
from .sampling import SamplingPointsResult, generate_sampling_points
from .types import (
    COORDINATE_SYSTEMS,
    FIELD_COORDINATE_SYSTEM,
    FIELD_LATITUDE,
    FIELD_LONGITUDE,
    FIELD_SAMPLING_POINT_ID,
    normalize_coordinate_system,
)

__version__ = "1.0.0"

__all__ = [
    # 固定入口
    "generate_sampling_points",
    "plan_route",
    # 辅助入口
    "nearest_unvisited_point",
    "partition_and_plan",
    "route_order",
    "route_distance_m",
    # 结果对象
    "SamplingPointsResult",
    "RouteResult",
    "PartitionResult",
    # 数据结构与几何
    "SamplingPoint",
    "ValidatedBoundary",
    "validate_boundary",
    "point_in_boundary",
    "point_in_polygon",
    "point_in_ring",
    "points_in_boundary",
    "parse_point",
    "parse_points",
    "points_to_dicts",
    # 公共字段与坐标系
    "FIELD_LONGITUDE",
    "FIELD_LATITUDE",
    "FIELD_COORDINATE_SYSTEM",
    "FIELD_SAMPLING_POINT_ID",
    "COORDINATE_SYSTEMS",
    "normalize_coordinate_system",
    # 常量
    "ALLOWED_METHODS",
    "BEST_METHOD",
    "DEFAULT_METHOD",
    # 测地工具
    "distance_m",
    "radii",
    "lonlat_to_local",
    "local_to_lonlat",
    "parse_dms",
    # 异常
    "AlgorithmError",
    "AlgorithmParameterError",
    "BoundaryValidationError",
    "CoordinateSystemError",
    "EmptyPointSetError",
    "SamplingError",
    "OptimizationError",
    "__version__",
]
