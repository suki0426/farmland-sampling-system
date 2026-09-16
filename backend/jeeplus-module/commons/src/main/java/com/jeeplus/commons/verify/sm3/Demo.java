package com.jeeplus.commons.verify.sm3;

import cn.hutool.crypto.digest.HMac;
import cn.hutool.crypto.digest.HmacAlgorithm;

import java.util.HashMap;
import java.util.Map;
import java.util.TreeMap;

public class Demo {
    public static void main(String[] args) {

        // ================== 1. 准备测试参数 ==================
        Map<String, String> requestParams = new HashMap<>();
        requestParams.put("timestamp", "1752552542");
        requestParams.put("endTime", "2025-07-14 09:10:00");
        requestParams.put("shopId", "1938062595353346048");
        requestParams.put("startTime", "2025-07-14 08:40:00");

        // 打印原始请求参数
        System.out.println("==== 原始请求参数 ====");

        // ================== 2. 生成待签名字符串 ==================
        String dataToSign = Demo.generateDataToSign(requestParams);
        System.out.println("\n==== 待签名字符串 ====");
        System.out.println(dataToSign);

        // ================== 3. 获取密钥 ==================
        String secretKey = System.getenv().getOrDefault("VERIFY_SECRET_KEY", "");

        // ================== 4. 计算签名 ==================
        System.out.println("\n==== 计算 HMAC-SM3 签名 ====");
        String signature = computeHmacSm3(secretKey, dataToSign);
        System.out.println("生成签名: " + signature);
        System.out.println("生成签名长度: " + signature.length());
    }

    public static String generateDataToSign(Map<String, String> params) {
        // 1. 按参数名排序
        Map<String, String> sortedParams = new TreeMap<>(params);

        // 2. 构造待签名字符串：key1=value1&key2=value2...
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> entry : sortedParams.entrySet()) {
            if (sb.length() > 0) {
                sb.append("&");
            }
            sb.append(entry.getKey()).append("=").append(entry.getValue());
        }

        return sb.toString();
    }

    public static String computeHmacSm3(String key, String data) {
        HMac mac = new HMac(HmacAlgorithm.HmacSM3, key.getBytes());
        return mac.digestHex(data);
    }
}
