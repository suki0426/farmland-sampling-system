package com.jeeplus.sys.service.vo;

import com.alibaba.excel.annotation.ExcelProperty;
import com.alibaba.excel.annotation.write.style.ColumnWidth;
import com.jeeplus.core.service.dto.BaseDTO;
import com.jeeplus.core.service.dto.TreeDTO;
import com.jeeplus.sys.service.dto.OfficeDTO;
import lombok.Data;

@Data
public class OfficeExcelModel extends BaseDTO {

    @ColumnWidth(50)
    @ExcelProperty("部门名称")
    private String name;


    @ColumnWidth(50)
    @ExcelProperty("部门管理员工号")
    private String masterId;

    @ColumnWidth(50)
    @ExcelProperty("部门管理员姓名")
    private String master;
}
