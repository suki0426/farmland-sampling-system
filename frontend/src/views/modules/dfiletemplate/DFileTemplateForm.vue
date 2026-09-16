<template>
<div>
  <el-dialog
    :title="title"
    :close-on-click-modal="false"
     v-dialogDrag
    :visible.sync="visible">
    <el-form :model="inputForm" size="small" ref="inputForm" v-loading="loading" :class="method==='view'?'readonly':''"  :disabled="method==='view'"
             label-width="120px">
      <el-row  :gutter="15">
        <el-col :span="12">
            <el-form-item label="模板编码" prop="templateCode"
                :rules="[
                 ]">
              <el-input v-model="inputForm.templateCode" placeholder="请填写模板编码"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="模板名称" prop="templateName"
                :rules="[
                 ]">
              <el-input v-model="inputForm.templateName" placeholder="请填写模板名称"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="文档类型" prop="docType"
                :rules="[
                 ]">
              <el-input v-model="inputForm.docType" placeholder="请填写文档类型"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="模板版本" prop="versionNo"
                :rules="[
                 ]">
              <el-input v-model="inputForm.versionNo" placeholder="请填写模板版本"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="适用课程范围" prop="applicableMajor"
                :rules="[
                 ]">
              <el-input v-model="inputForm.applicableMajor" placeholder="请填写适用课程范围"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="适用课程范围" prop="applicableCourse"
                :rules="[
                 ]">
              <el-input v-model="inputForm.applicableCourse" placeholder="请填写适用课程范围"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="是否默认模板" prop="isDefault"
                :rules="[
                 ]">
              <el-input v-model="inputForm.isDefault" placeholder="请填写是否默认模板"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="状态" prop="status"
                :rules="[
                 ]">
              <el-input v-model="inputForm.status" placeholder="请填写状态"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="备注" prop="remark"
                :rules="[
                 ]">
              <el-input v-model="inputForm.remark" placeholder="请填写备注"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="排序" prop="sortNo"
                :rules="[
                 ]">
              <el-input v-model="inputForm.sortNo" placeholder="请填写排序"     ></el-input>
           </el-form-item>
        </el-col>
    <el-col :span="24">
     <el-form-item label-width="0">
        <el-tabs v-model="dFileTemplateTab">
            <el-tab-pane label="文件模板章节表">
                  <el-button @click="addDFileTemplateSectionRow" type="primary">新增</el-button>
                  <el-table
                  class="table"
                  size="small"
                  :data="inputForm.dFileTemplateSectionDTOList.filter((item) => { return item.delFlag !== '1'})"
                  style="width: 100%">
                  <el-table-column
                    prop=""
                    header-align="center"
                    align="center"
                    show-overflow-tooltip
                    label="上级章节">
                      <template  #default="{row}">
                          <el-input v-model="row.parentSectionId" placeholder="请填写上级章节"     ></el-input>
                      </template>
                  </el-table-column>
                  <el-table-column
                    prop=""
                    header-align="center"
                    align="center"
                    show-overflow-tooltip
                    label="章节级别">
                      <template  #default="{row}">
                          <el-input v-model="row.sectionLevel" placeholder="请填写章节级别"     ></el-input>
                      </template>
                  </el-table-column>
                  <el-table-column
                    prop=""
                    header-align="center"
                    align="center"
                    show-overflow-tooltip
                    label="章节名称">
                      <template  #default="{row}">
                          <el-input v-model="row.sectionTitle" placeholder="请填写章节名称"     ></el-input>
                      </template>
                  </el-table-column>
                  <el-table-column
                    prop=""
                    header-align="center"
                    align="center"
                    show-overflow-tooltip
                    label="章节编号">
                      <template  #default="{row}">
                          <el-input v-model="row.sectionCode" placeholder="请填写章节编号"     ></el-input>
                      </template>
                  </el-table-column>
                  <el-table-column
                    prop=""
                    header-align="center"
                    align="center"
                    show-overflow-tooltip
                    label="显示顺序">
                      <template  #default="{row}">
                          <el-input v-model="row.sortNo" placeholder="请填写显示顺序"     ></el-input>
                      </template>
                  </el-table-column>
                  <el-table-column
                    prop=""
                    header-align="center"
                    align="center"
                    show-overflow-tooltip
                    label="是否必填">
                      <template  #default="{row}">
                          <el-input v-model="row.requiredFlag" placeholder="请填写是否必填"     ></el-input>
                      </template>
                  </el-table-column>
                  <el-table-column
                    prop=""
                    header-align="center"
                    align="center"
                    show-overflow-tooltip
                    label="是否可见">
                      <template  #default="{row}">
                          <el-input v-model="row.visibleFlag" placeholder="请填写是否可见"     ></el-input>
                      </template>
                  </el-table-column>
                  <el-table-column
                    prop=""
                    header-align="center"
                    align="center"
                    show-overflow-tooltip
                    label="组件类型">
                      <template  #default="{row}">
                          <el-input v-model="row.componentType" placeholder="请填写组件类型"     ></el-input>
                      </template>
                  </el-table-column>
                  <el-table-column
                    prop=""
                    header-align="center"
                    align="center"
                    show-overflow-tooltip
                    label="表单提示">
                      <template  #default="{row}">
                          <el-input v-model="row.placeHolderText" placeholder="请填写表单提示"     ></el-input>
                      </template>
                  </el-table-column>
                  <el-table-column
                    prop=""
                    header-align="center"
                    align="center"
                    show-overflow-tooltip
                    label="默认值">
                      <template  #default="{row}">
                          <el-input v-model="row.defaultvalue" placeholder="请填写默认值"     ></el-input>
                      </template>
                  </el-table-column>
                  <el-table-column
                    prop=""
                    header-align="center"
                    align="center"
                    show-overflow-tooltip
                    label="状态">
                      <template  #default="{row}">
                          <el-input v-model="row.status" placeholder="请填写状态"     ></el-input>
                      </template>
                  </el-table-column>
                  <el-table-column
                    fixed="right"
                    label="操作"
                    width="100">
                    <template #default="{row}">
                      <el-button  @click="delDFileTemplateSectionRow(row)" type="text" size="small">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </el-tab-pane>
        </el-tabs>
           </el-form-item>
          </el-col>
        </el-row>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button size="small" @click="visible = false">关闭</el-button>
      <el-button size="small" type="primary" v-if="method != 'view'" @click="doSubmit()" v-noMoreClick>确定</el-button>
    </span>
  </el-dialog>
