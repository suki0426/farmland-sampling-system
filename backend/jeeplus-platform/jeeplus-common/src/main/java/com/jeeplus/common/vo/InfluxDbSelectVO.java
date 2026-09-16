package com.jeeplus.common.vo;

import lombok.Data;

/**
 * @auther 高靖奇
 * @date 2025/8/4
 */
@Data
public class InfluxDbSelectVO {

    private String measurement;

    private String id;

    private long targetTime;

    private Short no;

    private Byte type;

    private Byte r;

    private String hour;

}
