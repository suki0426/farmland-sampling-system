package com.jeeplus.commons.websocket;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

/**
 * 定时任务组件，用于监控设备连接状态并对断线设备自动重连。
 * 从 YML 配置文件读取设备信息进行连接。
 */
@Component
public class DeviceReconnector implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DeviceReconnector.class);

    // 定时任务间隔（单位：秒），本例中为 60 秒
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

    // 从 YML 文件中读取设备信息
    @Value("${websocket.devices.ids}")
    private String deviceIds;

    @Value("${websocket.devices.addresses}")
    private String deviceAddresses;

    @Override
    public void run(String... args) throws Exception {
        // 每 60 秒检查一次断线设备并尝试重连
//        scheduler.scheduleAtFixedRate(this::reconnectLostDevices, 60, 60, TimeUnit.SECONDS);
    }

    /**
     * 检查从 YML 配置文件加载的设备列表并尝试重连
     */
//    private void reconnectLostDevices() {
//        List<Device> devices = loadDevicesFromConfig();
//        WebSocketContainer container = ContainerProvider.getWebSocketContainer();
//
//        for (Device device : devices) {
//            // 如果 DeviceClientManager 中没有对应的 Session，则说明设备未连接
//            if (DeviceClientManager.getInstance().getSession(device.getId()) == null) {
//                try {
//                    logger.info("检测到设备 [{}] 未连接，尝试重连，地址：{}", device.getId(), device.getWsAddress());
//                    DeviceClientEndpoint endpoint = new DeviceClientEndpoint(device.getId());
//                    container.connectToServer(endpoint, URI.create(device.getWsAddress()));
//                } catch (Exception e) {
//                    logger.error("设备 [{}] 重连失败：{}", device.getId(), e.getMessage(), e);
//                }
//            }
//        }
//    }

    /**
     * 从配置文件中读取设备 ID 和地址并构建设备列表
     */
//    private List<Device> loadDevicesFromConfig() {
//        List<Device> list = new ArrayList<>();
//        String[] ids = deviceIds.split(",");
//        String[] addresses = deviceAddresses.split(",");
//        for (int i = 0; i < ids.length && i < addresses.length; i++) {
//            if (StringUtils.hasText(ids[i]) && StringUtils.hasText(addresses[i])) {
//                list.add(new Device(ids[i].trim(), addresses[i].trim()));
//            }
//        }
//        return list;
//    }

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