/**
 * Copyright © 2021-2025 <a href="http://www.jeeplus.org/">JeePlus</a> All rights reserved.
 */
package com.jeeplus.teaching.dfiletemplate.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import com.jeeplus.core.domain.BaseEntity;
import com.jeeplus.core.query.Query;
import com.jeeplus.core.query.QueryType;
import lombok.Data;
import lombok.EqualsAndHashCode;
/**
 * 文件模板章节表Entity
 * @author GeniusGjq
 * @version 2026-04-27
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("d_file_template_section")
public class DFileTemplateSection extends BaseEntity {

	private static final long serialVersionUID = 1L;

	/**
     * 所属模板
     */
	private String templateId;
	/**
     * 上级章节
     */
	private String parentSectionId;
	/**
     * 章节级别
     */
	private String sectionLevel;
	/**
     * 章节名称
     */
	private String sectionTitle;
	/**
     * 章节编号
     */
	private String sectionCode;
	/**
     * 显示顺序
     */
	private Integer sortNo;
	/**
     * 是否必填
     */
	private String requiredFlag;
	/**
     * 是否可见
     */
	private String visibleFlag;
	/**
     * 组件类型
     */
	private String componentType;
	/**
     * 表单提示
     */
	private String placeHolderText;
	/**
     * 默认值
     */
	private String defaultvalue;
	/**
     * 状态
     */
	private String status;

}
