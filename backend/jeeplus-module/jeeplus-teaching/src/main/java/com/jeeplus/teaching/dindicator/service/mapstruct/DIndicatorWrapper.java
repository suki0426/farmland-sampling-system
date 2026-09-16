/**
 * Copyright © 2021-2025 <a href="http://www.jeeplus.org/">JeePlus</a> All rights reserved.
 */
package com.jeeplus.teaching.dindicator.service.mapstruct;


import com.jeeplus.core.mapstruct.TreeWrapper;
import com.jeeplus.teaching.dindicator.service.dto.DIndicatorDTO;
import com.jeeplus.teaching.dindicator.domain.DIndicator;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;
import org.mapstruct.factory.Mappers;

/**
 *  DIndicatorWrapper
 * @author GeniusGjq
 * @version 2026-04-25
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, uses = {} )
public interface DIndicatorWrapper extends TreeWrapper<DIndicatorDTO, DIndicator> {

    DIndicatorWrapper INSTANCE = Mappers.getMapper(DIndicatorWrapper.class);
}

