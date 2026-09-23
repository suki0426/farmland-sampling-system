package com.jeeplus.teaching.integration.udp;

import com.jeeplus.teaching.integration.dto.DeviceTelemetryDTO;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

/** 在 JSON 联调协议与 2 号二进制采样协议间安全分流。 */
@Component
@Primary
public class AutoDeviceMessageDecoder implements DeviceMessageDecoder {

    private final JsonDeviceMessageDecoder jsonDecoder;
    private final SamplingBinaryMessageDecoder binaryDecoder;

    public AutoDeviceMessageDecoder(JsonDeviceMessageDecoder jsonDecoder,
                                    SamplingBinaryMessageDecoder binaryDecoder) {
        this.jsonDecoder = jsonDecoder;
        this.binaryDecoder = binaryDecoder;
    }

    @Override
    public DeviceTelemetryDTO decode(byte[] data) {
        if (data != null && data.length >= 2 && (data[0] & 0xFF) == 0xFF && (data[1] & 0xFF) == 0x55) {
            return binaryDecoder.decode(data);
        }
        return jsonDecoder.decode(data);
    }
}
