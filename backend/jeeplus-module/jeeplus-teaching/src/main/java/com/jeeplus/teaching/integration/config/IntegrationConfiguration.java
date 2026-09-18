package com.jeeplus.teaching.integration.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(DeviceUdpProperties.class)
public class IntegrationConfiguration {
}
