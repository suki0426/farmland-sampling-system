/**
 * Copyright &copy; 2015-2020 <a href="http://www.jeeplus.org/">JeePlus</a> All rights reserved.
 */
package com.jeeplus.core.excel.converter;

import cn.hutool.core.util.StrUtil;
import cn.hutool.extra.spring.SpringUtil;
import com.alibaba.excel.converters.Converter;
import com.alibaba.excel.enums.CellDataTypeEnum;
import com.alibaba.excel.metadata.GlobalConfiguration;
import com.alibaba.excel.metadata.data.ReadCellData;
import com.alibaba.excel.metadata.data.WriteCellData;
import com.alibaba.excel.metadata.property.ExcelContentProperty;
import com.google.common.collect.Lists;
import com.jeeplus.sys.domain.Post;
import com.jeeplus.sys.service.PostService;
import com.jeeplus.sys.service.dto.PostDTO;
import com.jeeplus.sys.service.mapstruct.PostWrapper;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 岗位类型转换
 *
 * @author jeeplus
 * @version 2016-03-10
 */

public class ExcelPostListDTOConverter implements Converter <List <PostDTO>> {

    @Override
    public Class <?> supportJavaTypeKey() {
        return List.class;
    }

    @Override
    public CellDataTypeEnum supportExcelTypeKey() {
        return CellDataTypeEnum.STRING;
    }

    @Override
    public List <PostDTO> convertToJavaData(ReadCellData <?> cellData, ExcelContentProperty contentProperty, GlobalConfiguration globalConfiguration) {

        List <PostDTO> postList = Lists.newArrayList ( );
        String val = cellData.getStringValue ( );
        for (String postName : StrUtil.split ( val, "," )) {
            PostDTO postDTO = PostWrapper.INSTANCE.toDTO ( SpringUtil.getBean ( PostService.class ).lambdaQuery ( ).eq ( Post::getName, postName ).one ( ) );
            postList.add ( postDTO );
        }
        return postList.size ( ) > 0 ? postList : null;
    }

    @Override
    public WriteCellData <?> convertToExcelData(List <PostDTO> postDTOList, ExcelContentProperty contentProperty, GlobalConfiguration globalConfiguration) {
        List <String> postNames = postDTOList.stream ( ).map ( postDTO -> postDTO.getName ( ) ).collect ( Collectors.toList ( ) );
        return new WriteCellData <> ( StrUtil.join ( ",", postNames ) );
    }


}

