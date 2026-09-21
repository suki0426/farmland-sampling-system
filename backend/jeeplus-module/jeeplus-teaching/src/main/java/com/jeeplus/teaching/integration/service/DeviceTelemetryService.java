package com.jeeplus.teaching.integration.service;

import com.jeeplus.teaching.integration.dto.DeviceLocationVO;
import com.jeeplus.teaching.integration.dto.DeviceTelemetryDTO;
import com.jeeplus.teaching.integration.dto.DeviceTrackVO;

import java.util.List;

/**
 * 接收层与存储层之间的稳定边界。
 * TODO [Integration-4]: 数据库表结构冻结后增加 MySQL 实现并替换当前内存实现。
 */
public interface DeviceTelemetryService {

    void save(DeviceTelemetryDTO telemetry);

    List<DeviceLocationVO> getLatestLocations();

    DeviceTrackVO getTrack(String deviceId, int limit);
}
