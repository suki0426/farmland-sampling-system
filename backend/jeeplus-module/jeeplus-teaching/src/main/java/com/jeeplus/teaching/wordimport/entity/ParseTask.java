
package com.jeeplus.teaching.wordimport.entity;

import lombok.Data;
import java.util.Date;

/**
 * Word 解析任务实体
 */
@Data
public class ParseTask {
    private String taskId;              // 任务 ID
    private String docType;             // 文档分类
    private String sourceFileName;      // 原始文件名
    private String filePath;            // 临时文件路径
    private String status;              // waiting/uploading/parsing/success/failed/cancelled
    private Integer progress;           // 进度 0-100
    private String recordId;            // 生成的教学文档 ID
    private String errorMessage;        // 错误信息
    private Date createTime;
    private Date updateTime;
}
