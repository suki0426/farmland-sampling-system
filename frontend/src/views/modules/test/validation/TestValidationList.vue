<template>
    <div class="ultra-theme ultra-table-page">
      <el-form size="small" :inline="true" class="ultra-query-form" ref="searchForm" :model="searchForm" @keyup.enter.native="refreshList()" @submit.native.prevent>
            <!-- 搜索框-->
         <el-form-item prop="num">
                <el-input size="small" v-model="searchForm.num" placeholder="浮点数字" clearable></el-input>
         </el-form-item>
         <el-form-item prop="num2">
                <el-input size="small" v-model="searchForm.num2" placeholder="整数" clearable></el-input>
         </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="refreshList()" size="small" icon="el-icon-search">查询</el-button>
            <el-button @click="resetSearch()" size="small" icon="el-icon-refresh-right">重置</el-button>
          </el-form-item>
      </el-form>

     <div class="ultra-table-panel">
        <vxe-toolbar :refresh="{query: refreshList}" import export print custom>
          <template #buttons>
            <el-button v-if="hasPermission('test:validation:testValidation:add')" type="primary" size="small" icon="el-icon-plus" @click="add()">新建</el-button>
            <el-button v-if="hasPermission('test:validation:testValidation:edit')" type="warning" size="small" icon="el-icon-edit-outline" @click="edit()" :disabled="$refs.testValidationTable && $refs.testValidationTable.getCheckboxRecords().length !== 1" plain>修改</el-button>
            <el-button v-if="hasPermission('test:validation:testValidation:del')" type="danger"   size="small" icon="el-icon-delete" @click="del()" :disabled="$refs.testValidationTable && $refs.testValidationTable.getCheckboxRecords().length === 0" plain>删除</el-button>
          </template>
          <template #tools>
            <vxe-button
    		  type="default"
    		  title="下载导入模板"
    		  v-if="hasPermission('test:validation:testValidation:import')"
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
            ref="testValidationTable"
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
                filename: `测试校验数据${moment(new Date()).format(
            		'YYYY-MM-DD'
                )}`,
                sheetName: '测试校验数据',
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
        field="num"
        sortable
        title="浮点数字">
            <template slot-scope="scope">
              <el-link  type="primary" :underline="false" v-if="hasPermission('test:validation:testValidation:edit')" @click="edit(scope.row.id)">{{scope.row.num}}</el-link>
              <el-link  type="primary" :underline="false" v-else-if="hasPermission('test:validation:testValidation:view')"  @click="view(scope.row.id)">{{scope.row.num}}</el-link>
              <span v-else>{{scope.row.num}}</span>
            </template>
      </vxe-column>
    <vxe-column
        field="num2"
        sortable
        title="整数">
      </vxe-column>
    <vxe-column
        field="str"
        sortable
        title="字符串">
      </vxe-column>
    <vxe-column
        field="email"
        sortable
        title="邮件">
      </vxe-column>
    <vxe-column
        field="url"
        sortable
        title="网址">
      </vxe-column>
    <vxe-column
        field="newDate"
        sortable
        title="日期">
      </vxe-column>
    <vxe-column
        field="remarks"
        sortable
        title="备注信息">
      </vxe-column>
    <vxe-column
        field="c1"
        sortable
        title="浮点数小于等于0">
      </vxe-column>
    <vxe-column
        field="c2"
        sortable
        title="身份证号码">
      </vxe-column>
    <vxe-column
        field="c3"
        sortable
        title="QQ号码">
      </vxe-column>
    <vxe-column
        field="c4"
        sortable
        title="手机号码">
      </vxe-column>
    <vxe-column
        field="c5"
        sortable
        title="中英文数字下划线">
      </vxe-column>
    <vxe-column
        field="c6"
        sortable
        title="合法字符(a-z A-Z 0-9)">
      </vxe-column>
    <vxe-column
        field="en"
        sortable
        title="英语">
      </vxe-column>
    <vxe-column
        field="zn"
        sortable
        title="汉字">
      </vxe-column>
    <vxe-column
        field="enzn"
        sortable
        title="汉英字符">
      </vxe-column>
      <vxe-column
        fixed="right"
        align="center"
        width="200"
        title="操作">
        <template  slot-scope="scope">
          <el-button v-if="hasPermission('test:validation:testValidation:view')" type="text" icon="el-icon-view" size="small" @click="view(scope.row.id)">查看</el-button>
          <el-button v-if="hasPermission('test:validation:testValidation:edit')" type="text" icon="el-icon-edit" size="small" @click="edit(scope.row.id)">修改</el-button>
          <el-button v-if="hasPermission('test:validation:testValidation:del')" type="text"  icon="el-icon-delete" size="small" @click="del(scope.row.id)">删除</el-button>
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
    <TestValidationForm  ref="testValidationForm" @refreshDataList="refreshList"></TestValidationForm>
  </div>
</template>

<script>
  import TestValidationForm from './TestValidationForm'
  import testValidationService from '@/api/test/validation/testValidationService'
  export default {
    data () {
      return {
        searchForm: {
          num: '',
          num2: ''
        },
        dataList: [],
        tablePage: {
          total: 0,
          currentPage: 1,
          pageSize: 10,
          orders: [{ column: 'create_date', asc: false }]
        },
        loading: false
      }
    },
    components: {
      TestValidationForm
    },
    activated () {
      this.refreshList()
    },
    methods: {
      // 获取数据列表
      refreshList () {
        this.loading = true
        testValidationService.list({
          'current': this.tablePage.currentPage,
          'size': this.tablePage.pageSize,
          'orders': this.tablePage.orders,
          ...this.searchForm
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
          this.tablePage.orders = [{ column: 'create_date', asc: false }]
        }
        this.refreshList()
      },
      // 新增
      add () {
        this.$refs.testValidationForm.init('add', '')
      },
      // 修改
      edit (id) {
        id = id || this.$refs.testValidationTable.getCheckboxRecords().map(item => {
          return item.id
        })[0]
        this.$refs.testValidationForm.init('edit', id)
      },
      // 查看
      view (id) {
        this.$refs.testValidationForm.init('view', id)
      },
      // 删除
      del (id) {
        let ids = id || this.$refs.testValidationTable.getCheckboxRecords().map(item => {
          return item.id
        }).join(',')
        this.$confirm(`确定删除所选项吗?`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.loading = true
          testValidationService.delete(ids).then(({data}) => {
            this.$message.success(data)
            this.refreshList()
            this.loading = false
          })
        })
      },
      // 下载模板
      downloadTpl () {
        this.loading = true
        testValidationService.exportTemplate().then(({data}) => {
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
        testValidationService.importExcel(formBody).then(({data}) => {
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
        return testValidationService.exportExcel(params).then(({data}) => {
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

