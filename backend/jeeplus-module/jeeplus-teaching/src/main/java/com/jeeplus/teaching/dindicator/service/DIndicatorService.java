/**
 * Copyright © 2021-2025 <a href="http://www.jeeplus.org/">JeePlus</a> All rights reserved.
 */
package com.jeeplus.teaching.dindicator.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.jeeplus.core.service.TreeService;
import com.jeeplus.teaching.dindicator.domain.DIndicator;
import com.jeeplus.teaching.dindicator.mapper.DIndicatorMapper;

/**
 * 指标管理Service
 * @author GeniusGjq
 * @version 2026-04-25
 */
@Service
@Transactional
public class DIndicatorService extends TreeService<DIndicatorMapper, DIndicator> {

	public boolean saveOrUpdate(DIndicator dIndicator) {
		return super.saveOrUpdate (dIndicator);
	}

	public boolean removeWithChildrenById(String id) {
		return super.removeWithChildrenById (id);
	}

}
