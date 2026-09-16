/**
 * Copyright &copy; 2021-2026 <a href="http://www.jeeplus.org/">JeePlus</a> All rights reserved.
 */
package com.jeeplus.sys.mapper;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jeeplus.core.domain.TreeMapper;
import com.jeeplus.sys.domain.Office;
import com.jeeplus.sys.service.dto.LogDTO;
import com.jeeplus.sys.service.dto.OfficeDTO;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 机构MAPPER接口
 *
 * @author jeeplus
 * @version 2021-05-16
 */
@Repository
public interface OfficeMapper extends TreeMapper <Office> {

    IPage<Office> getList(String keyWord, Page<Office> page);

    List<String> getIdsByMaster(String userid);
}
