package com.jeeplus.commons.verify.sm2;

import com.jeeplus.commons.verify.SignatureAlgorithm;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
// 非对称加密验证注解
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface VerifyAsymmetricSignature {
    // 客户端标识参数名（用于获取公钥）
    String clientIdParam() default "clientId";

    // 签名参数名
    String signParam() default "signature";

    // 签名算法（默认RSA）
    com.jeeplus.commons.verify.SignatureAlgorithm algorithm() default SignatureAlgorithm.SM2;

    // 是否验证时间戳（防止重放攻击）
    boolean requireTimestamp() default true;

    // 时间戳参数名
    String timestampParam() default "timestamp";

    // 时间戳最大允许差值（秒）
    long maxTimeDiff() default 300;
}

