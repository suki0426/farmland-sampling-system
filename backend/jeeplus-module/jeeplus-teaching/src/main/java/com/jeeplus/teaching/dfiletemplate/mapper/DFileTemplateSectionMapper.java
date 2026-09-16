/**
 * Copyright © 2021-2025 <a href="http://www.jeeplus.org/">JeePlus</a> All rights reserved.
 */
package com.jeeplus.teaching.dfiletemplate.mapper;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Constants;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jeeplus.teaching.dfiletemplate.domain.DFileTemplateSection;
import com.jeeplus.teaching.dfiletemplate.service.dto.DFileTemplateSectionDTO;
import org.apache.ibatis.annotations.Param;

/**
 * 文件模板章节表MAPPER接口
 * @author GeniusGjq
 * @version 2026-04-27
 */
public interface DFileTemplateSectionMapper extends BaseMapper<DFileTemplateSection> {

    /**
     * 根据id获取文件模板章节表
     * @param id
     * @return
     */
    DFileTemplateSectionDTO findById(String id);

    /**
     * 获取文件模板章节表列表
     *
     * @param queryWrapper
     * @return
     */
    IPage<DFileTemplateSectionDTO> findList(Page<DFileTemplateSectionDTO> page, @Param(Constants.WRAPPER) QueryWrapper queryWrapper);

}