</div>
</template>

<script>
  import dFileTemplateService from '@/api/dfiletemplate/dFileTemplateService'
  export default {
    data () {
      return {
        title: '',
        method: '',
        visible: false,
        loading: false,
        dFileTemplateTab: '0',
        inputForm: {
          id: '',
          dFileTemplateSectionDTOList: [],
          templateCode: '',
          templateName: '',
          docType: '',
          versionNo: '',
          applicableMajor: '',
          applicableCourse: '',
          isDefault: '',
          status: '',
          remark: '',
          sortNo: ''
        }
      }
    },
    components: {
    },
    methods: {
      init (method, id) {
        this.method = method
        if (method === 'add') {
          this.title = `新建文档模板管理`
        } else if (method === 'edit') {
          this.title = '修改文档模板管理'
        } else if (method === 'view') {
          this.title = '查看文档模板管理'
        }
        this.visible = true
        this.loading = false
        this.$nextTick(() => {
          this.$refs.inputForm.resetFields()
          this.inputForm.id = id
          this.dFileTemplateTab = '0'
          this.inputForm.dFileTemplateSectionDTOList = []
          if (method === 'edit' || method === 'view') { // 修改或者查看
            this.loading = true
            dFileTemplateService.queryById(this.inputForm.id).then(({data}) => {
              this.inputForm = this.recover(this.inputForm, data)
              this.loading = false
            })
          }
        })
      },
      saveDFileTemplateSectionRow (child) {
        if (child[0] === '') {
          this.inputForm.dFileTemplateSectionDTOList.push(child[1])
        } else {
          this.inputForm.dFileTemplateSectionDTOList.forEach((item, index) => {
            if (item === child[0]) {
              this.inputForm.dFileTemplateSectionDTOList.splice(index, 1, child[1])
            }
          })
        }
      },
      addDFileTemplateSectionRow () {
        this.inputForm.dFileTemplateSectionDTOList.push({
          parentSectionId: '',
          sectionLevel: '',
          sectionTitle: '',
          sectionCode: '',
          sortNo: '',
          requiredFlag: '',
          visibleFlag: '',
          componentType: '',
          placeHolderText: '',
          defaultvalue: '',
          status: ''
        })
      },
      delDFileTemplateSectionRow (child) {
        this.inputForm.dFileTemplateSectionDTOList.forEach((item, index) => {
          if (item === child && item.id === '') {
            this.inputForm.dFileTemplateSectionDTOList.splice(index, 1)
          } else if (item === child) {
            item.delFlag = '1'
            this.inputForm.dFileTemplateSectionDTOList.splice(index, 1, item)
          }
        })
      },
      // 表单提交
      doSubmit () {
        this.$refs['inputForm'].validate((valid) => {
          if (valid) {
            this.loading = true
            dFileTemplateService.save(this.inputForm).then(({data}) => {
              this.visible = false
              this.$message.success(data)
              this.$emit('refreshDataList')
              this.loading = false
            }).catch(() => {
              this.loading = false
            })
          }
        })
      }
    }
  }
</script>

  
