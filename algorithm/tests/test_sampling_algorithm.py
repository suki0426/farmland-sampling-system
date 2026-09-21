"""3 号算法模块单元测试。

覆盖《第12课题五人岗位字段与公共接口约束 V2.1》第五章的验收点：
有效边界布点、点不越界、路线不漏点不重复、2-opt 不劣化、未知 method 报错、
空点集/无效边界明确失败、三人分区。

运行：
    python -m unittest discover -s algorithm/tests -t . -v
"""

from __future__ import annotations

import json
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sampling_algorithm import (  # noqa: E402
    AlgorithmParameterError,
    BoundaryValidationError,
    CoordinateSystemError,
    EmptyPointSetError,
    SamplingError,
    distance_m,
    generate_sampling_points,
    nearest_unvisited_point,
    partition_and_plan,
    plan_route,
    point_in_boundary,
    points_in_boundary,
    route_distance_m,
    validate_boundary,
)

GCJ02 = "GCJ02"


def rectangle(min_lon: float, min_lat: float, max_lon: float, max_lat: float) -> dict:
    """构造一个闭合的 GeoJSON Polygon。"""
    return {
        "type": "Polygon",
        "coordinates": [
            [
                [min_lon, min_lat],
                [max_lon, min_lat],
                [max_lon, max_lat],
                [min_lon, max_lat],
                [min_lon, min_lat],
            ]
        ],
    }


#: 测试农田：约 2.66km × 2.22km。
BOUNDARY = rectangle(112.10, 37.10, 112.13, 37.12)

#: 带孔洞的农田：外环同上，中间挖一个约 440m × 440m 的方孔。
BOUNDARY_WITH_HOLE = {
    "type": "Polygon",
    "coordinates": [
        BOUNDARY["coordinates"][0],
        [
            [112.1145, 37.1095],
            [112.1195, 37.1095],
            [112.1195, 37.1105],
            [112.1145, 37.1105],
            [112.1145, 37.1095],
        ],
    ],
}

#: MultiPolygon：两块分开的农田。
BOUNDARY_MULTI = {
    "type": "MultiPolygon",
    "coordinates": [
        rectangle(112.10, 37.10, 112.11, 37.11)["coordinates"],
        rectangle(112.12, 37.11, 112.13, 37.12)["coordinates"],
    ],
}


def sample_points(count: int = 9, coordinate_system: str = GCJ02):
    """用固定的 3×3 点位作为路线测试输入。"""
    points = []
    for row in range(3):
        for column in range(3):
            points.append(
                {
                    "longitude": 112.10 + column * 0.01,
                    "latitude": 37.10 + row * 0.01,
                    "coordinateSystem": coordinate_system,
                }
            )
    return points


