package com.jeeplus.common.utils;

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Signature;
import java.security.SecureRandom;
import java.util.Base64;
import java.security.KeyFactory;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import javax.servlet.http.HttpServletRequest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.util.Enumeration;
import java.util.Map;
import java.util.LinkedHashMap;

/**
 * @author Zhang
 */
public class RSASignatureUtil {

    private static final String SIGNING_ALGORITHM = "SHA512withRSA";
    private static final String RSA_ALGORITHM = "RSA";
    private static final int KEY_SIZE = 4096;

    private static final String PRIVATE_KEY_STRING = "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";
    private static final String PUBLIC_KEY_STRING = "MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA1dKJ6+/TF8DGvXU0JWyhkd81MBkcjtWjysGaOa85hLbkABvy3eBaTl2LPvgaIu0XNr8NIA8kQ409wAjGXScEraMfsZUzLjdGmMqILfwvVbgPjTgWBrIdZl8LOnxkD61n+9N3IYY7tVD2NjbQBPd81ZoUHFSJpXiDrU8oa5fVtVLFfK3JeNfv5jr/e23sK2rh3UMQxiN5qs1B5fq768Ept3QwFS/wTfCKxjAM7O5RwuyMRpJQelGyhqvjkkFZEmkW8ceokkMo48cRn8HRNBa86VawP77qMsULd+YxBUZOE/MVk+ml1r2EqNAJZXDflxe7SWHjfJEyLIeqDLBnBI+ObrxlXf4bKLMnuBVGPRAmJNROj8TLexmYcZEkDZlWbGglURquQSbgcYSMWy3B6EiBnxrW/YNiSSrGyqHV0tcBYVWiqH4rorP8agzP6rS6ljgddy/ws1MIJD00FW/4slsSo9Bf6cesOvi3PfKOtPNUA4J3P12X7uFbMug9Ho5uwCP7+RG4DYLY/jgZ+bB/XEInKHRzdYCY6uE6vrilXhie95bj9JvVYbK6y3whR1ySvLRr/2vnuTDK6/c/IemthV6j3BAGanQ3TG3ZXQuzFxQgLOD8uTf2qLSCS2k5g1ZJJPKRQ6Hr0mzh0mEPRip4hCiq384pErk3Q6QPB56iA0f3u58CAwEAAQ==";

    /**
     * 生成 RSA 密钥对
     * @return KeyPair 包含公钥和私钥
     * @throws Exception 如果生成密钥对失败
     */
    public static KeyPair generateKeyPair() throws Exception {
        KeyPairGenerator keyGen = KeyPairGenerator.getInstance(RSA_ALGORITHM);
        keyGen.initialize(KEY_SIZE, new SecureRandom());
        return keyGen.generateKeyPair();
    }

    /**
     * 从 Base64 编码的字符串中获取私钥
     * @return 私钥
     * @throws Exception 如果生成私钥失败
     */
    public static PrivateKey getPrivateKey() throws Exception {
        byte[] keyBytes = Base64.getDecoder().decode(PRIVATE_KEY_STRING);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
        KeyFactory keyFactory = KeyFactory.getInstance(RSA_ALGORITHM);
        return keyFactory.generatePrivate(spec);
    }

    /**
     * 从 Base64 编码的字符串中获取公钥
     * @return 公钥
     * @throws Exception 如果生成公钥失败
     */
    public static PublicKey getPublicKey() throws Exception {
        byte[] keyBytes = Base64.getDecoder().decode(PUBLIC_KEY_STRING);
        X509EncodedKeySpec spec = new X509EncodedKeySpec(keyBytes);
        KeyFactory keyFactory = KeyFactory.getInstance(RSA_ALGORITHM);
        return keyFactory.generatePublic(spec);
    }

    /**
     * 使用私钥对数据进行签名
     * @param data 需要签名的数据
     * @param privateKey 用于签名的私钥
     * @return Base64 编码的签名
     * @throws Exception 如果签名过程出现错误
     */
    public static String sign(String data, PrivateKey privateKey) throws Exception {
        Signature signature = Signature.getInstance(SIGNING_ALGORITHM);
        signature.initSign(privateKey, new SecureRandom());

        signature.update(data.getBytes(StandardCharsets.UTF_8));
        byte[] signedData = signature.sign();

        return Base64.getEncoder().encodeToString(signedData);
    }

    /**
     * 使用私钥对数据进行签名
     * @param data 需要签名的数据
     * @return Base64 编码的签名
     * @throws Exception 如果签名过程出现错误
     */
    public static String sign(String data) throws Exception {
        PrivateKey privateKey = getPrivateKey();
        Signature signature = Signature.getInstance(SIGNING_ALGORITHM);
        signature.initSign(privateKey);

        signature.update(data.getBytes(StandardCharsets.UTF_8));
        byte[] signedData = signature.sign();

        return Base64.getEncoder().encodeToString(signedData);
    }

    /**
     * 使用公钥验证签名
     * @param data 原始数据
     * @param signedData Base64 编码的签名
     * @param publicKey 用于验证的公钥
     * @return 如果签名有效返回 true，否则返回 false
     * @throws Exception 如果验证过程出现错误
     */
    public static boolean verify(String data, String signedData, PublicKey publicKey) throws Exception {
        Signature signature = Signature.getInstance(SIGNING_ALGORITHM);
        signature.initVerify(publicKey);

        signature.update(data.getBytes(StandardCharsets.UTF_8));
        return signature.verify(Base64.getDecoder().decode(signedData));
    }

