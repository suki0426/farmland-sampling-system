/**
 * Copyright © 2021-2025 <a href="http://www.jeeplus.org/">JeePlus</a> All rights reserved.
 */
package com.jeeplus.teaching.dteachingdocument.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Param;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Constants;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jeeplus.teaching.dteachingdocument.service.dto.DTeachingDocumentDTO;
import com.jeeplus.teaching.dteachingdocument.domain.DTeachingDocument;

/**
 * 教学文档管理MAPPER接口
 * @author GeniusGjq
 * @version 2026-04-25
 */
public interface DTeachingDocumentMapper extends BaseMapper<DTeachingDocument> {


    /**
     * 根据id获取教学文档管理
     * @param id
     * @return
     */
    DTeachingDocumentDTO findById(String id);

    /**
     * 获取教学文档管理列表
     *
     * @param queryWrapper
     * @return
     */
    IPage <DTeachingDocumentDTO> findList(Page <DTeachingDocumentDTO> page, @Param(Constants.WRAPPER) QueryWrapper queryWrapper);


}
