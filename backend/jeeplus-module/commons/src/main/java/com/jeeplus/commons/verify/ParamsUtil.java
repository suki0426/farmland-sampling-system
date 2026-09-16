package com.jeeplus.commons.verify;

import com.alibaba.fastjson2.JSONObject;

import javax.servlet.http.HttpServletRequest;
import java.io.BufferedReader;
import java.security.PublicKey;
import java.security.Signature;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.TreeMap;

/**
 * 参数工具类
 */
public class ParamsUtil {
    public static Map<String, String> getAllRequestParams(HttpServletRequest request) {
        Map<String, String> params = new LinkedHashMap<>();

        // GET 参数
//        Enumeration<String> paramNames = request.getParameterNames();
//        while (paramNames.hasMoreElements()) {
//            String name = paramNames.nextElement();
//            String value = request.getParameter(name);
//            params.put(name, value);
//        }

        // 处理JSON格式的POST请求
        if (isJsonPostRequest(request)) {
            try {
                // 读取请求体
                StringBuilder jsonBody = new StringBuilder();
                BufferedReader reader = request.getReader();
                String line;
                while ((line = reader.readLine()) != null) {
                    jsonBody.append(line);
                }

                // 解析JSON对象
                JSONObject jsonObject = JSONObject.parseObject(jsonBody.toString());

                // 提取顶层键值对
                for (String key : jsonObject.keySet()) {
                    Object value = jsonObject.get(key);
                    // 只处理基本类型值
                    if (value instanceof String ||
                            value instanceof Number ||
                            value instanceof Boolean) {
                        params.put(key, value.toString());
                    }
                }
            } catch (Exception e) {
                // 错误处理
                e.printStackTrace();
            }
        }
        return params;
    }

    // 检查是否为JSON POST请求
    private static boolean isJsonPostRequest(HttpServletRequest request) {
        String contentType = request.getContentType();
        return ("POST".equalsIgnoreCase(request.getMethod()) &&
                contentType != null &&
                contentType.toLowerCase().contains("application/json"));
    }

    public static void verifyTimestamp(Map<String, String> params, String timestampParam, long maxTimeDiff) {
        String timestampStr = params.get(timestampParam);
        if (timestampStr == null || timestampStr.isEmpty()) {
            throw new SignatureException("缺少时间戳参数");
        }

        try {
            long clientTime = Long.parseLong(timestampStr);
            long serverTime = System.currentTimeMillis() / 1000;

            if (Math.abs(serverTime - clientTime) > maxTimeDiff) {
                throw new SignatureException("请求已过期");
            }
        } catch (NumberFormatException e) {
            throw new SignatureException("时间戳格式错误");
        }
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

    public static boolean verifySignature(String data, byte[] signatureBytes, PublicKey publicKey, SignatureAlgorithm algorithm) {
        try {
            Signature signature = getSignatureInstance(algorithm);
            signature.initVerify(publicKey);
            signature.update(data.getBytes());

            return signature.verify(signatureBytes);
        } catch (Exception e) {
            throw new SignatureException("签名验证过程中出错: " + e.getMessage());
        }
    }

    public static Signature getSignatureInstance(SignatureAlgorithm algorithm) {
        try {
            switch (algorithm) {
                case RSA:
                    return Signature.getInstance("SHA256withRSA");
                case ECDSA:
                    return Signature.getInstance("SHA256withECDSA");
                case DSA:
                    return Signature.getInstance("SHA256withDSA");
                case SM2:
                    // SM2使用专用的签名算法
                    return Signature.getInstance("SM3WithSM2", "BC");
                case SM3:
                    // SM3使用专用的签名算法
                    return Signature.getInstance("SM3WithSM2", "BC");
                default:
                    throw new SignatureException("不支持的签名算法: " + algorithm);
            }
        } catch (Exception e) {
            throw new SignatureException("无法创建签名实例: " + e.getMessage());
        }
    }

}