    /**
     * 使用公钥验证签名
     * @param data 原始数据
     * @param signedData Base64 编码的签名
     * @return 如果签名有效返回 true，否则返回 false
     * @throws Exception 如果验证过程出现错误
     */
    public static boolean verify(String data, String signedData) throws Exception {
        PublicKey publicKey = getPublicKey();
        Signature signature = Signature.getInstance(SIGNING_ALGORITHM);
        signature.initVerify(publicKey);

        signature.update(data.getBytes(StandardCharsets.UTF_8));
        return signature.verify(Base64.getDecoder().decode(signedData));
    }

    /**
     * 从请求中获取所有参数并构造成 JSON 对象
     * @param request HttpServletRequest 对象
     * @return JSON 格式的字符串
     */
    public static String getParamsAsJson(HttpServletRequest request) {
        JsonObject jsonObject = new JsonObject();
        Map<String, String> sortedParams = new LinkedHashMap<>();

        Enumeration<String> parameterNames = request.getParameterNames();

        while (parameterNames.hasMoreElements()) {
            String paramName = parameterNames.nextElement();
            String paramValue = request.getParameter(paramName);
            // 排除空值或对特殊字符进行处理
            if (paramValue != null && !paramValue.trim().isEmpty()) {
                sortedParams.put(paramName, paramValue);
            }
        }

        // Optional: 这里排序可以根据需要进行
        // sortedParams = sortedParams.entrySet().stream()
        //     .sorted(Map.Entry.comparingByKey())
        //     .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (e1, e2) -> e1, LinkedHashMap::new));

        sortedParams.forEach(jsonObject::addProperty);

        return jsonObject.toString();
    }

    /**
     * 从 JSON 数据中提取特定的参数
     * @param jsonData JSON 格式的字符串
     * @param key 要提取的参数名
     * @return 提取的参数值
     */
    public static String extractParameter(String jsonData, String key) {
        JsonObject jsonObject = JsonParser.parseString(jsonData).getAsJsonObject();
        return jsonObject.has(key) ? jsonObject.get(key).getAsString() : null;
    }

    public static void main(String[] args) {
        try {
            // 示例：生成密钥对
            KeyPair keyPair = generateKeyPair();

            String privateKeyString = Base64.getEncoder().encodeToString(keyPair.getPrivate().getEncoded());
            String publicKeyString = Base64.getEncoder().encodeToString(keyPair.getPublic().getEncoded());

            System.out.println("Private Key: " + privateKeyString);
            System.out.println("Public Key: " + publicKeyString);


            // 要签名的数据
            String data = "Sensitive data that needs to be signed";

            // 生成签名
            String signature = sign(data);
            System.out.println("签名: " + signature);

            // 验证签名
            boolean isValid = verify(data, signature, keyPair.getPublic());
            System.out.println("验证结果: " + isValid);
        } catch (Exception e) {
            e.printStackTrace();
            // 生产环境中应记录日志，并适当处理异常
        }
    }



    private static final ObjectMapper objectMapper = new ObjectMapper();  // 用于对象转换为 JSON

    /**
     * 从请求头中获取签名并进行验证
     *
     * @param request HttpServletRequest 包含签名和数据的请求
     * @param data    待验证的数据（可以是实体类、字符串、JSON 等）
     * @return 验证是否通过
     */
    public static boolean verifySignatureFromHeader(HttpServletRequest request, Object data) {
        try {
            // 从请求头中获取签名
            String signatureHeader = request.getHeader("Signature");
            if (signatureHeader == null) {
                throw new IllegalArgumentException("签名缺失");
            }

            // 将传入的对象转换为 JSON 字符串
            String dataString = convertObjectToString(data);

            // 获取公钥
            PublicKey publicKey = getPublicKey();

            // 验证签名
            return verifySignature(dataString, signatureHeader, publicKey);
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * 验证签名
     *
     * @param data      待验证的字符串数据
     * @param signature 签名（Base64 编码）
     * @param publicKey 公钥
     * @return 验证是否通过
     * @throws Exception 如果签名验证失败
     */
    public static boolean verifySignature(String data, String signature, PublicKey publicKey) throws Exception {
        Signature publicSignature = Signature.getInstance(SIGNING_ALGORITHM);
        publicSignature.initVerify(publicKey);
        publicSignature.update(data.getBytes(StandardCharsets.UTF_8));

        byte[] signatureBytes = Base64.getDecoder().decode(signature);

        return publicSignature.verify(signatureBytes);
    }

    /**
     * 将对象转换为字符串（通常为 JSON）
     *
     * @param data 待转换的对象
     * @return 对象的 JSON 字符串表示
     * @throws Exception 如果对象转换失败
     */
    private static String convertObjectToString(Object data) throws Exception {
        if (data instanceof String) {
            // 如果已经是字符串，直接返回
            return (String) data;
        } else {
            // 否则，使用 ObjectMapper 将对象转换为 JSON 字符串
            return objectMapper.writeValueAsString(data);
        }
    }


}
