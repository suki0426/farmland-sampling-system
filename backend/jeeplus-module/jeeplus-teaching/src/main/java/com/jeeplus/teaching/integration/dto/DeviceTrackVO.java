package com.jeeplus.teaching.integration.dto;

import java.util.ArrayList;
import java.util.List;

public class DeviceTrackVO {

    private String deviceId;
    private List<TrackPointVO> points = new ArrayList<TrackPointVO>();

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
    public List<TrackPointVO> getPoints() { return points; }
    public void setPoints(List<TrackPointVO> points) { this.points = points; }
}
