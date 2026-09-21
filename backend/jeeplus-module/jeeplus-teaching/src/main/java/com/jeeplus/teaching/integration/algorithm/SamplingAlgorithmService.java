package com.jeeplus.teaching.integration.algorithm;

import com.jeeplus.teaching.integration.dto.GenerateSamplingPointDTO;
import com.jeeplus.teaching.integration.dto.RoutePlanDTO;
import com.jeeplus.teaching.integration.dto.RouteVO;
import com.jeeplus.teaching.integration.dto.SamplingPointVO;

import java.util.List;

/**
 * TODO [Integration-3]: 3号交付 Python 算法后，以适配实现替换 Mock，不改变 Controller 契约。
 */
public interface SamplingAlgorithmService {

    List<SamplingPointVO> generateSamplingPoints(GenerateSamplingPointDTO request);

    RouteVO planRoute(RoutePlanDTO request);
}
