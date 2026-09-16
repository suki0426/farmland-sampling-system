package com.jeeplus.teaching.dteachingdocument.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jeeplus.teaching.dfiletemplate.service.DFileTemplateService;
import com.jeeplus.teaching.dfiletemplate.service.dto.DFileTemplateDTO;
import com.jeeplus.teaching.dteachingdocument.domain.DTeachingDocument;
import com.jeeplus.teaching.dteachingdocument.mapper.DTeachingDocumentMapper;
import com.jeeplus.teaching.dteachingdocument.service.dto.DTeachingDocumentDTO;
import com.jeeplus.teaching.dteachingdocument.service.mapstruct.DTeachingDocumentWrapper;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
public class DTeachingDocumentService extends ServiceImpl<DTeachingDocumentMapper, DTeachingDocument> {

    @Autowired
    private DFileTemplateService dFileTemplateService;

    private static final ObjectMapper JSON_MAPPER = new ObjectMapper();

    public DTeachingDocumentDTO findById(String id) {
        DTeachingDocumentDTO dto = baseMapper.findById(id);
        return hydrateDetail(dto);
    }

    public DTeachingDocumentDTO detail(String id) {
        return findById(id);
    }

    public IPage<DTeachingDocumentDTO> findPage(Page<DTeachingDocumentDTO> page, QueryWrapper queryWrapper) {
        queryWrapper.eq("a.del_flag", 0);
        return baseMapper.findList(page, queryWrapper);
    }

    public DTeachingDocumentDTO saveDocument(DTeachingDocumentDTO dto) {
        DTeachingDocument entity = DTeachingDocumentWrapper.INSTANCE.toEntity(dto);
        if (StringUtils.isBlank(entity.getId())) {
            entity.setId(generateId());
        }
        if (dto.getTemplate() != null && StringUtils.isNotBlank(dto.getTemplate().getId())) {
            entity.setTemplateId(dto.getTemplate().getId());
        }
        if (StringUtils.isBlank(entity.getTemplateId())) {
            entity.setTemplateId(dto.getTemplateId());
        }
        entity.setContentJson(com.jeeplus.common.utils.JsonUtils.encode(dto.getContent()));
        super.saveOrUpdate(entity);
        return findById(entity.getId());
    }

    public DTeachingDocumentDTO copyDocument(String id) {
        DTeachingDocument source = super.getById(id);
        if (source == null) {
            return null;
        }
        DTeachingDocument copy = new DTeachingDocument();
        copy.setId(generateId());
        copy.setTitle(StringUtils.defaultIfBlank(source.getTitle(), "教学文档") + "-副本");
        copy.setDocType(source.getDocType());
        copy.setCourseName(source.getCourseName());
        copy.setCourseCode(source.getCourseCode());
        copy.setAcademicterm(source.getAcademicterm());
        copy.setTeacherName(source.getTeacherName());
        copy.setInputMethod(source.getInputMethod());
        copy.setStatus(source.getStatus());
        copy.setTemplateId(source.getTemplateId());
        copy.setSourceFileName(source.getSourceFileName());
        copy.setContentJson(source.getContentJson());
        copy.setKeywordsJson(source.getKeywordsJson());
        copy.setFlowChartText(source.getFlowChartText());
        super.save(copy);
        return findById(copy.getId());
    }

    private DTeachingDocumentDTO hydrateDetail(DTeachingDocumentDTO dto) {
        if (dto == null) {
            return null;
        }
        if (StringUtils.isNotBlank(dto.getContentJson())) {
            try {
                System.out.println("[DTeachingDocument] ========== hydrateDetail 开始 ==========");
                System.out.println("[DTeachingDocument] contentJson 长度: " + dto.getContentJson().length());
                System.out.println("[DTeachingDocument] contentJson 前200字符: " + dto.getContentJson().substring(0, Math.min(200, dto.getContentJson().length())));

                List<Map<String, Object>> content = JSON_MAPPER.readValue(
                    dto.getContentJson(),
                    new TypeReference<List<Map<String, Object>>>() {}
                );
                dto.setContent(content != null ? content : new ArrayList<>());
                System.out.println("[DTeachingDocument] content 反序列化成功, size=" + dto.getContent().size());

                if (!dto.getContent().isEmpty()) {
                    Map<String, Object> first = dto.getContent().get(0);
                    System.out.println("[DTeachingDocument] 第一个 section 的键: " + first.keySet());
                    System.out.println("[DTeachingDocument] 第一个 section title: " + first.get("sectionTitle"));
                    System.out.println("[DTeachingDocument] 第一个 section level: " + first.get("sectionLevel"));
                    Object children = first.get("children");
                    System.out.println("[DTeachingDocument] 第一个 section children 类型: " + (children != null ? children.getClass().getName() : "null"));
                    if (children instanceof List) {
                        System.out.println("[DTeachingDocument] 第一个 section children size: " + ((List<?>) children).size());
                    }
                }
                System.out.println("[DTeachingDocument] ========== hydrateDetail 结束 ==========");
            } catch (Exception e) {
                System.err.println("[DTeachingDocument] contentJson 反序列化失败: " + e.getMessage());
                e.printStackTrace();
                dto.setContent(new ArrayList<>());
            }
        } else {
            System.out.println("[DTeachingDocument] contentJson 为空");
            dto.setContent(new ArrayList<>());
        }
        if (StringUtils.isNotBlank(dto.getTemplateId())) {
            DFileTemplateDTO template = dFileTemplateService.findById(dto.getTemplateId());
            dto.setTemplate(template);
            if (template != null) {
                dto.setTemplateName(template.getTemplateName());
                dto.setTemplateVersion(template.getVersionNo());
            }
        }
        return dto;
    }

    private String generateId() {
        return UUID.randomUUID().toString().replace("-", "");
    }
}
