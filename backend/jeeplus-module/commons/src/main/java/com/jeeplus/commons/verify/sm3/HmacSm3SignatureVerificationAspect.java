package com.jeeplus.commons.verify.sm3;

import cn.hutool.crypto.digest.HMac;
import cn.hutool.crypto.digest.HmacAlgorithm;
import com.jeeplus.commons.verify.ParamsUtil;
import com.jeeplus.commons.verify.SecretKeyProvider;
import com.jeeplus.commons.verify.SignatureException;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.annotation.Resource;
import java.security.SecureRandom;
import java.util.HashMap;
import java.util.Map;

@Aspect
@Component
public class HmacSm3SignatureVerificationAspect {

    // 定义字符集：数字（0-9）和大写小写字母（A-Z, a-z）
    private static final String CHARACTERS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    private static final SecureRandom random = new SecureRandom();

    @Value("${verify.secretKey}")
    private String secretKey;

    @Resource
    private SecretKeyProvider secretKeyProvider; // 密钥提供者，用于根据密钥标识获取密钥

    @Around("@annotation(verifyHmac)")
    public Object verifySignature(ProceedingJoinPoint joinPoint, VerifyHmacSm3Signature verifyHmac) throws Throwable {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            throw new IllegalStateException("无法获取当前请求");
        }

        Map<String, String> params = ParamsUtil.getAllRequestParams(attributes.getRequest());

        // 1. 验证时间戳
        if (verifyHmac.requireTimestamp()) {
            ParamsUtil.verifyTimestamp(params, verifyHmac.timestampParam(), verifyHmac.maxTimeDiff());
        }

        // 2. 获取签名
        String signature = params.get(verifyHmac.signParam());
        if (signature == null || signature.isEmpty()) {
            throw new SignatureException("缺少签名参数");
        }

        // 由于已将secretKey放入到配置文件中获取，此处获取secretKeyId已没有必要
        // 3. 获取密钥标识
//        String secretKeyId = verifyHmac.secretKeyParam();

        // 4. 根据密钥标识获取密钥（对称密钥）
//        String secretKey = secretKeyProvider.getSecretKey(secretKeyId);

        // 5. 移除签名参数
        params.remove(verifyHmac.signParam());

        // 6. 生成待签名字符串
        String dataToSign = ParamsUtil.generateDataToSign(params);

        // 7. 计算HMAC-SM3
        String computedSignature = computeHmacSm3(secretKey, dataToSign);

        // 8. 比较签名
        if (!computedSignature.equalsIgnoreCase(signature)) {
            throw new SignatureException("签名验证失败");
        }

        return joinPoint.proceed();
    }

    // endTime=2025-07-14 09:10:00&shopId=1938062595353346048&startTime=2025-07-14 08:40:00&timestamp=1752556184
    public static String computeHmacSm3(String key, String data) {
        HMac mac = new HMac(HmacAlgorithm.HmacSM3, key.getBytes());
        return mac.digestHex(data);
    }

    /**
     * 生成16位由数字和字母组成的随机码
     * @return 16位的随机字符串
     */
    public static String generateRandomCode() {
        StringBuilder code = new StringBuilder(16);

        for (int i = 0; i < 16; i++) {
            // 从字符集中随机选取一个字符
            int randomIndex = random.nextInt(CHARACTERS.length());
            char randomChar = CHARACTERS.charAt(randomIndex);
            code.append(randomChar);
        }

        return code.toString();
    }

    public static void main(String[] args) {

        // ================== 1. 准备测试参数 ==================
        Map<String, String> requestParams = new HashMap<>();
        requestParams.put("timestamp", "1752557605");
        requestParams.put("endTime", "2025-07-14 09:10:00");
        requestParams.put("shopId", "1938062595353346048");
        requestParams.put("startTime", "2025-07-14 08:40:00");

        // 打印原始请求参数
        System.out.println("==== 原始请求参数 ====");

        // ================== 2. 生成待签名字符串 ==================
        String dataToSign = ParamsUtil.generateDataToSign(requestParams);
        System.out.println("\n==== 待签名字符串 ====");
        System.out.println(dataToSign);

        // ================== 3. 获取密钥 ==================
        String secretKey = "b74708d56bfd6713";

        // ================== 4. 计算签名 ==================
        System.out.println("\n==== 计算 HMAC-SM3 签名 ====");
        String signature = computeHmacSm3(secretKey, dataToSign);
        System.out.println("生成签名: " + signature);
        System.out.println("生成签名长度: " + signature.length());

        // ================== 5. 构造完整请求 ==================
//        Map<String, String> signedParams = new HashMap<>(requestParams);
//        signedParams.put("sign", signature);
//
//        // ================== 6. 验证签名 ==================
//        System.out.println("\n==== 验证签名 ====");
//        boolean verified = verifySignature2(signedParams);
//        System.out.println("签名验证: " + (verified ? "✅ 成功" : "❌ 失败"));
    }

    // 验证签名
    private static boolean verifySignature2(Map<String, String> signedParams) {
        try {
            String receivedSignature = signedParams.get("sign");
            if (receivedSignature == null || receivedSignature.isEmpty()) {
                throw new Exception("缺少签名参数");
            }

            signedParams.remove("sign");
            // 重新生成待签名字符串
            String dataToSign = ParamsUtil.generateDataToSign(signedParams);
            System.out.println("重新生成待签名字符串: " + dataToSign);

            // 获取密钥
            String secretKey = "b74708d56bfd6713";

            // 重新计算签名
            String computedSignature = computeHmacSm3(secretKey, dataToSign);
            System.out.println("重新计算签名字符串: " + computedSignature);

            // 比较签名
            return computedSignature.equalsIgnoreCase(receivedSignature);

        } catch (Exception e) {
            System.err.println("验证错误: " + e.getMessage());
            return false;
        }
    }
}
