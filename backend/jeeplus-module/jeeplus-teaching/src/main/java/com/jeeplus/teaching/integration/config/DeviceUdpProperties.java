package com.jeeplus.teaching.integration.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 农田采样终端 UDP 联调配置。
 */
@ConfigurationProperties(prefix = "integration.device-udp")
public class DeviceUdpProperties {

    private boolean enabled;
    private int port = 9000;
    private int maxTrackSize = 1000;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public int getPort() {
        return port;
    }

    public void setPort(int port) {
        this.port = port;
    }

    public int getMaxTrackSize() {
        return maxTrackSize;
    }

    public void setMaxTrackSize(int maxTrackSize) {
        this.maxTrackSize = maxTrackSize;
    }
}
