"""GeoJSON 边界校验与 Point-in-Polygon。

对外只暴露 dict / list 结构，不引入 shapely 等第三方依赖。
"""

from __future__ import annotations

import math
from collections.abc import Mapping
from dataclasses import dataclass
from typing import List, Optional, Sequence, Tuple

from .errors import (
    AlgorithmParameterError,
    BoundaryValidationError,
    CoordinateSystemError,
)
from .geodesy import polygon_area_m2
from .types import (
    FIELD_COORDINATE_SYSTEM,
    FIELD_LATITUDE,
    FIELD_LONGITUDE,
    FIELD_SAMPLING_POINT_ID,
    LATITUDE_RANGE,
    LONGITUDE_RANGE,
    check_field_aliases,
    normalize_coordinate_system,
    to_float,
)

Position = Tuple[float, float]
Ring = List[Position]

#: 边界经纬跨度上限（度）。农田尺度远小于该值，超出通常说明数据本身有问题。
MAX_BOUNDARY_SPAN_DEGREES = 20.0

#: 判定环闭合的容差（度）。
RING_CLOSE_TOLERANCE = 1e-7


@dataclass(frozen=True)
class SamplingPoint:
    """一个采样点/坐标点。额外字段原样保留，不会被丢弃。"""

    longitude: float
    latitude: float
    coordinateSystem: str
    samplingPointId: Optional[str] = None
    extra: Optional[dict] = None

    def to_dict(self) -> dict:
        payload = {
            FIELD_LONGITUDE: self.longitude,
            FIELD_LATITUDE: self.latitude,
            FIELD_COORDINATE_SYSTEM: self.coordinateSystem,
        }
        if self.samplingPointId is not None:
            payload[FIELD_SAMPLING_POINT_ID] = self.samplingPointId
        if self.extra:
            for key, value in self.extra.items():
                payload.setdefault(key, value)
        return payload

    def position(self) -> Position:
        return (self.longitude, self.latitude)


@dataclass(frozen=True)
class ValidatedBoundary:
    """校验通过的农田边界。camelCase 字段用于对外输出。"""

    coordinateSystem: str
    polygons: List[List[Ring]]
    rings: List[Ring]
    bbox: Tuple[float, float, float, float]
    area: float
    center: Position
    pointCount: int

    def rings_of(self, polygon_index: int) -> List[Ring]:
        return self.polygons[polygon_index]

    def to_dict(self) -> dict:
        return {
            "coordinateSystem": self.coordinateSystem,
            "type": "MultiPolygon" if len(self.polygons) > 1 else "Polygon",
            "polygonCount": len(self.polygons),
            "ringCount": len(self.rings),
            "area": round(self.area, 2),
            "center": {
                FIELD_LONGITUDE: self.center[0],
                FIELD_LATITUDE: self.center[1],
                FIELD_COORDINATE_SYSTEM: self.coordinateSystem,
            },
            "bbox": {
                "minLongitude": self.bbox[0],
                "minLatitude": self.bbox[1],
                "maxLongitude": self.bbox[2],
                "maxLatitude": self.bbox[3],
            },
            "pointCount": self.pointCount,
        }


def _format_position(position) -> str:
    return f"({position[0]:.7f}, {position[1]:.7f})"


def _parse_position(raw, *, where: str) -> Position:
    if isinstance(raw, (str, bytes)) or not isinstance(raw, Sequence):
        raise BoundaryValidationError(f"{where} 的坐标必须是 [经度, 纬度] 数组")
    if len(raw) < 2:
        raise BoundaryValidationError(f"{where} 的坐标至少需要 2 个数值，收到 {list(raw)!r}")
    try:
        lon = to_float(raw[0], field="经度", where=where)
        lat = to_float(raw[1], field="纬度", where=where)
    except AlgorithmParameterError as exc:
        raise BoundaryValidationError(str(exc)) from exc
    lon_min, lon_max = LONGITUDE_RANGE
    lat_min, lat_max = LATITUDE_RANGE
    if not (lon_min <= lon <= lon_max):
        raise BoundaryValidationError(
            f"{where} 的经度 {lon} 超出 [{lon_min}, {lon_max}]；"
            "GeoJSON 坐标顺序必须是 [经度, 纬度]，不允许静默修正"
        )
    if not (lat_min <= lat <= lat_max):
        raise BoundaryValidationError(
            f"{where} 的纬度 {lat} 超出 [{lat_min}, {lat_max}]"
        )
    return (lon, lat)