class TestBoundary(unittest.TestCase):
    """边界校验与 Point-in-Polygon。"""

    def test_有效矩形边界可解析(self):
        boundary = validate_boundary({**BOUNDARY, "coordinateSystem": GCJ02})
        self.assertEqual(boundary.coordinateSystem, GCJ02)
        self.assertEqual(len(boundary.polygons), 1)
        self.assertEqual(boundary.pointCount, 5)
        self.assertGreater(boundary.area, 5_000_000.0)
        self.assertLess(boundary.area, 7_000_000.0)
        self.assertAlmostEqual(boundary.center[0], 112.115, places=6)
        # 球面平均中心与平面中心有微小差异，容差取 1e-5 度（约 1 米）。
        self.assertAlmostEqual(boundary.center[1], 37.11, places=5)

    def test_未闭合的环必须报错(self):
        broken = {
            "type": "Polygon",
            "coordinates": [[[112.10, 37.10], [112.13, 37.10], [112.13, 37.12], [112.10, 37.12]]],
        }
        with self.assertRaises(BoundaryValidationError) as context:
            validate_boundary(broken)
        self.assertIn("未闭合", str(context.exception))

    def test_点数不足的环必须报错(self):
        with self.assertRaises(BoundaryValidationError):
            validate_boundary({"type": "Polygon", "coordinates": [[[112.10, 37.10], [112.13, 37.10], [112.13, 37.12]]]})

    def test_不支持的GeoJSON类型必须报错(self):
        with self.assertRaises(BoundaryValidationError) as context:
            validate_boundary({"type": "Point", "coordinates": [112.10, 37.10]})
        self.assertIn("不支持的 GeoJSON 类型", str(context.exception))

    def test_非法经纬度必须报错(self):
        bad = {
            "type": "Polygon",
            "coordinates": [[[200.0, 37.10], [112.13, 37.10], [112.13, 37.12], [200.0, 37.10]]],
        }
        with self.assertRaises(BoundaryValidationError):
            validate_boundary(bad)

    def test_PIP支持孔洞与MultiPolygon(self):
        boundary = validate_boundary(BOUNDARY_WITH_HOLE)
        self.assertTrue(point_in_boundary((112.101, 37.101), boundary))
        self.assertFalse(point_in_boundary((112.117, 37.110), boundary))
        self.assertFalse(point_in_boundary((112.20, 37.10), boundary))

        multi = validate_boundary(BOUNDARY_MULTI)
        self.assertTrue(point_in_boundary((112.105, 37.105), multi))
        self.assertTrue(point_in_boundary((112.125, 37.115), multi))
        self.assertFalse(point_in_boundary((112.115, 37.105), multi))

    def test_边界坐标系与参数冲突必须报错(self):
        with self.assertRaises(CoordinateSystemError):
            validate_boundary({**BOUNDARY, "coordinateSystem": "WGS84"}, coordinate_system=GCJ02)

    def test_未知坐标系必须报错(self):
        with self.assertRaises(CoordinateSystemError):
            validate_boundary({**BOUNDARY, "coordinateSystem": "CGCS2000"})


class TestGenerateSamplingPoints(unittest.TestCase):
    """自动布点。"""

    def test_按数量布点全部落在边界内(self):
        result = generate_sampling_points(BOUNDARY, count=12, coordinate_system=GCJ02)
        self.assertEqual(result["count"], 12)
        self.assertEqual(len(result["points"]), 12)
        self.assertEqual(result["strategy"], "count")
        self.assertEqual(result["boundary"]["coordinateSystem"], GCJ02)
        boundary = validate_boundary(BOUNDARY)
        pairs = [(point["longitude"], point["latitude"]) for point in result["points"]]
        self.assertEqual(len(set(pairs)), 12, "生成的点不允许重复")
        self.assertTrue(all(points_in_boundary(pairs, boundary)), "所有点必须在边界内部")
        for point in result["points"]:
            self.assertEqual(point["coordinateSystem"], GCJ02)

    def test_按间距布点使用给定间距(self):
        result = generate_sampling_points(BOUNDARY, spacing=500, coordinate_system=GCJ02)
        self.assertEqual(result["strategy"], "spacing")
        self.assertEqual(result["spacing"], 500)
        # 500m 网格在 2.66km × 2.22km 的农田内约有 20 个点。
        self.assertGreaterEqual(result["count"], 15)
        boundary = validate_boundary(BOUNDARY)
        self.assertTrue(
            all(points_in_boundary([(p["longitude"], p["latitude"]) for p in result["points"]], boundary))
        )

    def test_孔洞区域不布点(self):
        result = generate_sampling_points(BOUNDARY_WITH_HOLE, count=20, coordinate_system=GCJ02)
        for point in result["points"]:
            inside_hole = (
                112.1145 < point["longitude"] < 112.1195
                and 37.1095 < point["latitude"] < 37.1105
            )
            self.assertFalse(inside_hole, "孔洞内不允许出现采样点")

    def test_MultiPolygon可以布点(self):
        result = generate_sampling_points(BOUNDARY_MULTI, count=8, coordinate_system=GCJ02)
        boundary = validate_boundary(BOUNDARY_MULTI)
        self.assertTrue(
            all(points_in_boundary([(p["longitude"], p["latitude"]) for p in result["points"]], boundary))
        )

    def test_必须给出count或spacing之一(self):
        with self.assertRaises(AlgorithmParameterError):
            generate_sampling_points(BOUNDARY)

    def test_count与spacing互斥(self):
        with self.assertRaises(AlgorithmParameterError):
            generate_sampling_points(BOUNDARY, count=10, spacing=100)

    def test_返回结构可JSON序列化(self):
        result = generate_sampling_points(BOUNDARY, count=5, coordinate_system=GCJ02)
        payload = json.loads(json.dumps(dict(result), ensure_ascii=False))
        self.assertEqual(len(payload["points"]), 5)
        self.assertEqual(len(list(result)), 5)
        self.assertEqual(len(result), 5)

    def test_间距过大时必须明确失败(self):
        tiny = rectangle(112.1000, 37.1000, 112.10005, 37.10005)
        with self.assertRaises(SamplingError) as context:
            generate_sampling_points(tiny, spacing=5000)
        self.assertIn("spacing", str(context.exception))

    def test_间距过细时必须明确失败(self):
        # 500m × 500m 地块上要 1cm 网格（2500 万个候选点），必须明确失败而不是少给点。
        with self.assertRaises(SamplingError) as context:
            generate_sampling_points(BOUNDARY, spacing=0.01)
        self.assertIn("过细", str(context.exception))

    def test_count超过上限时必须报错(self):
        with self.assertRaises(AlgorithmParameterError) as context:
            generate_sampling_points(BOUNDARY, count=200_000)
        self.assertIn("上限", str(context.exception))

    def test_非法order必须报错(self):
        with self.assertRaises(AlgorithmParameterError):
            generate_sampling_points(BOUNDARY, count=4, order="zigzag")

    def test_非法count必须报错(self):
        for bad in (0, -3, 1.5):
            with self.assertRaises(AlgorithmParameterError):
                generate_sampling_points(BOUNDARY, count=bad)

    def test_禁止同义字段出现在点输入(self):
        from sampling_algorithm import parse_points

        with self.assertRaises(AlgorithmParameterError) as context:
            parse_points([{"lng": 112.1, "lat": 37.1, "coordinateSystem": GCJ02}])
        self.assertIn("同义字段", str(context.exception))


