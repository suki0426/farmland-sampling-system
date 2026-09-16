/**
 * Copyright © 2021-2025 <a href="http://www.jeeplus.org/">JeePlus</a> All rights reserved.
 */
package com.jeeplus.teaching.dindicator.controller;

import java.util.List;
import java.util.stream.Collectors;
import javax.validation.Valid;
import com.google.common.collect.Lists;
import com.jeeplus.aop.logging.annotation.ApiLog;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.jeeplus.teaching.dindicator.service.dto.DIndicatorDTO;
import com.jeeplus.teaching.dindicator.service.mapstruct.DIndicatorWrapper;
import com.jeeplus.teaching.dindicator.service.DIndicatorService;

/**
 * 指标管理Controller
 * @author GeniusGjq
 * @version 2026-04-25
 */
@Api(tags ="指标管理") 
@RestController
@RequestMapping(value = "/dindicator/dIndicator")
public class DIndicatorController {

	@Autowired
	private DIndicatorService dIndicatorService;

	@Autowired
	private DIndicatorWrapper dIndicatorWrapper;

	/**
	 * 根据Id获取指标管理数据
	 */
	@ApiLog("根据Id获取指标管理数据")
	@ApiOperation(value = "根据Id获取指标管理数据")
	@PreAuthorize("hasAnyAuthority('dindicator:dIndicator:view','dindicator:dIndicator:add','dindicator:dIndicator:edit')")
	@GetMapping("queryById")
	public ResponseEntity<DIndicatorDTO> queryById(String id) {
		return ResponseEntity.ok ( dIndicatorWrapper.toDTO ( dIndicatorService.getById ( id ) ) );
	}

	/**
	 * 保存指标管理
	 */
	@ApiLog("保存指标管理")
	@ApiOperation(value = "保存指标管理")
	@PreAuthorize("hasAnyAuthority('dindicator:dIndicator:add','dindicator:dIndicator:edit')")
	@PostMapping("save")
	public  ResponseEntity <String> save(@Valid @RequestBody DIndicatorDTO dIndicatorDTO) {
		//新增或编辑表单保存
		dIndicatorService.saveOrUpdate (dIndicatorWrapper.toEntity (dIndicatorDTO));
        return ResponseEntity.ok ( "保存指标管理成功" );
	}

	/**
	 * 删除指标管理
	 */
	@ApiLog("删除指标管理")
	@ApiOperation(value = "删除指标管理")
	@PreAuthorize("hasAuthority('dindicator:dIndicator:del')")
	@DeleteMapping("delete")
	public ResponseEntity <String> delete(String ids) {
		String idArray[] = ids.split(",");
        dIndicatorService.removeWithChildrenByIds ( Lists.newArrayList ( idArray ) );
		return ResponseEntity.ok( "删除指标管理成功" );
	}

	/**
     * 获取JSON树形数据。
     * @param extId 排除的ID
     * @return
	*/
	@ApiLog("查询指标管理树表数据")
	@ApiOperation(value = "查询指标管理树表数据")
	@GetMapping("treeData")
	public ResponseEntity <List <DIndicatorDTO> > treeData(String extId) {
		List <DIndicatorDTO> rootTree = dIndicatorService.treeData ( extId ).stream ().map ( dIndicatorWrapper::toDTO ).collect( Collectors.toList());
		return ResponseEntity.ok ( rootTree );
	}

}
