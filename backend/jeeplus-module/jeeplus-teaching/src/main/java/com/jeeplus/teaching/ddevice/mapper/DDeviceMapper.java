/**
 * Copyright © 2021-2025 <a href="http://www.jeeplus.org/">JeePlus</a> All rights reserved.
 */
package com.jeeplus.teaching.ddevice.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Param;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Constants;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jeeplus.teaching.ddevice.service.dto.DDeviceDTO;
import com.jeeplus.teaching.ddevice.domain.DDevice;

/**
 * 设备管理MAPPER接口
 * @author GeniusGjq
 * @version 2026-04-25
 */
public interface DDeviceMapper extends BaseMapper<DDevice> {


    /**
     * 根据id获取设备管理
     * @param id
     * @return
     */
    DDeviceDTO findById(String id);

    /**
     * 获取设备管理列表
     *
     * @param queryWrapper
     * @return
     */
    IPage <DDeviceDTO> findList(Page <DDeviceDTO> page, @Param(Constants.WRAPPER) QueryWrapper queryWrapper);


}
