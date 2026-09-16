package com.jeeplus.teaching.dteachingdocument.service.dto;

import com.alibaba.excel.annotation.ExcelProperty;
import com.jeeplus.core.excel.annotation.ExcelDictProperty;
import com.jeeplus.core.excel.converter.ExcelDictDTOConverter;
import com.jeeplus.core.query.Query;
import com.jeeplus.core.query.QueryType;
import com.jeeplus.core.service.dto.BaseDTO;
import com.jeeplus.teaching.dfiletemplate.service.dto.DFileTemplateDTO;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
@EqualsAndHashCode(callSuper = false)
public class DTeachingDocumentDTO extends BaseDTO {

    private static final long serialVersionUID = 1L;

    @Query(type = QueryType.EQ)
    @ExcelProperty("文档标题")
    private String title;

    @Query(type = QueryType.EQ)
    @ExcelProperty(value = "文档分类", converter = ExcelDictDTOConverter.class)
    @ExcelDictProperty("")
    private String docType;

    @Query(type = QueryType.EQ)
    @ExcelProperty("课程名称")
    private String courseName;

    @Query(type = QueryType.EQ)
    @ExcelProperty("课程编码")
    private String courseCode;

    @Query(type = QueryType.EQ)
    @ExcelProperty("学期")
    private String academicterm;

    @Query(type = QueryType.EQ)
    @ExcelProperty("教师姓名")
    private String teacherName;

    @Query(type = QueryType.EQ)
    @ExcelProperty(value = "录入方式", converter = ExcelDictDTOConverter.class)
    @ExcelDictProperty("")
    private String inputMethod;

    @Query(type = QueryType.EQ)
    @ExcelProperty(value = "文档状态", converter = ExcelDictDTOConverter.class)
    @ExcelDictProperty("")
    private String status;

    @ExcelProperty("模板id")
    private String templateId;

    @Query(type = QueryType.EQ)
    @ExcelProperty("导入文件原始名称")
    private String sourceFileName;

    @Query(type = QueryType.EQ)
    @ExcelProperty("文档结构化内容")
    private String contentJson;

    @Query(type = QueryType.EQ)
    @ExcelProperty("关键词集合")
    private String keywordsJson;

    @Query(type = QueryType.EQ)
    @ExcelProperty("流程图描述文本")
    private String flowChartText;

    private DFileTemplateDTO template;

    private String templateName;

    private String templateVersion;

    private List<Map<String, Object>> content = new ArrayList<>();
}
