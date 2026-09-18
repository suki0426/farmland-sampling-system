package com.jeeplus.teaching.integration.udp;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jeeplus.teaching.integration.dto.DeviceTelemetryDTO;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;

/**
 * 当前联调 JSON Decoder，同时兼容协议草案中的 snake_case 标识字段。
 */
@Component
public class JsonDeviceMessageDecoder implements DeviceMessageDecoder {

    private final ObjectMapper objectMapper;

    public JsonDeviceMessageDecoder(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public DeviceTelemetryDTO decode(byte[] data) {
        try {
            JsonNode root = objectMapper.readTree(new String(data, StandardCharsets.UTF_8));
            if (root == null || !root.isObject()) {
                throw new IllegalArgumentException("UDP 报文必须是 JSON 对象");
            }
            DeviceTelemetryDTO telemetry = new DeviceTelemetryDTO();
            telemetry.setDeviceId(text(root, "deviceId", "device_id"));
            telemetry.setTaskId(text(root, "taskId", "task_id"));
            telemetry.setLongitude(decimal(root, "longitude"));
            telemetry.setLatitude(decimal(root, "latitude"));
            telemetry.setTimestamp(text(root, "timestamp"));
            telemetry.setCoordinateSystem(text(root, "coordinateSystem", "coordinate_system"));
            telemetry.setAltitude(decimal(root, "altitude"));
            telemetry.setSpeed(decimal(root, "speed"));
            telemetry.setHeading(decimal(root, "heading"));
            telemetry.setStatus(text(root, "status"));
            telemetry.setBattery(decimal(root, "battery"));
            return telemetry;
        } catch (IllegalArgumentException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalArgumentException("UDP JSON 报文解析失败", exception);
        }
    }

    private String text(JsonNode root, String... names) {
        JsonNode node = node(root, names);
        return node == null || node.isNull() ? null : node.asText();
    }

    private BigDecimal decimal(JsonNode root, String... names) {
        JsonNode node = node(root, names);
        if (node == null || node.isNull() || node.asText().trim().isEmpty()) {
            return null;
        }
        try {
            return new BigDecimal(node.asText());
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("字段 " + names[0] + " 必须为数字");
        }
    }

    private JsonNode node(JsonNode root, String... names) {
        for (String name : names) {
            JsonNode node = root.get(name);
            if (node != null) {
                return node;
            }
        }
        return null;
    }
}
