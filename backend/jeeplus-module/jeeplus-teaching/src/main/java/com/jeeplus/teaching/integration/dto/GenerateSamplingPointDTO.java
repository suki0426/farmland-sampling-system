package com.jeeplus.teaching.integration.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * 采样点算法适配请求，边界数据由 GIS 模块提供。
 */
public class GenerateSamplingPointDTO {

    private String farmlandId;
    private List<CoordinateDTO> boundary = new ArrayList<CoordinateDTO>();
    private Integer expectedPointCount;
    private String coordinateSystem;

    public String getFarmlandId() { return farmlandId; }
    public void setFarmlandId(String farmlandId) { this.farmlandId = farmlandId; }
    public List<CoordinateDTO> getBoundary() { return boundary; }
    public void setBoundary(List<CoordinateDTO> boundary) { this.boundary = boundary; }
    public Integer getExpectedPointCount() { return expectedPointCount; }
    public void setExpectedPointCount(Integer expectedPointCount) { this.expectedPointCount = expectedPointCount; }
    public String getCoordinateSystem() { return coordinateSystem; }
    public void setCoordinateSystem(String coordinateSystem) { this.coordinateSystem = coordinateSystem; }
}
