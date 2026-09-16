/**
 * Copyright © 2021-2025 <a href="http://www.jeeplus.org/">JeePlus</a> All rights reserved.
 */
package com.jeeplus.teaching.dfiletemplate.service.mapstruct;


import com.jeeplus.core.mapstruct.EntityWrapper;
import com.jeeplus.teaching.dfiletemplate.service.dto.DFileTemplateDTO;
import com.jeeplus.teaching.dfiletemplate.domain.DFileTemplate;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;
import org.mapstruct.factory.Mappers;

/**
 *  DFileTemplateWrapper
 * @author GeniusGjq
 * @version 2026-04-27
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, uses = {} )
public interface DFileTemplateWrapper extends EntityWrapper<DFileTemplateDTO, DFileTemplate> {

    DFileTemplateWrapper INSTANCE = Mappers.getMapper(DFileTemplateWrapper.class);
}

