/**
 * Copyright 漏 2021-2025 <a href="http://www.jeeplus.org/">JeePlus</a> All rights reserved.
 */
package com.jeeplus.teaching.dfiletemplate.service.dto;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.common.collect.Lists;
import com.alibaba.excel.annotation.ExcelProperty;
import com.jeeplus.core.query.Query;
import com.jeeplus.core.query.QueryType;
import com.jeeplus.core.service.dto.BaseDTO;
import lombok.Data;
import lombok.EqualsAndHashCode;
/**
 * 文档模板管理DTO
 * @author GeniusGjq
 * @version 2026-04-27
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class DFileTemplateDTO extends BaseDTO {

    private static final long serialVersionUID = 1L;

    @ExcelProperty("模板编码")
    private String templateCode;

    @ExcelProperty("模板名称")
    private String templateName;

    @ExcelProperty("文档类型")
    @Query(type = QueryType.EQ)
    private String docType;

    @ExcelProperty("模板版本")
    private String versionNo;

    @ExcelProperty("适用课程范围")
    private String applicableMajor;

    @ExcelProperty("适用课程范围")
    private String applicableCourse;

    @ExcelProperty("是否默认模板")
    private String isDefault;

    @ExcelProperty("状态")
    @Query(type = QueryType.EQ)
    private String status;

    @ExcelProperty("备注")
    private String remark;

    @ExcelProperty("排序")
    private Integer sortNo;

    /**
     * 传统扁平子表字段
     */
    @JsonProperty("dFileTemplateSectionDTOList")
    @JsonAlias({"dFileTemplateSectionDtoList", "DFileTemplateSectionDTOList", "dfileTemplateSectionDTOList"})
    private List<DFileTemplateSectionDTO> dFileTemplateSectionDTOList = Lists.newArrayList();

    /**
     * 前端树形章节结构兼容字段
     */
    @JsonProperty("sections")
    private List<DFileTemplateSectionDTO> sections = Lists.newArrayList();
}
