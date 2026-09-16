package com.jeeplus.commons.verify.sm2;

import com.jeeplus.commons.verify.ParamsUtil;
import com.jeeplus.commons.verify.SignatureAlgorithm;
import com.jeeplus.commons.verify.SignatureException;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.Map;

/**
 * 非对称加密注解
 */
@Aspect
@Component
public class AsymmetricSignatureVerificationAspect {

    @Autowired
    private PublicKeyProvider publicKeyProvider;

    @Around("@annotation(verifySignature)")
    public Object verifySignature(ProceedingJoinPoint joinPoint, VerifyAsymmetricSignature verifySignature) throws Throwable {

        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

        if (attributes == null) {
            throw new IllegalStateException("无法获取当前请求");
        }

        HttpServletRequest request = attributes.getRequest();
        Map<String, String> params = ParamsUtil.getAllRequestParams(request);

        // 1. 验证时间戳（防止重放攻击）
        if (verifySignature.requireTimestamp()) {
            ParamsUtil.verifyTimestamp(params, verifySignature.timestampParam(), verifySignature.maxTimeDiff());
        }

        // 2. 获取客户端标识
        String clientId = params.get(verifySignature.clientIdParam());
        if (clientId == null || clientId.isEmpty()) {
            throw new SignatureException("缺少客户端标识");
        }

        // 3. 获取签名
        String signature = params.get(verifySignature.signParam());
        if (signature == null || signature.isEmpty()) {
            throw new SignatureException("缺少签名参数");
        }

        // 4. 获取公钥
        PublicKey publicKey = publicKeyProvider.getPublicKey(clientId);
        if (publicKey == null) {
            throw new SignatureException("无效的客户端标识");
        }

        // 5. 移除签名本身，准备验证
        params.remove(verifySignature.signParam());

        // 6. 生成待签名字符串
        String dataToSign = ParamsUtil.generateDataToSign(params);

        // 7. 验证签名
        boolean isValid = ParamsUtil.verifySignature(
                dataToSign,
                Base64.getDecoder().decode(signature),
                publicKey,
                verifySignature.algorithm()
        );

        if (!isValid) {
            throw new SignatureException("签名验证失败");
        }

        // 验签通过，执行原方法
        return joinPoint.proceed();
    }


    private PublicKey parsePublicKey(String publicKeyPem, SignatureAlgorithm algorithm) throws Exception {
        // 移除PEM头尾
        String publicKeyContent = publicKeyPem
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s", "");

        byte[] keyBytes = Base64.getDecoder().decode(publicKeyContent);
        X509EncodedKeySpec spec = new X509EncodedKeySpec(keyBytes);

        // 根据算法选择KeyFactory
        if (algorithm == SignatureAlgorithm.SM2) {
            // SM2使用EC KeyFactory
            KeyFactory keyFactory = KeyFactory.getInstance("EC", "BC");
            return keyFactory.generatePublic(spec);
        } else {
            KeyFactory keyFactory = KeyFactory.getInstance(algorithm.name());
            return keyFactory.generatePublic(spec);
        }
    }
}
