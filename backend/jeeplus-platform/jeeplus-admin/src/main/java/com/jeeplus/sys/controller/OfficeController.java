/**
 * Copyright &copy; 2021-2026 <a href="http://www.jeeplus.org/">JeePlus</a> All rights reserved.
 */
package com.jeeplus.sys.controller;

import com.alibaba.excel.EasyExcel;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.google.common.collect.Lists;
import com.jeeplus.aop.demo.annotation.DemoMode;
import com.jeeplus.aop.logging.annotation.ApiLog;
import com.jeeplus.core.excel.EasyExcelUtils;
import com.jeeplus.sys.constant.CommonConstants;
import com.jeeplus.sys.domain.Office;
import com.jeeplus.sys.domain.User;
import com.jeeplus.sys.mapper.OfficeMapper;
import com.jeeplus.sys.mapper.UserMapper;
import com.jeeplus.sys.service.OfficeService;
import com.jeeplus.sys.service.dto.LogDTO;
import com.jeeplus.sys.service.dto.OfficeDTO;
import com.jeeplus.sys.service.dto.UserDTO;
import com.jeeplus.sys.service.mapstruct.OfficeWrapper;
import com.jeeplus.sys.service.vo.OfficeExcelModel;
import com.jeeplus.sys.service.vo.OfficeVO;
import com.jeeplus.sys.utils.UserUtils;
import com.jeeplus.sys.utils.excel.UserEasyExcel;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletResponse;
import javax.validation.Valid;
import java.io.IOException;
import java.util.List;

/**
 * 机构Controller
 *
 * @author jeeplus
 * @version 2021-5-15
 */

@RestController
@RequestMapping("/sys/office")
public class OfficeController {

    @Autowired
    private OfficeService officeService;

    @Autowired
    private OfficeWrapper officeWrapper;


    /**
     * 根据id查询部门
     *
     * @param id
     * @return
     */
    @ApiLog("查询部门")
    @PreAuthorize("hasAnyAuthority('sys:office:view','sys:office:add','sys:office:edit')")
    @GetMapping("queryById")
    public ResponseEntity queryById(@RequestParam String id) {
        OfficeDTO officeDTO = officeWrapper.toDTO(officeService.getById(id));
        return ResponseEntity.ok(officeDTO);
    }

    /**
     * 保存或者修改部门
     *
     * @param officeDTO
     * @return
     */
    @DemoMode
    @ApiLog("保存部门")
    @PreAuthorize("hasAnyAuthority('sys:office:add','sys:office:edit')")
    @PostMapping("save")
    public ResponseEntity save(@Valid @RequestBody OfficeDTO officeDTO) {
        officeService.saveOrUpdate(officeWrapper.toEntity(officeDTO));
        return ResponseEntity.ok("保存机构'" + officeDTO.getName() + "'成功");
    }

    /**
     * 删除部门
     *
     * @param ids
     * @return
     */
    @DemoMode
    @ApiLog("删除部门")
    @PreAuthorize("hasAuthority('sys:office:del')")
    @GetMapping("delete")
    public ResponseEntity delete(String ids) {
        String idArray[] = ids.split(",");
        officeService.removeWithChildrenByIds(Lists.newArrayList(idArray));
        return ResponseEntity.ok("删除成功！");
    }


    /**
     * 获取机构JSON数据。
     *
     * @param extId   排除的ID
     * @param type    类型（1：公司；2：部门）
     * @param showAll 是否显示不可用数据 1 显示 0 隐藏
     * @return
     */
    @ApiLog("获取部门数据")
    @GetMapping("treeData")
    public ResponseEntity treeData(@RequestParam(required = false) String extId, @RequestParam(required = false) String type, @RequestParam(required = false, defaultValue = CommonConstants.NO) String showAll) {
        List<OfficeDTO> list = officeWrapper.toDTO(officeService.lambdaQuery().orderByAsc(Office::getSort).list());
        List rootTree = officeService.getRootTree(list, extId, type, showAll);
        return ResponseEntity.ok(rootTree);
    }

    @PreAuthorize("hasAnyAuthority('sys:office:add','sys:office:edit','officemaster:offerMaster:list')")
    @GetMapping("list")
    public ResponseEntity<IPage<Office>> getList(Page<Office> page, String keyWord) {

        IPage<Office> list = officeService.getList(keyWord, page);

        return ResponseEntity.ok(list);
    }

    @PreAuthorize("hasAnyAuthority('sys:office:add','sys:office:edit','officemaster:offerMaster:list')")
    @PostMapping("saveMaster")
    public ResponseEntity<String> saveMaster(@RequestBody OfficeVO officeVO) {
        officeService.saveMaster(officeVO);
        return ResponseEntity.ok("部门管理员设置成功");
    }

    @Autowired
    private OfficeMapper officeMapperl;
    @Autowired
    private UserMapper userMapper;

    @PostMapping("importExcel")
    public ResponseEntity importExcel(MultipartFile file) throws IOException {
        List<OfficeExcelModel> officeExcelModels = EasyExcel.read(file.getInputStream()).head(OfficeExcelModel.class).sheet().doReadSync();

        int count = 0;
        for (OfficeExcelModel officeExcelModel : officeExcelModels) {
            if ((officeExcelModel.getMasterId() != null && !officeExcelModel.getMasterId().isEmpty()) &&
                    (officeExcelModel.getName() != null && !officeExcelModel.getName().isEmpty())) {
                String name = officeExcelModel.getName();
                String master = officeExcelModel.getMasterId();
                QueryWrapper wrapper = new QueryWrapper();
                wrapper.eq("del_flag", 0);
                wrapper.eq("name", name);
                Office office = officeMapperl.selectOne(wrapper);

                QueryWrapper wrapper1 = new QueryWrapper();
                wrapper1.eq("del_flag", 0);
                wrapper1.eq("no", master);
                User user = userMapper.selectOne(wrapper1);

                if (office != null && user != null) {
                    OfficeVO officeVO = new OfficeVO();
                    officeVO.setId(office.getId());
                    officeVO.setMaster(user.getId());
                    officeService.saveMaster(officeVO);
                    count++;
                }
            }
        }

        return ResponseEntity.ok("导入成功! 本次导入数据共" + officeExcelModels.size() + "条，成功导入" + count + "条。");
    }

    @GetMapping("import/template")
    @ApiOperation(value = "下载模板")
    public void importFileTemplate(HttpServletResponse response) throws IOException {
        String fileName = "部门管理员导入模板.xlsx";
        List<OfficeExcelModel> list = Lists.newArrayList();
        EasyExcelUtils.newInstance(officeService, officeWrapper).exportExcel(list, "部门管理员", OfficeExcelModel.class, fileName, null, response);
    }

}
