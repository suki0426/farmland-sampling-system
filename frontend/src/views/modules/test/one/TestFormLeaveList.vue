<template>
    <div class="ultra-theme ultra-table-page">
      <el-form size="small" :inline="true" class="ultra-query-form" ref="searchForm" :model="searchForm" @keyup.enter.native="refreshList()" @submit.native.prevent>
            <!-- 搜索框-->
         <el-form-item prop="office.id">
            <SelectTree
                  ref="office.id"
                  :props="{
                      value: 'id',             // ID字段名
                      label: 'name',         // 显示名称
                      children: 'children'    // 子级字段名
                    }"
                  placeholder="请选择归属部门"
                  size="small"
                  url="/sys/office/treeData?type=2"
                  :value="searchForm.office.id"
                  :clearable="true"
                  :accordion="true"
                  @getValue="(value) => {searchForm.office.id=value}"/>
         </el-form-item>
         <el-form-item prop="user.id">
            <user-select :limit='1' size="small" placeholder="请选择员工" :value="searchForm.user.id" @getValue='(value) => {searchForm.user.id=value}'></user-select>
         </el-form-item>
         <el-form-item prop="area.id">
                <SelectTree
                  ref="area.id"
                  :props="{
                      value: 'id',             // ID字段名
                      label: 'name',         // 显示名称
                      children: 'children'    // 子级字段名
                    }"
                  placeholder="请选择归属区域"
                  size="small"
                  url="/sys/area/treeData"
                  :value="searchForm.area.id"
                  :clearable="true"
                  :accordion="true"
                  @getValue="(value) => {searchForm.area.id=value}"/>
         </el-form-item>
         <el-form-item prop="beginDate">
               <el-date-picker
                    v-model="searchForm.beginDate"
                    type="daterange"
                    size="small"
                    align="right"
                    value-format="yyyy-MM-dd hh:mm:ss"
                    unlink-panels
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期">
                 </el-date-picker>
         </el-form-item>
         <el-form-item prop="endDate">
               <el-date-picker
                    v-model="searchForm.endDate"
                    type="daterange"
                    size="small"
                    align="right"
                    value-format="yyyy-MM-dd hh:mm:ss"
                    unlink-panels
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期">
                 </el-date-picker>
         </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="refreshList()" size="small" icon="el-icon-search">查询</el-button>
            <el-button @click="resetSearch()" size="small" icon="el-icon-refresh-right">重置</el-button>
          </el-form-item>
      </el-form>

     <div class="ultra-table-panel">
        <vxe-toolbar :refresh="{query: refreshList}" import export print custom>
          <template #buttons>
            <el-button v-if="hasPermission('test:one:testFormLeave:add')" type="primary" size="small" icon="el-icon-plus" @click="add()">新建</el-button>
            <el-button v-if="hasPermission('test:one:testFormLeave:edit')" type="warning" size="small" icon="el-icon-edit-outline" @click="edit()" :disabled="$refs.testFormLeaveTable && $refs.testFormLeaveTable.getCheckboxRecords().length !== 1" plain>修改</el-button>
            <el-button v-if="hasPermission('test:one:testFormLeave:del')" type="danger"   size="small" icon="el-icon-delete" @click="del()" :disabled="$refs.testFormLeaveTable && $refs.testFormLeaveTable.getCheckboxRecords().length === 0" plain>删除</el-button>
          </template>
          <template #tools> 
            <vxe-button
    		  type="default"
    		  title="下载导入模板"
    		  v-if="hasPermission('test:one:testFormLeave:import')"
    		  class="el-icon-document m-r-12"
    		  @click="downloadTpl()"
    		  circle
            >
            </vxe-button>
          </template>
        </vxe-toolbar>
        <div class="ultra-table-stage">
        <vxe-table
            border="inner"
            auto-resize
            resizable
            height="100%"
            :loading="loading"
            size="small"
            ref="testFormLeaveTable"
            show-header-overflow
            show-overflow
            highlight-hover-row
            :menu-config="{}"
            :print-config="{}"
            :import-config="{
            importMethod: importMethod,
                types: ['csv', 'xls', 'xlsx'],
                remote: true,
            }"
            :export-config="{
                remote: true,
                filename: `请假表单数据${moment(new Date()).format(
            		'YYYY-MM-DD'
                )}`,
                sheetName: '请假表单数据',
                exportMethod: exportMethod,
                types: ['xlsx'],
                modes: ['current', 'selected', 'all'],
            }"
            @sort-change="sortChangeHandle"
            :sort-config="{remote:true}"
            :data="dataList"
            :checkbox-config="{}">
            <vxe-column type="seq" width="40"></vxe-column>
            <vxe-column type="checkbox"  width="40px"></vxe-column>
      <vxe-column
        field="company.name"
        sortable
        title="所属公司">
            <template slot-scope="scope">
              <el-link  type="primary" :underline="false" v-if="hasPermission('test:one:testFormLeave:edit')" @click="edit(scope.row.id)">{{scope.row.company && scope.row.company.name}}</el-link>
              <el-link  type="primary" :underline="false" v-else-if="hasPermission('test:one:testFormLeave:view')"  @click="view(scope.row.id)">{{scope.row.company &&  scope.row.company.name}}</el-link>
              <span v-else>{{scope.row.company && scope.row.company.name}}</span>
            </template>
      </vxe-column>
      <vxe-column
        field="office.name"
        sortable
        title="归属部门">
            <template slot-scope="scope">
                {{scope.row.office && scope.row.office.name}}
            </template>
      </vxe-column>
      <vxe-column
        field="user.name"
        sortable
        title="员工">
            <template slot-scope="scope">
                {{scope.row.user && scope.row.user.name}}
            </template>
      </vxe-column>
      <vxe-column
        field="area.name"
        sortable
        title="归属区域">
            <template slot-scope="scope">
                {{scope.row.area && scope.row.area.name}}
            </template>
      </vxe-column>
    <vxe-column
        field="beginDate"
        sortable
        title="请假开始日期">
      </vxe-column>
    <vxe-column
        field="endDate"
        sortable
        title="请假结束日期">
      </vxe-column>
      <vxe-column
        fixed="right"
        align="center"
        width="200"
        title="操作">
        <template  slot-scope="scope">
          <el-button v-if="hasPermission('test:one:testFormLeave:view')" type="text" icon="el-icon-view" size="small" @click="view(scope.row.id)">查看</el-button>
          <el-button v-if="hasPermission('test:one:testFormLeave:edit')" type="text" icon="el-icon-edit" size="small" @click="edit(scope.row.id)">修改</el-button>
          <el-button v-if="hasPermission('test:one:testFormLeave:del')" type="text"  icon="el-icon-delete" size="small" @click="del(scope.row.id)">删除</el-button>
        </template>
      </vxe-column>
    </vxe-table>
    
    </div>
      <vxe-pager
      background
      size="small"
      :current-page="tablePage.currentPage"
      :page-size="tablePage.pageSize"
      :total="tablePage.total"
      :page-sizes="[10, 20, 100, 1000, {label: '全量数据', value: 1000000}]"
      :layouts="['PrevPage', 'JumpNumber', 'NextPage', 'FullJump', 'Sizes', 'Total']"
      @page-change="currentChangeHandle">
    </vxe-pager>
    </div>
        <!-- 弹窗, 新增 / 修改 -->
    <TestFormLeaveForm  ref="testFormLeaveForm" @refreshDataList="refreshList"></TestFormLeaveForm>
  </div>
