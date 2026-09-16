/**
 * Copyright 漏 2021-2025 <a href="http://www.jeeplus.org/">JeePlus</a> All rights reserved.
 */
package com.jeeplus.teaching.dfiletemplate.controller;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
import org.springframework.web.multipart.MultipartFile;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jeeplus.teaching.dfiletemplate.domain.DFileTemplate;
import com.jeeplus.teaching.dfiletemplate.service.mapstruct.DFileTemplateWrapper;
import com.jeeplus.teaching.dfiletemplate.service.dto.DFileTemplateDTO;
import com.jeeplus.teaching.dfiletemplate.service.DFileTemplateService;

/**
 * 文档模板管理Controller
 * @author GeniusGjq
 * @version 2026-04-27
 */
@Api(tags ="文档模板管理")
@RestController
@RequestMapping(value = "/dfiletemplate/dFileTemplate")
public class DFileTemplateController {

    @Autowired
    private DFileTemplateService dFileTemplateService;

    @Autowired
    private DFileTemplateWrapper dFileTemplateWrapper;

    @ApiLog("查询文档模板管理列表数据")
    @ApiOperation(value = "查询文档模板管理列表数据")
    @GetMapping("list")
    public ResponseEntity<IPage<DFileTemplate>> list(DFileTemplateDTO dFileTemplateDTO, Page<DFileTemplate> page) throws Exception {
        QueryWrapper queryWrapper = QueryWrapperGenerator.buildQueryCondition(dFileTemplateDTO, DFileTemplateDTO.class);
        IPage<DFileTemplate> result = dFileTemplateService.page(page, queryWrapper);
        return ResponseEntity.ok(result);
    }

    @ApiLog("根据Id获取文档模板管理数据")
    @ApiOperation(value = "根据Id获取文档模板管理数据")
    @GetMapping("queryById")
    public ResponseEntity<DFileTemplateDTO> queryById(String id) {
        return ResponseEntity.ok(dFileTemplateService.findById(id));
    }

    @ApiLog("保存文档模板管理")
    @ApiOperation(value = "保存文档模板管理")
    @PostMapping("save")
    public ResponseEntity<String> save(@Valid @RequestBody DFileTemplateDTO dFileTemplateDTO) {
        dFileTemplateService.saveOrUpdate(dFileTemplateDTO);
        return ResponseEntity.ok("保存文档模板管理成功");
    }

    @ApiLog("删除文档模板管理")
    @ApiOperation(value = "删除文档模板管理")
    @DeleteMapping("delete")
    public ResponseEntity<String> delete(String ids) {
        String idArray[] = ids.split(",");
        for (String id : idArray) {
            dFileTemplateService.removeById(id);
        }
        return ResponseEntity.ok("删除文档模板管理成功");
    }

    @ApiLog("查询文档模板管理树表数据")
    @ApiOperation(value = "查询文档模板管理树表数据")
    @GetMapping("treeData")
    public ResponseEntity<List<DFileTemplateDTO>> treeData() {
        return ResponseEntity.ok(dFileTemplateService.treeData());
    }

    @ApiLog("查询文档模板详情")
    @ApiOperation(value = "查询文档模板详情")
    @GetMapping("detail")
    public ResponseEntity<DFileTemplateDTO> detail(String id) {
        return ResponseEntity.ok(dFileTemplateService.findById(id));
    }

    @ApiLog("保存文档模板草稿")
    @ApiOperation(value = "保存文档模板草稿")
    @PostMapping("saveDraft")
    public ResponseEntity<Map<String, Object>> saveDraft(@RequestBody DFileTemplateDTO dFileTemplateDTO) {
        DFileTemplateDTO saved = dFileTemplateService.saveDraft(dFileTemplateDTO);
        return ResponseEntity.ok(buildTemplateResponse(saved, "模板草稿已保存"));
    }

    @ApiLog("创建手动模板草稿")
    @ApiOperation(value = "创建手动模板草稿")
    @PostMapping("import/manual/create")
    public ResponseEntity<Map<String, Object>> createManual(@RequestBody DFileTemplateDTO dFileTemplateDTO) {
        DFileTemplateDTO saved = dFileTemplateService.createManualTemplate(dFileTemplateDTO);
        return ResponseEntity.ok(buildTemplateResponse(saved, "模板草稿已生成"));
    }

    @ApiLog("发布文档模板")
    @ApiOperation(value = "发布文档模板")
    @PostMapping("publish")
    public ResponseEntity<Map<String, Object>> publish(@RequestBody DFileTemplateDTO dFileTemplateDTO) {
        DFileTemplateDTO published = dFileTemplateService.publish(dFileTemplateDTO);
        return ResponseEntity.ok(buildTemplateResponse(published, "模板已发布"));
    }

    @ApiLog("校验文档模板")
    @ApiOperation(value = "校验文档模板")
    @PostMapping("validate")
    public ResponseEntity<Map<String, Object>> validate(@RequestBody DFileTemplateDTO dFileTemplateDTO) {
        return ResponseEntity.ok(dFileTemplateService.validateTemplate(dFileTemplateDTO));
    }

    @ApiLog("查询可用模板")
    @ApiOperation(value = "查询可用模板")
    @GetMapping("usable")
    public ResponseEntity<List<DFileTemplateDTO>> usable(String docType, String status) {
        return ResponseEntity.ok(dFileTemplateService.usableTemplates(docType, status));
    }

    @ApiLog("导出文档模板管理数据")
    @GetMapping("export")
    public void exportFile(DFileTemplateDTO dFileTemplateDTO, Page<DFileTemplate> page, ExcelOptions options, HttpServletResponse response) throws Exception {
        String fileName = options.getFilename();
        QueryWrapper queryWrapper = QueryWrapperGenerator.buildQueryCondition(dFileTemplateDTO, DFileTemplateDTO.class);
        if (ExportMode.selected.equals(options.getMode())) {
            queryWrapper.in("id", options.getSelectIds());
        } else if (!ExportMode.current.equals(options.getMode())) {
            page.setSize(-1);
            page.setCurrent(0);
        }
        List<DFileTemplate> result = dFileTemplateService.page(page, queryWrapper).getRecords();
        EasyExcelUtils.newInstance(dFileTemplateService, dFileTemplateWrapper).exportExcel(result, options.getSheetName(), DFileTemplateDTO.class, fileName, options.getExportFields(), response);
    }

    @PostMapping("import")
    public ResponseEntity importFile(MultipartFile file) throws IOException {
        String result = EasyExcelUtils.newInstance(dFileTemplateService, dFileTemplateWrapper).importExcel(file, DFileTemplateDTO.class);
        return ResponseEntity.ok(result);
    }

    @GetMapping("import/template")
    public void importFileTemplate(HttpServletResponse response) throws IOException {
        String fileName = "文档模板管理数据导入模板.xlsx";
        List<DFileTemplateDTO> list = Lists.newArrayList();
        EasyExcelUtils.newInstance(dFileTemplateService, dFileTemplateWrapper).exportExcel(list, "文档模板管理数据", DFileTemplateDTO.class, fileName, null, response);
    }

    private Map<String, Object> buildTemplateResponse(DFileTemplateDTO template, String message) {
        Map<String, Object> result = new HashMap<>();
        result.put("id", template == null ? null : template.getId());
        result.put("template", template);
        result.put("message", message);
        return result;
    }
}
