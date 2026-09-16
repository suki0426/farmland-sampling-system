package com.jeeplus.commons.websocket;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.util.StringUtils;

import javax.websocket.ContainerProvider;
import javax.websocket.WebSocketContainer;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;

/**
 * 应用启动时自动连接所有已知设备的组件。
 * 当前实现从 yml 配置文件中读取设备信息，且只有当配置启用时才连接。
 */
//@Component
public class AutoDeviceConnector implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(AutoDeviceConnector.class);

    // 从 YML 文件中读取设备信息
    @Value("${websocket.enabled:false}")
    private boolean websocketEnabled;

    @Value("${websocket.devices.ids}")
    private String deviceIds;

    @Value("${websocket.devices.addresses}")
    private String deviceAddresses;

    @Override
    public void run(String... args) throws Exception {
        // 只有在 websocketEnabled 为 true 时才连接设备
        if (websocketEnabled) {
            connectAllDevices();
        } else {
            logger.info("WebSocket 连接未启用，跳过设备连接过程。");
        }
    }

    /**
     * 启动时连接所有设备（从 yml 配置读取）
     */
    private void connectAllDevices() {
        List<Device> devices = loadDevicesFromConfig();
        WebSocketContainer container = ContainerProvider.getWebSocketContainer();

        for (Device device : devices) {
            try {
                logger.info("尝试连接设备 [{}]，地址：{}", device.getId(), device.getWsAddress());
                DeviceClientEndpoint endpoint = new DeviceClientEndpoint(device.getId());
                container.connectToServer(endpoint, URI.create(device.getWsAddress()));
            } catch (Exception e) {
                logger.error("设备 [{}]连接失败：{}", device.getId(), e.getMessage(), e);
            }
        }
    }

    /**
     * 从 YML 配置文件加载设备信息并构建设备列表
     */
    private List<Device> loadDevicesFromConfig() {
        List<Device> list = new ArrayList<>();
        String[] ids = deviceIds.split(",");
        String[] addresses = deviceAddresses.split(",");
        for (int i = 0; i < ids.length && i < addresses.length; i++) {
            if (StringUtils.hasText(ids[i]) && StringUtils.hasText(addresses[i])) {
                list.add(new Device(ids[i].trim(), addresses[i].trim()));
            }
        }
        return list;
    }

    // 设备类
    static class Device {
        private final String id;
        private final String wsAddress;

        public Device(String id, String wsAddress) {
            this.id = id;
            this.wsAddress = wsAddress;
        }

        public String getId() {
            return id;
        }

        public String getWsAddress() {
            return wsAddress;
        }
    }
}
