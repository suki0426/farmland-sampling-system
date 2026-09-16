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
            <el-form-item label="所属公司" prop="company.id"
                :rules="[
                  {required: true, message:'所属公司不能为空', trigger:'blur'}
                 ]">
          <SelectTree
                      ref="company"
                      :props="{
                          value: 'id',             // ID字段名
                          label: 'name',         // 显示名称
                          children: 'children'    // 子级字段名
                        }"

                      url="/sys/office/treeData?type=2"
                      :value="inputForm.company.id"
                      :clearable="true"
                      :accordion="true"
                      @getValue="(value) => {inputForm.company.id=value}"/>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="归属部门" prop="office.id"
                :rules="[
                  {required: true, message:'归属部门不能为空', trigger:'blur'}
                 ]">
          <SelectTree
                      ref="office"
                      :props="{
                          value: 'id',             // ID字段名
                          label: 'name',         // 显示名称
                          children: 'children'    // 子级字段名
                        }"

                      url="/sys/office/treeData?type=2"
                      :value="inputForm.office.id"
                      :clearable="true"
                      :accordion="true"
                      @getValue="(value) => {inputForm.office.id=value}"/>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="员工" prop="user.id"
                :rules="[
                 ]">
                <user-select :limit='1' :value="inputForm.user.id" @getValue='(value) => {inputForm.user.id=value}'></user-select>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="归属区域" prop="area.id"
                :rules="[
                 ]">
              <SelectTree
                      ref="area"
                      :props="{
                          value: 'id',             // ID字段名
                          label: 'name',         // 显示名称
                          children: 'children'    // 子级字段名
                        }"

                      url="/sys/area/treeData"
                      :value="inputForm.area.id"
                      :clearable="true"
                      :accordion="true"
                      @getValue="(value) => {inputForm.area.id=value}"/>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="请假开始日期" prop="beginDate"
                :rules="[
                 ]">
                <el-date-picker
                      style="width: 100%;"
                      v-model="inputForm.beginDate"
                      type="datetime"
                      value-format="yyyy-MM-dd HH:mm:ss"
                      placeholder="选择日期时间">
                    </el-date-picker>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="请假结束日期" prop="endDate"
                :rules="[
                 ]">
                <el-date-picker
                      style="width: 100%;"
                      v-model="inputForm.endDate"
                      type="datetime"
                      value-format="yyyy-MM-dd HH:mm:ss"
                      placeholder="选择日期时间">
                    </el-date-picker>
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
  import UserSelect from '@/components/userSelect'
  import testFormLeaveService from '@/api/test/one/testFormLeaveService'
  export default {
    data () {
      return {
        title: '',
        method: '',
        visible: false,
        loading: false,
        inputForm: {
          id: '',
          company: {
            id: ''
          },
          office: {
            id: ''
          },
          user: {
            id: ''
          },
          area: {
            id: ''
          },
          beginDate: '',
          endDate: ''
        }
      }
    },
    components: {
      SelectTree,
      UserSelect
    },
    methods: {
      init (method, id) {
        this.method = method
        this.inputForm.id = id
        if (method === 'add') {
          this.title = `新建请假表单`
        } else if (method === 'edit') {
          this.title = '修改请假表单'
        } else if (method === 'view') {
          this.title = '查看请假表单'
        }
        this.visible = true
        this.loading = false
        this.$nextTick(() => {
          this.$refs.inputForm.resetFields()
          if (method === 'edit' || method === 'view') { // 修改或者查看
            this.loading = true
            testFormLeaveService.queryById(this.inputForm.id).then(({data}) => {
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
            testFormLeaveService.save(this.inputForm).then(({data}) => {
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

  
