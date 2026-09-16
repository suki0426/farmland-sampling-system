package com.jeeplus.commons.verify.sm2;

import com.jeeplus.commons.verify.SignatureException;
import org.springframework.stereotype.Component;

import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 公钥提供者接口与实现
 */
@Component
public class ConfigBasedPublicKeyProvider implements PublicKeyProvider {

    private final Map<String, PublicKey> publicKeyCache = new ConcurrentHashMap<>();

    @Override
    public PublicKey getPublicKey(String clientId) {
        return publicKeyCache.computeIfAbsent(clientId, this::loadPublicKey);
    }

    private PublicKey loadPublicKey(String clientId) {
        try {
            // 从配置文件中获取公钥（实际项目中可以从数据库或密钥管理系统获取）
            String publicKeyPem = getPublicKeyFromConfig(clientId);

            // 解析PEM格式的公钥
            return parsePublicKey(publicKeyPem);
        } catch (Exception e) {
            throw new SignatureException("无法加载公钥: " + e.getMessage());
        }
    }

    private String getPublicKeyFromConfig(String clientId) {
        // 实际项目中应从配置中心或数据库获取
        // 这里仅作示例
        Map<String, String> keys = new HashMap<>();
        keys.put("client1", "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu1SU1LfVLPHCozMxH2Mo");
        keys.put("client2", "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3LxK7Lt1dDdO4z4m5vY");

        if (!keys.containsKey(clientId)) {
            throw new SignatureException("未知的客户端ID: " + clientId);
        }

        return keys.get(clientId);
    }

    private PublicKey parsePublicKey(String publicKeyPem) throws Exception {
        // 移除PEM头尾
        String publicKeyContent = publicKeyPem
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s", "");

        byte[] keyBytes = Base64.getDecoder().decode(publicKeyContent);

        // 创建X509编码的密钥规范
        X509EncodedKeySpec spec = new X509EncodedKeySpec(keyBytes);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        return keyFactory.generatePublic(spec);
    }
}
