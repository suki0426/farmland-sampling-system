package com.jeeplus.sys.utils;

import cn.hutool.core.util.StrUtil;
import cn.hutool.extra.spring.SpringUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jeeplus.common.redis.RedisUtils;
import com.jeeplus.sys.domain.SysConfig;
import com.jeeplus.sys.service.SysConfigService;
import com.jeeplus.sys.service.UserService;
import com.jeeplus.sys.service.dto.UserDTO;
import net.sf.json.JSONObject;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

public class MapUtils {


    @Autowired
    private static RestTemplate restTemplate;


    private static final Logger log = LoggerFactory.getLogger(MapUtils.class);

    /**
     * 查询定位API地址
     */
    private static final String locationApi = "http://api.tianditu.gov.cn/geocoder";

    /**
     * 根据HTTP请求方法获取信息
     *
     * @param params 请求参数，以Map形式传入
     * @param <T>    请求参数的类型
     * @return ResponseEntity对象，包含请求结果
     * @throws IllegalArgumentException 如果请求参数中缺少url或method，或者method不被支持，则抛出此异常
     * @throws ResourceAccessException 如果请求发生异常，如超时，则抛出此异常
     */
    public static <T> ResponseEntity<?> getInfoByHttpMethod(@RequestBody T params) {
        Map<String, Object> paramMap = (Map<String, Object>) params;

        // 从参数中提取url和method
        String url = (String) paramMap.get("url");
        if (url == null) {
            throw new IllegalArgumentException("Missing 'url' in the parameters.");
        }
        String methodStr = (String) paramMap.get("method");
        if (StrUtil.isEmpty(methodStr)) {
            throw new IllegalArgumentException("Missing 'method' in the parameters.");
        }
        HttpMethod method = HttpMethod.resolve(methodStr.toUpperCase());
        if (method == null) {
            throw new IllegalArgumentException("Unsupported HTTP method: " + methodStr);
        }
        // 从参数中提取验证token的url
        String verifyUrl = (String) paramMap.get("verifyUrl");
        String token = (String) paramMap.get("token");

        // 准备请求头和实体
        HttpHeaders headers = new HttpHeaders();


        // 设置验证token的URL
        if (StrUtil.isNotEmpty(verifyUrl)) {
            headers.set("verifyURL", verifyUrl);
            if (StrUtil.isNotEmpty(token)) {
                headers.set("token", token);
            }
        }

        // 从参数中移除url、token和method
        paramMap.remove("url");
        paramMap.remove("token");
        paramMap.remove("method");

        try {
            if (method.equals(HttpMethod.POST)) {
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<T> entity = new HttpEntity<>(params, headers);
                return restTemplate.postForEntity(url, entity, Map.class);
            } else if (method.equals(HttpMethod.GET)) {
                // 如果是GET请求，将参数拼接在url后面
                UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(url);
                // 序列化Map中的值
                ObjectMapper objectMapper = new ObjectMapper();
                // 在将参数添加到URL之前，检查并处理Map类型的值
                for (Map.Entry<String, Object> entry : paramMap.entrySet()) {
                    Object value = entry.getValue();
                    if (value instanceof Map) {
                        // 递归地处理Map值，这里简化为转换为JSON字符串
                        try {
                            String jsonString = objectMapper.writeValueAsString(value);
                            // 整个Map作为单个查询参数传递，使用如"param=jsonString"的格式
                            // 注意：这通常不是一个好的做法，因为URL长度有限制，且JSON需要URL编码
                            builder.queryParam("mapParam", jsonString);
                        } catch (Exception e) {
                            log.error("处理序列化异常:", e);
                            // 处理序列化异常
                            return ResponseEntity.badRequest().body("处理序列化异常");
                        }
                    } else {
                        // 非Map类型的值可以直接转换为字符串
                        builder.queryParam(entry.getKey(), String.valueOf(value));
                    }
                }
                // 确保值可以转为String
                // paramMap.forEach((key, value) -> builder.queryParam(key, value.toString()));
                URI uri = builder.build().toUri();
                ResponseEntity<String> responseEntity = restTemplate.exchange(uri, HttpMethod.GET, new HttpEntity<>(headers), String.class);
                if (responseEntity.getStatusCode().is2xxSuccessful()) {
                    // 判断ContenType是type为text需要转换为JSONObject
                    if ("text".equals(Objects.requireNonNull(responseEntity.getHeaders().getContentType()).getType())) {
                        String sr = Objects.requireNonNull(responseEntity.getBody());
                        JSONObject json = JSONObject.fromObject(sr);
                        return ResponseEntity.ok(json);
                    }
                    return responseEntity;
                } else {
                    // 返回错误信息
                    return ResponseEntity.badRequest().body(responseEntity.getBody());
                }

            } else {
                throw new IllegalArgumentException("Unsupported HTTP method: " + method);
            }

        } catch (ResourceAccessException e) {
            // 检查异常的消息来判断是否是超时
            if (Objects.requireNonNull(e.getMessage()).contains("Read timed out") || e.getMessage().contains("Connect timed out") || e.getMessage().contains("Connection timed out")) {
                // 处理超时异常，返回正常提示
                return ResponseEntity.badRequest().body("请求超时，请稍后再试。");
            } else {
                // 处理其他ResourceAccessException异常
                return ResponseEntity.badRequest().body("服务器内部错误：" + e.getMessage());
            }
        } catch (Exception e) {
            // 捕获其他异常
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("服务器内部错误：" + e.getMessage());
        }
    }

