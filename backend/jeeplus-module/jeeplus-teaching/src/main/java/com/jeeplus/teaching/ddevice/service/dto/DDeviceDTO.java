/**
 * Copyright © 2021-2025 <a href="http://www.jeeplus.org/">JeePlus</a> All rights reserved.
 */
package com.jeeplus.teaching.ddevice.service.dto;

import com.jeeplus.core.query.Query;
import com.jeeplus.core.query.QueryType;
import com.alibaba.excel.annotation.ExcelProperty;
import com.jeeplus.core.excel.converter.ExcelDictDTOConverter;
import com.jeeplus.core.excel.annotation.ExcelDictProperty;
import com.jeeplus.core.service.dto.BaseDTO;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

/**
 * 设备管理DTO
 * @author GeniusGjq
 * @version 2026-04-25
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class DDeviceDTO extends BaseDTO {

	private static final long serialVersionUID = 1L;

	        
	/**
     * 设备编码
     */
    @Query(type = QueryType.EQ)
	@ExcelProperty("设备编码") 
	private String deviceCode;
	        
	/**
     * 设备名称
     */
    @Query(type = QueryType.EQ)
	@ExcelProperty("设备名称") 
	private String deviceName;
	        
	/**
     * 设备分类
     */
    @Query(type = QueryType.EQ)
	@ExcelProperty(value = "设备分类", converter = ExcelDictDTOConverter.class)
	@ExcelDictProperty("")
	private String category;
	        
	/**
     * 设备型号
     */
    @Query(type = QueryType.EQ)
	@ExcelProperty("设备型号") 
	private String model;
	        
	/**
     * 厂商名称
     */
    @Query(type = QueryType.EQ)
	@ExcelProperty("厂商名称") 
	private String manufacturer;
	        
	/**
     * 设备价格
     */
    @Query(type = QueryType.EQ)
	@ExcelProperty("设备价格") 
	private BigDecimal price;
	        
	/**
     * 适用场景集合
     */
	@ExcelProperty("适用场景集合") 
	private String scenariosJson;
	        
	/**
     * 扩展属性
     */
	@ExcelProperty("扩展属性") 
	private String attrsJson;
	        
	/**
     * 设备综合评分
     */
    @Query(type = QueryType.EQ)
	@ExcelProperty("设备综合评分") 
	private String totalScore;
	        
	/**
     * 设备说明
     */
    @Query(type = QueryType.EQ)
	@ExcelProperty("设备说明") 
	private String descriptiontext;
	        
	/**
     * 状态
     */
    @Query(type = QueryType.EQ)
	@ExcelProperty(value = "状态", converter = ExcelDictDTOConverter.class)
	@ExcelDictProperty("")
	private String status;

}