class TestPlanRoute(unittest.TestCase):
    """路线规划。"""

    def setUp(self):
        self.points = sample_points()
        self.points_with_id = [
            dict(point, samplingPointId=f"P{index:03d}") for index, point in enumerate(self.points)
        ]

    def _assert_no_loss(self, result, expected_size, expected_points=None):
        ordered = result["orderedPoints"]
        self.assertEqual(len(ordered), expected_size)
        pairs = [(point["longitude"], point["latitude"]) for point in ordered]
        self.assertEqual(len(set(pairs)), expected_size, "路线不允许重复点")
        reference = self.points if expected_points is None else expected_points
        self.assertEqual(set(pairs), {(p["longitude"], p["latitude"]) for p in reference})

    def test_蛇形路线覆盖全部点(self):
        result = plan_route(self.points, method="snake", coordinate_system=GCJ02)
        self._assert_no_loss(result, 9)
        self.assertEqual(result["method"], "snake")
        self.assertIn("initialDistance", result["diagnostics"])
        self.assertIn("optimizedDistance", result["diagnostics"])
        self.assertEqual(result["diagnostics"]["unit"], "meter")

    def test_最近邻路线覆盖全部点(self):
        result = plan_route(self.points, method="nearest", coordinate_system=GCJ02)
        self._assert_no_loss(result, 9)
        self.assertEqual(result["method"], "nearest")

    def test_2opt不劣于初始路线(self):
        result = plan_route(self.points, method="2opt", coordinate_system=GCJ02)
        self._assert_no_loss(result, 9)
        diagnostics = result["diagnostics"]
        self.assertLessEqual(
            diagnostics["optimizedDistance"],
            diagnostics["initialDistance"] + 1e-6,
            "2-opt 结果不得大于初始路线距离",
        )
        self.assertEqual(result["method"], "2opt")
        self.assertIn(diagnostics["realMethod"], {"2opt", "nearest"})
        self.assertIn("applied", diagnostics)

    def test_2opt在交叉路线上确实缩短距离(self):
        # 输入顺序在矩形四角上来回交叉，2-opt 应当拉直并缩短总距离。
        points = [
            {"longitude": 112.1000, "latitude": 37.1000, "coordinateSystem": GCJ02},
            {"longitude": 112.1100, "latitude": 37.1050, "coordinateSystem": GCJ02},
            {"longitude": 112.1100, "latitude": 37.1000, "coordinateSystem": GCJ02},
            {"longitude": 112.1000, "latitude": 37.1050, "coordinateSystem": GCJ02},
            {"longitude": 112.1050, "latitude": 37.1025, "coordinateSystem": GCJ02},
        ]
        sequence = round(route_distance_m(points, list(range(5))), 2)
        two_opt = plan_route(points, method="2opt", coordinate_system=GCJ02)
        self.assertLess(two_opt["distance"], sequence)
        self.assertTrue(two_opt["diagnostics"]["applied"], "交叉顺序下 2-opt 应当真正发生交换")
        self.assertEqual(two_opt["method"], "2opt")
        self.assertEqual(two_opt["diagnostics"]["realMethod"], "2opt")

    def test_best自动挑选最短路线(self):
        result = plan_route(self.points, method="best", coordinate_system=GCJ02)
        self._assert_no_loss(result, 9)
        comparison = result["diagnostics"]["comparison"]
        self.assertEqual({item["method"] for item in comparison}, {"snake", "nearest", "2opt"})
        shortest = min(item["distance"] for item in comparison)
        self.assertAlmostEqual(result["distance"], shortest, places=2)
        self.assertEqual(result["method"], result["diagnostics"]["method"])

    def test_未命中的start_point会作为起点加入(self):
        start = {"longitude": 112.1005, "latitude": 37.1005, "coordinateSystem": GCJ02}
        expected = list(self.points) + [start]
        result = plan_route(self.points, start_point=start, method="2opt", coordinate_system=GCJ02)
        self._assert_no_loss(result, 10, expected_points=expected)
        self.assertTrue(result["diagnostics"]["startPointUsed"])
        first = result["orderedPoints"][0]
        self.assertAlmostEqual(first["longitude"], start["longitude"])
        self.assertAlmostEqual(first["latitude"], start["latitude"])

    def test_start_point命中已有点时排到最前(self):
        start = {"longitude": 112.11, "latitude": 37.11, "coordinateSystem": GCJ02}
        result = plan_route(self.points, start_point=start, method="nearest", coordinate_system=GCJ02)
        self._assert_no_loss(result, 9)
        self.assertTrue(result["diagnostics"]["startPointUsed"])
        first = result["orderedPoints"][0]
        self.assertAlmostEqual(first["longitude"], start["longitude"])
        self.assertAlmostEqual(first["latitude"], start["latitude"])

    def test_未知method必须报错而不是暗中切换(self):
        with self.assertRaises(AlgorithmParameterError) as context:
            plan_route(self.points, method="genetic", coordinate_system=GCJ02)
        self.assertIn("未知 method", str(context.exception))

    def test_method可以是列表(self):
        result = plan_route(self.points, method=["snake", "2opt"], coordinate_system=GCJ02)
        self._assert_no_loss(result, 9)
        self.assertIn(result["method"], {"snake", "2opt"})
        evaluation = result["diagnostics"]["evaluations"]
        self.assertEqual(len(evaluation), 2)
    def test_空点集返回空路线而不是报错(self):
        result = plan_route([], coordinate_system=GCJ02)
        self.assertEqual(result["orderedPoints"], [])
        self.assertEqual(result["distance"], 0.0)
        self.assertEqual(result.geojson()["type"], "LineString")
        self.assertEqual(result.geojson()["coordinates"], [])
        self.assertEqual(result["diagnostics"]["pointCount"], 0)

    def test_空点集且只有起点时按单点处理(self):
        start = {"longitude": 112.1005, "latitude": 37.1005, "coordinateSystem": GCJ02}
        result = plan_route([], start_point=start, coordinate_system=GCJ02)
        self.assertEqual(len(result["orderedPoints"]), 1)
        self.assertEqual(result["distance"], 0.0)

    def test_分区空点集必须报错(self):
        with self.assertRaises(EmptyPointSetError):
            partition_and_plan([], partitions=3)

    def test_坐标系不一致必须报错(self):
        mixed = sample_points()
        mixed[0]["coordinateSystem"] = "WGS84"
        with self.assertRaises(CoordinateSystemError):
            plan_route(mixed)
        with self.assertRaises(AlgorithmParameterError):
            plan_route(
                self.points,
                start_point={"longitude": 112.1, "latitude": 37.1, "coordinateSystem": "WGS84"},
                coordinate_system=GCJ02,
            )

    def test_缺少坐标系必须报错(self):
        with self.assertRaises(CoordinateSystemError):
            plan_route([{"longitude": 112.1, "latitude": 37.1}])

    def test_输出可JSON序列化(self):
        result = plan_route(self.points_with_id, method="snake", coordinate_system=GCJ02)
        payload = json.loads(json.dumps(dict(result), ensure_ascii=False))
        ids = {point["samplingPointId"] for point in payload["orderedPoints"]}
        self.assertEqual(ids, {f"P{index:03d}" for index in range(9)})
        geometry = json.loads(payload["routeGeoJson"])
        self.assertEqual(geometry["type"], "LineString")
        self.assertEqual(len(geometry["coordinates"]), 9)
        self.assertEqual(geometry["coordinateSystem"], GCJ02)
        self.assertEqual(result.geojson(), geometry)

    def test_闭合路线会重复首点(self):
        result = plan_route(self.points, method="snake", coordinate_system=GCJ02, closed=True)
        geometry = result.geojson()
        self.assertEqual(len(geometry["coordinates"]), 10)
        self.assertEqual(geometry["coordinates"][0], geometry["coordinates"][-1])
        self.assertTrue(geometry["closed"])
        self.assertEqual(len(result["orderedPoints"]), 9, "orderedPoints 不因闭合而重复")

    def test_两点路线不报错(self):
        points = [
            {"longitude": 112.10, "latitude": 37.10, "coordinateSystem": GCJ02},
            {"longitude": 112.11, "latitude": 37.11, "coordinateSystem": GCJ02},
        ]
        result = plan_route(points, method="2opt", coordinate_system=GCJ02)
        self.assertEqual(len(result["orderedPoints"]), 2)
        expected = distance_m(112.10, 37.10, 112.11, 37.11)
        self.assertAlmostEqual(result["distance"], round(expected, 2), places=2)

    def test_未知参数必须报错(self):
        with self.assertRaises(AlgorithmParameterError):
            plan_route(self.points, method="snake", coordinate_system=GCJ02, algorithm="2opt")


