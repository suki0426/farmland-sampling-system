"""测地基础工具：米制距离、局部平面投影、度分秒解析。

本模块只做数学计算，不涉及任何业务字段。
"""

from __future__ import annotations

import math
import re
from typing import List, Tuple

from .errors import AlgorithmParameterError

#: 地球平均半径（IUGG 平均半径，米）。
EARTH_RADIUS_M = 6371008.8

#: 局部平面（等距圆柱近似）使用的经纬半径。
WGS84_A = 6378137.0
WGS84_F = 1.0 / 298.257223563
WGS84_E2 = WGS84_F * (2.0 - WGS84_F)

_DMS_RE = re.compile(
    r"^(?P<sign>[-+])?\s*(?P<deg>\d{1,3}(?:\.\d+)?)\s*[°d:\s]\s*"
    r"(?:(?P<min>\d{1,2}(?:\.\d+)?)\s*['m:\s]\s*)?"
    r"(?:(?P<sec>\d{1,2}(?:\.\d+)?)\s*[\"s]?\s*)?$"
)


def distance_m(lon_a: float, lat_a: float, lon_b: float, lat_b: float) -> float:
    """两点球面距离（米），haversine 公式。"""
    phi1 = math.radians(lat_a)
    phi2 = math.radians(lat_b)
    d_phi = phi2 - phi1
    d_lambda = math.radians(lon_b - lon_a)
    h = (
        math.sin(d_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2.0) ** 2
    )
    return 2.0 * EARTH_RADIUS_M * math.asin(min(1.0, math.sqrt(h)))


def radii(lat_deg: float) -> Tuple[float, float]:
    """返回 (每度纬度米数, 每度经度米数)，基于 WGS84 椭球在给定纬度的曲率半径。"""
    if lat_deg >= 90.0:
        return math.pi * WGS84_A / 180.0, 0.0
    lat = math.radians(lat_deg)
    sin_lat = math.sin(lat)
    w = math.sqrt(1.0 - WGS84_E2 * sin_lat * sin_lat)
    meridional = WGS84_A * (1.0 - WGS84_E2) / (w ** 3)
    prime_vertical = WGS84_A / w
    meters_per_deg_lat = math.pi * meridional / 180.0
    meters_per_deg_lon = math.pi * prime_vertical * math.cos(lat) / 180.0
    return meters_per_deg_lat, meters_per_deg_lon


def lonlat_to_local(lon: float, lat: float, lon0: float, lat0: float) -> Tuple[float, float]:
    """经纬度转局部平面米制坐标（等距圆柱近似，中心为 lon0/lat0）。"""
    m_per_deg_lat, m_per_deg_lon = radii(lat0)
    x = (lon - lon0) * m_per_deg_lon
    y = (lat - lat0) * m_per_deg_lat
    return x, y


def local_to_lonlat(x: float, y: float, lon0: float, lat0: float) -> Tuple[float, float]:
    """局部平面米制坐标转经纬度，与 lonlat_to_local 互逆。"""
    m_per_deg_lat, m_per_deg_lon = radii(lat0)
    lon = lon0 + (x / m_per_deg_lon if m_per_deg_lon else 0.0)
    lat = lat0 + (y / m_per_deg_lat if m_per_deg_lat else 0.0)
    return lon, lat


def grid_origin(boundary) -> Tuple[float, float]:
    """给出一个边界对象的网格原点（边界中心）。"""
    return boundary.center[0], boundary.center[1]


def polygon_area_m2(rings: List[List[Tuple[float, float]]], lat0: float) -> float:
    """多边形面积（平方米），外环为正、孔洞为负，取绝对值。

    rings[0] 为外环，其余为孔洞；坐标为 (lon, lat)。
    """
    m_per_deg_lat, m_per_deg_lon = radii(lat0)
    total = 0.0
    for index, ring in enumerate(rings):
        points = list(ring)
        if points and points[0] == points[-1]:
            points = points[:-1]
        if len(points) < 3:
            continue
        twin_area = 0.0
        for position in range(len(points)):
            lon_a, lat_a = points[position]
            lon_b, lat_b = points[(position + 1) % len(points)]
            x_a = lon_a * m_per_deg_lon
            y_a = lat_a * m_per_deg_lat
            x_b = lon_b * m_per_deg_lon
            y_b = lat_b * m_per_deg_lat
            twin_area += x_a * y_b - x_b * y_a
        area = abs(twin_area) / 2.0
        total += area if index == 0 else -area
    return abs(total)


def parse_dms(value: str, *, field: str = "coordinate") -> float:
    """解析 "112°07'23.4\\"" 或 "112 07 23.4" 形式的度分秒为十进制度。

    仅用于把设备/文档中的度分秒写法转成十进制度，不做坐标系转换。
    """
    text = str(value).strip()
    if not text:
        raise AlgorithmParameterError(f"{field} 的度分秒字符串为空")
    compact = text.replace("″", '"').replace("’", "'").replace("º", "°")
    match = _DMS_RE.match(compact)
    if not match:
        raise AlgorithmParameterError(f"{field} 无法解析为度分秒：{value!r}")
    degrees = float(match.group("deg"))
    minutes = float(match.group("min") or 0.0)
    seconds = float(match.group("sec") or 0.0)
    result = degrees + minutes / 60.0 + seconds / 3600.0
    if match.group("sign") == "-":
        result = -result
    return result


__all__ = [
    "EARTH_RADIUS_M",
    "distance_m",
    "radii",
    "lonlat_to_local",
    "local_to_lonlat",
    "grid_origin",
    "polygon_area_m2",
    "parse_dms",
]
