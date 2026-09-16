package com.jeeplus.common.influxdb;

import com.influxdb.client.InfluxDBClient;
import com.influxdb.client.InfluxDBClientFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(
        prefix = "influxdb",          // 配置前缀
        name = "influxdbSwitch",      // 配置项名称
        havingValue = "true"      // 当值为true时生效
)
public class InfluxDBConfig {

    @Value("${influxdb.url}")
    private String url;

    @Value("${influxdb.username}")
    private String username;

    @Value("${influxdb.password}")
    private String password;

    @Value("${influxdb.token}")
    private String token;

    @Value("${influxdb.org}")
    private String org;

    @Value("${influxdb.bucket}")
    private String bucket;

    /**
     * 使用InfluxQL的语法，类似于SQL语法，如果用上边那种创建的客户端，需要使用flux的指令写法
     * @return
     */
    @Bean
    public InfluxDBClient influxDB() {
        return InfluxDBClientFactory.createV1(url, username, password.toCharArray(), org, bucket);
    }
}