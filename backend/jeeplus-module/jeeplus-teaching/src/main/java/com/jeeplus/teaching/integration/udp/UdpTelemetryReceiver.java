package com.jeeplus.teaching.integration.udp;

import com.jeeplus.teaching.integration.config.DeviceUdpProperties;
import com.jeeplus.teaching.integration.dto.DeviceTelemetryDTO;
import com.jeeplus.teaching.integration.dto.UdpStatusVO;
import com.jeeplus.teaching.integration.service.DeviceTelemetryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.SmartLifecycle;
import org.springframework.stereotype.Component;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.SocketException;
import java.util.concurrent.atomic.AtomicLong;

/**
 * 非阻塞 Web 主线程的 UDP 生命周期组件。
 */
@Component
@ConditionalOnProperty(prefix = "integration.device-udp", name = "enabled", havingValue = "true")
public class UdpTelemetryReceiver implements SmartLifecycle {

    private static final Logger LOGGER = LoggerFactory.getLogger(UdpTelemetryReceiver.class);
    private static final int BUFFER_SIZE = 8192;

    private final DeviceUdpProperties properties;
    private final DeviceMessageDecoder decoder;
    private final DeviceTelemetryValidator validator;
    private final DeviceTelemetryService telemetryService;
    private final AtomicLong receivedCount = new AtomicLong();
    private final AtomicLong acceptedCount = new AtomicLong();
    private final AtomicLong rejectedCount = new AtomicLong();

    private volatile boolean running;
    private volatile DatagramSocket socket;
    private volatile Thread worker;

    public UdpTelemetryReceiver(DeviceUdpProperties properties, DeviceMessageDecoder decoder,
                                DeviceTelemetryValidator validator, DeviceTelemetryService telemetryService) {
        this.properties = properties;
        this.decoder = decoder;
        this.validator = validator;
        this.telemetryService = telemetryService;
    }

    @Override
    public synchronized void start() {
        if (running) {
            return;
        }
        try {
            socket = new DatagramSocket(properties.getPort());
            socket.setSoTimeout(1000);
            running = true;
            worker = new Thread(new Runnable() {
                @Override
                public void run() {
                    receiveLoop();
                }
            }, "field-sampling-udp-receiver");
            worker.setDaemon(true);
            worker.start();
            LOGGER.info("农田采样 UDP 接收器已启动，监听端口 {}", socket.getLocalPort());
        } catch (Exception exception) {
            running = false;
            closeSocket();
            LOGGER.error("农田采样 UDP 接收器启动失败，端口 {}", properties.getPort(), exception);
        }
    }

    @Override
    public synchronized void stop() {
        running = false;
        closeSocket();
        Thread currentWorker = worker;
        if (currentWorker != null && currentWorker != Thread.currentThread()) {
            try {
                currentWorker.join(1500L);
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
            }
        }
        LOGGER.info("农田采样 UDP 接收器已停止");
    }

    @Override
    public void stop(Runnable callback) {
        stop();
        callback.run();
    }

    @Override
    public boolean isRunning() {
        return running;
    }

    @Override
    public boolean isAutoStartup() {
        return true;
    }

    @Override
    public int getPhase() {
        return 0;
    }

    public UdpStatusVO getStatus() {
        UdpStatusVO status = new UdpStatusVO();
        status.setRunning(running);
        DatagramSocket currentSocket = socket;
        status.setPort(currentSocket == null ? properties.getPort() : currentSocket.getLocalPort());
        status.setReceivedCount(receivedCount.get());
        status.setAcceptedCount(acceptedCount.get());
        status.setRejectedCount(rejectedCount.get());
        return status;
    }

    private void receiveLoop() {
        while (running) {
            try {
                byte[] buffer = new byte[BUFFER_SIZE];
                DatagramPacket packet = new DatagramPacket(buffer, buffer.length);
                socket.receive(packet);
                receivedCount.incrementAndGet();
                byte[] payload = new byte[packet.getLength()];
                System.arraycopy(packet.getData(), packet.getOffset(), payload, 0, packet.getLength());
                process(payload);
            } catch (java.net.SocketTimeoutException ignored) {
                // 定期检查 running 标志，以支持优雅关闭。
            } catch (SocketException exception) {
                if (running) {
                    LOGGER.warn("UDP Socket 异常：{}", exception.getMessage());
                }
            } catch (Exception exception) {
                if (running) {
                    LOGGER.warn("UDP 报文接收异常：{}", exception.getMessage());
                }
            }
        }
    }

    private void process(byte[] payload) {
        try {
            DeviceTelemetryDTO telemetry = decoder.decode(payload);
            validator.validate(telemetry);
            telemetryService.save(telemetry);
            acceptedCount.incrementAndGet();
            LOGGER.debug("已接收设备 {} 的遥测数据", telemetry.getDeviceId());
        } catch (IllegalArgumentException exception) {
            rejectedCount.incrementAndGet();
            LOGGER.warn("丢弃非法 UDP 报文：{}", exception.getMessage());
        } catch (Exception exception) {
            rejectedCount.incrementAndGet();
            LOGGER.warn("保存 UDP 遥测数据失败：{}", exception.getMessage());
        }
    }

    private void closeSocket() {
        DatagramSocket currentSocket = socket;
        socket = null;
        if (currentSocket != null && !currentSocket.isClosed()) {
            currentSocket.close();
        }
    }
}
