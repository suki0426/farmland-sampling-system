/**
 * Copyright &copy; 2021-2026 <a href="http://www.jeeplus.org/">JeePlus</a> All rights reserved.
 */
package com.jeeplus.sys.service;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import com.jeeplus.core.service.TreeService;
import com.jeeplus.sys.constant.CommonConstants;
import com.jeeplus.sys.constant.enums.OfficeTypeEnum;
import com.jeeplus.sys.domain.Office;
import com.jeeplus.sys.mapper.OfficeMapper;
import com.jeeplus.sys.mapper.UserMapper;
import com.jeeplus.sys.service.dto.OfficeDTO;
import com.jeeplus.sys.service.dto.RoleDTO;
import com.jeeplus.sys.service.dto.UserDTO;
import com.jeeplus.sys.service.mapstruct.OfficeWrapper;
import com.jeeplus.sys.service.vo.OfficeVO;
import org.apache.commons.lang.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * 机构Service
 *
 * @author jeeplus
 * @version 2021-05-16
 */
@Service
@Transactional
public class OfficeService extends TreeService <OfficeMapper, Office> {

    @Autowired
    private OfficeWrapper officeWrapper;

    public List <OfficeDTO> getRootTree(List <OfficeDTO> list, String extId, String type, String showAll) {
        List <OfficeDTO> offices = Lists.newArrayList ( );
        List <OfficeDTO> rootTrees = officeWrapper.toDTO ( super.getChildren ( new Office ( OfficeDTO.getRootId ( ) ) ) );
        for (OfficeDTO root : rootTrees) {
            if ( this.isUseAble ( extId, type, root, showAll ) ) {
                // 不是被排除节点的子节点
                List <OfficeDTO> officeList = formatListToTree ( root, list, extId, type, showAll );
                offices.addAll ( officeList );
            }
        }
        return offices;
    }


    public List <OfficeDTO> formatListToTree(OfficeDTO root, List <OfficeDTO> allList, String extId, String type, String showAll) {
        String rootId = root.getId ( );

        // type为2时，是选择部门，因此禁用type为1的公司节点
        if ( OfficeTypeEnum.OFFICE.getValue ( ).equals ( type ) && root.getType ( ).equals ( OfficeTypeEnum.COMPANY.getValue ( ) ) ) {
            root.setDisabled ( true );
        } else {
            root.setDisabled ( false );
        }
        // 最终的树形态
        List <OfficeDTO> trees = Lists.newArrayList ( );

        // 把需要构造树的所有列表, 根据以父id作为key, 整理为列表
        Map <String, List <OfficeDTO>> treeMap = Maps.newHashMap ( );
        for (OfficeDTO entity : allList) {
            List <OfficeDTO> offices = treeMap.get ( entity.getParent ( ).getId ( ) );
            if ( offices == null ) {
                offices = Lists.newLinkedList ( );
            }

            if ( this.isUseAble ( extId, type, root, showAll ) ) {
                // 如果是查找公司，只返回公司数据，如果是查询部门，则一起返回公司部门数据
                if ( OfficeTypeEnum.COMPANY.getValue ( ).equals ( type ) && entity.getType ( ).equals ( type )
                        || OfficeTypeEnum.OFFICE.getValue ( ).equals ( type )
                        || StrUtil.isBlank ( type )
                ) {

                    // type为2时，是选择部门，因此禁用type为1的公司节点
                    if ( OfficeTypeEnum.OFFICE.getValue ( ).equals ( type ) && entity.getType ( ).equals ( OfficeTypeEnum.COMPANY.getValue ( ) ) ) {
                        entity.setDisabled ( true );
                    } else {
                        entity.setDisabled ( false );
                    }
                    offices.add ( entity );
                }
                treeMap.put ( entity.getParent ( ).getId ( ), offices );
            }
        }

        // 开始递归格式化
        List <OfficeDTO> children = treeMap.get ( rootId );
        if ( children != null ) {
            for (OfficeDTO parent : children) {
                formatFillChildren ( parent, treeMap );
                trees.add ( parent );
            }
        }

        root.setChildren ( trees );
        return Lists.newArrayList ( root );
    }

    /**
     * 从treeMap中取出子节点填入parent, 并递归此操作
     **/
    private void formatFillChildren(OfficeDTO parent, Map <String, List <OfficeDTO>> treeMap) {

        List <OfficeDTO> children = treeMap.get ( parent.getId ( ) );
        parent.setChildren ( children );
        if ( children != null && !children.isEmpty ( ) ) {
            for (OfficeDTO child : children) {
                formatFillChildren ( child, treeMap );
            }
        }
    }

    private boolean isUseAble(String extId, String type, OfficeDTO dto, String showAll) {
        return (StringUtils.isBlank ( extId ) || (extId != null && !extId.equals ( dto.getId ( ) ) && dto.getParentIds ( ).indexOf ( "," + extId + "," ) == -1))
                && (type == null || (type != null && (type.equals ( OfficeTypeEnum.COMPANY.getValue ( ) ) ? type.equals ( dto.getType ( ) ) : true)))
                && (CommonConstants.YES.equals ( showAll ) || CommonConstants.YES.equals ( dto.getUseable ( ) ));
    }



    @Autowired
    private OfficeMapper officeMapper;

    public IPage<Office> getList(String keyWord, Page<Office> page){

        IPage<Office> list = officeMapper.getList(keyWord,page);

        return list;
    }


    @Autowired
    private UserMapper userMapper;
    public void saveMaster(OfficeVO officeVO) {

        // 审核评估任务部门管理员
        String roleId = "1418249937002459138";
        // 首先将原来的 管理员 查询出来
        String officeId = officeVO.getId();
        String masterNew = officeVO.getMaster();
        // 根据部门id查询对应的 管理员id
        Office officeById = officeMapper.selectById(officeId);
        // 如果有 那么取消掉他的 管理员身份
        if(officeById.getMaster()!=null&&!officeById.getMaster().isEmpty()){
            String masterOld = officeById.getMaster();
            userMapper.deleteUserRoleByRoleId(masterOld,roleId);
        }
        if(masterNew!=null && !masterNew.isEmpty()){
            // 如果没有 跳过 设置新的管理员
            // 设置管理员角色
            QueryWrapper queryWrapper = new QueryWrapper();
            queryWrapper.eq("a.id", masterNew);
            queryWrapper.eq("a.del_flag", 0); // 排除已经删除
            UserDTO userDTO = userMapper.get(queryWrapper);
            // 查询当前用户是否拥有次角色 如果有再去加会报错
            List<RoleDTO> roleDTOList = userDTO.getRoleDTOList();
            boolean flag = true;
            // 遍历角色列表
            for (RoleDTO roleDTO : roleDTOList) {
                // 如果角色中 有角色和 要设置的角色相同
                if (roleId.equals(roleDTO.getId())) {
                    // 设置 旗帜为false
                    flag = false;
                }
            }
            // 如果旗帜为false 则不执行设置角色的行为
            if (flag) {
                userMapper.insertUserRole(masterNew, roleId);
            }
        }

        // 修改管理员
        Office office = new Office();
        office.setId(officeId);
        office.setMaster(masterNew);
        officeMapper.updateById(office);
    }
}
