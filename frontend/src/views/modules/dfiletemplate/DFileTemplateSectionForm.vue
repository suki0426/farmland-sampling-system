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
            <el-form-item label="所属模板" prop="template.id"
                :rules="[
                 ]">
          <SelectTree
                      ref="template"
                      :props="{
                          value: 'id',             // ID字段名
                          label: 'name',         // 显示名称
                          children: 'children'    // 子级字段名
                        }"

                      url="/dfiletemplate/dFileTemplate/treeData"
                      :value="inputForm.template.id"
                      :clearable="true"
                      :accordion="true"
                      @getValue="(value) => {inputForm.template.id=value}"/>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="上级章节" prop="parentSectionId"
                :rules="[
                 ]">
          <el-input v-model="inputForm.parentSectionId" placeholder="请填写上级章节"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="章节级别" prop="sectionLevel"
                :rules="[
                 ]">
          <el-input v-model="inputForm.sectionLevel" placeholder="请填写章节级别"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="章节名称" prop="sectionTitle"
                :rules="[
                 ]">
          <el-input v-model="inputForm.sectionTitle" placeholder="请填写章节名称"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="章节编号" prop="sectionCode"
                :rules="[
                 ]">
          <el-input v-model="inputForm.sectionCode" placeholder="请填写章节编号"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="显示顺序" prop="sortNo"
                :rules="[
                 ]">
          <el-input v-model="inputForm.sortNo" placeholder="请填写显示顺序"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="是否必填" prop="requiredFlag"
                :rules="[
                 ]">
          <el-input v-model="inputForm.requiredFlag" placeholder="请填写是否必填"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="是否可见" prop="visibleFlag"
                :rules="[
                 ]">
          <el-input v-model="inputForm.visibleFlag" placeholder="请填写是否可见"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="组件类型" prop="componentType"
                :rules="[
                 ]">
                <el-select v-model="inputForm.componentType" placeholder="请选择"  style="width: 100%;">
                          <el-option
                            v-for="item in $dictUtils.getDictList('')"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value">
                          </el-option>
                      </el-select>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="表单提示" prop="placeHolderText"
                :rules="[
                 ]">
          <el-input v-model="inputForm.placeHolderText" placeholder="请填写表单提示"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="默认值" prop="defaultvalue"
                :rules="[
                 ]">
          <el-input v-model="inputForm.defaultvalue" placeholder="请填写默认值"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="状态" prop="status"
                :rules="[
                 ]">
                <el-select v-model="inputForm.status" placeholder="请选择"  style="width: 100%;">
                          <el-option
                            v-for="item in $dictUtils.getDictList('')"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value">
                          </el-option>
                      </el-select>
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
  import SelectTree from '@/components/treeSelect/treeSelect.vue'
  import dFileTemplateSectionService from '@/api/dfiletemplate/dFileTemplateSectionService'
  export default {
    data () {
      return {
        title: '',
        method: '',
        visible: false,
        loading: false,
        inputForm: {
          id: '',
          template: {
            id: ''
          },
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
        }
      }
    },
    components: {
      SelectTree
    },
    methods: {
      init (method, id) {
        this.method = method
        this.inputForm.id = id
        if (method === 'add') {
          this.title = `新建文件模板章节表`
        } else if (method === 'edit') {
          this.title = '修改文件模板章节表'
        } else if (method === 'view') {
          this.title = '查看文件模板章节表'
        }
        this.visible = true
        this.loading = false
        this.$nextTick(() => {
          this.$refs.inputForm.resetFields()
          if (method === 'edit' || method === 'view') { // 修改或者查看
            this.loading = true
            dFileTemplateSectionService.queryById(this.inputForm.id).then(({data}) => {
              this.inputForm = this.recover(this.inputForm, data)
              this.loading = false
            })
          }
        })
      },
      // 表单提交
      doSubmit () {
        this.$refs['inputForm'].validate((valid) => {
          if (valid) {
            this.loading = true
            dFileTemplateSectionService.save(this.inputForm).then(({data}) => {
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

  
