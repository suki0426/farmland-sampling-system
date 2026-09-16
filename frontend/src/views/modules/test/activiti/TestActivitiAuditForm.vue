<template>
<div>
    <el-form size="small" :model="inputForm" ref="inputForm" v-loading="loading" :disabled="formReadOnly" label-width="120px">
      <el-row  :gutter="15">
        <el-col :span="24">
            <el-form-item label="变动用户" prop="user.id"
                :rules="[
                  {required: true, message:'变动用户不能为空', trigger:'blur'}
                 ]">
                <user-select :limit='1' :value="inputForm.user.id" @getValue='(value) => {inputForm.user.id=value}'></user-select>
           </el-form-item>
        </el-col>
        <el-col :span="24">
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
        <el-col :span="24">
            <el-form-item label="岗位" prop="post"
                :rules="[
                 ]">
              <el-input v-model="inputForm.post" placeholder="请填写岗位"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="24">
            <el-form-item label="性别" prop="sex"
                :rules="[
                 ]">
                    <el-radio-group v-model="inputForm.sex">
                        <el-radio v-for="item in $dictUtils.getDictList('sex')" :label="item.value" :key="item.value">{{item.label}}</el-radio>
                    </el-radio-group>
           </el-form-item>
        </el-col>
        <el-col :span="24">
            <el-form-item label="学历" prop="edu"
                :rules="[
                 ]">
              <el-input v-model="inputForm.edu" placeholder="请填写学历"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="24">
            <el-form-item label="调整原因" prop="content"
                :rules="[
                  {required: true, message:'调整原因不能为空', trigger:'blur'}
                 ]">
          <el-input type="textarea" v-model="inputForm.content" placeholder="请填写调整原因"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="24">
            <el-form-item label="现行标准 薪酬档级" prop="olda"
                :rules="[
                 ]">
              <el-input v-model="inputForm.olda" placeholder="请填写现行标准 薪酬档级"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="24">
            <el-form-item label="现行标准 月工资额" prop="oldb"
                :rules="[
                  {required: true, message:'现行标准 月工资额不能为空', trigger:'blur'}
                 ]">
              <el-input v-model="inputForm.oldb" placeholder="请填写现行标准 月工资额"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="24">
            <el-form-item label="现行标准 年薪总额" prop="oldc"
                :rules="[
                 ]">
              <el-input v-model="inputForm.oldc" placeholder="请填写现行标准 年薪总额"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="24">
            <el-form-item label="调整后标准 薪酬档级" prop="newa"
                :rules="[
                 ]">
              <el-input v-model="inputForm.newa" placeholder="请填写调整后标准 薪酬档级"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="24">
            <el-form-item label="调整后标准 月工资额" prop="newb"
                :rules="[
                  {required: true, message:'调整后标准 月工资额不能为空', trigger:'blur'}
                 ]">
              <el-input v-model="inputForm.newb" placeholder="请填写调整后标准 月工资额"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="24">
            <el-form-item label="调整后标准 年薪总额" prop="newc"
                :rules="[
                 ]">
              <el-input v-model="inputForm.newc" placeholder="请填写调整后标准 年薪总额"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="24">
            <el-form-item label="月增资" prop="addNum"
                :rules="[
                  {required: true, message:'月增资不能为空', trigger:'blur'}
                 ]">
              <el-input v-model="inputForm.addNum" placeholder="请填写月增资"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="24">
            <el-form-item label="执行时间" prop="exeDate"
                :rules="[
                  {required: true, message:'执行时间不能为空', trigger:'blur'}
                 ]">
                <el-date-picker
                      style="width: 100%;"
                      v-model="inputForm.exeDate"
                      type="datetime"
                      value-format="yyyy-MM-dd HH:mm:ss"
                      placeholder="选择日期时间">
                    </el-date-picker>
           </el-form-item>
        </el-col>
        <el-col :span="24">
            <el-form-item label="备注信息" prop="remarks"
                :rules="[
                 ]">
          <el-input type="textarea" v-model="inputForm.remarks" placeholder="请填写备注信息"     ></el-input>
           </el-form-item>
        </el-col>
        </el-row>
    </el-form>
</div>
</template>

<script>
  import UserSelect from '@/components/userSelect'
  import SelectTree from '@/components/treeSelect/treeSelect.vue'
  import testActivitiAuditService from '@/api/test/activiti/testActivitiAuditService'
  export default {
    data () {
      return {
        title: '',
        method: '',
        visible: false,
        loading: false,
        inputForm: {
          id: '',
          user: {
            id: ''
          },
          office: {
            id: ''
          },
          post: '',
          sex: '',
          edu: '',
          content: '',
          olda: '',
          oldb: '',
          oldc: '',
          newa: '',
          newb: '',
          newc: '',
          addNum: '',
          exeDate: '',
          remarks: ''
        }
      }
    },
    props: {
      businessId: {
        type: String,
        default: ''
      },
      formReadOnly: {
        type: Boolean,
        default: false
      }
    },
    components: {
      UserSelect,
      SelectTree
    },
    watch: {
      'businessId': {
        handler (newVal) {
          if (this.businessId) {
            this.init(this.businessId)
          } else {
            this.$nextTick(() => {
              this.$refs.inputForm.resetFields()
            })
          }
        },
        immediate: true,
        deep: false
      }
    },
    methods: {
      init (id) {
        if (id) {
          this.loading = true
          this.inputForm.id = id
          this.$nextTick(() => {
            this.$refs.inputForm.resetFields()
            testActivitiAuditService.queryById(this.inputForm.id).then(({data}) => {
              this.inputForm = this.recover(this.inputForm, data)
              this.loading = false
            })
          })
        }
      },
      // 表单提交
      saveForm (callback) {
        this.$refs['inputForm'].validate((valid) => {
          if (valid) {
            this.loading = true
            testActivitiAuditService.save(this.inputForm).then(({data}) => {
              callback(data.businessTable, data.businessId, this.inputForm)
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

  
