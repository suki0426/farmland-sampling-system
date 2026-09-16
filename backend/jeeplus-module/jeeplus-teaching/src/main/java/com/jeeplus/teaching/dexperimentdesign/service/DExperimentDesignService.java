/**
 * Copyright © 2021-2025 <a href="http://www.jeeplus.org/">JeePlus</a> All rights reserved.
 */
package com.jeeplus.teaching.dexperimentdesign.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jeeplus.teaching.dexperimentdesign.service.dto.DExperimentDesignDTO;
import com.jeeplus.teaching.dexperimentdesign.domain.DExperimentDesign;
import com.jeeplus.teaching.dexperimentdesign.mapper.DExperimentDesignMapper;

/**
 * 实验设计管理Service
 * @author GeniusGjq
 * @version 2026-04-25
 */
@Service
@Transactional
public class DExperimentDesignService extends ServiceImpl<DExperimentDesignMapper, DExperimentDesign> {


	/**
	 * 根据id查询
	 * @param id
	 * @return
	 */
	public DExperimentDesignDTO findById(String id) {
		return baseMapper.findById ( id );
	}

	/**
	 * 自定义分页检索
	 * @param page
	 * @param queryWrapper
	 * @return
	 */
	public IPage <DExperimentDesignDTO> findPage(Page <DExperimentDesignDTO> page, QueryWrapper queryWrapper) {
		queryWrapper.eq ("a.del_flag", 0 ); // 排除已经删除
		return  baseMapper.findList (page, queryWrapper);
	}


}