class TestNearestUnvisitedPoint(unittest.TestCase):
    """导航用：最近未采样点。"""

    def setUp(self):
        self.points = [
            dict(point, samplingPointId=f"P{index:03d}")
            for index, point in enumerate(sample_points())
        ]

    def test_返回最近点(self):
        current = {"longitude": 112.101, "latitude": 37.101, "coordinateSystem": GCJ02}
        nearest = nearest_unvisited_point(self.points, current)
        self.assertIsNotNone(nearest)
        self.assertEqual(nearest["samplingPointId"], "P000")
        self.assertIn("distance", nearest)

    def test_支持按下标排除已采样点(self):
        current = {"longitude": 112.101, "latitude": 37.101, "coordinateSystem": GCJ02}
        nearest = nearest_unvisited_point(self.points, current, exclude=[0])
        self.assertNotEqual(nearest["samplingPointId"], "P000")

    def test_支持按ID排除已采样点(self):
        current = {"longitude": 112.101, "latitude": 37.101, "coordinateSystem": GCJ02}
        nearest = nearest_unvisited_point(self.points, current, exclude={"P000", "P001"})
        self.assertNotIn(nearest["samplingPointId"], {"P000", "P001"})

    def test_全部采样完返回None(self):
        current = {"longitude": 112.101, "latitude": 37.101, "coordinateSystem": GCJ02}
        nearest = nearest_unvisited_point(self.points, current, exclude=list(range(9)))
        self.assertIsNone(nearest)


