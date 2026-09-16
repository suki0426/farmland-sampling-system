package com.jeeplus.sys.model;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import org.springframework.validation.annotation.Validated;

import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@ApiModel("登录对象")
@Data
@Valid
public class LoginForm {

    /**
     * 用户名
     */
    @NotNull(message="请输入用户名")
    @ApiModelProperty("用户名")
    private String username;

    /**
     * 密码
     */
    @NotNull(message="请输入密码")
    @ApiModelProperty("密码")
    private String password;

    /**
     * 验证码
     */
    @NotBlank(message="请输入验证码")
    @NotNull(message="请输入验证码")
    @ApiModelProperty("验证码")
    private String code;

    /**
     * uuid
     */
    @ApiModelProperty("验证码对应的唯一UUID")
    private String uuid;
}
