package com.jeeplus.teaching.integration.algorithm;

import com.jeeplus.teaching.integration.dto.CoordinateDTO;
import com.jeeplus.teaching.integration.dto.GenerateSamplingPointDTO;
import com.jeeplus.teaching.integration.dto.RoutePlanDTO;
import com.jeeplus.teaching.integration.dto.RouteVO;
import com.jeeplus.teaching.integration.dto.SamplingPointVO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * 开发联调桩：仅按输入边界顺序返回临时点位，不实现真实布点或路径优化算法。
 */
@Service
public class MockSamplingAlgorithmService implements SamplingAlgorithmService {

    private static final Logger LOGGER = LoggerFactory.getLogger(MockSamplingAlgorithmService.class);

    @Override
    public List<SamplingPointVO> generateSamplingPoints(GenerateSamplingPointDTO request) {
        LOGGER.info("调用 Mock 采样点生成服务，farmlandId={}", request.getFarmlandId());
        if (request.getBoundary() == null || request.getBoundary().isEmpty()) {
            return Collections.emptyList();
        }
        int count = request.getExpectedPointCount() == null ? request.getBoundary().size()
                : Math.min(Math.max(1, request.getExpectedPointCount()), request.getBoundary().size());
        List<SamplingPointVO> points = new ArrayList<SamplingPointVO>();
        for (int index = 0; index < count; index++) {
            CoordinateDTO coordinate = request.getBoundary().get(index);
            SamplingPointVO point = new SamplingPointVO();
            point.setSamplingPointId("MOCK-" + (index + 1));
            point.setLongitude(coordinate.getLongitude());
            point.setLatitude(coordinate.getLatitude());
            point.setCoordinateSystem(coordinate.getCoordinateSystem() == null
                    ? request.getCoordinateSystem() : coordinate.getCoordinateSystem());
            point.setSequence(index + 1);
            point.setStatus("MOCK_PENDING");
            points.add(point);
        }
        return points;
    }

    @Override
    public RouteVO planRoute(RoutePlanDTO request) {
        LOGGER.info("调用 Mock 路线规划服务，taskId={}", request.getTaskId());
        RouteVO route = new RouteVO();
        route.setRouteId("MOCK-ROUTE");
        route.setAlgorithm("MOCK_INPUT_ORDER");
        route.setOrderedPoints(request.getSamplingPoints() == null
                ? Collections.<SamplingPointVO>emptyList() : new ArrayList<SamplingPointVO>(request.getSamplingPoints()));
        return route;
    }
}
