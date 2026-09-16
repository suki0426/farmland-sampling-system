/**
 * Copyright &copy; 2015-2020 <a href="http://www.jeeplus.org/">JeePlus</a> All rights reserved.
 */
package com.jeeplus.core.excel.converter;

import cn.hutool.extra.spring.SpringUtil;
import com.alibaba.excel.converters.Converter;
import com.alibaba.excel.enums.CellDataTypeEnum;
import com.alibaba.excel.metadata.GlobalConfiguration;
import com.alibaba.excel.metadata.data.ReadCellData;
import com.alibaba.excel.metadata.data.WriteCellData;
import com.alibaba.excel.metadata.property.ExcelContentProperty;
import com.jeeplus.sys.domain.Office;
import com.jeeplus.sys.service.OfficeService;
import com.jeeplus.sys.service.dto.OfficeDTO;
import com.jeeplus.sys.service.mapstruct.OfficeWrapper;

/**
 * 字段类型转换
 *
 * @author jeeplus
 * @version 2022-03-10
 */

public class ExcelOfficeDTOConverter implements Converter <OfficeDTO> {

    @Override
    public Class <?> supportJavaTypeKey() {
        return OfficeDTO.class;
    }

    @Override
    public CellDataTypeEnum supportExcelTypeKey() {
        return CellDataTypeEnum.STRING;
    }

    @Override
    public OfficeDTO convertToJavaData(ReadCellData <?> cellData, ExcelContentProperty contentProperty, GlobalConfiguration globalConfiguration) {
        String val = cellData.getStringValue ( );
        OfficeDTO officeDTO = OfficeWrapper.INSTANCE.toDTO ( SpringUtil.getBean ( OfficeService.class ).lambdaQuery ( ).eq ( Office::getName, val ).one ( ) );
        return officeDTO;
    }

    @Override
    public WriteCellData <?> convertToExcelData(OfficeDTO value, ExcelContentProperty contentProperty,
                                                GlobalConfiguration globalConfiguration) {

        if ( value != null && value.getName ( ) != null ) {
            return new WriteCellData <> ( value.getName ( ) );
        }
        return new WriteCellData <> ( "" );
    }


}

