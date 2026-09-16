/**
 * Copyright 漏 2021-2025 <a href="http://www.jeeplus.org/">JeePlus</a> All rights reserved.
 */
package com.jeeplus.teaching.dfiletemplate.service.dto;

import com.google.common.collect.Lists;
import com.jeeplus.core.query.Query;
import com.jeeplus.core.query.QueryType;
import com.jeeplus.core.service.dto.BaseDTO;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;
/**
 * 文件模板章节表Entity
 * @author GeniusGjq
 * @version 2026-04-27
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class DFileTemplateSectionDTO extends BaseDTO {

    private static final long serialVersionUID = 1L;

    @Query(type = QueryType.EQ)
    private DFileTemplateDTO template;

    @Query(type = QueryType.EQ)
    private String parentSectionId;

    @Query(type = QueryType.EQ)
    private String sectionLevel;

    @Query(type = QueryType.EQ)
    private String sectionTitle;

    @Query(type = QueryType.EQ)
    private String sectionCode;

    @Query(type = QueryType.EQ)
    private Integer sortNo;

    @Query(type = QueryType.EQ)
    private String requiredFlag;

    @Query(type = QueryType.EQ)
    private String visibleFlag;

    @Query(type = QueryType.EQ)
    private String componentType;

    @Query(type = QueryType.EQ)
    private String placeHolderText;

    @Query(type = QueryType.EQ)
    private String defaultvalue;

    @Query(type = QueryType.EQ)
    private String status;

    /**
     * 前端树形结构兼容字段
     */
    private List<DFileTemplateSectionDTO> sections = Lists.newArrayList();
}
