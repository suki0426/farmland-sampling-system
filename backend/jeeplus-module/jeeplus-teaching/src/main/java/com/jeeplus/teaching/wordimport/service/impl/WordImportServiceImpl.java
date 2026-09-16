 package com.jeeplus.teaching.wordimport.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jeeplus.teaching.dteachingdocument.domain.DTeachingDocument;
import com.jeeplus.teaching.dteachingdocument.service.DTeachingDocumentService;
import com.jeeplus.teaching.wordimport.entity.ParseTask;
import com.jeeplus.teaching.wordimport.entity.WordStruct;
import com.jeeplus.teaching.wordimport.service.WordImportService;
import com.jeeplus.teaching.wordimport.util.WordReaderUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Word 导入服务实现
 */
@Service
public class WordImportServiceImpl implements WordImportService {

    @Autowired
    private DTeachingDocumentService dTeachingDocumentService;

    // 任务存储（生产环境建议用数据库或 Redis）
    private static final Map<String, ParseTask> taskStore = new ConcurrentHashMap<>();

    @Override
    public ParseTask uploadAndParse(MultipartFile file, String docType) {
        try {
            // 1. 生成任务 ID
            String taskId = "task-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8);

            // 2. 保存临时文件
            String tempDir = System.getProperty("java.io.tmpdir");
            String originalFilename = file.getOriginalFilename();
            String tempFilePath = tempDir + File.separator + taskId + "_" + originalFilename;
            File tempFile = new File(tempFilePath);
            file.transferTo(tempFile);

            // 3. 创建任务记录
            ParseTask task = new ParseTask();
            task.setTaskId(taskId);
            task.setDocType(docType);
            task.setSourceFileName(originalFilename);
            task.setFilePath(tempFilePath);
            task.setStatus("uploading");
            task.setProgress(0);
            task.setCreateTime(new Date());
            taskStore.put(taskId, task);

            // 4. 异步解析（实际项目建议使用线程池或消息队列）
            new Thread(() -> parseWordAsync(taskId, tempFile, docType)).start();

            return task;

        } catch (Exception e) {
            throw new RuntimeException("文件上传失败: " + e.getMessage(), e);
        }
    }

    /**
     * 异步解析 Word 文件
     */
    private void parseWordAsync(String taskId, File wordFile, String docType) {
        ParseTask task = taskStore.get(taskId);
        if (task == null) return;

        try {
            System.out.println("[WordImport] 开始解析任务: " + taskId + ", 文件: " + wordFile.getAbsolutePath());

            task.setStatus("parsing");
            task.setProgress(10);
            task.setUpdateTime(new Date());

            System.out.println("[WordImport] 开始读取Word文件结构...");
            List<WordStruct> structList = WordReaderUtil.readStructWord(wordFile.getAbsolutePath());
            System.out.println("[WordImport] Word文件读取完成，解析到 " + (structList != null ? structList.size() : 0) + " 个结构");

            task.setProgress(60);
            task.setUpdateTime(new Date());

            if (structList == null || structList.isEmpty()) {
                task.setStatus("failed");
                task.setErrorMessage("Word 文件内容为空或格式无法识别");
                task.setProgress(100);
                task.setUpdateTime(new Date());
                System.err.println("[WordImport] 解析失败: 文件内容为空");
                return;
            }

            System.out.println("[WordImport] 开始转换JSON...");
            String contentJson = convertToJson(structList);
            System.out.println("[WordImport] JSON转换完成");

            task.setProgress(80);
            task.setUpdateTime(new Date());

            System.out.println("[WordImport] 开始保存教学文档...");
            // 使用文件名（去掉扩展名）作为文档标题，避免与一级标题冲突
            String docTitle = task.getSourceFileName();
            if (docTitle != null && docTitle.contains(".")) {
                docTitle = docTitle.substring(0, docTitle.lastIndexOf("."));
            }
            if (docTitle == null || docTitle.trim().isEmpty()) {
                docTitle = structList.get(0).getLevel1Title();
            }

            DTeachingDocument document = new DTeachingDocument();
            document.setId(UUID.randomUUID().toString().replace("-", ""));
            document.setTitle(docTitle);
            document.setDocType(docType);
            document.setInputMethod("word_import");
            document.setStatus("draft");
            document.setSourceFileName(task.getSourceFileName());
            document.setContentJson(contentJson);
            document.setDelFlag(0);
            document.setCreateDate(new Date());
            document.setUpdateDate(new Date());

            dTeachingDocumentService.save(document);
            System.out.println("[WordImport] 教学文档保存成功, ID: " + document.getId());

            task.setProgress(95);
            task.setUpdateTime(new Date());

            task.setStatus("success");
            task.setRecordId(document.getId());
            task.setProgress(100);
            task.setUpdateTime(new Date());

            System.out.println("[WordImport] 任务完成: " + taskId);

        } catch (Exception e) {
            System.err.println("[WordImport] 解析异常: " + e.getMessage());
            e.printStackTrace();
            task.setStatus("failed");
            task.setErrorMessage("解析失败: " + e.getMessage());
            task.setProgress(100);
            task.setUpdateTime(new Date());
        } finally {
            if (wordFile.exists()) {
                wordFile.delete();
                System.out.println("[WordImport] 临时文件已删除: " + wordFile.getAbsolutePath());
            }
        }
    }

