"""公共字段名、坐标系常量与参数解析工具。

字段名严格来自《第12课题五人岗位字段与公共接口约束 V2.1》第一章，禁止另建同义字段。
"""

from __future__ import annotations

import json
import math
from collections.abc import Mapping
from decimal import Decimal, InvalidOperation

from .errors import AlgorithmParameterError, CoordinateSystemError

#: 经度字段名（唯一合法写法）。
FIELD_LONGITUDE = "longitude"
#: 纬度字段名（唯一合法写法）。
FIELD_LATITUDE = "latitude"
#: 坐标系字段名。
FIELD_COORDINATE_SYSTEM = "coordinateSystem"
#: 采样点主键字段名（可选字段）。
FIELD_SAMPLING_POINT_ID = "samplingPointId"

#: 允许的坐标系取值，只允许这三个。
COORDINATE_SYSTEMS = ("GCJ02", "WGS84", "BD09")
DEFAULT_COORDINATE_SYSTEM = "GCJ02"

#: 禁止出现的同义替代字段，一旦出现立即报错，避免两套字段并存。
FORBIDDEN_FIELD_ALIASES = (
    "farmId",
    "farm_id",
    "fieldId",
    "field_id",
    "pointId",
    "point_id",
    "equipmentId",
    "equipment_id",
    "lng",
    "lon",
    "long",
    "timestamp",
    "lat_deg",
    "lon_deg",
)

#: 坐标数值允许的范围。
LONGITUDE_RANGE = (-180.0, 180.0)
LATITUDE_RANGE = (-90.0, 90.0)


def normalize_coordinate_system(value, *, field: str = FIELD_COORDINATE_SYSTEM) -> str:
    """校验并规范化坐标系取值。未知坐标系拒绝处理，不做转换猜测。"""
    if value is None or (isinstance(value, str) and not value.strip()):
        raise CoordinateSystemError(
            f"{field} 不能为空；只允许 {'/'.join(COORDINATE_SYSTEMS)}"
        )
    if not isinstance(value, str):
        raise CoordinateSystemError(
            f"{field} 必须是字符串，收到 {type(value).__name__}；"
            f"只允许 {'/'.join(COORDINATE_SYSTEMS)}"
        )
    code = value.strip().upper().replace("-", "").replace("_", "").replace(" ", "")
    if code not in COORDINATE_SYSTEMS:
        raise CoordinateSystemError(
            f"{field} 取值为 {value!r}，不在允许集合 {'/'.join(COORDINATE_SYSTEMS)} 内；"
            "坐标系未知时拒绝转换猜测"
        )
    return code


def check_field_aliases(mapping, *, where: str) -> None:
    """检查是否混入禁止的同义字段（lng/lon/pointId/timestamp 等）。"""
    if not isinstance(mapping, Mapping):
        return
    hit = [key for key in FORBIDDEN_FIELD_ALIASES if key in mapping]
    if hit:
        raise AlgorithmParameterError(
            f"{where} 出现禁止的同义字段 {sorted(hit)}；"
            f"只允许 {FIELD_LONGITUDE}/{FIELD_LATITUDE}/{FIELD_COORDINATE_SYSTEM}"
            f"（可选 {FIELD_SAMPLING_POINT_ID}）"
        )


def to_float(value, *, field: str, where: str) -> float:
    """把数值字段安全转成 float，bool 与不可解析值一律报错。"""
    if isinstance(value, bool):
        raise AlgorithmParameterError(f"{where} 的 {field} 不能是布尔值")
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        try:
            return float(value.strip())
        except (ValueError, InvalidOperation):
            raise AlgorithmParameterError(
                f"{where} 的 {field} 无法解析为数值：{value!r}"
            ) from None
    raise AlgorithmParameterError(
        f"{where} 的 {field} 必须是数值，收到 {type(value).__name__}"
    )


def optional_number(value, *, field: str, where: str):
    """可选数值参数：None 返回 None，否则转 float。"""
    if value is None:
        return None
    return to_float(value, field=field, where=where)


def optional_bool(value, *, field: str, where: str) -> bool:
    """可选布尔参数：只接受真正的布尔值，避免 "false" 被当成 True。"""
    if value is None:
        return False
    if not isinstance(value, bool):
        raise AlgorithmParameterError(
            f"{where} 的 {field} 必须是布尔值 true/false，收到 {value!r}"
        )
    return value


def call_args(args, kwargs, *, where: str):
    """把位置参数与关键字参数合并成一个 dict。

    只允许 0 个或 1 个位置参数（即首个形参），其余必须用关键字传递。
    """
    if len(args) > 1:
        raise AlgorithmParameterError(
            f"{where} 只接受 1 个位置参数，收到 {len(args)} 个；请使用关键字参数"
        )
    options = dict(kwargs)
    if args:
        primary = "boundary_geojson" if where == "generate_sampling_points" else "points"
        if primary in options:
            raise AlgorithmParameterError(f"{where} 的 {primary} 被重复指定")
        options[primary] = args[0]
    return options


def json_default(value):
    """json.dumps 的兜底转换：支持 to_dict()、dataclass 与 __dict__ 对象。"""
    to_dict = getattr(value, "to_dict", None)
    if callable(to_dict):
        return to_dict()
    if hasattr(value, "__dict__"):
        return {key: val for key, val in vars(value).items() if not key.startswith("_")}
    raise TypeError(f"无法序列化的类型：{type(value).__name__}")


def dumps(payload, *, indent=None) -> str:
    """统一的 JSON 序列化入口（中文不转义，支持本模块的自定义结果对象）。"""
    return json.dumps(payload, ensure_ascii=False, indent=indent, default=json_default)


def copy_options(options: Mapping) -> dict:
    """复制参数 dict，避免调用方对象被就地修改。"""
    return {key: value for key, value in options.items()}


def haversine_m(lon_a: float, lat_a: float, lon_b: float, lat_b: float) -> float:
    """球面两点距离（米）。保留在 types 中只是为了给局部投影一个共同来源。"""
    phi1 = math.radians(lat_a)
    phi2 = math.radians(lat_b)
    d_phi = phi2 - phi1
    d_lambda = math.radians(lon_b - lon_a)
    h = (
        math.sin(d_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2.0) ** 2
    )
    return 2.0 * 6371008.8 * math.asin(min(1.0, math.sqrt(h)))


__all__ = [
    "FIELD_LONGITUDE",
    "FIELD_LATITUDE",
    "FIELD_COORDINATE_SYSTEM",
    "FIELD_SAMPLING_POINT_ID",
    "COORDINATE_SYSTEMS",
    "DEFAULT_COORDINATE_SYSTEM",
    "FORBIDDEN_FIELD_ALIASES",
    "LONGITUDE_RANGE",
    "LATITUDE_RANGE",
    "normalize_coordinate_system",
    "check_field_aliases",
    "to_float",
    "optional_number",
    "optional_bool",
    "call_args",
    "json_default",
    "dumps",
    "copy_options",
    "haversine_m",
]