def _parse_ring(raw_ring, *, where: str) -> Ring:
    if isinstance(raw_ring, (str, bytes)) or not isinstance(raw_ring, Sequence):
        raise BoundaryValidationError(f"{where} 必须是坐标数组")
    ring = [
        _parse_position(position, where=f"{where}[{index}]")
        for index, position in enumerate(raw_ring)
    ]
    return _check_ring(ring, where=where)


def _check_ring(ring: Ring, *, where: str) -> Ring:
    if len(ring) < 4:
        raise BoundaryValidationError(
            f"{where} 至少需要 4 个坐标点（含闭合点），当前 {len(ring)} 个"
        )
    first, last = ring[0], ring[-1]
    if abs(first[0] - last[0]) > RING_CLOSE_TOLERANCE or abs(first[1] - last[1]) > RING_CLOSE_TOLERANCE:
        raise BoundaryValidationError(
            f"{where} 未闭合：首点 {_format_position(first)} 与末点 {_format_position(last)} 不一致；"
            "GeoJSON 环要求首尾坐标完全相同"
        )
    return ring


def _parse_polygon(raw_polygon, *, where: str) -> List[Ring]:
    if isinstance(raw_polygon, (str, bytes)) or not isinstance(raw_polygon, Sequence):
        raise BoundaryValidationError(f"{where} 必须是环数组")
    if len(raw_polygon) == 0:
        raise BoundaryValidationError(f"{where} 不能为空")
    rings = [
        _parse_ring(ring, where=f"{where}[{index}]")
        for index, ring in enumerate(raw_polygon)
    ]
    return rings


def _extract_polygons(geojson, *, depth: int = 0) -> List[List[Ring]]:
    if depth > 4:
        raise BoundaryValidationError("GeoJSON 嵌套层级过深，无法解析")
    if isinstance(geojson, Mapping):
        geo_type = geojson.get("type")
        if geo_type == "Feature":
            geometry = geojson.get("geometry")
            if geometry is None:
                raise BoundaryValidationError("GeoJSON Feature 缺少 geometry")
            return _extract_polygons(geometry, depth=depth + 1)
        if geo_type == "FeatureCollection":
            features = geojson.get("features")
            if not isinstance(features, Sequence) or isinstance(features, (str, bytes)) or not features:
                raise BoundaryValidationError("GeoJSON FeatureCollection 的 features 必须是非空数组")
            polygons: List[List[Ring]] = []
            for index, feature in enumerate(features):
                polygons.extend(_extract_polygons(feature, depth=depth + 1))
            return polygons
        if geo_type == "Polygon":
            coordinates = geojson.get("coordinates")
            return [_parse_polygon(coordinates, where="Polygon.coordinates")]
        if geo_type == "MultiPolygon":
            coordinates = geojson.get("coordinates")
            if isinstance(coordinates, (str, bytes)) or not isinstance(coordinates, Sequence) or not coordinates:
                raise BoundaryValidationError("MultiPolygon.coordinates 必须是非空数组")
            return [
                _parse_polygon(polygon, where=f"MultiPolygon.coordinates[{index}]")
                for index, polygon in enumerate(coordinates)
            ]
        raise BoundaryValidationError(
            f"不支持的 GeoJSON 类型 {geo_type!r}；只接受 Polygon、MultiPolygon、Feature、FeatureCollection"
        )
    raise BoundaryValidationError(
        f"boundary_geojson 必须是 GeoJSON 映射对象，收到 {type(geojson).__name__}"
    )


def _normalize_coordinate_system_option(value, *, where: str) -> Optional[str]:
    if value is None:
        return None
    return normalize_coordinate_system(value, field=f"{where} 的 coordinateSystem")


