package com.jeeplus.teaching.integration.dto;

import java.util.ArrayList;
import java.util.List;

public class RoutePlanDTO {

    private String taskId;
    private List<SamplingPointVO> samplingPoints = new ArrayList<SamplingPointVO>();
    private String coordinateSystem;

    public String getTaskId() { return taskId; }
    public void setTaskId(String taskId) { this.taskId = taskId; }
    public List<SamplingPointVO> getSamplingPoints() { return samplingPoints; }
    public void setSamplingPoints(List<SamplingPointVO> samplingPoints) { this.samplingPoints = samplingPoints; }
    public String getCoordinateSystem() { return coordinateSystem; }
    public void setCoordinateSystem(String coordinateSystem) { this.coordinateSystem = coordinateSystem; }
}
