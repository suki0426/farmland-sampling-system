package com.jeeplus.teaching.integration.udp;

import com.jeeplus.teaching.integration.dto.DeviceTelemetryDTO;

/**
 * 设备报文可替换解码边界。
 * TODO [Integration-2]: 设备协议冻结后，如不是 JSON，新增对应 Decoder 实现。
 */
public interface DeviceMessageDecoder {

    DeviceTelemetryDTO decode(byte[] data);
}
