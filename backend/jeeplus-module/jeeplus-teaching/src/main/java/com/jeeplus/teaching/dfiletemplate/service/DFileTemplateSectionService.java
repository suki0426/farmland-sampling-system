package com.jeeplus.teaching.dfiletemplate.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.jeeplus.teaching.dfiletemplate.domain.DFileTemplateSection;
import com.jeeplus.teaching.dfiletemplate.mapper.DFileTemplateSectionMapper;
import com.jeeplus.teaching.dfiletemplate.service.dto.DFileTemplateDTO;
import com.jeeplus.teaching.dfiletemplate.service.dto.DFileTemplateSectionDTO;
import com.jeeplus.teaching.dfiletemplate.service.mapstruct.DFileTemplateSectionWrapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 文件模板章节表Service
 * @author GeniusGjq
 * @version 2026-04-27
 */
@Service
@Transactional
public class DFileTemplateSectionService extends ServiceImpl<DFileTemplateSectionMapper, DFileTemplateSection> {

    public DFileTemplateSectionDTO findById(String id) {
        return baseMapper.findById(id);
    }

    public IPage<DFileTemplateSectionDTO> findPage(Page<DFileTemplateSectionDTO> page, QueryWrapper queryWrapper) {
        queryWrapper.eq("a.del_flag", 0);
        return baseMapper.findList(page, queryWrapper);
    }

    public List<DFileTemplateSectionDTO> findList(String templateId) {
        return super.lambdaQuery()
                .eq(DFileTemplateSection::getTemplateId, templateId)
                .orderByAsc(DFileTemplateSection::getSectionLevel)
                .orderByAsc(DFileTemplateSection::getSortNo)
                .list()
                .stream()
                .map(DFileTemplateSectionWrapper.INSTANCE::toDTO)
                .collect(Collectors.toList());
    }

    public List<DFileTemplateSectionDTO> listByTemplate(String templateId) {
        return findList(templateId).stream().peek(item -> {
            if (item.getTemplate() == null) {
                item.setTemplate(new DFileTemplateDTO());
            }
            item.getTemplate().setId(templateId);
        }).collect(Collectors.toList());
    }

    public void batchSave(List<DFileTemplateSectionDTO> sectionDTOList) {
        if (sectionDTOList == null || sectionDTOList.isEmpty()) {
            return;
        }
        String templateId = sectionDTOList.get(0).getTemplate() == null ? null : sectionDTOList.get(0).getTemplate().getId();
        if (templateId != null) {
            this.lambdaUpdate().eq(DFileTemplateSection::getTemplateId, templateId).remove();
        }
        List<DFileTemplateSection> entities = sectionDTOList.stream()
                .map(DFileTemplateSectionWrapper.INSTANCE::toEntity)
                .collect(Collectors.toList());
        if (!entities.isEmpty()) {
            this.saveBatch(entities);
        }
    }
}
