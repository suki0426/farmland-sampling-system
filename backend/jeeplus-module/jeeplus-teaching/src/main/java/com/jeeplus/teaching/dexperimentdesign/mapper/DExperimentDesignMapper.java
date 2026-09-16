/**
 * Copyright © 2021-2025 <a href="http://www.jeeplus.org/">JeePlus</a> All rights reserved.
 */
package com.jeeplus.teaching.dexperimentdesign.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Param;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Constants;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jeeplus.teaching.dexperimentdesign.service.dto.DExperimentDesignDTO;
import com.jeeplus.teaching.dexperimentdesign.domain.DExperimentDesign;

/**
 * 实验设计管理MAPPER接口
 * @author GeniusGjq
 * @version 2026-04-25
 */
public interface DExperimentDesignMapper extends BaseMapper<DExperimentDesign> {


    /**
     * 根据id获取实验设计管理
     * @param id
     * @return
     */
    DExperimentDesignDTO findById(String id);

    /**
     * 获取实验设计管理列表
     *
     * @param queryWrapper
     * @return
     */
    IPage <DExperimentDesignDTO> findList(Page <DExperimentDesignDTO> page, @Param(Constants.WRAPPER) QueryWrapper queryWrapper);


}
