/**
 * Copyright 漏 2021-2025 <a href="http://www.jeeplus.org/">JeePlus</a> All rights reserved.
 */
package com.jeeplus.teaching.dteachingdocument.controller;

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
import com.jeeplus.teaching.dteachingdocument.domain.DTeachingDocument;
import com.jeeplus.teaching.dteachingdocument.service.dto.DTeachingDocumentDTO;
import com.jeeplus.teaching.dteachingdocument.service.mapstruct.DTeachingDocumentWrapper;
import com.jeeplus.teaching.dteachingdocument.service.DTeachingDocumentService;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Api(tags ="教学文档管理")
@RestController
@RequestMapping(value = "/dteachingdocument/dTeachingDocument")
public class DTeachingDocumentController {

    @Autowired
    private DTeachingDocumentService dTeachingDocumentService;

    @Autowired
    private DTeachingDocumentWrapper dTeachingDocumentWrapper;

    @ApiLog("查询教学文档管理列表数据")
    @ApiOperation(value = "查询教学文档管理列表数据")
    @PreAuthorize("hasAuthority('dteachingdocument:dTeachingDocument:list')")
    @GetMapping("list")
    public ResponseEntity<IPage<DTeachingDocumentDTO>> list(DTeachingDocumentDTO dTeachingDocumentDTO, Page<DTeachingDocumentDTO> page) throws Exception {
        QueryWrapper queryWrapper = QueryWrapperGenerator.buildQueryCondition(dTeachingDocumentDTO, DTeachingDocumentDTO.class);
        IPage<DTeachingDocumentDTO> result = dTeachingDocumentService.findPage(page, queryWrapper);
        return ResponseEntity.ok(result);
    }

    @ApiLog("根据Id获取教学文档管理数据")
    @ApiOperation(value = "根据Id获取教学文档管理数据")
    @PreAuthorize("hasAnyAuthority('dteachingdocument:dTeachingDocument:view','dteachingdocument:dTeachingDocument:add','dteachingdocument:dTeachingDocument:edit')")
    @GetMapping("queryById")
    public ResponseEntity<DTeachingDocumentDTO> queryById(String id) {
        return ResponseEntity.ok(dTeachingDocumentService.findById(id));
    }

    @ApiLog("查询教学文档详情")
    @ApiOperation(value = "查询教学文档详情")
    @GetMapping("detail")
    public ResponseEntity<DTeachingDocumentDTO> detail(String id) {
        return ResponseEntity.ok(dTeachingDocumentService.detail(id));
    }

    @ApiLog("保存教学文档管理")
    @ApiOperation(value = "保存教学文档管理")
    @PreAuthorize("hasAnyAuthority('dteachingdocument:dTeachingDocument:add','dteachingdocument:dTeachingDocument:edit')")
    @PostMapping("save")
    public ResponseEntity<Map<String, Object>> save(@Valid @RequestBody DTeachingDocumentDTO dTeachingDocumentDTO) {
        DTeachingDocumentDTO saved = dTeachingDocumentService.saveDocument(dTeachingDocumentDTO);
        Map<String, Object> result = new HashMap<>();
        result.put("id", saved == null ? null : saved.getId());
        result.put("message", "保存教学文档成功");
        result.put("data", saved);
        return ResponseEntity.ok(result);
    }

    @ApiLog("复制教学文档")
    @ApiOperation(value = "复制教学文档")
    @PostMapping("copy")
    public ResponseEntity<Map<String, Object>> copy(@RequestBody Map<String, String> payload) {
        DTeachingDocumentDTO copied = dTeachingDocumentService.copyDocument(payload.get("id"));
        Map<String, Object> result = new HashMap<>();
        result.put("id", copied == null ? null : copied.getId());
        result.put("data", copied);
        result.put("message", "复制成功");
        return ResponseEntity.ok(result);
    }

    @ApiLog("删除教学文档管理")
    @ApiOperation(value = "删除教学文档管理")
    @PreAuthorize("hasAuthority('dteachingdocument:dTeachingDocument:del')")
    @DeleteMapping("delete")
    public ResponseEntity<String> delete(String ids) {
        String idArray[] = ids.split(",");
        dTeachingDocumentService.removeByIds(Lists.newArrayList(idArray));
        return ResponseEntity.ok("删除教学文档管理成功");
    }

    @ApiLog("导出教学文档管理数据")
    @PreAuthorize("hasAnyAuthority('dteachingdocument:dTeachingDocument:export')")
    @GetMapping("export")
    public void exportFile(DTeachingDocumentDTO dTeachingDocumentDTO, Page<DTeachingDocumentDTO> page, ExcelOptions options, HttpServletResponse response) throws Exception {
        String fileName = options.getFilename();
        QueryWrapper queryWrapper = QueryWrapperGenerator.buildQueryCondition(dTeachingDocumentDTO, DTeachingDocumentDTO.class);

        if (ExportMode.selected.equals(options.getMode())) {
            queryWrapper.in("a.id", options.getSelectIds());
        } else if (!ExportMode.current.equals(options.getMode())) {
            page.setSize(-1);
            page.setCurrent(0);
        }
        List<DTeachingDocumentDTO> result = dTeachingDocumentService.findPage(page, queryWrapper).getRecords();
        EasyExcelUtils.newInstance(dTeachingDocumentService, dTeachingDocumentWrapper).exportExcel(result, options.getSheetName(), DTeachingDocumentDTO.class, fileName, options.getExportFields(), response);
    }

    @PreAuthorize("hasAnyAuthority('dteachingdocument:dTeachingDocument:import')")
    @PostMapping("import")
    public ResponseEntity importFile(MultipartFile file) throws IOException {
        String result = EasyExcelUtils.newInstance(dTeachingDocumentService, dTeachingDocumentWrapper).importExcel(file, DTeachingDocumentDTO.class);
        return ResponseEntity.ok(result);
    }

    @PreAuthorize("hasAnyAuthority('dteachingdocument:dTeachingDocument:import')")
    @GetMapping("import/template")
    public void importFileTemplate(HttpServletResponse response) throws IOException {
        String fileName = "教学文档管理数据导入模板.xlsx";
        List<DTeachingDocumentDTO> list = Lists.newArrayList();
        EasyExcelUtils.newInstance(dTeachingDocumentService, dTeachingDocumentWrapper).exportExcel(list, "教学文档管理数据", DTeachingDocumentDTO.class, fileName, null, response);
    }
}
