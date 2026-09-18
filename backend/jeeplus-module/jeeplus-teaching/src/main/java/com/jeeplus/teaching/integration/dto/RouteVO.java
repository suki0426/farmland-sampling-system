package com.jeeplus.teaching.integration.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class RouteVO {

    private String routeId;
    private List<SamplingPointVO> orderedPoints = new ArrayList<SamplingPointVO>();
    private BigDecimal totalDistance;
    private String algorithm;

    public String getRouteId() { return routeId; }
    public void setRouteId(String routeId) { this.routeId = routeId; }
    public List<SamplingPointVO> getOrderedPoints() { return orderedPoints; }
    public void setOrderedPoints(List<SamplingPointVO> orderedPoints) { this.orderedPoints = orderedPoints; }
    public BigDecimal getTotalDistance() { return totalDistance; }
    public void setTotalDistance(BigDecimal totalDistance) { this.totalDistance = totalDistance; }
    public String getAlgorithm() { return algorithm; }
    public void setAlgorithm(String algorithm) { this.algorithm = algorithm; }
}
