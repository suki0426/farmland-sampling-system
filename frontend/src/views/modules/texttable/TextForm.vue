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
            <el-form-item label="标题" prop="title"
                :rules="[
                 ]">
              <el-input v-model="inputForm.title" placeholder="请填写标题"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="24">
            <el-form-item label="内容" prop="content"
                :rules="[
                 ]">
            <WangEditor ref="contentEditor" v-model="inputForm.content"/>
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
  import WangEditor from '@/components/editor/WangEditor'
  import textService from '@/api/texttable/textService'
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
          content: ''
        }
      }
    },
    components: {
      WangEditor
    },
    methods: {
      init (method, id) {
        this.method = method
        this.inputForm.id = id
        if (method === 'add') {
          this.title = `新建新增文本`
        } else if (method === 'edit') {
          this.title = '修改新增文本'
        } else if (method === 'view') {
          this.title = '查看新增文本'
        }
        this.visible = true
        this.loading = false
        this.$nextTick(() => {
          this.$refs.inputForm.resetFields()
          this.$refs.contentEditor.init('')
          if (method === 'edit' || method === 'view') { // 修改或者查看
            this.loading = true
            textService.queryById(this.inputForm.id).then(({data}) => {
              this.inputForm = this.recover(this.inputForm, data)
              this.$refs.contentEditor.init(this.inputForm.content)
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
            textService.save(this.inputForm).then(({data}) => {
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

  
