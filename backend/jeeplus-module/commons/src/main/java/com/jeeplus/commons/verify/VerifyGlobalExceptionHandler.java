package com.jeeplus.commons.verify;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 实现全局异常处理（处理验签失败）
 */
@RestControllerAdvice
public class VerifyGlobalExceptionHandler {

    @ExceptionHandler(SignatureException.class)
    public ResponseEntity<ErrorResponse> handleSignatureException(SignatureException ex) {
        ErrorResponse error = new ErrorResponse("SIGNATURE_ERROR", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    // 通用错误响应类
    static class ErrorResponse {
        private String code;
        private String message;

        public ErrorResponse(String code, String message) {
            this.code = code;
            this.message = message;
        }

        // getters
    }
}
