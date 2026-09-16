/**
 * Copyright © 2021-2025 <a href="http://www.jeeplus.org/">JeePlus</a> All rights reserved.
 */
package com.jeeplus.teaching.dexperimentdesign.service.mapstruct;


import com.jeeplus.core.mapstruct.EntityWrapper;
import com.jeeplus.teaching.dexperimentdesign.service.dto.DExperimentDesignDTO;
import com.jeeplus.teaching.dexperimentdesign.domain.DExperimentDesign;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;
import org.mapstruct.factory.Mappers;

/**
 *  DExperimentDesignWrapper
 * @author GeniusGjq
 * @version 2026-04-25
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, uses = {} )
public interface DExperimentDesignWrapper extends EntityWrapper<DExperimentDesignDTO, DExperimentDesign> {

    DExperimentDesignWrapper INSTANCE = Mappers.getMapper(DExperimentDesignWrapper.class);
}

