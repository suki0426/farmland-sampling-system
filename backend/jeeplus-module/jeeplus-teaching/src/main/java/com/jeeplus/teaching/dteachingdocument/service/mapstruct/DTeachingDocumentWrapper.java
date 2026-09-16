/**
 * Copyright © 2021-2025 <a href="http://www.jeeplus.org/">JeePlus</a> All rights reserved.
 */
package com.jeeplus.teaching.dteachingdocument.service.mapstruct;


import com.jeeplus.core.mapstruct.EntityWrapper;
import com.jeeplus.teaching.dteachingdocument.service.dto.DTeachingDocumentDTO;
import com.jeeplus.teaching.dteachingdocument.domain.DTeachingDocument;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;
import org.mapstruct.factory.Mappers;

/**
 *  DTeachingDocumentWrapper
 * @author GeniusGjq
 * @version 2026-04-25
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, uses = {} )
public interface DTeachingDocumentWrapper extends EntityWrapper<DTeachingDocumentDTO, DTeachingDocument> {

    DTeachingDocumentWrapper INSTANCE = Mappers.getMapper(DTeachingDocumentWrapper.class);
}

