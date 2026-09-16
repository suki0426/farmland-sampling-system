/**
 * Copyright © 2021-2025 <a href="http://www.jeeplus.org/">JeePlus</a> All rights reserved.
 */
package com.jeeplus.teaching.dfiletemplate.service.mapstruct;


import com.jeeplus.core.mapstruct.EntityWrapper;
import com.jeeplus.teaching.dfiletemplate.service.dto.DFileTemplateSectionDTO;
import com.jeeplus.teaching.dfiletemplate.domain.DFileTemplateSection;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.ReportingPolicy;
import org.mapstruct.factory.Mappers;

/**
 *  DFileTemplateSectionWrapper
 * @author GeniusGjq
 * @version 2026-04-27
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, uses = {} )
public interface DFileTemplateSectionWrapper extends EntityWrapper<DFileTemplateSectionDTO, DFileTemplateSection> {

    DFileTemplateSectionWrapper INSTANCE = Mappers.getMapper(DFileTemplateSectionWrapper.class);
     @Mappings({
            @Mapping(source = "template.id", target = "templateId"),
            @Mapping(source = "createBy.id", target = "createBy"),
            @Mapping (source = "updateBy.id", target = "updateBy")})
    DFileTemplateSection toEntity(DFileTemplateSectionDTO dto);


    @Mappings({
            @Mapping(source = "templateId", target = "template.id"),
            @Mapping (source = "createBy", target = "createBy.id"),
            @Mapping (source = "updateBy", target = "updateBy.id")})
    DFileTemplateSectionDTO toDTO(DFileTemplateSection entity);
}

