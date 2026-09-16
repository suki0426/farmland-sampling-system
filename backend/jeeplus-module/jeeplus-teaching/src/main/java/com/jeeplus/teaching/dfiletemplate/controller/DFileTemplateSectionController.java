/**
 * Copyright 漏 2021-2025 <a href="http://www.jeeplus.org/">JeePlus</a> All rights reserved.
 */
package com.jeeplus.teaching.dfiletemplate.controller;

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
import com.jeeplus.teaching.dfiletemplate.service.dto.DFileTemplateSectionDTO;
import com.jeeplus.teaching.dfiletemplate.service.mapstruct.DFileTemplateSectionWrapper;
import com.jeeplus.teaching.dfiletemplate.service.DFileTemplateSectionService;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

/**
 * 文件模板章节表Controller
 * @author GeniusGjq
 * @version 2026-04-27
 */
@Api(tags ="文件模板章节表")
@RestController
@RequestMapping(value = "/dfiletemplate/dFileTemplateSection")
public class DFileTemplateSectionController {

    @Autowired
    private DFileTemplateSectionService dFileTemplateSectionService;

    @Autowired
    private DFileTemplateSectionWrapper dFileTemplateSectionWrapper;

    @ApiLog("查询文件模板章节表列表数据")
    @ApiOperation(value = "查询文件模板章节表列表数据")
    @PreAuthorize("hasAuthority('dfiletemplate:dFileTemplateSection:list')")
    @GetMapping("list")
    public ResponseEntity<IPage<DFileTemplateSectionDTO>> list(DFileTemplateSectionDTO dFileTemplateSectionDTO, Page<DFileTemplateSectionDTO> page) throws Exception {
        QueryWrapper queryWrapper = QueryWrapperGenerator.buildQueryCondition(dFileTemplateSectionDTO, DFileTemplateSectionDTO.class);
        IPage<DFileTemplateSectionDTO> result = dFileTemplateSectionService.findPage(page, queryWrapper);
        return ResponseEntity.ok(result);
    }

    @ApiLog("根据Id获取文件模板章节表数据")
    @ApiOperation(value = "根据Id获取文件模板章节表数据")
    @PreAuthorize("hasAnyAuthority('dfiletemplate:dFileTemplateSection:view','dfiletemplate:dFileTemplateSection:add','dfiletemplate:dFileTemplateSection:edit')")
    @GetMapping("queryById")
    public ResponseEntity<DFileTemplateSectionDTO> queryById(String id) {
        return ResponseEntity.ok(dFileTemplateSectionService.findById(id));
    }

    @ApiLog("保存文件模板章节表")
    @ApiOperation(value = "保存文件模板章节表")
    @PreAuthorize("hasAnyAuthority('dfiletemplate:dFileTemplateSection:add','dfiletemplate:dFileTemplateSection:edit')")
    @PostMapping("save")
    public ResponseEntity<String> save(@Valid @RequestBody DFileTemplateSectionDTO dFileTemplateSectionDTO) {
        dFileTemplateSectionService.saveOrUpdate(dFileTemplateSectionWrapper.toEntity(dFileTemplateSectionDTO));
        return ResponseEntity.ok("保存文件模板章节表成功");
    }

    @ApiLog("删除文件模板章节表")
    @ApiOperation(value = "删除文件模板章节表")
    @PreAuthorize("hasAuthority('dfiletemplate:dFileTemplateSection:del')")
    @DeleteMapping("delete")
    public ResponseEntity<String> delete(String ids) {
        String idArray[] = ids.split(",");
        dFileTemplateSectionService.removeByIds(Lists.newArrayList(idArray));
        return ResponseEntity.ok("删除文件模板章节表成功");
    }

    @ApiLog("根据模板查询章节结构")
    @ApiOperation(value = "根据模板查询章节结构")
    @GetMapping("listByTemplate")
    public ResponseEntity<List<DFileTemplateSectionDTO>> listByTemplate(String templateId) {
        return ResponseEntity.ok(dFileTemplateSectionService.listByTemplate(templateId));
    }

    @ApiLog("批量保存模板章节")
    @ApiOperation(value = "批量保存模板章节")
    @PostMapping("batchSave")
    public ResponseEntity<String> batchSave(@RequestBody List<DFileTemplateSectionDTO> sectionDTOList) {
        dFileTemplateSectionService.batchSave(sectionDTOList);
        return ResponseEntity.ok("保存文件模板章节表成功");
    }

    @ApiLog("导出文件模板章节表数据")
    @PreAuthorize("hasAnyAuthority('dfiletemplate:dFileTemplateSection:export')")
    @GetMapping("export")
    public void exportFile(DFileTemplateSectionDTO dFileTemplateSectionDTO, Page<DFileTemplateSectionDTO> page, ExcelOptions options, HttpServletResponse response) throws Exception {
        String fileName = options.getFilename();
        QueryWrapper queryWrapper = QueryWrapperGenerator.buildQueryCondition(dFileTemplateSectionDTO, DFileTemplateSectionDTO.class);
        if (ExportMode.selected.equals(options.getMode())) {
            queryWrapper.in("a.id", options.getSelectIds());
        } else if (!ExportMode.current.equals(options.getMode())) {
            page.setSize(-1);
            page.setCurrent(0);
        }
        List<DFileTemplateSectionDTO> result = dFileTemplateSectionService.findPage(page, queryWrapper).getRecords();
        EasyExcelUtils.newInstance(dFileTemplateSectionService, dFileTemplateSectionWrapper).exportExcel(result, options.getSheetName(), DFileTemplateSectionDTO.class, fileName, options.getExportFields(), response);
    }

    @PreAuthorize("hasAnyAuthority('dfiletemplate:dFileTemplateSection:import')")
    @PostMapping("import")
    public ResponseEntity importFile(MultipartFile file) throws IOException {
        String result = EasyExcelUtils.newInstance(dFileTemplateSectionService, dFileTemplateSectionWrapper).importExcel(file, DFileTemplateSectionDTO.class);
        return ResponseEntity.ok(result);
    }

    @PreAuthorize("hasAnyAuthority('dfiletemplate:dFileTemplateSection:import')")
    @GetMapping("import/template")
    public void importFileTemplate(HttpServletResponse response) throws IOException {
        String fileName = "文件模板章节表数据导入模板.xlsx";
        List<DFileTemplateSectionDTO> list = Lists.newArrayList();
        EasyExcelUtils.newInstance(dFileTemplateSectionService, dFileTemplateSectionWrapper).exportExcel(list, "文件模板章节表数据", DFileTemplateSectionDTO.class, fileName, null, response);
    }
}
