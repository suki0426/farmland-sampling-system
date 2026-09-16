package com.jeeplus.teaching.wordimport.util;

import com.jeeplus.teaching.wordimport.entity.WordStruct;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTPPr;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTStyle;

import java.io.FileInputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class WordReaderUtil {

    static {
        try {
            String version = org.apache.commons.io.IOUtils.class.getPackage().getImplementationVersion();
            System.out.println("[WordReader] ========== Commons-IO 版本信息 ==========");
            System.out.println("[WordReader] 实际加载的 commons-io 版本: " + version);
            System.out.println("[WordReader] IOUtils 类位置: " + org.apache.commons.io.IOUtils.class.getProtectionDomain().getCodeSource().getLocation());
            System.out.println("[WordReader] ========================================");
        } catch (Exception e) {
            System.err.println("[WordReader] 无法获取版本信息: " + e.getMessage());
        }
    }

    public static List<WordStruct> readStructWord(String filePath) throws Exception {
        List<WordStruct> structList = new ArrayList<>();
        System.out.println("[WordReader] 开始读取文件: " + filePath);

        try (FileInputStream fis = new FileInputStream(filePath);
             XWPFDocument document = new XWPFDocument(fis)) {

            String docTitle = ""; // 新增：存储文档标题
            String currentLevel1 = "";
            String currentLevel2 = "";
            String currentLevel3 = "";
            String currentLevel4 = "";
            StringBuilder content = new StringBuilder();

            int paragraphCount = 0;
            int processedCount = 0;

            for (XWPFParagraph paragraph : document.getParagraphs()) {
                paragraphCount++;
                String text = paragraph.getText().trim();

                if (text.isEmpty()) {
                    System.out.println("[WordReader] 段落 " + paragraphCount + ": 空段落，跳过");
                    continue;
                }

                String styleId = paragraph.getStyleID();

                System.out.println("[WordReader] 段落 " + paragraphCount + ": 文本='" + text.substring(0, Math.min(50, text.length())) + "', styleId='" + styleId + "'");

                // ==============================================
                // 新增：优先特殊识别WPS/Word的「标题」样式（文档标题）
                // ==============================================
                if ("Title".equals(styleId) || "标题".equals(styleId)) {
                    // 兼容WPS和Word的不同命名方式
                    docTitle = text;
                    System.out.println("[WordReader] -> 检测到文档标题 (styleId=Title): " + text);
                    continue; // 不进入后续标题和内容处理逻辑
                }

                // 使用大纲级别判断标题层级（原有逻辑完全不变）
                int outlineLevel = getOutlineLevel(paragraph);

                if (outlineLevel == 0) {
                    // 大纲级别为0，作为正文内容处理
                    content.append(text).append("\n");
                    System.out.println("[WordReader] -> 作为内容处理 (outlineLevel=0)");
                    continue;
                }

                // 只处理 1-4 级标题
                if (outlineLevel > 4) {
                    content.append(text).append("\n");
                    System.out.println("[WordReader] -> 标题级别=" + outlineLevel + ">4，作为内容处理");
                    continue;
                }

                System.out.println("[WordReader] -> 检测到标题，大纲级别: " + outlineLevel);

                switch (outlineLevel) {
                    case 1:
                        if (!currentLevel1.isEmpty()) {
                            WordStruct struct = buildWordStruct(docTitle, currentLevel1, currentLevel2, currentLevel3, currentLevel4, content.toString());
                            structList.add(struct);
                            processedCount++;
                        }
                        currentLevel1 = text;
                        currentLevel2 = "";
                        currentLevel3 = "";
                        currentLevel4 = "";
                        content.setLength(0);
                        break;

                    case 2:
                        if (!currentLevel2.isEmpty() && !currentLevel1.isEmpty()) {
                            WordStruct struct = buildWordStruct(docTitle, currentLevel1, currentLevel2, currentLevel3, currentLevel4, content.toString());
                            structList.add(struct);
                            processedCount++;
                        } else if (currentLevel1.isEmpty()) {
                            // 如果没有 1 级标题，将当前内容作为 1 级标题
                            currentLevel1 = text;
                            currentLevel2 = "";
                            currentLevel3 = "";
                            currentLevel4 = "";
                            content.setLength(0);
                            break;
                        }
                        currentLevel2 = text;
                        currentLevel3 = "";
                        currentLevel4 = "";
                        content.setLength(0);
                        break;

                    case 3:
                        if (!currentLevel3.isEmpty() && !currentLevel1.isEmpty() && !currentLevel2.isEmpty()) {
                            WordStruct struct = buildWordStruct(docTitle, currentLevel1, currentLevel2, currentLevel3, currentLevel4, content.toString());
                            structList.add(struct);
                            processedCount++;
                        } else if (currentLevel2.isEmpty() && !currentLevel1.isEmpty()) {
                            // 如果没有 2 级标题，将当前内容作为 2 级标题
                            currentLevel2 = text;
                            currentLevel3 = "";
                            currentLevel4 = "";
                            content.setLength(0);
                            break;
                        } else if (currentLevel1.isEmpty()) {
                            // 如果没有 1 级标题，将当前内容作为 1 级标题
                            currentLevel1 = text;
                            currentLevel2 = "";
                            currentLevel3 = "";
                            currentLevel4 = "";
                            content.setLength(0);
                            break;
                        }
                        currentLevel3 = text;
                        currentLevel4 = "";
                        content.setLength(0);
                        break;

                    case 4:
                        if (!currentLevel4.isEmpty() && !currentLevel1.isEmpty() && !currentLevel2.isEmpty() && !currentLevel3.isEmpty()) {
                            WordStruct struct = buildWordStruct(docTitle, currentLevel1, currentLevel2, currentLevel3, currentLevel4, content.toString());
                            structList.add(struct);
                            processedCount++;
                        } else if (currentLevel3.isEmpty() && !currentLevel2.isEmpty() && !currentLevel1.isEmpty()) {
                            // 如果没有 3 级标题，将当前内容作为 3 级标题
                            currentLevel3 = text;
                            currentLevel4 = "";
                            content.setLength(0);
                            break;
                        } else if (currentLevel2.isEmpty() && !currentLevel1.isEmpty()) {
                            // 如果没有 2 级标题，将当前内容作为 2 级标题
                            currentLevel2 = text;
                            currentLevel3 = "";
                            currentLevel4 = "";
                            content.setLength(0);
                            break;
                        } else if (currentLevel1.isEmpty()) {
                            // 如果没有 1 级标题，将当前内容作为 1 级标题
                            currentLevel1 = text;
                            currentLevel2 = "";
                            currentLevel3 = "";
                            currentLevel4 = "";
                            content.setLength(0);
                            break;
                        }
                        currentLevel4 = text;
                        content.setLength(0);
                        break;

                    default:
                        content.append(text).append("\n");
                        break;
                }
            }

            // 处理最后一个结构
            if (!currentLevel1.isEmpty()) {
                WordStruct struct = buildWordStruct(docTitle, currentLevel1, currentLevel2, currentLevel3, currentLevel4, content.toString());
                structList.add(struct);
                processedCount++;
            }

            System.out.println("[WordReader] 解析完成: 总段落=" + paragraphCount + ", 处理的结构=" + processedCount + ", 结果数量=" + structList.size());
            if (!docTitle.isEmpty()) {
                System.out.println("[WordReader] 识别到文档标题: " + docTitle);
            }

            return structList;
        }
    }

    /**
     * 获取段落的大纲级别（最可靠的标题判断方式）
     * @param paragraph Word 段落
     * @return 大纲级别（1-9 为标题，0 为正文）
     */
    private static int getOutlineLevel(XWPFParagraph paragraph) {
        CTPPr pPr = paragraph.getCTP().getPPr();
        if (pPr == null) {
            return 0;
        }

        // 优先直接读取段落上设置的大纲级别
        if (pPr.isSetOutlineLvl()) {
            int level = pPr.getOutlineLvl().getVal().intValue() + 1;
            System.out.println("[WordReader] 段落直接设置大纲级别: " + level);
            return level;
        }

        // 如果段落没有直接设置，读取其样式的大纲级别
        if (pPr.isSetPStyle()) {
            String styleId = pPr.getPStyle().getVal();
            CTStyle style = paragraph.getDocument().getStyles().getStyle(styleId).getCTStyle();
            if (style != null && style.getPPr() != null && style.getPPr().isSetOutlineLvl()) {
                int level = style.getPPr().getOutlineLvl().getVal().intValue() + 1;
                System.out.println("[WordReader] 通过样式读取大纲级别: " + level);
                return level;
            }
        }

        return 0; // 正文
    }

    // 原有未使用的方法保持不变，方便你后续扩展
    private static final Pattern HEADING_NUMBER_PATTERN = Pattern.compile("^(\\d+(?:[\\.、\\)）]\\d*)*)(?:[\\.、\\)）]?\\s+).*$");

    private static boolean isHeadingStyle(String styleId, String text) {
        if (styleId != null) {
            String lowerStyleId = styleId.toLowerCase();
            if (lowerStyleId.contains("heading") || lowerStyleId.contains("标题") || styleId.matches("\\d+(?:[\\.、]\\d+)*")) {
                return true;
            }
        }

        if (text != null) {
            Matcher matcher = HEADING_NUMBER_PATTERN.matcher(text);
            return matcher.find();
        }
        return false;
    }

    private static int getHeadingLevel(String styleId, String text, int headingOrder) {
        // 优先通过文本编号判断层级（更可靠）
        if (text != null) {
            Matcher matcher = HEADING_NUMBER_PATTERN.matcher(text);
            if (matcher.find()) {
                String numbering = matcher.group(1);
                if (numbering != null) {
                    String normalized = numbering.replaceAll("[\\uFF0E\\u3002\\u3001\\)\\）]", ".");
                    String[] parts = normalized.split("\\.");
                    int level = Math.min(parts.length, 4);
                    System.out.println("[WordReader] 通过文本编号判断层级: text='" + text + "', numbering='" + numbering + "', level=" + level);
                    return level;
                }
            }
        }

        // 其次通过 styleId 判断
        if (styleId != null) {
            String lowerStyleId = styleId.toLowerCase();

            if (lowerStyleId.contains("heading1") || lowerStyleId.contains("标题1")) {
                return 1;
            }
            if (lowerStyleId.contains("heading2") || lowerStyleId.contains("标题2")) {
                return 2;
            }
            if (lowerStyleId.contains("heading3") || lowerStyleId.contains("标题3")) {
                return 3;
            }
            if (lowerStyleId.contains("heading4") || lowerStyleId.contains("标题4")) {
                return 4;
            }

            // styleId 是编号格式（如 "1.1.1"）
            if (styleId.matches("\\d+(?:[\\.、]\\d+)*")) {
                String normalized = styleId.replaceAll("[\\uFF0E\\u3002\\u3001]", ".");
                String[] parts = normalized.split("\\.");
                return Math.min(parts.length, 4);
            }
        }

        // 默认返回 0（作为内容处理）
        return 0;
    }

    /**
     * 构建WordStruct对象（新增docTitle参数）
     */
    private static WordStruct buildWordStruct(String docTitle, String level1, String level2, String level3, String level4, String content) {
        WordStruct struct = new WordStruct();
        struct.setDocTitle(docTitle); // 设置文档标题
        struct.setLevel1Title(level1);
        struct.setLevel2Title(level2);
        struct.setLevel3Title(level3);
        struct.setLevel4Title(level4);
        struct.setContent(content.trim());
        return struct;
    }
}