package com.jeeplus.teaching.wordimport.controller;

import com.jeeplus.aop.logging.annotation.ApiLog;
import com.jeeplus.teaching.wordimport.entity.ParseTask;
import com.jeeplus.teaching.wordimport.service.WordImportService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * 教学文件导入控制器
 */
@Api(tags = "教学文件导入")
@RestController
@RequestMapping("/teaching/file/import")
public class TeachingFileImportController {

    @Autowired
    private WordImportService wordImportService;

    /**
     * 上传 Word 并创建解析任务
     */
    @ApiLog("上传 Word 并创建解析任务")
    @ApiOperation(value = "上传 Word 并创建解析任务")
    @PostMapping("/upload")
    public ResponseEntity<ParseTask> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("docType") String docType) {

        return handleUpload(file, docType);
    }

    @ApiLog("上传 Word 并创建解析任务(兼容files参数)")
    @ApiOperation(value = "上传 Word 并创建解析任务(兼容files参数)")
    @PostMapping("/uploadFiles")
    public ResponseEntity<ParseTask> uploadWithFiles(
            @RequestParam("files") MultipartFile file,
            @RequestParam("docType") String docType) {

        return handleUpload(file, docType);
    }

    private ResponseEntity<ParseTask> handleUpload(MultipartFile file, String docType) {
        // 验证文件类型
        String filename = file.getOriginalFilename();
        if (filename == null || (!filename.endsWith(".doc") && !filename.endsWith(".docx"))) {
            return ResponseEntity.badRequest().build();
        }

        ParseTask task = wordImportService.uploadAndParse(file, docType);
        return ResponseEntity.ok(task);
    }

    /**
     * 查询解析状态
     */
    @ApiLog("查询解析状态")
    @ApiOperation(value = "查询解析状态")
    @GetMapping("/status")
    public ResponseEntity<ParseTask> getStatus(@RequestParam String taskId) {
        ParseTask task = wordImportService.getTaskStatus(taskId);
        return ResponseEntity.ok(task);
    }

    /**
     * 查询解析结果
     */
    @ApiLog("查询解析结果")
    @ApiOperation(value = "查询解析结果")
    @GetMapping("/result")
    public ResponseEntity<ParseTask> getResult(@RequestParam String taskId) {
        ParseTask task = wordImportService.getParseResult(taskId);
        return ResponseEntity.ok(task);
    }

    /**
     * 取消解析任务
     */
    @ApiLog("取消解析任务")
    @ApiOperation(value = "取消解析任务")
    @PostMapping("/cancel")
    public ResponseEntity<Void> cancel(@RequestBody TaskCancelRequest request) {
        wordImportService.cancelTask(request.getTaskId());
        return ResponseEntity.ok().build();
    }

    /**
     * 取消请求体
     */
    @lombok.Data
    public static class TaskCancelRequest {
        private String taskId;
    }
}
