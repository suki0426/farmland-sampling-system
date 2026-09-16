/**
 * Copyright © 2021-2025 <a href="http://www.jeeplus.org/">JeePlus</a> All rights reserved.
 */
package com.jeeplus.teaching.dindicator.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import com.jeeplus.core.domain.TreeEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

/**
 * 指标管理Entity
 * @author GeniusGjq
 * @version 2026-04-25
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("d_indicator")
public class DIndicator extends TreeEntity<DIndicator> {

	private static final long serialVersionUID = 1L;

	/**
     * 名称
     */
	private String name;
	/**
     * 指标层级
     */
	private Integer indicatorLevel;
	/**
     * 指标编码
     */
	private String indicatorCode;
	/**
     * 指标名称
     */
	private String indicatorName;
	/**
     * 指标权重
     */
	private BigDecimal weightValue;
	/**
     * 指标分数
     */
	private BigDecimal scoreValue;
	/**
     * 指标说明
     */
	private String descriptionText;
	/**
     * 指标状态
     */
	private String status;
	/**
     * 上级路径
     */
	private String ancestorPath;

}
