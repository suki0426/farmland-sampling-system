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
            <el-form-item label="用户" prop="tuser.id"
                :rules="[
                  {required: true, message:'用户不能为空', trigger:'blur'}
                 ]">
                <user-select :limit='1' :value="inputForm.tuser.id" @getValue='(value) => {inputForm.tuser.id=value}'></user-select>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="所属部门" prop="office.id"
                :rules="[
                  {required: true, message:'所属部门不能为空', trigger:'blur'}
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
            <el-form-item label="所属区域" prop="area.id"
                :rules="[
                  {required: true, message:'所属区域不能为空', trigger:'blur'}
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
            <el-form-item label="名称" prop="name"
                :rules="[
                  {required: true, message:'名称不能为空', trigger:'blur'}
                 ]">
              <el-input v-model="inputForm.name" placeholder="请填写名称"     ></el-input>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="性别" prop="sex"
                :rules="[
                  {required: true, message:'性别不能为空', trigger:'blur'}
                 ]">
                    <el-radio-group v-model="inputForm.sex">
                        <el-radio v-for="item in $dictUtils.getDictList('sex')" :label="item.value" :key="item.value">{{item.label}}</el-radio>
                    </el-radio-group>
           </el-form-item>
        </el-col>
        <el-col :span="24">
            <el-form-item label="身份证照片" prop="file"
                :rules="[
                 ]">
              <image-upload v-model="inputForm.file" :limit="3" tip="最多上传3个图片,单个图片不要超过10M"></image-upload>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="加入日期" prop="inDate"
                :rules="[
                 ]">
                <el-date-picker
                      style="width: 100%;"
                      v-model="inputForm.inDate"
                      type="datetime"
                      value-format="yyyy-MM-dd HH:mm:ss"
                      placeholder="选择日期时间">
                    </el-date-picker>
           </el-form-item>
        </el-col>
        <el-col :span="12">
            <el-form-item label="备注信息" prop="remarks"
                :rules="[
                 ]">
          <el-input type="textarea" v-model="inputForm.remarks" placeholder="请填写备注信息"     ></el-input>
           </el-form-item>
        </el-col>
    <el-col :span="24">
     <el-form-item label-width="0">
        <el-tabs v-model="testDataMainFormTab">
            <el-tab-pane label="汽车票">
                  <el-button @click="addTestDataChild23Row" type="primary">新增</el-button>
                  <el-table
                  class="table"
                  size="small"
                  :data="inputForm.testDataChild23DTOList.filter((item) => { return item.delFlag !== '1'})"
                  style="width: 100%">
                  <el-table-column
                    prop="startArea.name"
                    header-align="center"
                    align="center"
                    show-overflow-tooltip
                    label="出发地">
                      <template  #default="{row}">
                         <SelectTree
                          ref="startArea"
                          :props="{
                              value: 'id',             // ID字段名
                              label: 'name',         // 显示名称
                              children: 'children'    // 子级字段名
                            }"
    
                          url="/sys/area/treeData"
                          :value="row.startArea.id"
                          :clearable="true"
                          :accordion="true"
                          @getValue="(value) => {row.startArea.id=value}"/>
                      </template>
                  </el-table-column>
                  <el-table-column
                    prop="endArea.name"
                    header-align="center"
                    align="center"
                    show-overflow-tooltip
                    label="目的地">
                      <template  #default="{row}">
                         <SelectTree
                          ref="endArea"
                          :props="{
                              value: 'id',             // ID字段名
                              label: 'name',         // 显示名称
                              children: 'children'    // 子级字段名
                            }"
    
                          url="/sys/area/treeData"
                          :value="row.endArea.id"
                          :clearable="true"
                          :accordion="true"
                          @getValue="(value) => {row.endArea.id=value}"/>
                      </template>
                  </el-table-column>
                  <el-table-column
                    prop=""
                    header-align="center"
                    align="center"
                    show-overflow-tooltip
                    label="出发时间">
                      <template  #default="{row}">
                            <el-date-picker
                              style="width: 100%;"
                              v-model="row.startTime"
                              type="datetime"
                              value-format="yyyy-MM-dd HH:mm:ss"
                              placeholder="选择日期时间">
                            </el-date-picker>
                      </template>
                  </el-table-column>
                  <el-table-column
                    prop=""
                    header-align="center"
                    align="center"
                    show-overflow-tooltip
                    label="到达时间">
                      <template  #default="{row}">
                            <el-date-picker
                              style="width: 100%;"
                              v-model="row.endTime"
                              type="datetime"
                              value-format="yyyy-MM-dd HH:mm:ss"
                              placeholder="选择日期时间">
                            </el-date-picker>
                      </template>
                  </el-table-column>
                  <el-table-column
                    prop=""
                    header-align="center"
                    align="center"
                    show-overflow-tooltip
                    label="代理价格">
                      <template  #default="{row}">
                          <el-input v-model="row.price" placeholder="请填写代理价格"     ></el-input>
                      </template>
                  </el-table-column>
                  <el-table-column
                    prop=""
                    header-align="center"
                    align="center"
                    show-overflow-tooltip
                    label="备注信息">
                      <template  #default="{row}">
                         <el-input type="textarea" v-model="row.remarks" placeholder="请填写备注信息"     ></el-input>
                      </template>
                  </el-table-column>
                  <el-table-column
                    fixed="right"
                    label="操作"
                    width="100">
                    <template #default="{row}">
                      <el-button  @click="delTestDataChild23Row(row)" type="text" size="small">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </el-tab-pane>
            <el-tab-pane label="火车票">
                  <el-button @click="addTestDataChild21Row" type="primary">新增</el-button>
                  <el-table
                  class="table"
                  size="small"
                  :data="inputForm.testDataChild21DTOList.filter((item) => { return item.delFlag !== '1'})"
                  style="width: 100%">
                  <el-table-column
                    prop="startArea.name"
                    header-align="center"
                    align="center"
                    show-overflow-tooltip
                    label="出发地">
                      <template  #default="{row}">
                         <SelectTree
                          ref="startArea"
                          :props="{
                              value: 'id',             // ID字段名
                              label: 'name',         // 显示名称
                              children: 'children'    // 子级字段名
                            }"
    
                          url="/sys/area/treeData"
                          :value="row.startArea.id"
                          :clearable="true"
                          :accordion="true"
                          @getValue="(value) => {row.startArea.id=value}"/>
                      </template>
                  </el-table-column>
                  <el-table-column
                    prop="endArea.name"
                    header-align="center"
                    align="center"
                    show-overflow-tooltip
                    label="目的地">
                      <template  #default="{row}">
                         <SelectTree
                          ref="endArea"
                          :props="{
                              value: 'id',             // ID字段名
                              label: 'name',         // 显示名称
                              children: 'children'    // 子级字段名
                            }"
    
                          url="/sys/area/treeData"
                          :value="row.endArea.id"
                          :clearable="true"
                          :accordion="true"
                          @getValue="(value) => {row.endArea.id=value}"/>
                      </template>
                  </el-table-column>
                  <el-table-column
                    prop=""
                    header-align="center"
                    align="center"
                    show-overflow-tooltip
                    label="出发时间">
                      <template  #default="{row}">
                            <el-date-picker
                              style="width: 100%;"
                              v-model="row.starttime"
                              type="datetime"
                              value-format="yyyy-MM-dd HH:mm:ss"
                              placeholder="选择日期时间">
                            </el-date-picker>
                      </template>
                  </el-table-column>
                  <el-table-column
                    prop=""
                    header-align="center"
                    align="center"
                    show-overflow-tooltip
                    label="到达时间">
                      <template  #default="{row}">
                            <el-date-picker
                              style="width: 100%;"
                              v-model="row.endtime"
                              type="datetime"
                              value-format="yyyy-MM-dd HH:mm:ss"
                              placeholder="选择日期时间">
                            </el-date-picker>
                      </template>
                  </el-table-column>
                  <el-table-column
                    prop=""
                    header-align="center"
                    align="center"
                    show-overflow-tooltip
                    label="代理价格">
                      <template  #default="{row}">
                          <el-input v-model="row.price" placeholder="请填写代理价格"     ></el-input>
                      </template>
                  </el-table-column>
                  <el-table-column
                    prop=""
                    header-align="center"
                    align="center"
                    show-overflow-tooltip
                    label="文件">
                      <template  #default="{row}">
                         <file-upload v-model="row.t1File" :limit="3" tip="最多上传3个文件,单个文件不要超过10M"></file-upload>
                      </template>
                  </el-table-column>
                  <el-table-column
                    prop=""
                    header-align="center"
                    align="center"
                    show-overflow-tooltip
                    label="备注信息">
                      <template  #default="{row}">
                         <el-input type="textarea" v-model="row.remarks" placeholder="请填写备注信息"     ></el-input>
                      </template>
                  </el-table-column>
                  <el-table-column
                    fixed="right"
                    label="操作"
                    width="100">
                    <template #default="{row}">
                      <el-button  @click="delTestDataChild21Row(row)" type="text" size="small">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </el-tab-pane>
            <el-tab-pane label="飞机票">
                  <el-button @click="addTestDataChild22Row" type="primary">新增</el-button>
                  <el-table
                  class="table"
                  size="small"
                  :data="inputForm.testDataChild22DTOList.filter((item) => { return item.delFlag !== '1'})"
                  style="width: 100%">
                  <el-table-column
                    prop="startArea.name"
                    header-align="center"
                    align="center"
                    show-overflow-tooltip
                    label="出发地">
                      <template  #default="{row}">
                         <SelectTree
                          ref="startArea"
                          :props="{
                              value: 'id',             // ID字段名
                              label: 'name',         // 显示名称
                              children: 'children'    // 子级字段名
                            }"
    
                          url="/sys/area/treeData"
                          :value="row.startArea.id"
                          :clearable="true"
                          :accordion="true"
                          @getValue="(value) => {row.startArea.id=value}"/>
                      </template>
                  </el-table-column>
                  <el-table-column
                    prop="endArea.name"
                    header-align="center"
                    align="center"
                    show-overflow-tooltip
                    label="目的地">
                      <template  #default="{row}">
                         <SelectTree
                          ref="endArea"
                          :props="{
                              value: 'id',             // ID字段名
                              label: 'name',         // 显示名称
                              children: 'children'    // 子级字段名
                            }"
    
                          url="/sys/area/treeData"
                          :value="row.endArea.id"
                          :clearable="true"
                          :accordion="true"
                          @getValue="(value) => {row.endArea.id=value}"/>
                      </template>
                  </el-table-column>
                  <el-table-column
                    prop=""
                    header-align="center"
                    align="center"
                    show-overflow-tooltip
                    label="出发时间">
                      <template  #default="{row}">
                            <el-date-picker
                              style="width: 100%;"
                              v-model="row.startTime"
                              type="datetime"
                              value-format="yyyy-MM-dd HH:mm:ss"
                              placeholder="选择日期时间">
                            </el-date-picker>
                      </template>
                  </el-table-column>
                  <el-table-column
                    prop=""
                    header-align="center"
                    align="center"
                    show-overflow-tooltip
                    label="到达时间">
                      <template  #default="{row}">
                            <el-date-picker
                              style="width: 100%;"
                              v-model="row.endTime"
                              type="datetime"
                              value-format="yyyy-MM-dd HH:mm:ss"
                              placeholder="选择日期时间">
                            </el-date-picker>
                      </template>
                  </el-table-column>
                  <el-table-column
                    prop=""
                    header-align="center"
                    align="center"
                    show-overflow-tooltip
                    label="代理价格">
                      <template  #default="{row}">
                          <el-input v-model="row.price" placeholder="请填写代理价格"     ></el-input>
                      </template>
                  </el-table-column>
                  <el-table-column
                    prop=""
                    header-align="center"
                    align="center"
                    show-overflow-tooltip
                    label="备注信息">
                      <template  #default="{row}">
                         <el-input type="textarea" v-model="row.remarks" placeholder="请填写备注信息"     ></el-input>
                      </template>
                  </el-table-column>
                  <el-table-column
                    fixed="right"
                    label="操作"
                    width="100">
                    <template #default="{row}">
                      <el-button  @click="delTestDataChild22Row(row)" type="text" size="small">删除</el-button>
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
  import UserSelect from '@/components/userSelect'
  import SelectTree from '@/components/treeSelect/treeSelect.vue'
  import testDataMainFormService from '@/api/test/onetomany/testDataMainFormService'
  export default {
    data () {
      return {
        title: '',
        method: '',
        visible: false,
        loading: false,
        testDataMainFormTab: '0',
        inputForm: {
          id: '',
          testDataChild23DTOList: [],
          testDataChild21DTOList: [],
          testDataChild22DTOList: [],
          tuser: {
            id: ''
          },
          office: {
            id: ''
          },
          area: {
            id: ''
          },
          name: '',
          sex: '',
          file: '',
          inDate: '',
          remarks: ''
        }
      }
    },
    components: {
      UserSelect,
      SelectTree
    },
    methods: {
      init (method, id) {
        this.method = method
        if (method === 'add') {
          this.title = `新建票务代理`
        } else if (method === 'edit') {
          this.title = '修改票务代理'
        } else if (method === 'view') {
          this.title = '查看票务代理'
        }
        this.visible = true
        this.loading = false
        this.$nextTick(() => {
          this.$refs.inputForm.resetFields()
          this.inputForm.id = id
          this.testDataMainFormTab = '0'
          this.inputForm.testDataChild23DTOList = []
          this.inputForm.testDataChild21DTOList = []
          this.inputForm.testDataChild22DTOList = []
          if (method === 'edit' || method === 'view') { // 修改或者查看
            this.loading = true
            testDataMainFormService.queryById(this.inputForm.id).then(({data}) => {
              this.inputForm = this.recover(this.inputForm, data)
              this.loading = false
            })
          }
        })
      },
      saveTestDataChild23Row (child) {
        if (child[0] === '') {
          this.inputForm.testDataChild23DTOList.push(child[1])
        } else {
          this.inputForm.testDataChild23DTOList.forEach((item, index) => {
            if (item === child[0]) {
              this.inputForm.testDataChild23DTOList.splice(index, 1, child[1])
            }
          })
        }
      },
      addTestDataChild23Row () {
        this.inputForm.testDataChild23DTOList.push({
          startArea: {
            id: ''
          },
          endArea: {
            id: ''
          },
          startTime: '',
          endTime: '',
          price: '',
          remarks: ''
        })
      },
      delTestDataChild23Row (child) {
        this.inputForm.testDataChild23DTOList.forEach((item, index) => {
          if (item === child && item.id === '') {
            this.inputForm.testDataChild23DTOList.splice(index, 1)
          } else if (item === child) {
            item.delFlag = '1'
            this.inputForm.testDataChild23DTOList.splice(index, 1, item)
          }
        })
      },
      saveTestDataChild21Row (child) {
        if (child[0] === '') {
          this.inputForm.testDataChild21DTOList.push(child[1])
        } else {
          this.inputForm.testDataChild21DTOList.forEach((item, index) => {
            if (item === child[0]) {
              this.inputForm.testDataChild21DTOList.splice(index, 1, child[1])
            }
          })
        }
      },
      addTestDataChild21Row () {
        this.inputForm.testDataChild21DTOList.push({
          startArea: {
            id: ''
          },
          endArea: {
            id: ''
          },
          starttime: '',
          endtime: '',
          price: '',
          t1File: '',
          remarks: ''
        })
      },
      delTestDataChild21Row (child) {
        this.inputForm.testDataChild21DTOList.forEach((item, index) => {
          if (item === child && item.id === '') {
            this.inputForm.testDataChild21DTOList.splice(index, 1)
          } else if (item === child) {
            item.delFlag = '1'
            this.inputForm.testDataChild21DTOList.splice(index, 1, item)
          }
        })
      },
      saveTestDataChild22Row (child) {
        if (child[0] === '') {
          this.inputForm.testDataChild22DTOList.push(child[1])
        } else {
          this.inputForm.testDataChild22DTOList.forEach((item, index) => {
            if (item === child[0]) {
              this.inputForm.testDataChild22DTOList.splice(index, 1, child[1])
            }
          })
        }
      },
      addTestDataChild22Row () {
        this.inputForm.testDataChild22DTOList.push({
          startArea: {
            id: ''
          },
          endArea: {
            id: ''
          },
          startTime: '',
          endTime: '',
          price: '',
          remarks: ''
        })
      },
      delTestDataChild22Row (child) {
        this.inputForm.testDataChild22DTOList.forEach((item, index) => {
          if (item === child && item.id === '') {
            this.inputForm.testDataChild22DTOList.splice(index, 1)
          } else if (item === child) {
            item.delFlag = '1'
            this.inputForm.testDataChild22DTOList.splice(index, 1, item)
          }
        })
      },
      // 表单提交
      doSubmit () {
        this.$refs['inputForm'].validate((valid) => {
          if (valid) {
            this.loading = true
            testDataMainFormService.save(this.inputForm).then(({data}) => {
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

  
