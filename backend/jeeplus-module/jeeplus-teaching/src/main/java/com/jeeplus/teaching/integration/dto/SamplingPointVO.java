package com.jeeplus.teaching.integration.dto;

import java.math.BigDecimal;

public class SamplingPointVO {

    private String samplingPointId;
    private BigDecimal longitude;
    private BigDecimal latitude;
    private Integer sequence;
    private String status;
    private String coordinateSystem;

    public String getSamplingPointId() { return samplingPointId; }
    public void setSamplingPointId(String samplingPointId) { this.samplingPointId = samplingPointId; }
    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }
    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }
    public Integer getSequence() { return sequence; }
    public void setSequence(Integer sequence) { this.sequence = sequence; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCoordinateSystem() { return coordinateSystem; }
    public void setCoordinateSystem(String coordinateSystem) { this.coordinateSystem = coordinateSystem; }
}