    /**
     * 将 WordStruct 列表转换为 JSON 格式
     * 核心逻辑：
     * 1. 每个 WordStruct 代表一个完整的层级路径（如 level1="1教学目标", level2="1.1知识目标", content="...")
     * 2. 以 level1 为根节点（sectionLevel=1），level2 为其子节点（sectionLevel=2）
     * 3. 同一个 level1 下的多个 level2 都归入该 level1 的 children
     */
    private String convertToJson(List<WordStruct> structList) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            List<Map<String, Object>> result = new ArrayList<>();
            Map<String, Object> currentSection = null;
            String currentLevel1Title = null; // 追踪当前的一级标题

            System.out.println("[WordImport] 开始转换JSON, structList.size=" + structList.size());

            for (int i = 0; i < structList.size(); i++) {
                WordStruct ws = structList.get(i);

                String level1Title = ws.getLevel1Title();
                if (level1Title != null) level1Title = level1Title.trim();

                String level2Title = ws.getLevel2Title();
                if (level2Title != null) level2Title = level2Title.trim();

                String content = ws.getContent();
                if (content != null) content = content.trim();

                boolean hasLevel1 = level1Title != null && !level1Title.isEmpty();
                boolean hasLevel2 = level2Title != null && !level2Title.isEmpty();
                boolean hasContent = content != null && !content.isEmpty();

                System.out.println("[WordImport] 处理 struct[" + i + "]: level1='" + level1Title + "', level2='" + level2Title + "', contentLen=" + (content != null ? content.length() : 0));

                if (!hasLevel1) {
                    System.out.println("[WordImport] 跳过没有 level1 的数据");
                    continue;
                }

                // 1. 如果一级标题变化了，创建新的一级 section
                if (!level1Title.equals(currentLevel1Title)) {
                    currentLevel1Title = level1Title;
                    currentSection = new LinkedHashMap<>();
                    currentSection.put("sectionTitle", level1Title);
                    currentSection.put("sectionLevel", "1");
                    currentSection.put("children", new ArrayList<Map<String, Object>>());
                    result.add(currentSection);
                    System.out.println("[WordImport] 创建新的一级 section: " + level1Title);
                }

                // 2. 如果有二级标题，作为子节点添加到当前 section（注意：不是 else if！）
                if (hasLevel2) {
                    Map<String, Object> childMap = new LinkedHashMap<>();
                    childMap.put("sectionTitle", level2Title);
                    childMap.put("sectionLevel", "2");
                    childMap.put("componentType", "richtext");
                    String htmlValue = (content == null || content.isEmpty()) ? "" : "<p>" + content.replace("\n", "<br/>") + "</p>";
                    childMap.put("value", htmlValue);
                    ((List<Map<String, Object>>) currentSection.get("children")).add(childMap);
                    System.out.println("[WordImport] 添加二级子节点: " + level2Title + " 到 section: " + level1Title);
                }
                // 3. 如果没有二级标题但有内容，直接作为一级标题下的内容块
                else if (hasContent) {
                    Map<String, Object> childMap = new LinkedHashMap<>();
                    childMap.put("sectionTitle", level1Title + "内容");
                    childMap.put("sectionLevel", "2");
                    childMap.put("componentType", "richtext");
                    String htmlValue = "<p>" + content.replace("\n", "<br/>") + "</p>";
                    childMap.put("value", htmlValue);
                    ((List<Map<String, Object>>) currentSection.get("children")).add(childMap);
                    System.out.println("[WordImport] 添加内容子节点到 section: " + level1Title);
                }
            }

            System.out.println("[WordImport] 转换前 result.size=" + result.size());
            for (Map<String, Object> section : result) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> children = (List<Map<String, Object>>) section.get("children");
                System.out.println("[WordImport] section '" + section.get("sectionTitle") + "' children.size=" + (children != null ? children.size() : 0));
            }

            // 清理空节点：移除没有有效子内容的章节
            result.removeIf(section -> {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> children = (List<Map<String, Object>>) section.get("children");
                return children == null || children.isEmpty();
            });

            System.out.println("[WordImport] 清理空节点后 result.size=" + result.size());

            String json = mapper.writeValueAsString(result);
            System.out.println("[WordImport] JSON转换结果: " + json);
            return json;

        } catch (Exception e) {
            throw new RuntimeException("JSON转换失败: " + e.getMessage(), e);
        }
    }

    /**
     * 辅助方法：构建子节点 Map，减少重复代码
     */
    private Map<String, Object> createChildNode(String title, String level, String content) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("sectionTitle", title);
        map.put("sectionLevel", level);
        map.put("componentType", "richtext");
        // 简单的 HTML 处理
        String htmlValue = (content == null || content.isEmpty()) ? "" : "<p>" + content.replace("\n", "<br/>") + "</p>";
        map.put("value", htmlValue);
        return map;
    }

    @Override
    public ParseTask getTaskStatus(String taskId) {
        ParseTask task = taskStore.get(taskId);
        if (task == null) {
            throw new RuntimeException("任务不存在: " + taskId);
        }
        return task;
    }

    @Override
    public ParseTask getParseResult(String taskId) {
        return getTaskStatus(taskId);
    }

    @Override
    public void cancelTask(String taskId) {
        ParseTask task = taskStore.get(taskId);
        if (task != null && !"success".equals(task.getStatus()) && !"failed".equals(task.getStatus())) {
            task.setStatus("cancelled");
            task.setProgress(100);
            task.setUpdateTime(new Date());
        }
    }
}
