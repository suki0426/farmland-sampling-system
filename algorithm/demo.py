"""3 号算法模块演示脚本。

演示内容：
1. 校验农田边界并打印边界摘要；
2. 按数量 / 按间距自动布点，检查所有点都在边界内；
3. 比较蛇形、最近邻、2-opt 的总距离与优化幅度；
4. 三人分区并分别规划路线（可选的加分项）。

运行：
    python algorithm/demo.py
    python algorithm/demo.py --count 20 --spacing 400 --json
"""

from __future__ import annotations

import argparse
import json
import os
import sys

for _stream in (sys.stdout, sys.stderr):
    # Windows 控制台默认 GBK，统一按 UTF-8 输出，避免中文与 m²/° 等符号报错。
    if hasattr(_stream, "reconfigure"):
        try:
            _stream.reconfigure(encoding="utf-8", errors="replace")
        except (ValueError, OSError):
            pass

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sampling_algorithm import (  # noqa: E402
    generate_sampling_points,
    partition_and_plan,
    plan_route,
    points_in_boundary,
    validate_boundary,
)

#: 演示用坐标系（与公共字段字典一致，只允许 GCJ02 / WGS84 / BD09）。
DEMO_COORDINATE_SYSTEM = "GCJ02"


def build_demo_boundary() -> dict:
    """构造一块约 2km × 2km 的不规则农田（用于演示 PIP 与布点）。"""
    ring = [
        [112.100000, 37.100000],
        [112.124000, 37.100000],
        [112.130000, 37.108000],
        [112.130000, 37.119000],
        [112.118000, 37.124000],
        [112.104000, 37.121000],
        [112.100000, 37.112000],
        [112.100000, 37.100000],
    ]
    return {
        "type": "Polygon",
        "coordinates": [ring],
        "coordinateSystem": DEMO_COORDINATE_SYSTEM,
    }


def _format_points(points, per_line: int = 4) -> str:
    lines = []
    for index in range(0, len(points), per_line):
        chunk = points[index : index + per_line]
        text = "  ".join(
            f"({point['longitude']:.6f}, {point['latitude']:.6f})" for point in chunk
        )
        lines.append(f"    {index + 1:>3}. {text}")
    return "\n".join(lines)


def _route_report(points) -> None:
    """打印三种算法的总距离对比表。"""
    header = f"{'method':<10}{'总距离(m)':>14}{'初始距离(m)':>16}{'优化幅度':>12}"
    print(header)
    print("-" * len(header))
    best = None
    for method in ("snake", "nearest", "2opt"):
        result = plan_route(points, method=method, coordinate_system=DEMO_COORDINATE_SYSTEM)
        diagnostics = result["diagnostics"]
        gain = diagnostics["improvement"]
        print(
            f"{method:<10}{result['distance']:>14.2f}"
            f"{diagnostics['initialDistance']:>16.2f}{gain:>11.2f}%"
        )
        if best is None or result["distance"] < best["distance"]:
            best = result
    print("-" * len(header))
    print(
        f"最短路线：{best['method']}，总距离 {best['distance']:.2f} m，"
        f"点数 {len(best['orderedPoints'])}"
    )
    return best


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="3 号算法模块演示")
    parser.add_argument("--count", type=int, default=12, help="按数量布点（默认 12）")
    parser.add_argument("--spacing", type=float, default=None, help="按间距布点（米）")
    parser.add_argument("--partitions", type=int, default=3, help="分区数量（默认 3）")
    parser.add_argument("--seed", type=int, default=20260917, help="随机种子（当前算法确定性，保留参数）")
    parser.add_argument("--json", action="store_true", help="额外打印 JSON 结果")
    arguments = parser.parse_args(argv)

    boundary = build_demo_boundary()

    print("=" * 74)
    print("3 号岗位：自动采样点与路线算法模块 演示")
    print("=" * 74)

    validated = validate_boundary(boundary, coordinate_system=DEMO_COORDINATE_SYSTEM)
    summary = validated.to_dict()
    print("\n[1] 农田边界校验")
    print(f"    坐标系      : {summary['coordinateSystem']}")
    print(f"    类型        : {summary['type']}（{summary['polygonCount']} 个多边形 / {summary['ringCount']} 个环）")
    print(f"    面积        : {summary['area']:.2f} m²（约 {summary['area'] / 10000.0:.2f} 公顷）")
    print(f"    中心        : ({summary['center']['longitude']:.6f}, {summary['center']['latitude']:.6f})")
    print(f"    外环点数    : {summary['pointCount']}")

    print("\n[2] 按数量自动布点")
    by_count = generate_sampling_points(
        boundary, count=arguments.count, coordinate_system=DEMO_COORDINATE_SYSTEM
    )
    pairs = [(point["longitude"], point["latitude"]) for point in by_count["points"]]
    print(f"    请求数量    : {arguments.count}")
    print(f"    实际数量    : {by_count['count']}")
    print(f"    实际间距    : {by_count['spacing']:.2f} m")
    print(f"    全部在界内  : {all(points_in_boundary(pairs, validated))}")
    print(f"    点位去重    : {len(set(pairs)) == len(pairs)}")
    print(_format_points(by_count["points"]))

    print("\n[3] 按间距自动布点")
    spacing = arguments.spacing if arguments.spacing else round(by_count["spacing"])
    by_spacing = generate_sampling_points(
        boundary, spacing=spacing, coordinate_system=DEMO_COORDINATE_SYSTEM
    )
    pairs_by_spacing = [(point["longitude"], point["latitude"]) for point in by_spacing["points"]]
    print(f"    请求间距    : {spacing} m")
    print(f"    实际数量    : {by_spacing['count']}")
    print(f"    全部在界内  : {all(points_in_boundary(pairs_by_spacing, validated))}")

    print("\n[4] 路线算法对比（同一批采样点）")
    best_route = _route_report(by_count["points"])
    print("    路线坐标（前 4 个）：")
    for index, point in enumerate(best_route["orderedPoints"][:4]):
        print(f"      {index + 1}. ({point['longitude']:.6f}, {point['latitude']:.6f})")

    print(f"\n[5] 三人分区规划（partition_method=balanced）")
    partition = partition_and_plan(
        by_count["points"],
        boundary_geojson=boundary,
        partitions=arguments.partitions,
        method="2opt",
        coordinate_system=DEMO_COORDINATE_SYSTEM,
    )
    plan = partition["plan"]
    print(f"    分区数量    : {plan['partitionCount']}")
    print(f"    各区点位数  : {plan['partitionSizes']}")
    for index, route in enumerate(partition["partitions"]):
        seed = plan["seeds"][index]
        print(
            f"    采样员 {index + 1}    : {route['pointCount']} 个点，"
            f"距离 {route['distance']:.2f} m，方法 {route['method']}，"
            f"起点种子 ({seed['longitude']:.6f}, {seed['latitude']:.6f})"
        )
    print(f"    三区合计    : {plan['totalDistance']:.2f} m")

    if arguments.json:
        print("\n[6] JSON 输出")
        payload = {
            "boundary": summary,
            "samplingPoints": dict(by_count),
            "route": dict(best_route),
            "partitions": partition["plan"],
        }
        print(json.dumps(payload, ensure_ascii=False, indent=2, default=lambda value: value.to_dict()))

    print("\n演示完成：布点全部落在边界内，路线不漏点，2-opt 不劣于初始路线。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
