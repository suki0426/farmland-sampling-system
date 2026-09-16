/**
 * Copyright &copy; 2021-2026 <a href="http://www.jeeplus.org/">JeePlus</a> All rights reserved.
 */
package com.jeeplus.config;

import com.alibaba.druid.support.http.StatViewServlet;
import com.google.common.collect.Lists;
import com.jeeplus.common.converter.StringToDateConverter;
import com.jeeplus.common.converter.mapper.JsonMapper;
import org.springframework.boot.web.servlet.ServletRegistrationBean;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.format.FormatterRegistry;
import org.springframework.http.MediaType;
import org.springframework.http.converter.ByteArrayHttpMessageConverter;
import org.springframework.http.converter.FormHttpMessageConverter;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.context.request.RequestContextListener;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.alibaba.druid.spring.boot.autoconfigure.properties.DruidStatProperties;
import com.alibaba.druid.util.Utils;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import javax.servlet.*;
import java.io.IOException;

/**
 * Created by jeeplus on 2021/9/28.
 */
@EnableWebMvc
@EnableCaching //开启缓存
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler ( "/static/**" ).addResourceLocations ( "classpath:/static/" );
        registry.addResourceHandler ( "/act/**" ).addResourceLocations ( "classpath:/act/" );
        registry.addResourceHandler ( "swagger-ui.html" ).addResourceLocations ( "classpath:/META-INF/resources/" );
        registry.addResourceHandler ( "doc.html" ).addResourceLocations ( "classpath:/META-INF/resources/" );
        registry.addResourceHandler ( "/webjars/**" ).addResourceLocations ( "classpath:/META-INF/resources/webjars/" );
    }

    /**
     * 配置后台返回数据的类型转换
     *
     * @param converters
     */
    @Override
    public void configureMessageConverters(List <HttpMessageConverter <?>> converters) {

        List <MediaType> supportedMediaTypes = Lists.newArrayList ( );
        supportedMediaTypes.add ( MediaType.APPLICATION_JSON_UTF8 );

        FormHttpMessageConverter formHttpMessageConverter = new FormHttpMessageConverter ( );
        converters.add ( formHttpMessageConverter );


        StringHttpMessageConverter stringHttpMessageConverter = new StringHttpMessageConverter ( );
        stringHttpMessageConverter.setSupportedMediaTypes ( supportedMediaTypes );
        converters.add ( stringHttpMessageConverter );


        MappingJackson2HttpMessageConverter mappingJackson2HttpMessageConverter = new MappingJackson2HttpMessageConverter ( );
        mappingJackson2HttpMessageConverter.setPrettyPrint ( false );
        mappingJackson2HttpMessageConverter.setSupportedMediaTypes ( supportedMediaTypes );
        mappingJackson2HttpMessageConverter.setObjectMapper ( new JsonMapper ( ) );
        converters.add ( mappingJackson2HttpMessageConverter );

        ByteArrayHttpMessageConverter byteArrayHttpMessageConverter = new ByteArrayHttpMessageConverter ( );
        List <MediaType> byteSupportedMediaTypes = Lists.newArrayList ( );
        byteSupportedMediaTypes.add ( MediaType.ALL );
        byteSupportedMediaTypes.add ( MediaType.IMAGE_PNG );
        byteSupportedMediaTypes.add ( MediaType.APPLICATION_OCTET_STREAM );
        byteSupportedMediaTypes.add ( MediaType.IMAGE_GIF );
        byteSupportedMediaTypes.add ( MediaType.IMAGE_JPEG );
        byteSupportedMediaTypes.add ( MediaType.valueOf ( "image/*" ) );
        byteArrayHttpMessageConverter.setSupportedMediaTypes ( byteSupportedMediaTypes );
        converters.add ( byteArrayHttpMessageConverter );


    }

    /**
     * 配置接收前台参数的类型转换
     *
     * @param registry
     */
    @Override
    public void addFormatters(FormatterRegistry registry) {
        registry.addConverter ( new StringToDateConverter ( ) );

    }

    /**
     * druidServlet注册
     */
    @Bean
    public ServletRegistrationBean druidServletRegistration() {
        ServletRegistrationBean registration = new ServletRegistrationBean ( new StatViewServlet ( ) );
        registration.addUrlMappings ( "/druid/*" );
        // 配置druid参数
        Map<String, String> initParams = new HashMap<>(16);
        // 默认访问用户密码 admin:admin
        initParams.put("loginUsername", "dadmin");
        initParams.put("loginPassword", "HDPEP7R#cfJE");
        // 允许访问的ip
        // initParams.put("allow", "127.0.0.1");
        // 黑名单ip，优先级比allow配置高
        // initParams.put("deny", "");
        registration.setInitParameters(initParams);
        return registration;
    }

    /**
     * request 请求参数主子线程共享
     * @return
     */
    @Bean
    public RequestContextListener requestContextListener(){
        return new RequestContextListener();
    }


    /**
     * @author Benjamin
     * @date 2024/1/6
     * @version 1.0.0
     * @description 过滤掉Druid监控页面Ad(广告)
     * @param properties
     * @return org.springframework.boot.web.servlet.FilterRegistrationBean
     */
    @Bean
    public FilterRegistrationBean removeDruidAdFilterRegistrationBean(DruidStatProperties properties) {
        // 获取web监控页面的参数
        DruidStatProperties.StatViewServlet config = properties.getStatViewServlet();
        // 提取common.js的配置路径
        String pattern = config.getUrlPattern() != null ? config.getUrlPattern() : "/druid/*";
        String commonJsPattern = pattern.replaceAll("\\*", "js/common.js");

        final String filePath = "support/http/resources/js/common.js";
        // 创建filter进行过滤
        Filter filter = new Filter() {
            @Override
            public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {
                filterChain.doFilter(servletRequest, servletResponse);
                // 重置缓冲区，响应头不会被重置
                servletResponse.resetBuffer();
                // 获取common.js
                String text = Utils.readFromResource(filePath);

                // 正则替换banner, 除去底部的广告信息
                text = text.replaceAll("<a.*?banner\"></a><br/>", "");
                text = text.replaceAll("powered.*?shrek.wang</a>", "");
                servletResponse.getWriter().write(text);
            }

        };

        FilterRegistrationBean registrationBean = new FilterRegistrationBean();
        registrationBean.setFilter(filter);
        registrationBean.addUrlPatterns(commonJsPattern);

        return registrationBean;
    }



}
