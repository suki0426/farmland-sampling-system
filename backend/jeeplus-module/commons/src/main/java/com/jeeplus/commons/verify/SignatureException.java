package com.jeeplus.commons.verify;

/**
 * 自定义异常
 */
public class SignatureException extends RuntimeException {
    public SignatureException(String message) {
        super(message);
    }
}
