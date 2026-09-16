/**
 * Copyright © 2021-2025 <a href="http://www.jeeplus.org/">JeePlus</a> All rights reserved.
 */
package com.jeeplus.teaching.dexperimentdesign.controller;

import javax.servlet.http.HttpServletResponse;
import javax.validation.Valid;
import com.google.common.collect.Lists;
import com.jeeplus.core.excel.EasyExcelUtils;
import com.jeeplus.core.excel.ExcelOptions;
import com.jeeplus.core.excel.annotation.ExportMode;
import com.jeeplus.core.query.QueryWrapperGenerator;
import com.jeeplus.aop.logging.annotation.ApiLog;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jeeplus.teaching.dexperimentdesign.domain.DExperimentDesign;
import com.jeeplus.teaching.dexperimentdesign.service.dto.DExperimentDesignDTO;
import com.jeeplus.teaching.dexperimentdesign.service.mapstruct.DExperimentDesignWrapper;
import com.jeeplus.teaching.dexperimentdesign.service.DExperimentDesignService;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

/**
 * 实验设计管理Controller
 * @author GeniusGjq
 * @version 2026-04-25
 */

@Api(tags ="实验设计管理")
@RestController
@RequestMapping(value = "/dexperimentdesign/dExperimentDesign")
public class DExperimentDesignController {

	@Autowired
	private DExperimentDesignService dExperimentDesignService;

	@Autowired
	private DExperimentDesignWrapper dExperimentDesignWrapper;

	/**
	 * 实验设计管理列表数据
	 */
	@ApiLog("查询实验设计管理列表数据")
	@ApiOperation(value = "查询实验设计管理列表数据")
	@PreAuthorize("hasAuthority('dexperimentdesign:dExperimentDesign:list')")
	@GetMapping("list")
	public ResponseEntity<IPage<DExperimentDesignDTO>> list(DExperimentDesignDTO dExperimentDesignDTO, Page<DExperimentDesignDTO> page) throws Exception {
		QueryWrapper queryWrapper = QueryWrapperGenerator.buildQueryCondition (dExperimentDesignDTO, DExperimentDesignDTO.class);
		IPage<DExperimentDesignDTO> result = dExperimentDesignService.findPage (page, queryWrapper);
		return ResponseEntity.ok (result);
	}


	/**
	 * 根据Id获取实验设计管理数据
	 */
	@ApiLog("根据Id获取实验设计管理数据")
	@ApiOperation(value = "根据Id获取实验设计管理数据")
	@PreAuthorize("hasAnyAuthority('dexperimentdesign:dExperimentDesign:view','dexperimentdesign:dExperimentDesign:add','dexperimentdesign:dExperimentDesign:edit')")
	@GetMapping("queryById")
	public ResponseEntity<DExperimentDesignDTO> queryById(String id) {
		return ResponseEntity.ok ( dExperimentDesignService.findById ( id ) );
	}

	/**
	 * 保存实验设计管理
	 */
	@ApiLog("保存实验设计管理")
	@ApiOperation(value = "保存实验设计管理")
	@PreAuthorize("hasAnyAuthority('dexperimentdesign:dExperimentDesign:add','dexperimentdesign:dExperimentDesign:edit')")
	@PostMapping("save")
	public  ResponseEntity <String> save(@Valid @RequestBody DExperimentDesignDTO dExperimentDesignDTO) {
		//新增或编辑表单保存
		dExperimentDesignService.saveOrUpdate (dExperimentDesignWrapper.toEntity (dExperimentDesignDTO));
        return ResponseEntity.ok ( "保存实验设计管理成功" );
	}


	/**
	 * 删除实验设计管理
	 */
	@ApiLog("删除实验设计管理")
	@ApiOperation(value = "删除实验设计管理")
	@PreAuthorize("hasAuthority('dexperimentdesign:dExperimentDesign:del')")
	@DeleteMapping("delete")
	public ResponseEntity <String> delete(String ids) {
		String idArray[] = ids.split(",");
        dExperimentDesignService.removeByIds ( Lists.newArrayList ( idArray ) );
		return ResponseEntity.ok( "删除实验设计管理成功" );
	}
	
	/**
     * 导出实验设计管理数据
     *
     * @param dExperimentDesignDTO
     * @param page
     * @param response
     * @throws Exception
     */
    @ApiLog("导出实验设计管理数据")
    @PreAuthorize("hasAnyAuthority('dexperimentdesign:dExperimentDesign:export')")
    @GetMapping("export")
    public void exportFile(DExperimentDesignDTO dExperimentDesignDTO, Page <DExperimentDesignDTO> page, ExcelOptions options, HttpServletResponse response) throws Exception {
        String fileName = options.getFilename ( );
		QueryWrapper queryWrapper = QueryWrapperGenerator.buildQueryCondition (dExperimentDesignDTO, DExperimentDesignDTO.class);

        if ( ExportMode.current.equals ( options.getMode ( ) ) ) { // 导出当前页数据
            
        } else if ( ExportMode.selected.equals ( options.getMode ( ) ) ) { // 导出选中数据
            queryWrapper.in ( "a.id", options.getSelectIds () );
        } else { // 导出全部数据
            page.setSize ( -1 );
            page.setCurrent ( 0 );
        }
        List<DExperimentDesignDTO> result = dExperimentDesignService.findPage ( page, queryWrapper ).getRecords ( );
        EasyExcelUtils.newInstance ( dExperimentDesignService, dExperimentDesignWrapper ).exportExcel ( result,  options.getSheetName ( ), DExperimentDesignDTO.class, fileName,options.getExportFields (), response );
    }

    /**
     * 导入实验设计管理数据
     *
     * @return
     */
    @PreAuthorize("hasAnyAuthority('dexperimentdesign:dExperimentDesign:import')")
    @PostMapping("import")
    public ResponseEntity importFile(MultipartFile file) throws IOException {
        String result = EasyExcelUtils.newInstance ( dExperimentDesignService, dExperimentDesignWrapper ).importExcel ( file, DExperimentDesignDTO.class );
        return ResponseEntity.ok ( result );
    }

    /**
     * 下载导入实验设计管理数据模板
     *
     * @param response
     * @return
     */
    @PreAuthorize ("hasAnyAuthority('dexperimentdesign:dExperimentDesign:import')")
    @GetMapping("import/template")
    public void importFileTemplate(HttpServletResponse response) throws IOException {
        String fileName = "实验设计管理数据导入模板.xlsx";
        List<DExperimentDesignDTO> list = Lists.newArrayList();
        EasyExcelUtils.newInstance ( dExperimentDesignService, dExperimentDesignWrapper ).exportExcel ( list,  "实验设计管理数据", DExperimentDesignDTO.class, fileName, null, response );
    }

}
