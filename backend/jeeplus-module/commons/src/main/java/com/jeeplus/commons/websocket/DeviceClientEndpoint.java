package com.jeeplus.commons.websocket;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.websocket.*;
import java.nio.ByteBuffer;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

/**
 * WebSocket 客户端端点，用于连接远程设备。
 * 实现了心跳检测功能（每 30 秒发送一次 Ping 消息）以及基本的连接、消息、关闭和错误处理。
 */
@ClientEndpoint
public class DeviceClientEndpoint {

    private static final Logger logger = LoggerFactory.getLogger(DeviceClientEndpoint.class);
    // 心跳间隔时间（单位：秒）
    private static final long HEARTBEAT_INTERVAL = 30;

    // 设备ID
    private String deviceId;
    // 当前 WebSocket 连接会话
    private Session session;
    // 独立线程池用于执行心跳任务
    private ScheduledExecutorService heartbeatScheduler = Executors.newSingleThreadScheduledExecutor();
    // 心跳任务的 Future 对象，用于取消任务
    private ScheduledFuture<?> heartbeatTask;

    /**
     * 构造方法，传入设备ID。
     *
     * @param deviceId 设备ID
     */
    public DeviceClientEndpoint(String deviceId) {
        this.deviceId = deviceId;
    }

    /**
     * 当连接建立成功时调用此方法。
     * 保存 Session，并将连接添加到 DeviceClientManager 中，
     * 同时启动心跳检测任务。
     *
     * @param session 当前连接的 Session
     */
    @OnOpen
    public void onOpen(Session session) {
        this.session = session;
        logger.info("成功连接设备 [{}]，Session ID: {}", deviceId, session.getId());
        // 保存连接到会话管理器中
        DeviceClientManager.getInstance().addSession(deviceId, session);
        // 启动心跳检测任务
        startHeartbeat();
    }

    /**
     * 启动心跳检测任务，每 HEARTBEAT_INTERVAL 秒发送一次 Ping 消息。
     */
    private void startHeartbeat() {
        heartbeatTask = heartbeatScheduler.scheduleAtFixedRate(() -> {
            if (session != null && session.isOpen()) {
                try {
                    // 发送 Ping 消息检测连接状态
                    session.getAsyncRemote().sendPing(ByteBuffer.wrap("ping".getBytes()));
                    logger.debug("已向设备 [{}]发送心跳 ping", deviceId);
                } catch (Exception e) {
                    logger.error("设备 [{}]发送心跳失败", deviceId, e);
                }
            }
        }, HEARTBEAT_INTERVAL, HEARTBEAT_INTERVAL, TimeUnit.SECONDS);
    }

    /**
     * 处理服务端返回的 Pong 消息，表示心跳检测正常。
     *
     * @param pong    Pong 消息
     * @param session 当前连接的 Session
     */
    @OnMessage
    public void onPong(PongMessage pong, Session session) {
        logger.debug("设备 [{}]响应心跳 pong", deviceId);
    }

    /**
     * 处理接收到的文本消息。
     *
     * @param message 接收到的消息
     * @param session 当前连接的 Session
     */
    @OnMessage
    public void onMessage(String message, Session session) {
        logger.info("收到设备 [{}]的消息: {}", deviceId, message);
    }

    /**
     * 当连接关闭时调用此方法。
     * 移除会话，并取消心跳任务，释放线程资源。
     *
     * @param session      当前连接的 Session
     * @param closeReason  关闭原因
     */
    @OnClose
    public void onClose(Session session, CloseReason closeReason) {
        logger.info("设备 [{}]连接关闭，原因：{}", deviceId, closeReason);
        // 从会话管理器中移除
        DeviceClientManager.getInstance().removeSession(deviceId);
        // 取消心跳任务，释放线程池资源
        if (heartbeatTask != null) {
            heartbeatTask.cancel(true);
        }
        heartbeatScheduler.shutdownNow();
    }

    /**
     * 当连接发生错误时调用。
     *
     * @param session 当前连接的 Session
     * @param thr     异常信息
     */
    @OnError
    public void onError(Session session, Throwable thr) {
        logger.error("设备 [{}]连接异常：{}", deviceId, thr.getMessage(), thr);
    }
}
