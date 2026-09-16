/**
 * Copyright © 2021-2025 <a href="http://www.jeeplus.org/">JeePlus</a> All rights reserved.
 */
package com.jeeplus.teaching.dfiletemplate.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import com.jeeplus.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;
/**
 * 文档模板管理Entity
 * @author GeniusGjq
 * @version 2026-04-27
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("d_file_template")
public class DFileTemplate extends BaseEntity {

	private static final long serialVersionUID = 1L;

	/**
     * 模板编码
     */
	private String templateCode;
	/**
     * 模板名称
     */
	private String templateName;
	/**
     * 文档类型
     */
	private String docType;
	/**
     * 模板版本
     */
	private String versionNo;
	/**
     * 适用课程范围
     */
	private String applicableMajor;
	/**
     * 适用课程范围
     */
	private String applicableCourse;
	/**
     * 是否默认模板
     */
	private String isDefault;
	/**
     * 状态
     */
	private String status;
	/**
     * 备注
     */
	private String remark;
	/**
     * 排序
     */
	private Integer sortNo;

}
