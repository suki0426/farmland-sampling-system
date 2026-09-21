package com.jeeplus.teaching.integration.udp;

import com.jeeplus.teaching.integration.dto.DeviceTelemetryDTO;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;

/**
 * 解码 2 号模拟器的采样二进制帧。
 *
 * 帧格式：FF55 + pointCode(u16, BE) + latitude(i32, BE, 1e7) +
 * longitude(i32, BE, 1e7) + 6 个传感器字节 + deviceId(16 bytes, ASCII) +
 * CRC-16/MODBUS(u16, LE)。
 */
@Component
public class SamplingBinaryMessageDecoder implements DeviceMessageDecoder {

    private static final int HEADER_SIZE = 2;
    private static final int PAYLOAD_SIZE = 16;
    private static final int DEVICE_ID_SIZE = 16;
    private static final int CRC_SIZE = 2;
    private static final int FRAME_SIZE = HEADER_SIZE + PAYLOAD_SIZE + DEVICE_ID_SIZE + CRC_SIZE;

    @Override
    public DeviceTelemetryDTO decode(byte[] data) {
        if (data == null || data.length != FRAME_SIZE) {
            throw new IllegalArgumentException("采样二进制帧长度必须为 " + FRAME_SIZE + " 字节；旧 20 字节帧缺少 deviceId，不能安全入库");
        }
        if ((data[0] & 0xFF) != 0xFF || (data[1] & 0xFF) != 0x55) {
            throw new IllegalArgumentException("采样二进制帧头必须为 FF55");
        }
        int expectedCrc = ((data[data.length - 1] & 0xFF) << 8) | (data[data.length - 2] & 0xFF);
        if (crc16Modbus(data, data.length - CRC_SIZE) != expectedCrc) {
            throw new IllegalArgumentException("采样二进制帧 CRC-16/MODBUS 校验失败");
        }

        ByteBuffer buffer = ByteBuffer.wrap(data).order(ByteOrder.BIG_ENDIAN);
        buffer.position(HEADER_SIZE);
        buffer.getShort(); // pointCode 仅用于采样点关联，当前实时轨迹不覆盖该字段。
        int latitudeScaled = buffer.getInt();
        int longitudeScaled = buffer.getInt();
        buffer.position(buffer.position() + 6); // 传感器字段由监测记录持久化模块消费。
        byte[] deviceBytes = new byte[DEVICE_ID_SIZE];
        buffer.get(deviceBytes);
        String deviceId = new String(deviceBytes, StandardCharsets.US_ASCII).replace("\u0000", "").trim();
        if (deviceId.isEmpty()) {
            throw new IllegalArgumentException("采样二进制帧 deviceId 不能为空");
        }

        DeviceTelemetryDTO telemetry = new DeviceTelemetryDTO();
        telemetry.setDeviceId(deviceId);
        telemetry.setLatitude(BigDecimal.valueOf(latitudeScaled, 7));
        telemetry.setLongitude(BigDecimal.valueOf(longitudeScaled, 7));
        telemetry.setCoordinateSystem("WGS84");
        telemetry.setTimestamp(OffsetDateTime.now().toString());
        return telemetry;
    }

    private int crc16Modbus(byte[] data, int length) {
        int crc = 0xFFFF;
        for (int index = 0; index < length; index++) {
            crc ^= data[index] & 0xFF;
            for (int bit = 0; bit < 8; bit++) {
                crc = (crc & 1) != 0 ? (crc >>> 1) ^ 0xA001 : crc >>> 1;
            }
        }
        return crc & 0xFFFF;
    }
}