def validate_boundary(
    boundary_geojson,
    *,
    coordinate_system: Optional[str] = None,
    max_span_degrees: float = MAX_BOUNDARY_SPAN_DEGREES,
) -> ValidatedBoundary:
    """校验农田边界并返回边界摘要。不合法直接抛 BoundaryValidationError。"""
    if not isinstance(boundary_geojson, Mapping):
        raise AlgorithmParameterError(
            "boundary_geojson 必须是 GeoJSON dict；"
            f"收到 {type(boundary_geojson).__name__}"
        )
    polygons = _extract_polygons(boundary_geojson)
    if not polygons:
        raise BoundaryValidationError("boundary_geojson 未解析出任何多边形")

    rings = [ring for polygon in polygons for ring in polygon]
    lons = [position[0] for ring in rings for position in ring]
    lats = [position[1] for ring in rings for position in ring]
    bbox = (min(lons), min(lats), max(lons), max(lats))
    span_lon = bbox[2] - bbox[0]
    span_lat = bbox[3] - bbox[1]
    if span_lon > max_span_degrees or span_lat > max_span_degrees:
        raise BoundaryValidationError(
            f"边界跨度 {span_lon:.3f}° × {span_lat:.3f}° 超过上限 {max_span_degrees}°；"
            "本模块面向农田尺度，超大面积请先切分"
        )

    center = _ring_center(rings[0])
    area = polygon_area_m2(rings, center[1])
    if area <= 0.0:
        raise BoundaryValidationError("边界面积为 0，无法布点；请检查外环坐标顺序与取值")

    geo_option = boundary_geojson.get(FIELD_COORDINATE_SYSTEM) if isinstance(boundary_geojson, Mapping) else None
    requested = _normalize_coordinate_system_option(coordinate_system, where="参数")
    boundary_geo = _normalize_coordinate_system_option(geo_option, where="boundary_geojson")
    if requested and boundary_geo and requested != boundary_geo:
        raise CoordinateSystemError(
            f"boundary_geojson 的 coordinateSystem={boundary_geo} 与参数 coordinate_system={requested} 不一致"
        )
    resolved = requested or boundary_geo

    return ValidatedBoundary(
        coordinateSystem=resolved,
        polygons=polygons,
        rings=rings,
        bbox=bbox,
        area=area,
        center=center,
        pointCount=len(rings[0]),
    )


def _ring_center(ring: Ring) -> Position:
    """环的球面平均中心（单位向量平均后转回经纬度）。"""
    values = ring[:-1] if ring[0] == ring[-1] else ring
    x = y = z = 0.0
    for lon, lat in values:
        lon_rad = math.radians(lon)
        lat_rad = math.radians(lat)
        cos_lat = math.cos(lat_rad)
        x += cos_lat * math.cos(lon_rad)
        y += cos_lat * math.sin(lon_rad)
        z += math.sin(lat_rad)
    count = max(1, len(values))
    x, y, z = x / count, y / count, z / count
    norm = math.sqrt(x * x + y * y + z * z)
    if norm < 1e-12:
        return values[0]
    x, y, z = x / norm, y / norm, z / norm
    return (math.degrees(math.atan2(y, x)), math.degrees(math.asin(max(-1.0, min(1.0, z)))))


def point_in_ring(point: Position, ring: Ring) -> bool:
    """射线法：点是否在单个环内（环自带方向，孔洞由调用方处理）。"""
    x, y = point
    inside = False
    count = len(ring)
    for index in range(count - 1):
        x_a, y_a = ring[index]
        x_b, y_b = ring[index + 1]
        if (y_a > y) != (y_b > y):
            x_cross = (x_b - x_a) * (y - y_a) / (y_b - y_a) + x_a
            if x < x_cross:
                inside = not inside
    return inside


def point_in_polygon(point: Position, rings: Sequence[Ring]) -> bool:
    """点是否在多边形内：在外环内且不在任何孔洞内。"""
    if not rings:
        return False
    if not point_in_ring(point, rings[0]):
        return False
    for hole in rings[1:]:
        if point_in_ring(point, hole):
            return False
    return True


def point_in_boundary(point: Position, boundary: ValidatedBoundary) -> bool:
    """点是否落在（Multi）Polygon 内部。"""
    return any(point_in_polygon(point, rings) for rings in boundary.polygons)


def points_in_boundary(points: Sequence[Position], boundary: ValidatedBoundary) -> List[bool]:
    """批量判断，返回与输入等长的布尔列表。"""
    return [point_in_boundary(point, boundary) for point in points]


def point_at_position(points: Sequence[SamplingPoint], position: Position) -> Optional[SamplingPoint]:
    """按坐标在点集中查找第一个匹配点（先按精确相等，再按 1e-9 容差）。"""
    for point in points:
        if point.longitude == position[0] and point.latitude == position[1]:
            return point
    for point in points:
        if abs(point.longitude - position[0]) <= 1e-9 and abs(point.latitude - position[1]) <= 1e-9:
            return point
    return None


