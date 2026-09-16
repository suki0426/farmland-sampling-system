/**
 * Copyright © 2021-2025 <a href="http://www.jeeplus.org/">JeePlus</a> All rights reserved.
 */
package com.jeeplus.teaching.dteachingdocument.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import com.jeeplus.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;
/**
 * 教学文档管理Entity
 * @author GeniusGjq
 * @version 2026-04-25
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("d_teaching_document")
public class DTeachingDocument extends BaseEntity {

	private static final long serialVersionUID = 1L;

	/**
     * 文档标题
     */
	private String title;
	/**
     * 文档分类
     */
	private String docType;
	/**
     * 课程名称
     */
	private String courseName;
	/**
     * 课程编码
     */
	private String courseCode;
	/**
     * 学年
     */
	private String academicterm;
	/**
     * 教室姓名
     */
	private String teacherName;
	/**
     * 录入方式
     */
	private String inputMethod;
	/**
     * 文档状态
     */
	private String status;
	/**
     * 模板id
     */
	private String templateId;
	/**
     * 导入文件原始名称
     */
	private String sourceFileName;
	/**
     * 文档结构化内容
     */
	private String contentJson;
	/**
     * 关键词集合
     */
	private String keywordsJson;
	/**
     * 流程图描述文本
     */
	private String flowChartText;

}
