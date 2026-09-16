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
            <el-form-item label="实验方案名称" prop="experimentName"
                :rules="[
                 ]">
              <el-input v-model="inputForm.experimentName" placeholder="请填写实验方案名称"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="课程名称" prop="courseName"
                :rules="[
                 ]">
              <el-input v-model="inputForm.courseName" placeholder="请填写课程名称"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="专业名称" prop="majorName"
                :rules="[
                 ]">
              <el-input v-model="inputForm.majorName" placeholder="请填写专业名称"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="实验类型" prop="experimentType"
                :rules="[
                 ]">
              <el-input v-model="inputForm.experimentType" placeholder="请填写实验类型"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="实验应用场景" prop="scenarioName"
                :rules="[
                 ]">
              <el-input v-model="inputForm.scenarioName" placeholder="请填写实验应用场景"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="实验所需课时" prop="classHours"
                :rules="[
                 ]">
              <el-input v-model="inputForm.classHours" placeholder="请填写实验所需课时"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="实验目标" prop="goalText"
                :rules="[
                 ]">
              <el-input v-model="inputForm.goalText" placeholder="请填写实验目标"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="已选择的设备清单" prop="selectedDevicesJson"
                :rules="[
                 ]">
              <el-input v-model="inputForm.selectedDevicesJson" placeholder="请填写已选择的设备清单"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="内容引用来源" prop="contentSourceId"
                :rules="[
                 ]">
              <el-input v-model="inputForm.contentSourceId" placeholder="请填写内容引用来源"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="来源类型标识" prop="contentSourceType"
                :rules="[
                 ]">
              <el-input v-model="inputForm.contentSourceType" placeholder="请填写来源类型标识"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="实验内容正文" prop="contentText"
                :rules="[
                 ]">
              <el-input v-model="inputForm.contentText" placeholder="请填写实验内容正文"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="评分或推荐算法类型" prop="algorithmType"
                :rules="[
                 ]">
              <el-input v-model="inputForm.algorithmType" placeholder="请填写评分或推荐算法类型"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="设备部分评分" prop="deviceScore"
                :rules="[
                 ]">
              <el-input v-model="inputForm.deviceScore" placeholder="请填写设备部分评分"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="内容部分评分" prop="contentScore"
                :rules="[
                 ]">
              <el-input v-model="inputForm.contentScore" placeholder="请填写内容部分评分"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="综合评分" prop="finalScore"
                :rules="[
                 ]">
              <el-input v-model="inputForm.finalScore" placeholder="请填写综合评分"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="状态" prop="status"
                :rules="[
                 ]">
              <el-input v-model="inputForm.status" placeholder="请填写状态"     ></el-input>
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
  import dExperimentDesignService from '@/api/dexperimentdesign/dExperimentDesignService'
  export default {
    data () {
      return {
        title: '',
        method: '',
        visible: false,
        loading: false,
        inputForm: {
          id: '',
          experimentName: '',
          courseName: '',
          majorName: '',
          experimentType: '',
          scenarioName: '',
          classHours: '',
          goalText: '',
          selectedDevicesJson: '',
          contentSourceId: '',
          contentSourceType: '',
          contentText: '',
          algorithmType: '',
          deviceScore: '',
          contentScore: '',
          finalScore: '',
          status: ''
        }
      }
    },
    components: {
    },
    methods: {
      init (method, id) {
        this.method = method
        this.inputForm.id = id
        if (method === 'add') {
          this.title = `新建实验设计管理`
        } else if (method === 'edit') {
          this.title = '修改实验设计管理'
        } else if (method === 'view') {
          this.title = '查看实验设计管理'
        }
        this.visible = true
        this.loading = false
        this.$nextTick(() => {
          this.$refs.inputForm.resetFields()
          if (method === 'edit' || method === 'view') { // 修改或者查看
            this.loading = true
            dExperimentDesignService.queryById(this.inputForm.id).then(({data}) => {
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
            dExperimentDesignService.save(this.inputForm).then(({data}) => {
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

  
