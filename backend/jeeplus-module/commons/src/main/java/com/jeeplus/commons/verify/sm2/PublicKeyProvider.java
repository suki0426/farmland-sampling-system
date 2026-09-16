package com.jeeplus.commons.verify.sm2;

import java.security.PublicKey;

public interface PublicKeyProvider {
    PublicKey getPublicKey(String clientId);
}
