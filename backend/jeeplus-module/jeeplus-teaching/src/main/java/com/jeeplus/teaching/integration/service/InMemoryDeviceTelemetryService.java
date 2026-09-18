package com.jeeplus.teaching.integration.service;

import com.jeeplus.teaching.integration.config.DeviceUdpProperties;
import com.jeeplus.teaching.integration.dto.DeviceLocationVO;
import com.jeeplus.teaching.integration.dto.DeviceTelemetryDTO;
import com.jeeplus.teaching.integration.dto.DeviceTrackVO;
import com.jeeplus.teaching.integration.dto.TrackPointVO;
import org.springframework.stereotype.Service;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 仅用于开发联调的线程安全内存实现；重启应用后数据会丢失。
 */
@Service
public class InMemoryDeviceTelemetryService implements DeviceTelemetryService {

    private final Map<String, DeviceTelemetryDTO> latestByDevice = new ConcurrentHashMap<String, DeviceTelemetryDTO>();
    private final Map<String, TrackBuffer> trackByDevice = new ConcurrentHashMap<String, TrackBuffer>();
    private final int maxTrackSize;

    public InMemoryDeviceTelemetryService(DeviceUdpProperties properties) {
        this.maxTrackSize = Math.max(1, properties.getMaxTrackSize());
    }

    @Override
    public void save(DeviceTelemetryDTO telemetry) {
        DeviceTelemetryDTO copied = copyTelemetry(telemetry);
        latestByDevice.put(copied.getDeviceId(), copied);
        TrackBuffer buffer = trackByDevice.get(copied.getDeviceId());
        if (buffer == null) {
            TrackBuffer candidate = new TrackBuffer(maxTrackSize);
            TrackBuffer existing = trackByDevice.putIfAbsent(copied.getDeviceId(), candidate);
            buffer = existing == null ? candidate : existing;
        }
        buffer.add(copied);
    }

    @Override
    public List<DeviceLocationVO> getLatestLocations() {
        List<DeviceLocationVO> locations = new ArrayList<DeviceLocationVO>();
        for (DeviceTelemetryDTO telemetry : latestByDevice.values()) {
            locations.add(toLocation(telemetry));
        }
        Collections.sort(locations, new Comparator<DeviceLocationVO>() {
            @Override
            public int compare(DeviceLocationVO left, DeviceLocationVO right) {
                return left.getDeviceId().compareTo(right.getDeviceId());
            }
        });
        return locations;
    }

    @Override
    public DeviceTrackVO getTrack(String deviceId, int limit) {
        DeviceTrackVO result = new DeviceTrackVO();
        result.setDeviceId(deviceId);
        TrackBuffer buffer = trackByDevice.get(deviceId);
        if (buffer == null) {
            return result;
        }
        List<DeviceTelemetryDTO> telemetryList = buffer.list(Math.max(1, limit));
        List<TrackPointVO> points = new ArrayList<TrackPointVO>();
        for (DeviceTelemetryDTO telemetry : telemetryList) {
            TrackPointVO point = new TrackPointVO();
            point.setLongitude(telemetry.getLongitude());
            point.setLatitude(telemetry.getLatitude());
            point.setCoordinateSystem(telemetry.getCoordinateSystem());
            point.setTimestamp(telemetry.getTimestamp());
            points.add(point);
        }
        result.setPoints(points);
        return result;
    }

    private DeviceLocationVO toLocation(DeviceTelemetryDTO telemetry) {
        DeviceLocationVO location = new DeviceLocationVO();
        location.setDeviceId(telemetry.getDeviceId());
        location.setTaskId(telemetry.getTaskId());
        location.setLongitude(telemetry.getLongitude());
        location.setLatitude(telemetry.getLatitude());
        location.setCoordinateSystem(telemetry.getCoordinateSystem());
        location.setTimestamp(telemetry.getTimestamp());
        location.setStatus(telemetry.getStatus());
        return location;
    }

    private DeviceTelemetryDTO copyTelemetry(DeviceTelemetryDTO source) {
        DeviceTelemetryDTO copy = new DeviceTelemetryDTO();
        copy.setDeviceId(source.getDeviceId());
        copy.setTaskId(source.getTaskId());
        copy.setLongitude(source.getLongitude());
        copy.setLatitude(source.getLatitude());
        copy.setCoordinateSystem(source.getCoordinateSystem());
        copy.setTimestamp(source.getTimestamp());
        copy.setAltitude(source.getAltitude());
        copy.setSpeed(source.getSpeed());
        copy.setHeading(source.getHeading());
        copy.setStatus(source.getStatus());
        copy.setBattery(source.getBattery());
        return copy;
    }

    private static final class TrackBuffer {
        private final int capacity;
        private final Deque<DeviceTelemetryDTO> values = new ArrayDeque<DeviceTelemetryDTO>();

        private TrackBuffer(int capacity) {
            this.capacity = capacity;
        }

        private synchronized void add(DeviceTelemetryDTO telemetry) {
            while (values.size() >= capacity) {
                values.removeFirst();
            }
            values.addLast(telemetry);
        }

        private synchronized List<DeviceTelemetryDTO> list(int limit) {
            List<DeviceTelemetryDTO> result = new ArrayList<DeviceTelemetryDTO>(values);
            if (result.size() <= limit) {
                return result;
            }
            return new ArrayList<DeviceTelemetryDTO>(result.subList(result.size() - limit, result.size()));
        }
    }
}
