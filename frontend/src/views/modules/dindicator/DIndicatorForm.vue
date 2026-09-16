<template>
<div>
  <el-dialog
    :title="title"
    :close-on-click-modal="false"
     v-dialogDrag
    :visible.sync="visible">
    <el-form size="small" :model="inputForm" ref="inputForm" v-loading="loading" :class="method==='view'?'readonly':''"  :disabled="method==='view'"
             label-width="120px">
      <el-row  :gutter="15">
        <el-col :span="12">
            <el-form-item label="名称" prop="name"
                :rules="[
                  {required: true, message:'名称不能为空', trigger:'blur'}
                 ]">
          <el-input v-model="inputForm.name" placeholder="请填写名称"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="排序" prop="sort"
                :rules="[
                  {required: true, message:'排序不能为空', trigger:'blur'}
                 ]">
          <el-input-number v-model="inputForm.sort" placeholder="请填写排序"     style="width: 100%;"></el-input-number>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="上级目录" prop="parent.id"
                :rules="[
                 ]">
                <SelectTree
                      ref="parent"
                      :props="{
                          value: 'id',             // ID字段名
                          label: 'name',         // 显示名称
                          children: 'children'    // 子级字段名
                        }"
                      v-if="visible"
                      :url="`/dindicator/dIndicator/treeData?extId=${inputForm.id}`"
                      :value="inputForm.parent.id"
                      :clearable="true"
                      :accordion="true"
                      @getValue="(value) => {inputForm.parent.id=value}"/>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="指标层级" prop="indicatorLevel"
                :rules="[
                 ]">
          <el-input v-model="inputForm.indicatorLevel" placeholder="请填写指标层级"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="指标编码" prop="indicatorCode"
                :rules="[
                 ]">
          <el-input v-model="inputForm.indicatorCode" placeholder="请填写指标编码"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="指标名称" prop="indicatorName"
                :rules="[
                 ]">
          <el-input v-model="inputForm.indicatorName" placeholder="请填写指标名称"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="指标说明" prop="descriptionText"
                :rules="[
                 ]">
          <el-input v-model="inputForm.descriptionText" placeholder="请填写指标说明"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="指标状态" prop="status"
                :rules="[
                 ]">
                <el-select v-model="inputForm.status" placeholder="请选择" style="width: 100%;">
                          <el-option
                            v-for="item in $dictUtils.getDictList('indicator_status')"
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
  import dIndicatorService from '@/api/dindicator/dIndicatorService'
  export default {
    data () {
      return {
        title: '',
        method: '',
        visible: false,
        loading: false,
        inputForm: {
          id: '',
          name: '',
          sort: '',
          parent: {
            id: ''
          },
          indicatorLevel: '',
          indicatorCode: '',
          indicatorName: '',
          weightValue: '',
          scoreValue: '',
          descriptionText: '',
          status: '',
          ancestorPath: ''
        }
      }
    },
    components: {
      SelectTree
    },
    methods: {
      init (method, obj) {
        this.method = method
        this.inputForm.id = obj.id
        if (method === 'add') {
          this.title = '新建指标'
        } else if (method === 'addChild') {
          this.title = '新增下级指标'
        } else if (method === 'edit') {
          this.title = '修改指标'
        } else if (method === 'view') {
          this.title = '查看指标'
        }
        this.visible = true
        this.loading = false
        this.$nextTick(() => {
          this.$refs.inputForm.resetFields()
          this.inputForm.parent.id = obj.parent.id
          this.inputForm.parent.name = obj.parent.name
          if (method === 'edit' || method === 'view') { // 修改或者查看
            this.loading = true
            dIndicatorService.queryById(this.inputForm.id).then(({data}) => {
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
            dIndicatorService.save(this.inputForm).then(({data}) => {
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

  
