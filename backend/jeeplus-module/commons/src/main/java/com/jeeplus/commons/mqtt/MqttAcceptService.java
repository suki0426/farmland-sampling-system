package com.jeeplus.commons.mqtt;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.channel.ExecutorChannel;
import org.springframework.integration.mqtt.core.DefaultMqttPahoClientFactory;
import org.springframework.integration.mqtt.core.MqttPahoClientFactory;
import org.springframework.integration.mqtt.inbound.MqttPahoMessageDrivenChannelAdapter;
import org.springframework.integration.mqtt.support.DefaultPahoMessageConverter;
import org.springframework.messaging.MessageHandler;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import javax.annotation.Resource;
import java.util.Map;
import java.util.concurrent.Executor;

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
public class MqttAcceptService {

    @Value("${mqtt.brokerUrl}")
    private String brokerUrl;

    @Value("${mqtt.clientId}")
    private String clientId;

    @Value("${mqtt.username}")
    private String username;

    @Value("${mqtt.password}")
    private String password;

    @Value("${mqtt.mqttSwitch}")
    private Boolean mqttSwitch;

    @Resource
    private ObjectMapper objectMapper;

    @Resource
    @Qualifier("mqttMsgTaskExecutor")
    private Executor mqttMsgTaskExecutor;

    private final static Logger logger = LoggerFactory.getLogger(MqttAcceptService.class);


    @Bean
    public MqttPahoClientFactory clientFactory() {
        // 创建默认的MQTT客户端工厂
        DefaultMqttPahoClientFactory factory = new DefaultMqttPahoClientFactory();

        // 配置MQTT连接参数
        MqttConnectOptions connectOptions = new MqttConnectOptions();

        // 关键配置：MQTT Broker 地址（tcp://ip:端口，默认1883）
        connectOptions.setServerURIs(new String[]{brokerUrl});

        // 保持连接（心跳时间，单位秒）
        connectOptions.setKeepAliveInterval(60);

        // 断线自动重连
        connectOptions.setAutomaticReconnect(true);

        connectOptions.setUserName(username);
        connectOptions.setPassword(password.toCharArray());

        // 将连接参数设置到工厂中
        factory.setConnectionOptions(connectOptions);

        return factory;
    }

    // 1. 定义MQTT消息处理的线程池
    @Bean(name = "mqttMsgTaskExecutor")
    public Executor mqttMsgTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        // 注入线程池配置
        executor.setCorePoolSize(16); // 核心线程数
        executor.setMaxPoolSize(32); // 最大线程数
        executor.setQueueCapacity(25); // 任务队列容量
        executor.setThreadNamePrefix("mqtt-message-"); // 线程名称前缀，方便排查问题
        executor.initialize();
        return executor;
    }

    // 2. 定义MQTT消息通道（绑定线程池）
    @Bean
    public ExecutorChannel mqttInputChannel(@Qualifier("mqttMsgTaskExecutor") Executor mqttMsgTaskExecutor) {
        return new ExecutorChannel(mqttMsgTaskExecutor);
    }

    // 3. MQTT消息驱动适配器（接收Broker推送的消息）
    @Bean
    public MqttPahoMessageDrivenChannelAdapter mqttInbound(
            MqttPahoClientFactory clientFactory,
            ExecutorChannel mqttInputChannel) {
        MqttPahoMessageDrivenChannelAdapter adapter =
                new MqttPahoMessageDrivenChannelAdapter(clientId, clientFactory,
                        "$share/iot-data-group/yckg_info/#",
                        "$share/iot-data-group/yckg_op_r/#");
        adapter.setCompletionTimeout(5000);
        adapter.setConverter(new DefaultPahoMessageConverter());
        adapter.setQos(1);
        adapter.setOutputChannel(mqttInputChannel);
        return adapter;
    }

    // 4. 消息处理器（核心：处理物联网数据，多线程执行）
    @Bean
    @ServiceActivator(inputChannel = "mqttInputChannel")
    public MessageHandler mqttMessageHandler() {
        return message -> {
            // 消息体：MQTT推送的设备数据
            String msgContent = message.getPayload().toString();
            // 消息头：可获取主题、QoS等信息
            String topic = message.getHeaders().get("mqtt_receivedTopic").toString();
            // 此处为多线程执行，可直接做解析、入库、业务处理
            handleIotData(topic, msgContent);
        };
    }

    // 逻辑处理
    private void handleIotData(String topic, String msgContent) {
        if (!mqttSwitch) {
            //mqtt消息不处理
            return;
        }
        try {
            logger.info(topic + "_MqttMessage: " + msgContent);
            //将消息体转为Map类型
            Map<String, Object> mqttMessageSO =  objectMapper.readValue(msgContent,
                    new TypeReference<Map<String, Object>>() {});
            /**
             * 处理业务逻辑
             */

            // 提交六路任务到线程池
            mqttMsgTaskExecutor.execute(() -> {
                try {
                    //处理业务相关数据

                } catch (Exception e) {
                    logger.error("MQTT消息处理失败，topic：{}", topic, e);
                }
            });

        } catch (JsonProcessingException e) {
            logger.error("JSON格式解析失败，原始消息内容：{}", msgContent);
            return;
        }
    }

}
