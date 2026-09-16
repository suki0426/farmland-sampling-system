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
            <el-form-item label="用户" prop="user.id"
                :rules="[
                 ]">
          <GridSelect
            title="选择用户"
            labelName = 'info'
            labelValue = 'id'
            :value = "inputForm.user.id"
            :limit="1"
            @getValue='(value) => {inputForm.user.id=value}'
            :columns="[
            {
              prop: 'info',
              label: '单表信息'
            }
            ]"
            :searchs="[
            {
              prop: 'info',
              label: '单表信息'
            }
            ]"
            dataListUrl="/onlytable/onlyTable/list"
            queryEntityUrl="/onlytable/onlyTable/queryById">
          </GridSelect>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="名称" prop="name"
                :rules="[
                 ]">
              <el-input v-model="inputForm.name" placeholder="请填写名称"     ></el-input>
           </el-form-item>
        </el-col>
    <el-col :span="24">
     <el-form-item label-width="0">
        <el-tabs v-model="masterTableTab">
            <el-tab-pane label="从表">
                  <el-button @click="addServeTableRow" type="primary">新增</el-button>
                  <el-table
                  class="table"
                  size="small"
                  :data="inputForm.serveTableDTOList.filter((item) => { return item.delFlag !== '1'})"
                  style="width: 100%">
                  <el-table-column
                    prop=""
                    header-align="center"
                    align="center"
                    show-overflow-tooltip
                    label="名称">
                      <template  #default="{row}">
                          <el-input v-model="row.name" placeholder="请填写名称"     ></el-input>
                      </template>
                  </el-table-column>
                  <el-table-column
                    fixed="right"
                    label="操作"
                    width="100">
                    <template #default="{row}">
                      <el-button  @click="delServeTableRow(row)" type="text" size="small">删除</el-button>
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
  import GridSelect from '@/components/gridSelect'
  import masterTableService from '@/api/masterservetable/masterTableService'
  export default {
    data () {
      return {
        title: '',
        method: '',
        visible: false,
        loading: false,
        masterTableTab: '0',
        inputForm: {
          id: '',
          serveTableDTOList: [],
          user: {
            id: ''
          },
          name: ''
        }
      }
    },
    components: {
      GridSelect
    },
    methods: {
      init (method, id) {
        this.inputForm = {
          id: '',
          serveTableDTOList: [],
          user: {
            id: ''
          },
          name: ''
        }
        this.method = method
        if (method === 'add') {
          this.title = `新建新增数据`
        } else if (method === 'edit') {
          this.title = '修改新增数据'
        } else if (method === 'view') {
          this.title = '查看新增数据'
        }
        this.visible = true
        this.loading = false
        this.$nextTick(() => {
          this.$refs.inputForm.resetFields()
          this.inputForm.id = id
          this.masterTableTab = '0'
          this.inputForm.serveTableDTOList = []
          if (method === 'edit' || method === 'view') { // 修改或者查看
            this.loading = true
            masterTableService.queryById(this.inputForm.id).then(({data}) => {
              this.inputForm = this.recover(this.inputForm, data)
              this.loading = false
            })
          }
        })
      },
      saveServeTableRow (child) {
        if (child[0] === '') {
          this.inputForm.serveTableDTOList.push(child[1])
        } else {
          this.inputForm.serveTableDTOList.forEach((item, index) => {
            if (item === child[0]) {
              this.inputForm.serveTableDTOList.splice(index, 1, child[1])
            }
          })
        }
      },
      addServeTableRow () {
        this.inputForm.serveTableDTOList.push({
          name: ''
        })
      },
      delServeTableRow (child) {
        this.inputForm.serveTableDTOList.forEach((item, index) => {
          if (item === child && item.id === '') {
            this.inputForm.serveTableDTOList.splice(index, 1)
          } else if (item === child) {
            item.delFlag = '1'
            this.inputForm.serveTableDTOList.splice(index, 1, item)
          }
        })
      },
      // 表单提交
      doSubmit () {
        this.$refs['inputForm'].validate((valid) => {
          if (valid) {
            this.loading = true
            masterTableService.save(this.inputForm).then(({data}) => {
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

  
