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
            <el-form-item label="设备编码" prop="deviceCode"
                :rules="[
                 ]">
              <el-input v-model="inputForm.deviceCode" placeholder="请填写设备编码"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="设备名称" prop="deviceName"
                :rules="[
                 ]">
              <el-input v-model="inputForm.deviceName" placeholder="请填写设备名称"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="设备分类" prop="category"
                :rules="[
                 ]">
                <el-select v-model="inputForm.category" placeholder="请选择"  style="width: 100%;">
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
            <el-form-item label="设备型号" prop="model"
                :rules="[
                 ]">
              <el-input v-model="inputForm.model" placeholder="请填写设备型号"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="厂商名称" prop="manufacturer"
                :rules="[
                 ]">
              <el-input v-model="inputForm.manufacturer" placeholder="请填写厂商名称"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="设备价格" prop="price"
                :rules="[
                 ]">
              <el-input v-model="inputForm.price" placeholder="请填写设备价格"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="设备综合评分" prop="totalScore"
                :rules="[
                 ]">
              <el-input v-model="inputForm.totalScore" placeholder="请填写设备综合评分"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="设备说明" prop="descriptiontext"
                :rules="[
                 ]">
              <el-input v-model="inputForm.descriptiontext" placeholder="请填写设备说明"     ></el-input>
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
  import dDeviceService from '@/api/ddevice/dDeviceService'
  export default {
    data () {
      return {
        title: '',
        method: '',
        visible: false,
        loading: false,
        inputForm: {
          id: '',
          deviceCode: '',
          deviceName: '',
          category: '',
          model: '',
          manufacturer: '',
          price: '',
          totalScore: '',
          descriptiontext: '',
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
          this.title = `新建设备管理`
        } else if (method === 'edit') {
          this.title = '修改设备管理'
        } else if (method === 'view') {
          this.title = '查看设备管理'
        }
        this.visible = true
        this.loading = false
        this.$nextTick(() => {
          this.$refs.inputForm.resetFields()
          if (method === 'edit' || method === 'view') { // 修改或者查看
            this.loading = true
            dDeviceService.queryById(this.inputForm.id).then(({data}) => {
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
            dDeviceService.save(this.inputForm).then(({data}) => {
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

  
