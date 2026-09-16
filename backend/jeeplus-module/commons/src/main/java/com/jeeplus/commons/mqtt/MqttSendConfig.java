package com.jeeplus.commons.mqtt;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.mqtt.core.MqttPahoClientFactory;
import org.springframework.integration.mqtt.outbound.MqttPahoMessageHandler;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageHeaders;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.util.Assert;

import java.util.Map;

/**
 * @auther 高靖奇
 * @date 2026/2/5
 */
@Configuration
@ConditionalOnProperty(
        prefix = "mqtt",          // 配置前缀
        name = "mqttSwitch",      // 配置项名称
        havingValue = "true"      // 当值为true时生效
)
public class MqttSendConfig {
    private static final Logger logger = LoggerFactory.getLogger(MqttSendConfig.class);

    // 注入MQTT客户端工厂
    @Autowired
    private MqttPahoClientFactory mqttPahoClientFactory;

    // 注入ObjectMapper
    @Autowired
    private ObjectMapper objectMapper;

    @Value("${mqtt.clientId}")
    private String clientId;

    // 1. 定义MQTT消息发送处理器（向Broker发送消息的核心Bean）
    @Bean
    public MqttPahoMessageHandler mqttPahoMessageHandler() {
        // 构造发送处理器：客户端ID、MQTT工厂
        MqttPahoMessageHandler messageHandler = new MqttPahoMessageHandler(clientId, mqttPahoClientFactory);
        // 设置默认QoS（可在发送时覆盖，这里默认1，至少一次送达）
        messageHandler.setDefaultQos(1);
        // 设置是否保留消息（默认false，不保留）
        messageHandler.setDefaultRetained(false);
        // 开启异步发送（避免阻塞调用线程，可选，根据业务需求调整）
        messageHandler.setAsync(true);

        return messageHandler;
    }

    // 2. 封装通用的MQTT发送方法
    /**
     * 向指定MQTT主题发送消息（Map格式内容自动转为JSON字符串）
     * @param topic 消息主题（如：iot/device/send/001）
     * @param messageSO2 消息内容（Map格式）
     */
    public void sendMqttMessage(String topic, Map<String, Object> messageSO2) {
        // 1. 参数校验（避免空指针异常）
        Assert.hasText(topic, "MQTT发送主题不能为空");
        Assert.notNull(messageSO2, "MQTT发送消息内容不能为空");

        try {
            // 2. 将Map<String, Object> 转为 JSON字符串（MQTT消息体通常为JSON格式）
            String msgJson = objectMapper.writeValueAsString(messageSO2);

            // 3. 构建Spring Integration Message对象（封装主题和消息体）
            Message<String> message = MessageBuilder
                    .withPayload(msgJson) // 消息体（JSON字符串）
                    .setHeader(MessageHeaders.CONTENT_TYPE, "application/json") // 设置消息头（可选）
                    .setHeader("mqtt_topic", topic) // 指定发送主题
                    .build();

            // 4. 调用发送处理器发送消息
            mqttPahoMessageHandler().handleMessage(message);

            // 5. 打印发送日志
            logger.info("MQTT消息发送成功，主题：{}，消息内容：{}", topic, msgJson);

        } catch (JsonProcessingException e) {
            logger.error("MQTT消息发送失败：Map转JSON字符串异常，主题：{}，消息内容：{}", topic, messageSO2, e);
        } catch (Exception e) {
            logger.error("MQTT消息发送失败，主题：{}，消息内容：{}", topic, messageSO2, e);
        }
    }
}
