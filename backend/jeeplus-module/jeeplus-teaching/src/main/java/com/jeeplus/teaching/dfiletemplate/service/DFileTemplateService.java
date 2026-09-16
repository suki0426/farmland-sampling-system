package com.jeeplus.teaching.dfiletemplate.service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.google.common.collect.Lists;
import com.jeeplus.teaching.dfiletemplate.domain.DFileTemplate;
import com.jeeplus.teaching.dfiletemplate.domain.DFileTemplateSection;
import com.jeeplus.teaching.dfiletemplate.mapper.DFileTemplateMapper;
import com.jeeplus.teaching.dfiletemplate.service.dto.DFileTemplateDTO;
import com.jeeplus.teaching.dfiletemplate.service.dto.DFileTemplateSectionDTO;
import com.jeeplus.teaching.dfiletemplate.service.mapstruct.DFileTemplateSectionWrapper;
import com.jeeplus.teaching.dfiletemplate.service.mapstruct.DFileTemplateWrapper;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class DFileTemplateService extends ServiceImpl<DFileTemplateMapper, DFileTemplate> {

    private static final String STATUS_DRAFT = "draft";
    private static final String STATUS_PUBLISHED = "published";
    private static final String STATUS_ARCHIVED = "archived";

    @Autowired
    private DFileTemplateSectionService dFileTemplateSectionService;

    public DFileTemplateDTO findById(String id) {
        DFileTemplate entity = super.getById(id);
        if (entity == null) {
            return null;
        }
        DFileTemplateDTO dto = DFileTemplateWrapper.INSTANCE.toDTO(entity);
        dto.setDFileTemplateSectionDTOList(dFileTemplateSectionService.findList(id));
        dto.setSections(buildSectionTree(dto.getDFileTemplateSectionDTOList()));
        return dto;
    }

    public List<DFileTemplateDTO> treeData() {
        return super.lambdaQuery()
                .orderByAsc(DFileTemplate::getDocType)
                .orderByDesc(DFileTemplate::getUpdateDate)
                .list()
                .stream()
                .map(DFileTemplateWrapper.INSTANCE::toDTO)
                .collect(Collectors.toList());
    }

    public List<DFileTemplateDTO> usableTemplates(String docType, String status) {
        return super.lambdaQuery()
                .eq(StringUtils.isNotBlank(docType), DFileTemplate::getDocType, docType)
                .eq(StringUtils.isNotBlank(status), DFileTemplate::getStatus, status)
                .orderByDesc(DFileTemplate::getUpdateDate)
                .list()
                .stream()
                .map(DFileTemplateWrapper.INSTANCE::toDTO)
                .collect(Collectors.toList());
    }

    public DFileTemplateDTO saveDraft(DFileTemplateDTO dto) {
        applyTemplateDefaults(dto, STATUS_DRAFT);
        return saveTemplate(dto);
    }

    public DFileTemplateDTO createManualTemplate(DFileTemplateDTO dto) {
        applyTemplateDefaults(dto, STATUS_DRAFT);
        return saveTemplate(dto);
    }

    public DFileTemplateDTO publish(DFileTemplateDTO dto) {
        applyTemplateDefaults(dto, STATUS_PUBLISHED);
        archivePublishedTemplates(dto);
        return saveTemplate(dto);
    }

    public Map<String, Object> validateTemplate(DFileTemplateDTO dto) {
        normalizeSectionPayload(dto);
        List<Map<String, String>> errors = new ArrayList<>();
        if (StringUtils.isBlank(dto.getDocType())) {
            errors.add(buildError("docType", "请选择文档分类"));
        }
        if (StringUtils.isBlank(dto.getTemplateName())) {
            errors.add(buildError("templateName", "请填写模板名称"));
        }
        List<DFileTemplateSectionDTO> sections = dto.getDFileTemplateSectionDTOList();
        if (sections == null || sections.isEmpty()) {
            errors.add(buildError("sections", "至少需要一个一级标题"));
        } else {
            List<DFileTemplateSectionDTO> levelOne = sections.stream()
                    .filter(item -> "1".equals(item.getSectionLevel()))
                    .sorted((a, b) -> Integer.compare(nullSafeInt(a.getSortNo()), nullSafeInt(b.getSortNo())))
                    .collect(Collectors.toList());
            Set<String> codes = new HashSet<>();
            for (int i = 0; i < levelOne.size(); i++) {
                DFileTemplateSectionDTO section = levelOne.get(i);
                if (StringUtils.isBlank(section.getSectionTitle())) {
                    errors.add(buildError("sections." + i + ".sectionTitle", "一级标题不能为空"));
                }
                List<DFileTemplateSectionDTO> children = sections.stream()
                        .filter(item -> "2".equals(item.getSectionLevel()) && isChildOf(item, section))
                        .sorted((a, b) -> Integer.compare(nullSafeInt(a.getSortNo()), nullSafeInt(b.getSortNo())))
                        .collect(Collectors.toList());
                if (children.isEmpty()) {
                    errors.add(buildError("sections." + i + ".children", StringUtils.defaultIfBlank(section.getSectionTitle(), "当前一级标题") + " 至少需要一个二级标题"));
                }
                for (int j = 0; j < children.size(); j++) {
                    DFileTemplateSectionDTO child = children.get(j);
                    if (StringUtils.isBlank(child.getSectionTitle())) {
                        errors.add(buildError("sections." + i + ".children." + j + ".sectionTitle", "二级标题不能为空"));
                    }
                    if (StringUtils.isBlank(child.getSectionCode())) {
                        errors.add(buildError("sections." + i + ".children." + j + ".sectionCode", "二级标题编码不能为空"));
                    } else if (!codes.add(child.getSectionCode())) {
                        errors.add(buildError("sections." + i + ".children." + j + ".sectionCode", "二级标题编码不能重复"));
                    }
                    if (StringUtils.isBlank(child.getComponentType())) {
                        errors.add(buildError("sections." + i + ".children." + j + ".componentType", "组件类型不能为空"));
                    }
                }
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("valid", errors.isEmpty());
        result.put("errors", errors);
        return result;
    }

    public DFileTemplateDTO saveTemplate(DFileTemplateDTO dto) {
        normalizeSectionPayload(dto);
        ensureTemplateIds(dto);
        DFileTemplate entity = DFileTemplateWrapper.INSTANCE.toEntity(dto);
        super.saveOrUpdate(entity);

        List<DFileTemplateSectionDTO> incoming = dto.getDFileTemplateSectionDTOList();
        List<DFileTemplateSectionDTO> existing = dFileTemplateSectionService.findList(entity.getId());
        Set<String> incomingIds = incoming.stream()
                .map(DFileTemplateSectionDTO::getId)
                .filter(StringUtils::isNotBlank)
                .collect(Collectors.toSet());

        List<String> needDeleteIds = existing.stream()
                .map(DFileTemplateSectionDTO::getId)
                .filter(StringUtils::isNotBlank)
                .filter(id -> !incomingIds.contains(id))
                .collect(Collectors.toList());
        if (!needDeleteIds.isEmpty()) {
            dFileTemplateSectionService.removeByIds(Lists.newArrayList(needDeleteIds));
        }

        for (DFileTemplateSectionDTO item : incoming) {
            if (item.getDelFlag() != null && item.getDelFlag() != 0) {
                if (StringUtils.isNotBlank(item.getId())) {
                    dFileTemplateSectionService.removeById(item.getId());
                }
                continue;
            }
            DFileTemplateSection sectionEntity = DFileTemplateSectionWrapper.INSTANCE.toEntity(item);
            sectionEntity.setTemplateId(entity.getId());
            dFileTemplateSectionService.saveOrUpdate(sectionEntity);
        }
        return findById(entity.getId());
    }

    public void saveOrUpdate(DFileTemplateDTO dto) {
        saveTemplate(dto);
    }

    public void removeById(String id) {
        super.removeById(id);
        dFileTemplateSectionService.lambdaUpdate().eq(DFileTemplateSection::getTemplateId, id).remove();
    }

    private void archivePublishedTemplates(DFileTemplateDTO dto) {
        if (StringUtils.isBlank(dto.getDocType())) {
            return;
        }
        List<DFileTemplate> publishedTemplates = super.lambdaQuery()
                .eq(DFileTemplate::getDocType, dto.getDocType())
                .eq(DFileTemplate::getStatus, STATUS_PUBLISHED)
                .list();
        for (DFileTemplate item : publishedTemplates) {
            if (StringUtils.isNotBlank(dto.getId()) && StringUtils.equals(item.getId(), dto.getId())) {
                continue;
            }
            item.setStatus(STATUS_ARCHIVED);
            super.updateById(item);
        }
    }

    private void normalizeSectionPayload(DFileTemplateDTO dto) {
        List<DFileTemplateSectionDTO> flatList = dto.getDFileTemplateSectionDTOList();
        if (flatList != null && !flatList.isEmpty()) {
            return;
        }
        List<DFileTemplateSectionDTO> sectionTree = dto.getSections();
        if (sectionTree == null || sectionTree.isEmpty()) {
            dto.setDFileTemplateSectionDTOList(new ArrayList<>());
            return;
        }
        List<DFileTemplateSectionDTO> rows = new ArrayList<>();
        for (int i = 0; i < sectionTree.size(); i++) {
            DFileTemplateSectionDTO section = sectionTree.get(i);
            DFileTemplateSectionDTO levelOne = copySection(section);
            levelOne.setSectionLevel("1");
            levelOne.setParentSectionId("");
            levelOne.setSortNo(i + 1);
            rows.add(levelOne);

            List<DFileTemplateSectionDTO> children = section.getSections();
            if (children == null) {
                children = new ArrayList<>();
            }
            for (int j = 0; j < children.size(); j++) {
                DFileTemplateSectionDTO child = copySection(children.get(j));
                child.setSectionLevel("2");
                child.setParentSectionId(StringUtils.defaultIfBlank(levelOne.getId(), StringUtils.defaultIfBlank(levelOne.getSectionCode(), levelOne.getSectionTitle())));
                child.setSortNo(j + 1);
                rows.add(child);
            }
        }
        dto.setDFileTemplateSectionDTOList(rows);
    }

    private List<DFileTemplateSectionDTO> buildSectionTree(List<DFileTemplateSectionDTO> rows) {
        List<DFileTemplateSectionDTO> tree = new ArrayList<>();
        if (rows == null || rows.isEmpty()) {
            return tree;
        }
        List<DFileTemplateSectionDTO> levelOne = rows.stream()
                .filter(item -> "1".equals(item.getSectionLevel()))
                .sorted((a, b) -> Integer.compare(nullSafeInt(a.getSortNo()), nullSafeInt(b.getSortNo())))
                .collect(Collectors.toList());
        for (DFileTemplateSectionDTO section : levelOne) {
            DFileTemplateSectionDTO node = copySection(section);
            node.setSections(rows.stream()
                    .filter(item -> "2".equals(item.getSectionLevel()) && isChildOf(item, section))
                    .sorted((a, b) -> Integer.compare(nullSafeInt(a.getSortNo()), nullSafeInt(b.getSortNo())))
                    .map(this::copySection)
                    .collect(Collectors.toList()));
            tree.add(node);
        }
        return tree;
    }

    private DFileTemplateSectionDTO copySection(DFileTemplateSectionDTO source) {
        DFileTemplateSectionDTO target = new DFileTemplateSectionDTO();
        target.setId(source.getId());
        target.setTemplate(source.getTemplate());
        target.setParentSectionId(source.getParentSectionId());
        target.setSectionLevel(source.getSectionLevel());
        target.setSectionTitle(source.getSectionTitle());
        target.setSectionCode(source.getSectionCode());
        target.setSortNo(source.getSortNo());
        target.setRequiredFlag(source.getRequiredFlag());
        target.setVisibleFlag(source.getVisibleFlag());
        target.setComponentType(source.getComponentType());
        target.setPlaceHolderText(source.getPlaceHolderText());
        target.setDefaultvalue(source.getDefaultvalue());
        target.setStatus(source.getStatus());
        target.setCreateBy(source.getCreateBy());
        target.setCreateDate(source.getCreateDate());
        target.setUpdateBy(source.getUpdateBy());
        target.setUpdateDate(source.getUpdateDate());
        target.setDelFlag(source.getDelFlag());
        target.setSections(source.getSections() == null ? new ArrayList<>() : source.getSections());
        return target;
    }

    private void applyTemplateDefaults(DFileTemplateDTO dto, String status) {
        if (StringUtils.isBlank(dto.getVersionNo())) {
            dto.setVersionNo("V1.0");
        }
        if (StringUtils.isBlank(dto.getStatus())) {
            dto.setStatus(status);
        } else if (StringUtils.equals(status, STATUS_PUBLISHED)) {
            dto.setStatus(STATUS_PUBLISHED);
        }
        if (StringUtils.isBlank(dto.getTemplateCode())) {
            dto.setTemplateCode("TPL_" + System.currentTimeMillis());
        }
    }

    private void ensureTemplateIds(DFileTemplateDTO dto) {
        if (StringUtils.isBlank(dto.getId())) {
            dto.setId(generateId());
        }
        List<DFileTemplateSectionDTO> sections = dto.getDFileTemplateSectionDTOList();
        if (sections == null) {
            dto.setDFileTemplateSectionDTOList(new ArrayList<>());
            return;
        }
        for (DFileTemplateSectionDTO section : sections) {
            if (StringUtils.isBlank(section.getId())) {
                section.setId(generateId());
            }
            if (section.getTemplate() == null) {
                section.setTemplate(new DFileTemplateDTO());
            }
            section.getTemplate().setId(dto.getId());
        }
    }

    private boolean isChildOf(DFileTemplateSectionDTO child, DFileTemplateSectionDTO parent) {
        if (StringUtils.isBlank(child.getParentSectionId())) {
            return false;
        }
        return StringUtils.equals(child.getParentSectionId(), parent.getId())
                || StringUtils.equals(child.getParentSectionId(), parent.getSectionCode())
                || StringUtils.equals(child.getParentSectionId(), parent.getSectionTitle());
    }

    private int nullSafeInt(Integer value) {
        return value == null ? 0 : value;
    }

    private Map<String, String> buildError(String field, String message) {
        Map<String, String> error = new HashMap<>();
        error.put("field", field);
        error.put("message", message);
        return error;
    }

    private String generateId() {
        return UUID.randomUUID().toString().replace("-", "");
    }
}
