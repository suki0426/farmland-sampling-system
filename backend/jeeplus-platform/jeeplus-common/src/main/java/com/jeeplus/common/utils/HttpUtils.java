package com.jeeplus.common.utils;

import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.impl.client.CloseableHttpClient;
import org.springframework.http.*;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import javax.net.ssl.*;
import java.net.URI;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.util.HashMap;
import java.util.Map;


/**
 * HTTP请求工具类，支持GET、POST方法，同时支持HTTP和HTTPS协议
 *
 * @auther 高靖奇
 * @date 2025/8/18
 */
public class HttpUtils {

    private static final RestTemplate restTemplate;

    static {
        // 初始化RestTemplate，配置支持HTTPS
        HttpComponentsClientHttpRequestFactory requestFactory = new HttpComponentsClientHttpRequestFactory();
        // 设置连接超时时间 5秒
        requestFactory.setConnectTimeout(10000);
        // 设置读取超时时间 10秒
        requestFactory.setReadTimeout(10000);

        // 配置支持HTTPS，忽略SSL证书验证
        requestFactory.setHttpClient(createIgnoreVerifySSLClient());

        restTemplate = new RestTemplate(requestFactory);
    }

    /**
     * 发送HTTP请求
     * @param url 请求URL
     * @param method 请求方法（GET/POST）
     * @param headers 请求头
     * @param params 请求参数（查询参数）
     * @param body 请求体
     * @return 响应结果
     */
    public static String sendRequest(String url, HttpMethod method,
                                     Map<String, String> headers,
                                     Map<String, String> params,
                                     Object body) {
        // 创建请求头
        HttpHeaders httpHeaders = new HttpHeaders();
        if (headers != null) {
            headers.forEach(httpHeaders::set);
        }

        // 设置默认Content-Type
        if (!httpHeaders.containsKey(HttpHeaders.CONTENT_TYPE)) {
            httpHeaders.setContentType(MediaType.APPLICATION_JSON);
        }

        // 构建请求实体
        HttpEntity<Object> requestEntity = new HttpEntity<>(body, httpHeaders);

        // 处理查询参数
        UriComponentsBuilder uriBuilder = UriComponentsBuilder.fromHttpUrl(url);
        if (params != null && !params.isEmpty()) {
            params.forEach(uriBuilder::queryParam);
        }
        URI uri = uriBuilder.build().toUri();

        // 发送请求并返回结果
        ResponseEntity<String> response = restTemplate.exchange(
                uri, method, requestEntity, String.class);

        return response.getBody();
    }

    /**
     * 发送GET请求
     * @param url 请求URL
     * @return 响应结果
     */
    public static String get(String url) {
        return sendRequest(url, HttpMethod.GET, null, null, null);
    }

    /**
     * 发送带参数的GET请求
     * @param url 请求URL
     * @param params 请求参数
     * @return 响应结果
     */
    public static String get(String url, Map<String, String> params) {
        return sendRequest(url, HttpMethod.GET, null, params, null);
    }

    /**
     * 发送POST请求（仅带URL和请求体）
     * @param url 请求URL
     * @param body 请求体
     * @return 响应结果
     */
    public static String post(String url, Object body) {
        return sendRequest(url, HttpMethod.POST, null, null, body);
    }

    /**
     * 发送带请求头的POST请求
     * @param url 请求URL
     * @param headers 请求头
     * @param body 请求体
     * @return 响应结果
     */
//    public static String post(String url, Map<String, String> headers, Object body) {
//        return sendRequest(url, HttpMethod.POST, headers, null, body);
//    }

    /**
     * 发送带参数的POST请求
     * @param url 请求URL
     * @param params 请求参数
     * @param body 请求体
     * @return 响应结果
     */
    public static String post(String url, Map<String, String> params, Object body) {
        return sendRequest(url, HttpMethod.POST, null, params, body);
    }

    /**
     * 发送带请求头和参数的POST请求
     * @param url 请求URL
     * @param headers 请求头
     * @param params 请求参数
     * @param body 请求体
     * @return 响应结果
     */
    public static String post(String url, Map<String, String> headers, Map<String, String> params, Object body) {
        return sendRequest(url, HttpMethod.POST, headers, params, body);
    }

    /**
     * 创建忽略SSL证书验证的HttpClient
     * @return HttpClient实例
     */
    private static CloseableHttpClient createIgnoreVerifySSLClient() {
        try {
            // 创建SSLContext
            SSLContext sslContext = SSLContext.getInstance("SSL");

            // 实现一个X509TrustManager接口，用于绕过验证
            X509TrustManager trustManager = new X509TrustManager() {
                @Override
                public void checkClientTrusted(X509Certificate[] chain, String authType) throws CertificateException {}

                @Override
                public void checkServerTrusted(X509Certificate[] chain, String authType) throws CertificateException {}

                @Override
                public X509Certificate[] getAcceptedIssuers() {
                    return new X509Certificate[0];
                }
            };

            sslContext.init(null, new TrustManager[]{trustManager}, new java.security.SecureRandom());

            // 获取SSLConnectionSocketFactory
            SSLConnectionSocketFactory sslsf = new SSLConnectionSocketFactory(
                    sslContext,
                    NoopHostnameVerifier.INSTANCE);

            // 创建HttpClient
            return org.apache.http.impl.client.HttpClients.custom()
                    .setSSLSocketFactory(sslsf)
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("创建HTTPS客户端失败", e);
        }
    }

    public static void main(String[] args) {
        // 1. 发送简单的GET请求（HTTP/HTTPS均可）
        String getResult = HttpUtils.get("https://api.example.com/public/data");
        System.out.println("GET请求结果: " + getResult);

        // 2. 发送带参数的GET请求
        Map<String, String> params = new HashMap<>();
        params.put("id", "12345");
        params.put("type", "normal");
        String getWithParamsResult = HttpUtils.get("https://api.example.com/user/info", params);
        System.out.println("带参数的GET请求结果: " + getWithParamsResult);

        // 3. 发送JSON格式的POST请求
        // 构建请求体（可以是简单Map或自定义JavaBean）
        Map<String, Object> postBody = new HashMap<>();
        postBody.put("username", "testUser");
        postBody.put("password", "testPass123");
        String postJsonResult = HttpUtils.post("https://api.example.com/login", postBody);
        System.out.println("JSON POST请求结果: " + postJsonResult);

        // 4. 发送带参数的POST请求
        Map<String, String> postParams = new HashMap<>();
        postParams.put("id", "12345");
        postParams.put("type", "normal");

        // 表单格式请求体
        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("name", "张三");
        formData.add("email", "zhangsan@example.com");

        String postWithHeadersResult = HttpUtils.post("https://api.example.com/user/update", postParams, formData);
        System.out.println("带请求头的POST请求结果: " + postWithHeadersResult);
    }
}

