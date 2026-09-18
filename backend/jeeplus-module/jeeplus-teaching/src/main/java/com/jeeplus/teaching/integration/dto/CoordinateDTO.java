package com.jeeplus.teaching.integration.dto;

import java.math.BigDecimal;

/**
 * 统一坐标表达；当前 Mock 不进行坐标转换。
 */
public class CoordinateDTO {

    private BigDecimal longitude;
    private BigDecimal latitude;
    private String coordinateSystem;

    public BigDecimal getLongitude() {
        return longitude;
    }

    public void setLongitude(BigDecimal longitude) {
        this.longitude = longitude;
    }

    public BigDecimal getLatitude() {
        return latitude;
    }

    public void setLatitude(BigDecimal latitude) {
        this.latitude = latitude;
    }

    public String getCoordinateSystem() {
        return coordinateSystem;
    }

    public void setCoordinateSystem(String coordinateSystem) {
        this.coordinateSystem = coordinateSystem;
    }
}