def parse_point(raw, *, where: str = "point", coordinate_system: Optional[str] = None) -> SamplingPoint:
    """把 dict / dataclass 解析为 SamplingPoint；额外字段保留在 extra 中。"""
    if isinstance(raw, SamplingPoint):
        return raw
    if not isinstance(raw, Mapping):
        if isinstance(raw, (str, bytes)) or isinstance(raw, type) or not hasattr(raw, "__dict__"):
            raise AlgorithmParameterError(
                f"{where} 必须是包含 {FIELD_LONGITUDE}/{FIELD_LATITUDE} 的 dict，"
                f"收到 {type(raw).__name__}"
            )
        raw = dict(vars(raw))
    check_field_aliases(raw, where=where)
    if FIELD_LONGITUDE not in raw:
        raise AlgorithmParameterError(f"{where} 缺少 {FIELD_LONGITUDE}")
    if FIELD_LATITUDE not in raw:
        raise AlgorithmParameterError(f"{where} 缺少 {FIELD_LATITUDE}")

    lon = to_float(raw[FIELD_LONGITUDE], field=FIELD_LONGITUDE, where=where)
    lat = to_float(raw[FIELD_LATITUDE], field=FIELD_LATITUDE, where=where)
    lon_min, lon_max = LONGITUDE_RANGE
    lat_min, lat_max = LATITUDE_RANGE
    if not (lon_min <= lon <= lon_max):
        raise AlgorithmParameterError(f"{where} 的 {FIELD_LONGITUDE}={lon} 超出 [{lon_min}, {lon_max}]")
    if not (lat_min <= lat <= lat_max):
        raise AlgorithmParameterError(f"{where} 的 {FIELD_LATITUDE}={lat} 超出 [{lat_min}, {lat_max}]")

    raw_system = raw.get(FIELD_COORDINATE_SYSTEM, coordinate_system)
    system = normalize_coordinate_system(raw_system, field=f"{where} 的 {FIELD_COORDINATE_SYSTEM}")

    point_id = raw.get(FIELD_SAMPLING_POINT_ID)
    if point_id is not None and not isinstance(point_id, str):
        raise AlgorithmParameterError(f"{where} 的 {FIELD_SAMPLING_POINT_ID} 必须是字符串")

    reserved = {FIELD_LONGITUDE, FIELD_LATITUDE, FIELD_COORDINATE_SYSTEM, FIELD_SAMPLING_POINT_ID}
    extra = {key: value for key, value in raw.items() if key not in reserved}
    return SamplingPoint(
        longitude=lon,
        latitude=lat,
        coordinateSystem=system,
        samplingPointId=point_id,
        extra=extra,
    )


def parse_points(raw_points, *, where: str = "points", coordinate_system: Optional[str] = None) -> List[SamplingPoint]:
    """批量解析点集，并强制整组坐标系一致。"""
    if raw_points is None:
        raise AlgorithmParameterError(f"{where} 不能为空")
    if isinstance(raw_points, (str, bytes, Mapping)):
        raise AlgorithmParameterError(f"{where} 必须是点数组，收到 {type(raw_points).__name__}")
    try:
        items = list(raw_points)
    except TypeError:
        raise AlgorithmParameterError(
            f"{where} 必须是可迭代的点数组，收到 {type(raw_points).__name__}"
        ) from None

    points = [
        parse_point(raw, where=f"{where}[{index}]", coordinate_system=coordinate_system)
        for index, raw in enumerate(items)
    ]
    systems = {point.coordinateSystem for point in points}
    if len(systems) > 1:
        raise CoordinateSystemError(
            f"同一组 {where} 的坐标系不一致：{sorted(systems)}；调用方必须先统一坐标系"
        )
    return points


def points_to_dicts(points: Sequence[SamplingPoint]) -> List[dict]:
    """SamplingPoint 列表转普通 dict 列表（可直接 json.dumps）。"""
    return [point.to_dict() for point in points]


__all__ = [
    "Position",
    "Ring",
    "SamplingPoint",
    "ValidatedBoundary",
    "validate_boundary",
    "point_in_ring",
    "point_in_polygon",
    "point_in_boundary",
    "points_in_boundary",
    "point_at_position",
    "parse_point",
    "parse_points",
    "points_to_dicts",
]
