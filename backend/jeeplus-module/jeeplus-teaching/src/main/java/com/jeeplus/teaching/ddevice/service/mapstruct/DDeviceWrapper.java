/**
 * Copyright © 2021-2025 <a href="http://www.jeeplus.org/">JeePlus</a> All rights reserved.
 */
package com.jeeplus.teaching.ddevice.service.mapstruct;


import com.jeeplus.core.mapstruct.EntityWrapper;
import com.jeeplus.teaching.ddevice.service.dto.DDeviceDTO;
import com.jeeplus.teaching.ddevice.domain.DDevice;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;
import org.mapstruct.factory.Mappers;

/**
 *  DDeviceWrapper
 * @author GeniusGjq
 * @version 2026-04-25
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, uses = {} )
public interface DDeviceWrapper extends EntityWrapper<DDeviceDTO, DDevice> {

    DDeviceWrapper INSTANCE = Mappers.getMapper(DDeviceWrapper.class);
}

