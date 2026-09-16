/**
 * Copyright © 2021-2025 <a href="http://www.jeeplus.org/">JeePlus</a> All rights reserved.
 */
package com.jeeplus.teaching.ddevice.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import com.jeeplus.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

/**
 * 设备管理Entity
 * @author GeniusGjq
 * @version 2026-04-25
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("d_device")
public class DDevice extends BaseEntity {

	private static final long serialVersionUID = 1L;

	/**
     * 设备编码
     */
	private String deviceCode;
	/**
     * 设备名称
     */
	private String deviceName;
	/**
     * 设备分类
     */
	private String category;
	/**
     * 设备型号
     */
	private String model;
	/**
     * 厂商名称
     */
	private String manufacturer;
	/**
     * 设备价格
     */
	private BigDecimal price;
	/**
     * 适用场景集合
     */
	private String scenariosJson;
	/**
     * 扩展属性
     */
	private String attrsJson;
	/**
     * 设备综合评分
     */
	private String totalScore;
	/**
     * 设备说明
     */
	private String descriptiontext;
	/**
     * 状态
     */
	private String status;

}
