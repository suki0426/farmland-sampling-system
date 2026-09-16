package com.jeeplus.teaching.wordimport.entity;

/**
 * Word文档结构实体类
 * 用于存储解析后的文档标题层级和内容
 */
public class WordStruct {
    // 文档标题（对应WPS/Word的「标题」样式）
    private String docTitle;

    // 一级标题（对应WPS/Word的「标题1」样式）
    private String level1Title;

    // 二级标题（对应WPS/Word的「标题2」样式）
    private String level2Title;

    // 三级标题（对应WPS/Word的「标题3」样式）
    private String level3Title;

    // 四级标题（对应WPS/Word的「标题4」样式）
    private String level4Title;

    // 标题下的正文内容
    private String content;

    // 无参构造函数
    public WordStruct() {
    }

    // 全参构造函数
    public WordStruct(String docTitle, String level1Title, String level2Title, String level3Title, String level4Title, String content) {
        this.docTitle = docTitle;
        this.level1Title = level1Title;
        this.level2Title = level2Title;
        this.level3Title = level3Title;
        this.level4Title = level4Title;
        this.content = content;
    }

    // Getter 和 Setter 方法
    public String getDocTitle() {
        return docTitle;
    }

    public void setDocTitle(String docTitle) {
        this.docTitle = docTitle;
    }

    public String getLevel1Title() {
        return level1Title;
    }

    public void setLevel1Title(String level1Title) {
        this.level1Title = level1Title;
    }

    public String getLevel2Title() {
        return level2Title;
    }

    public void setLevel2Title(String level2Title) {
        this.level2Title = level2Title;
    }

    public String getLevel3Title() {
        return level3Title;
    }

    public void setLevel3Title(String level3Title) {
        this.level3Title = level3Title;
    }

    public String getLevel4Title() {
        return level4Title;
    }

    public void setLevel4Title(String level4Title) {
        this.level4Title = level4Title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    // 重写toString方法，方便调试和打印
    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("WordStruct{");

        if (docTitle != null && !docTitle.isEmpty()) {
            sb.append("docTitle='").append(docTitle).append("', ");
        }

        if (level1Title != null && !level1Title.isEmpty()) {
            sb.append("level1Title='").append(level1Title).append("', ");
        }

        if (level2Title != null && !level2Title.isEmpty()) {
            sb.append("level2Title='").append(level2Title).append("', ");
        }

        if (level3Title != null && !level3Title.isEmpty()) {
            sb.append("level3Title='").append(level3Title).append("', ");
        }

        if (level4Title != null && !level4Title.isEmpty()) {
            sb.append("level4Title='").append(level4Title).append("', ");
        }

        if (content != null && !content.isEmpty()) {
            sb.append("content='").append(content.substring(0, Math.min(50, content.length()))).append("...'");
        }

        sb.append("}");
        return sb.toString();
    }
}