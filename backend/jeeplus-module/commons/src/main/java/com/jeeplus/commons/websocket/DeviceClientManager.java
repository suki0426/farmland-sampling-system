package com.jeeplus.commons.websocket;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.websocket.Session;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 设备客户端会话管理器，采用单例模式管理所有设备的 WebSocket 客户端连接。
 * 提供添加、移除以及断开指定设备连接的功能。
 */
public class DeviceClientManager {

    private static final Logger logger = LoggerFactory.getLogger(DeviceClientManager.class);
    // 单例实例
    private static DeviceClientManager instance = new DeviceClientManager();
    // 保存设备ID与对应 WebSocket Session 的映射
    private ConcurrentHashMap<String, Session> sessionMap = new ConcurrentHashMap<>();

    // 私有构造方法，防止外部实例化
    private DeviceClientManager() {}

    /**
     * 获取单例实例
     *
     * @return DeviceClientManager 实例
     */
    public static DeviceClientManager getInstance() {
        return instance;
    }

    /**
     * 添加设备连接 Session。
     *
     * @param deviceId 设备ID
     * @param session  WebSocket Session
     */
    public void addSession(String deviceId, Session session) {
        sessionMap.put(deviceId, session);
        logger.info("设备 [{}]的会话添加成功，Session ID: {}", deviceId, session.getId());
    }

    /**
     * 移除设备连接 Session。
     *
     * @param deviceId 设备ID
     */
    public void removeSession(String deviceId) {
        sessionMap.remove(deviceId);
        logger.info("设备 [{}]的会话已移除", deviceId);
    }

    /**
     * 获取设备对应的 Session。
     *
     * @param deviceId 设备ID
     * @return 设备的 WebSocket Session，若不存在则返回 null
     */
    public Session getSession(String deviceId) {
        return sessionMap.get(deviceId);
    }

    /**
     * 主动断开指定设备的连接。
     *
     * @param deviceId 设备ID
     */
    public void disconnectDevice(String deviceId) {
        Session session = sessionMap.get(deviceId);
        if (session != null && session.isOpen()) {
            try {
                session.close();
                logger.info("设备 [{}]的连接已断开", deviceId);
            } catch (Exception e) {
                logger.error("断开设备 [{}]连接时出错", deviceId, e);
            }
        }
        sessionMap.remove(deviceId);
    }
}


