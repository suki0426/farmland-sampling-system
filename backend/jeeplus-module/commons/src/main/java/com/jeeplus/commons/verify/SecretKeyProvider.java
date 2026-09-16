package com.jeeplus.commons.verify;

/**
 * 密钥提供者
 */
public interface SecretKeyProvider {
    String getSecretKey(String keyId);
}
