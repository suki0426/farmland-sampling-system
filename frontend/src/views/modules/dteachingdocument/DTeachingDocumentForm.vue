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
            <el-form-item label="文档标题" prop="title"
                :rules="[
                 ]">
              <el-input v-model="inputForm.title" placeholder="请填写文档标题"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="文档分类" prop="docType"
                :rules="[
                 ]">
                <el-select v-model="inputForm.docType" placeholder="请选择"  style="width: 100%;">
                          <el-option
                            v-for="item in $dictUtils.getDictList('teaching_doc_type')"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value">
                          </el-option>
                      </el-select>
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
            <el-form-item label="课程编码" prop="courseCode"
                :rules="[
                 ]">
              <el-input v-model="inputForm.courseCode" placeholder="请填写课程编码"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="学年" prop="academicterm"
                :rules="[
                 ]">
              <el-input v-model="inputForm.academicterm" placeholder="请填写学年"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="教师姓名" prop="teacherName"
                :rules="[
                 ]">
              <el-input v-model="inputForm.teacherName" placeholder="请填写教师姓名"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="录入方式" prop="inputMethod"
                :rules="[
                 ]">
                <el-select v-model="inputForm.inputMethod" placeholder="请选择"  style="width: 100%;">
                          <el-option
                            v-for="item in $dictUtils.getDictList('teaching_input_method')"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value">
                          </el-option>
                      </el-select>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="文档状态" prop="status"
                :rules="[
                 ]">
                <el-select v-model="inputForm.status" placeholder="请选择"  style="width: 100%;">
                          <el-option
                            v-for="item in $dictUtils.getDictList('teaching_doc_status')"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value">
                          </el-option>
                      </el-select>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="模板id" prop="templateId"
                :rules="[
                 ]">
              <el-input v-model="inputForm.templateId" placeholder="请填写模板id"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="导入文件原始名称" prop="sourceFileName"
                :rules="[
                 ]">
              <el-input v-model="inputForm.sourceFileName" placeholder="请填写导入文件原始名称"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="文档结构化内容" prop="contentJson"
                :rules="[
                 ]">
              <el-input v-model="inputForm.contentJson" placeholder="请填写文档结构化内容"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="关键词集合" prop="keywordsJson"
                :rules="[
                 ]">
              <el-input v-model="inputForm.keywordsJson" placeholder="请填写关键词集合"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="流程图描述文本" prop="flowChartText"
                :rules="[
                 ]">
              <el-input v-model="inputForm.flowChartText" placeholder="请填写流程图描述文本"     ></el-input>
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
  import dTeachingDocumentService from '@/api/dteachingdocument/dTeachingDocumentService'
  export default {
    data () {
      return {
        title: '',
        method: '',
        visible: false,
        loading: false,
        inputForm: {
          id: '',
          title: '',
          docType: '',
          courseName: '',
          courseCode: '',
          academicterm: '',
          teacherName: '',
          inputMethod: '',
          status: '',
          templateId: '',
          sourceFileName: '',
          contentJson: '',
          keywordsJson: '',
          flowChartText: ''
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
          this.title = '新建教学文档'
        } else if (method === 'edit') {
          this.title = '修改教学文档'
        } else if (method === 'view') {
          this.title = '查看教学文档'
        }
        this.visible = true
        this.loading = false
        this.$nextTick(() => {
          this.$refs.inputForm.resetFields()
          if (method === 'edit' || method === 'view') { // 修改或者查看
            this.loading = true
            dTeachingDocumentService.queryById(this.inputForm.id).then(({data}) => {
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
            dTeachingDocumentService.save(this.inputForm).then(({data}) => {
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

  
