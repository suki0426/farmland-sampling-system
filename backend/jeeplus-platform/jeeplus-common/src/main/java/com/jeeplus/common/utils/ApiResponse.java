package com.jeeplus.common.utils;

import lombok.Data;
import lombok.Getter;

import java.io.Serializable;

/**
 * @author Zhang
 */
@Getter
@Data
public class ApiResponse<T> implements Serializable {

    private static final long serialVersionUID = 1L;

    // Getters 和 Setters
    // 状态码
    private int code;

    // 提示信息
    private String message;

    // 响应数据
    private T data;

    // 私有构造函数，使用静态工厂方法创建实例
    private ApiResponse() {}

    // 带参数的构造函数
    private ApiResponse(int code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    // 静态工厂方法 - 成功响应
    public static <T> ApiResponse<T> success() {
        return new ApiResponse<>(StatusCode.SUCCESS.getCode(), StatusCode.SUCCESS.getMessage(), null);
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(StatusCode.SUCCESS.getCode(), StatusCode.SUCCESS.getMessage(), data);
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(StatusCode.SUCCESS.getCode(), message, data);
    }

    // 静态工厂方法 - 错误响应
    public static <T> ApiResponse<T> error(StatusCode statusCode) {
        return new ApiResponse<>(statusCode.getCode(), statusCode.getMessage(), null);
    }

    public static <T> ApiResponse<T> error(StatusCode statusCode, String message) {
        return new ApiResponse<>(statusCode.getCode(), message, null);
    }

    public static <T> ApiResponse<T> error(StatusCode statusCode, T data) {
        return new ApiResponse<>(statusCode.getCode(), statusCode.getMessage(), data);
    }

    // 方法链支持
    public ApiResponse<T> withMessage(String message) {
        this.message = message;
        return this;
    }

    public ApiResponse<T> withData(T data) {
        this.data = data;
        return this;
    }

    @Override
    public String toString() {
        return "ApiResponse{" +
                "code=" + code +
                ", message='" + message + '\'' +
                ", data=" + data +
                '}';
    }

    // 枚举类：定义常见的状态码和信息
    @Getter
    public enum StatusCode {
        SUCCESS(200, "Success"),
        BAD_REQUEST(400, "Bad Request"),
        UNAUTHORIZED(401, "Unauthorized"),
        FORBIDDEN(403, "Forbidden"),
        NOT_FOUND(404, "Not Found"),
        INTERNAL_SERVER_ERROR(500, "Internal Server Error"),
        // 签名错误
        SIGN_ERROR(40001, "Signature Error"),
        // 异常
        EXCEPTION(99999, "Exception");

        private final int code;
        private final String message;

        StatusCode(int code, String message) {
            this.code = code;
            this.message = message;
        }

    }
}
