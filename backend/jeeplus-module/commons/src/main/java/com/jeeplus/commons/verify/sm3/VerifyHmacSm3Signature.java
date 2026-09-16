package com.jeeplus.commons.verify.sm3;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface VerifyHmacSm3Signature {
    // 用于从请求中获取密钥标识（实际密钥不传输）
    String secretKeyParam() default "secretKey";

    // 签名参数名
    String signParam() default "sign";

    // 是否需要时间戳
    boolean requireTimestamp() default true;

    // 时间戳参数名
    String timestampParam() default "timestamp";

    // 时间戳允许的最大差值（秒）
    long maxTimeDiff() default 300;
}
