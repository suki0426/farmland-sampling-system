package com.jeeplus.commons.verify;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class ConfigBasedSecretKeyProvider implements SecretKeyProvider {

    // 这里简单用map模拟，实际应从安全存储（如数据库、配置中心、密钥管理系统）中获取
    private Map<String, String> secretKeys = new HashMap<>();

    {
        secretKeys.put("shop_door", "shop_door");
    }

    @Override
    public String getSecretKey(String keyId) {
        if (!secretKeys.containsKey(keyId)) {
            throw new SignatureException("无效的密钥标识");
        }
        return secretKeys.get(keyId);
    }
}