class TestPartition(unittest.TestCase):
    """可选的三人分区。"""

    def setUp(self):
        self.points = sample_points(count=9)

    def test_均衡分区覆盖全部点(self):
        result = partition_and_plan(
            self.points, boundary_geojson=BOUNDARY, partitions=3, method="2opt", coordinate_system=GCJ02
        )
        payload = result["plan"]
        self.assertEqual(payload["partitionCount"], 3)
        self.assertEqual(sum(payload["partitionSizes"]), 9)
        collected = []
        for partition in result["partitions"]:
            collected.extend(
                (point["longitude"], point["latitude"]) for point in partition["orderedPoints"]
            )
        self.assertEqual(len(collected), 9)
        self.assertEqual(len(set(collected)), 9, "分区之间不允许重复分配同一个点")
        self.assertEqual(len(result["routeGeoJson"]["features"]), 3)

    def test_角分区同样覆盖全部点(self):
        result = partition_and_plan(
            self.points,
            boundary_geojson=BOUNDARY,
            partitions=3,
            partition_method="angular",
            coordinate_system=GCJ02,
        )
        assigned = sum(len(route["orderedPoints"]) for route in result["partitions"])
        self.assertEqual(assigned, 9)

    def test_支持每个采样员各自的起点(self):
        starts = [
            {"longitude": 112.1005, "latitude": 37.1005, "coordinateSystem": GCJ02},
            {"longitude": 112.1295, "latitude": 37.1005, "coordinateSystem": GCJ02},
            {"longitude": 112.1150, "latitude": 37.1195, "coordinateSystem": GCJ02},
        ]
        result = partition_and_plan(
            self.points,
            boundary_geojson=BOUNDARY,
            partitions=3,
            start_points=starts,
            coordinate_system=GCJ02,
        )
        self.assertEqual(len(result["partitions"]), 3)

    def test_分区数非法必须报错(self):
        with self.assertRaises(AlgorithmParameterError):
            partition_and_plan(self.points, partitions=1)

    def test_空点集必须报错(self):
        with self.assertRaises(EmptyPointSetError):
            partition_and_plan([], partitions=3)

    def test_分区方式非法必须报错(self):
        with self.assertRaises(AlgorithmParameterError):
            partition_and_plan(self.points, partitions=3, partition_method="kmeans")


