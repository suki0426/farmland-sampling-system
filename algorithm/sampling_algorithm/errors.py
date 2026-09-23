"""算法模块异常类型。

统一继承 AlgorithmError，便于 5 号在 adapter 里一次性捕获并转换为 HTTP 400/500。
"""

from __future__ import annotations


class AlgorithmError(Exception):
    """算法模块所有异常的基类。"""


class AlgorithmParameterError(AlgorithmError, ValueError):
    """参数缺失、类型错误、取值冲突或出现同义替代字段。"""


class BoundaryValidationError(AlgorithmError, ValueError):
    """农田边界 GeoJSON 不合法。"""


class CoordinateSystemError(AlgorithmError, ValueError):
    """坐标系缺失、非法，或同一组坐标的坐标系不一致。"""


class EmptyPointSetError(AlgorithmError, ValueError):
    """点集为空。"""


class SamplingError(AlgorithmError, ValueError):
    """布点无法满足请求（边界过小、间距过大、目标数量无法达成）。"""


class OptimizationError(AlgorithmError, RuntimeError):
    """优化过程出现异常状态。"""


__all__ = [
    "AlgorithmError",
    "AlgorithmParameterError",
    "BoundaryValidationError",
    "CoordinateSystemError",
    "EmptyPointSetError",
    "SamplingError",
    "OptimizationError",
]
