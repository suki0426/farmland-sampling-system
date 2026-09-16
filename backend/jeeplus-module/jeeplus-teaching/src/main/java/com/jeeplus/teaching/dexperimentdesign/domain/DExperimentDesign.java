/**
 * Copyright © 2021-2025 <a href="http://www.jeeplus.org/">JeePlus</a> All rights reserved.
 */
package com.jeeplus.teaching.dexperimentdesign.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import com.jeeplus.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

/**
 * 实验设计管理Entity
 * @author GeniusGjq
 * @version 2026-04-25
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("d_experiment_design")
public class DExperimentDesign extends BaseEntity {

	private static final long serialVersionUID = 1L;

	/**
     * 实验方案名称
     */
	private String experimentName;
	/**
     * 课程名称
     */
	private String courseName;
	/**
     * 专业名称
     */
	private String majorName;
	/**
     * 实验类型
     */
	private String experimentType;
	/**
     * 实验应用场景
     */
	private String scenarioName;
	/**
     * 实验所需课时
     */
	private String classHours;
	/**
     * 实验目标
     */
	private String goalText;
	/**
     * 已选择的设备清单
     */
	private String selectedDevicesJson;
	/**
     * 内容引用来源
     */
	private String contentSourceId;
	/**
     * 来源类型标识
     */
	private String contentSourceType;
	/**
     * 实验内容正文
     */
	private String contentText;
	/**
     * 评分或推荐算法类型
     */
	private String algorithmType;
	/**
     * 设备部分评分
     */
	private BigDecimal deviceScore;
	/**
     * 内容部分评分
     */
	private BigDecimal contentScore;
	/**
     * 综合评分
     */
	private BigDecimal finalScore;
	/**
     * 状态
     */
	private String status;

}
