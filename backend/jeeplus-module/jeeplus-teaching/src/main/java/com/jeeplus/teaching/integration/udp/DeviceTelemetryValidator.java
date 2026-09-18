package com.jeeplus.teaching.integration.udp;

import com.jeeplus.teaching.integration.dto.DeviceTelemetryDTO;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

@Component
public class DeviceTelemetryValidator {

    private static final DateTimeFormatter LOCAL_DATE_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public void validate(DeviceTelemetryDTO telemetry) {
        if (telemetry == null) {
            throw new IllegalArgumentException("遥测数据不能为空");
        }
        if (isBlank(telemetry.getDeviceId())) {
            throw new IllegalArgumentException("deviceId 不能为空");
        }
        validateRange(telemetry.getLongitude(), new BigDecimal("-180"), new BigDecimal("180"), "longitude");
        validateRange(telemetry.getLatitude(), new BigDecimal("-90"), new BigDecimal("90"), "latitude");
        if (!isTimestamp(telemetry.getTimestamp())) {
            throw new IllegalArgumentException("timestamp 格式不合法");
        }
    }

    private void validateRange(BigDecimal value, BigDecimal min, BigDecimal max, String field) {
        if (value == null || value.compareTo(min) < 0 || value.compareTo(max) > 0) {
            throw new IllegalArgumentException(field + " 超出合法范围");
        }
    }

    private boolean isTimestamp(String value) {
        if (isBlank(value)) {
            return false;
        }
        try {
            OffsetDateTime.parse(value);
            return true;
        } catch (DateTimeParseException ignored) {
            try {
                LocalDateTime.parse(value, LOCAL_DATE_TIME);
                return true;
            } catch (DateTimeParseException ignoredAgain) {
                return false;
            }
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