class TestUtilities(unittest.TestCase):
    """测地工具与坐标系规范化。"""

    def test_距离量级正确(self):
        # 同纬度上 0.01° 经度在北纬 37.1° 约为 880m。
        gap = distance_m(112.10, 37.10, 112.11, 37.10)
        self.assertGreater(gap, 800.0)
        self.assertLess(gap, 950.0)
        self.assertEqual(distance_m(112.10, 37.10, 112.10, 37.10), 0.0)

    def test_度分秒解析(self):
        from sampling_algorithm import parse_dms

        self.assertAlmostEqual(parse_dms("112°07'23.4\""), 112.12316666666666, places=9)
        self.assertAlmostEqual(parse_dms("37 06 00"), 37.1, places=9)
        with self.assertRaises(AlgorithmParameterError):
            parse_dms("北纬一百一十二度")

    def test_坐标系规范化(self):
        from sampling_algorithm import normalize_coordinate_system

        self.assertEqual(normalize_coordinate_system("gcj02"), "GCJ02")
        self.assertEqual(normalize_coordinate_system("wgs-84"), "WGS84")
        for bad in ("CGCS2000", "", None, 123):
            with self.assertRaises(CoordinateSystemError):
                normalize_coordinate_system(bad)


class TestDemoModule(unittest.TestCase):
    """demo.py 与布点、路线可以串起来跑通。"""

    def test_demo边界可用且端到端跑通(self):
        import demo

        boundary = demo.build_demo_boundary()
        validated = validate_boundary(boundary, coordinate_system=demo.DEMO_COORDINATE_SYSTEM)
        self.assertGreater(validated.area, 1_000_000.0)

        sampling = generate_sampling_points(boundary, count=12, coordinate_system=demo.DEMO_COORDINATE_SYSTEM)
        route = plan_route(sampling["points"], method="best", coordinate_system=demo.DEMO_COORDINATE_SYSTEM)
        self.assertEqual(len(route["orderedPoints"]), 12)
        partition = partition_and_plan(
            sampling["points"],
            boundary_geojson=boundary,
            partitions=3,
            coordinate_system=demo.DEMO_COORDINATE_SYSTEM,
        )
        self.assertEqual(partition["plan"]["partitionCount"], 3)


if __name__ == "__main__":
    unittest.main(verbosity=2)