    /**
     * 获取系统配置的MapKey。
     *
     * <p>此方法首先从Spring容器中获取SysConfigService的实例。
     * 如果获取失败（即sysConfigService为null），则直接返回空字符串。
     * @return 系统配置的MapKey，如果获取失败或配置信息不完整，则返回空字符串。
     */
    public static String getMapKey() {
        SysConfigService sysConfigService = SpringUtil.getBean(SysConfigService.class);
        if (sysConfigService == null) {
            return "";
        }
        SysConfig sysConfig = sysConfigService.getById(1);
        if (sysConfig == null || StringUtils.isEmpty(sysConfig.getMapKey())) {
            return "";
        }
        return sysConfig.getMapKey();
    }


    /**
     * 根据给定的经纬度坐标，通过天地图接口获取地理位置信息。
     *
     * @param lon 经度坐标，单位为米，需转换为度。
     * @param lat 纬度坐标，单位为米，需转换为度。
     * @return 返回地理位置信息的JSON字符串，如果无法获取或处理失败，则返回空字符串。
     *
     */
    public static String geocoder(Integer lon, Integer lat) {
        String mapKey = getMapKey();
        if (StrUtil.isEmpty(mapKey)) {
            return "";
        }

        // 经纬度转换
        double lonDegree = lon * 0.000001;
        double latDegree = lat * 0.000001;

        // 创建JSON字符串
        JSONObject postStrJson = new JSONObject();
        postStrJson.put("lon", lonDegree);
        postStrJson.put("lat", latDegree);
        postStrJson.put("ver", 1);
        String postStr = postStrJson.toString();

        // 构建URL
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(locationApi)
                .queryParam("postStr", postStr)
                .queryParam("type", "geocode")
                .queryParam("tk", mapKey);
        String reverseGeocodeQueryUrl = builder.toUriString();

        // 初始化请求参数
        Map<String, Object> reverseGeocodeQueryMap = new HashMap<>();
        reverseGeocodeQueryMap.put("url", reverseGeocodeQueryUrl);
        reverseGeocodeQueryMap.put("method", "get");

        // 发送请求
        ResponseEntity<?> reverseGeocodeQueryResponseEntity = getInfoByHttpMethod(reverseGeocodeQueryMap);
        if (reverseGeocodeQueryResponseEntity.getBody() == null) {
            return "";
        }

        String reverseGeocodeResponseStr = reverseGeocodeQueryResponseEntity.getBody().toString();
        if (StringUtils.isEmpty(reverseGeocodeResponseStr)) {
            return "";
        }

        JSONObject reverseGeocodeJson = JSONObject.fromObject(reverseGeocodeResponseStr);
        if (reverseGeocodeJson == null) {
            return "";
        }

        JSONObject reverseGeocodeData = reverseGeocodeJson.getJSONObject("result");
        if (reverseGeocodeData == null) {
            return "";
        }

        JSONObject addressComponentData = reverseGeocodeData.getJSONObject("addressComponent");
        if (addressComponentData == null) {
            return "";
        }

        return reverseGeocodeData.toString();
    }



}
