package com.jeeplus.teaching.wordimport.service;

import com.jeeplus.teaching.wordimport.entity.ParseTask;
import org.springframework.web.multipart.MultipartFile;

/**
 * Word 导入服务接口
 */
public interface WordImportService {

    /**
     * 上传 Word 文件并创建解析任务
     */
    ParseTask uploadAndParse(MultipartFile file, String docType);

    /**
     * 查询解析任务状态
     */
    ParseTask getTaskStatus(String taskId);

    /**
     * 获取解析结果
     */
    ParseTask getParseResult(String taskId);

    /**
     * 取消解析任务
     */
    void cancelTask(String taskId);
}