</template>

<script>
  import TestFormLeaveForm from './TestFormLeaveForm'
  import testFormLeaveService from '@/api/test/one/testFormLeaveService'
  import SelectTree from '@/components/treeSelect/treeSelect.vue'
  import UserSelect from '@/components/userSelect'
  export default {
    data () {
      return {
        searchForm: {
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
        },
        dataList: [],
        tablePage: {
          total: 0,
          currentPage: 1,
          pageSize: 10,
          orders: [{ column: 'a.create_date', asc: false }]
        },
        loading: false
      }
    },
    components: {
      SelectTree,
      UserSelect,
      TestFormLeaveForm
    },
    activated () {
      this.refreshList()
    },
    methods: {
      // 获取数据列表
      refreshList () {
        this.loading = true
        testFormLeaveService.list({
          'current': this.tablePage.currentPage,
          'size': this.tablePage.pageSize,
          'orders': this.tablePage.orders,
          beginBeginDate: this.searchForm.beginDate[0],
          endBeginDate: this.searchForm.beginDate[1],
          ...this.lodash.omit(this.searchForm, 'beginDate')
        }).then(({data}) => {
          this.dataList = data.records
          this.tablePage.total = data.total
          this.loading = false
        })
      },
      // 当前页
      currentChangeHandle ({ currentPage, pageSize }) {
        this.tablePage.currentPage = currentPage
        this.tablePage.pageSize = pageSize
        this.refreshList()
      },
      // 排序
      sortChangeHandle (obj) {
        this.tablePage.orders = []
        if (obj.order != null) {
          this.tablePage.orders = [{ column: obj.column.sortBy || this.$utils.toLine(obj.property), asc: obj.order === 'asc' }]
        } else {
          this.tablePage.orders = [{ column: 'a.create_date', asc: false }]
        }
        this.refreshList()
      },
      // 新增
      add () {
        this.$refs.testFormLeaveForm.init('add', '')
      },
      // 修改
      edit (id) {
        id = id || this.$refs.testFormLeaveTable.getCheckboxRecords().map(item => {
          return item.id
        })[0]
        this.$refs.testFormLeaveForm.init('edit', id)
      },
      // 查看
      view (id) {
        this.$refs.testFormLeaveForm.init('view', id)
      },
      // 删除
      del (id) {
        let ids = id || this.$refs.testFormLeaveTable.getCheckboxRecords().map(item => {
          return item.id
        }).join(',')
        this.$confirm(`确定删除所选项吗?`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.loading = true
          testFormLeaveService.delete(ids).then(({data}) => {
            this.$message.success(data)
            this.refreshList()
            this.loading = false
          })
        })
      },
      // 下载模板
      downloadTpl () {
        this.loading = true
        testFormLeaveService.exportTemplate().then(({data}) => {
    // 将二进制流文件写入excel表，以下为重要步骤
          this.$utils.downloadExcel(data, '请假表单导入模板')
          this.loading = false
        }).catch(function (err) {
          this.loading = false
          if (err.response) {
            console.log(err.response)
          }
        })
      },
      // 自定义服务端导入
      importMethod ({ file }) {
      // 处理表单
        const formBody = new FormData()
        formBody.append('file', file)
        this.loading = true
        testFormLeaveService.importExcel(formBody).then(({data}) => {
          this.$message.success({
            dangerouslyUseHTMLString: true,
            message: data
          })
          this.refreshList()
        })
      },
      // 自定义服务端导出
      exportMethod ({ options }) {
      // 传给服务端的参数
        const params = {
          current: this.tablePage.currentPage,
          size: this.tablePage.pageSize,
          orders: this.tablePage.orders,
          ...this.searchForm,
          filename: options.filename,
          sheetName: options.sheetName,
          isHeader: options.isHeader,
          original: options.original,
          mode: options.mode,
          selectIds: options.mode === 'selected' ? options.data.map((item) => item.id) : [],
          exportFields: options.columns.map((column) => column.property && column.property.split('.')[0])
        }
        this.loading = true
        return testFormLeaveService.exportExcel(params).then(({data}) => {
      // 将二进制流文件写入excel表，以下为重要步骤
          this.$utils.downloadExcel(data, options.filename)
          this.loading = false
        }).catch(function (err) {
          if (err.response) {
            console.log(err.response)
          }
        })
      },
      resetSearch () {
        this.$refs.searchForm.resetFields()
        this.refreshList()
      }
    }
  }
</script>

