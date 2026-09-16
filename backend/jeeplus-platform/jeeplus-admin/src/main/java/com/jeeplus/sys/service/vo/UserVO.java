package com.jeeplus.sys.service.vo;

import com.alibaba.excel.annotation.ExcelIgnore;
import lombok.Data;

import java.io.Serializable;

@Data
public class UserVO implements Serializable {

    /**
     * 新密码
     */
    private String newPassword;

    /***
     * 旧密码
     */
    private String oldPassword;

}
