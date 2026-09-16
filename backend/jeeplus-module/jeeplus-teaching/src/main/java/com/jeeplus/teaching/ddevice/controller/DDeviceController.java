/**
 * Copyright © 2021-2025 <a href="http://www.jeeplus.org/">JeePlus</a> All rights reserved.
 */
package com.jeeplus.teaching.ddevice.controller;

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
import com.jeeplus.teaching.ddevice.domain.DDevice;
import com.jeeplus.teaching.ddevice.service.dto.DDeviceDTO;
import com.jeeplus.teaching.ddevice.service.mapstruct.DDeviceWrapper;
import com.jeeplus.teaching.ddevice.service.DDeviceService;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

/**
 * 设备管理Controller
 * @author GeniusGjq
 * @version 2026-04-25
 */

@Api(tags ="设备管理")
@RestController
@RequestMapping(value = "/ddevice/dDevice")
public class DDeviceController {

	@Autowired
	private DDeviceService dDeviceService;

	@Autowired
	private DDeviceWrapper dDeviceWrapper;

	/**
	 * 设备管理列表数据
	 */
	@ApiLog("查询设备管理列表数据")
	@ApiOperation(value = "查询设备管理列表数据")
	@PreAuthorize("hasAuthority('ddevice:dDevice:list')")
	@GetMapping("list")
	public ResponseEntity<IPage<DDeviceDTO>> list(DDeviceDTO dDeviceDTO, Page<DDeviceDTO> page) throws Exception {
		QueryWrapper queryWrapper = QueryWrapperGenerator.buildQueryCondition (dDeviceDTO, DDeviceDTO.class);
		IPage<DDeviceDTO> result = dDeviceService.findPage (page, queryWrapper);
		return ResponseEntity.ok (result);
	}


	/**
	 * 根据Id获取设备管理数据
	 */
	@ApiLog("根据Id获取设备管理数据")
	@ApiOperation(value = "根据Id获取设备管理数据")
	@PreAuthorize("hasAnyAuthority('ddevice:dDevice:view','ddevice:dDevice:add','ddevice:dDevice:edit')")
	@GetMapping("queryById")
	public ResponseEntity<DDeviceDTO> queryById(String id) {
		return ResponseEntity.ok ( dDeviceService.findById ( id ) );
	}

	/**
	 * 保存设备管理
	 */
	@ApiLog("保存设备管理")
	@ApiOperation(value = "保存设备管理")
	@PreAuthorize("hasAnyAuthority('ddevice:dDevice:add','ddevice:dDevice:edit')")
	@PostMapping("save")
	public  ResponseEntity <String> save(@Valid @RequestBody DDeviceDTO dDeviceDTO) {
		//新增或编辑表单保存
		dDeviceService.saveOrUpdate (dDeviceWrapper.toEntity (dDeviceDTO));
        return ResponseEntity.ok ( "保存设备管理成功" );
	}


	/**
	 * 删除设备管理
	 */
	@ApiLog("删除设备管理")
	@ApiOperation(value = "删除设备管理")
	@PreAuthorize("hasAuthority('ddevice:dDevice:del')")
	@DeleteMapping("delete")
	public ResponseEntity <String> delete(String ids) {
		String idArray[] = ids.split(",");
        dDeviceService.removeByIds ( Lists.newArrayList ( idArray ) );
		return ResponseEntity.ok( "删除设备管理成功" );
	}
	
	/**
     * 导出设备管理数据
     *
     * @param dDeviceDTO
     * @param page
     * @param response
     * @throws Exception
     */
    @ApiLog("导出设备管理数据")
    @PreAuthorize("hasAnyAuthority('ddevice:dDevice:export')")
    @GetMapping("export")
    public void exportFile(DDeviceDTO dDeviceDTO, Page <DDeviceDTO> page, ExcelOptions options, HttpServletResponse response) throws Exception {
        String fileName = options.getFilename ( );
		QueryWrapper queryWrapper = QueryWrapperGenerator.buildQueryCondition (dDeviceDTO, DDeviceDTO.class);

        if ( ExportMode.current.equals ( options.getMode ( ) ) ) { // 导出当前页数据
            
        } else if ( ExportMode.selected.equals ( options.getMode ( ) ) ) { // 导出选中数据
            queryWrapper.in ( "a.id", options.getSelectIds () );
        } else { // 导出全部数据
            page.setSize ( -1 );
            page.setCurrent ( 0 );
        }
        List<DDeviceDTO> result = dDeviceService.findPage ( page, queryWrapper ).getRecords ( );
        EasyExcelUtils.newInstance ( dDeviceService, dDeviceWrapper ).exportExcel ( result,  options.getSheetName ( ), DDeviceDTO.class, fileName,options.getExportFields (), response );
    }

    /**
     * 导入设备管理数据
     *
     * @return
     */
    @PreAuthorize("hasAnyAuthority('ddevice:dDevice:import')")
    @PostMapping("import")
    public ResponseEntity importFile(MultipartFile file) throws IOException {
        String result = EasyExcelUtils.newInstance ( dDeviceService, dDeviceWrapper ).importExcel ( file, DDeviceDTO.class );
        return ResponseEntity.ok ( result );
    }

    /**
     * 下载导入设备管理数据模板
     *
     * @param response
     * @return
     */
    @PreAuthorize ("hasAnyAuthority('ddevice:dDevice:import')")
    @GetMapping("import/template")
    public void importFileTemplate(HttpServletResponse response) throws IOException {
        String fileName = "设备管理数据导入模板.xlsx";
        List<DDeviceDTO> list = Lists.newArrayList();
        EasyExcelUtils.newInstance ( dDeviceService, dDeviceWrapper ).exportExcel ( list,  "设备管理数据", DDeviceDTO.class, fileName, null, response );
    }

}
