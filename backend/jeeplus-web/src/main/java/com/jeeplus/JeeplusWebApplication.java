package com.jeeplus;

import com.alibaba.druid.spring.boot.autoconfigure.DruidDataSourceAutoConfigure;
import com.anwen.mongo.config.MongoPropertyConfiguration;
import com.anwen.mongo.config.OverrideMongoConfiguration;
import com.anwen.mongo.config.MongoPlusConfiguration;
import com.anwen.mongo.transactional.MongoTransactionManagerAutoConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration;
import org.springframework.boot.autoconfigure.mongo.MongoReactiveAutoConfiguration;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.ServletComponentScan;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;


@ServletComponentScan("com.jeeplus")
@SpringBootApplication(scanBasePackages = {"com.jeeplus", "cn.hutool.extra.spring","org.flowable.ui.modeler", "org.flowable.ui.common"},
        exclude = {
                DruidDataSourceAutoConfigure.class,
                org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class,
                // 为了适配MongoTemplate，OverrideMongoConfiguration做了一些配置，但是和低版本的并不兼容，所以只需将OverrideMongoConfiguration排除即可
                OverrideMongoConfiguration.class,
                MongoPropertyConfiguration.class,
                MongoAutoConfiguration.class, // Spring Boot原生MongoDB自动配置类
                com.anwen.mongo.config.MongoPlusAutoConfiguration.class, // MongoPlus核心自动配置类
                MongoReactiveAutoConfiguration.class,
                MongoPlusConfiguration.class,
                MongoTransactionManagerAutoConfiguration.class
        }
)
public class JeeplusWebApplication extends SpringBootServletInitializer {

    // 其中 dataSource 框架会自动为我们注入
    @Bean
    public PlatformTransactionManager txManager(DataSource dataSource) {
        return new DataSourceTransactionManager ( dataSource );
    }

    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder builder) {
        // 注意这里要指向原先用main方法执行的Application启动类
        return builder.sources ( JeeplusWebApplication.class );
    }

    public static void main(String[] args) {
        SpringApplication.run ( JeeplusWebApplication.class, args );
    }

}
