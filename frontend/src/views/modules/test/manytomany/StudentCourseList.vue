<template>
    <div class="ultra-theme ultra-table-page">
      <el-form size="small" :inline="true" class="ultra-query-form" ref="searchForm" :model="searchForm" @keyup.enter.native="refreshList()" @submit.native.prevent>
            <!-- 搜索框-->
         <el-form-item prop="student.id">
            <GridSelect
                    title="选择学生"
                    placeholder="请选择学生"
                    labelName = 'name'
                    labelValue = 'id'
                    :value = "searchForm.student.id"
                    :limit="1"
                    size="small"
                    @getValue='(value) => {searchForm.student.id=value}'
                    :columns="[
                    {
                      prop: 'name',
                      label: '姓名'
                    }
                    ]"
                    :searchs="[
                    {
                      prop: 'name',
                      label: '姓名'
                    }
                    ]"
                    dataListUrl="/test/manytomany/student/list"
                    queryEntityUrl="/test/manytomany/student/queryById">
                  </GridSelect>
         </el-form-item>
         <el-form-item prop="course.id">
            <GridSelect
                    title="选择课程"
                    placeholder="请选择课程"
                    labelName = 'name'
                    labelValue = 'id'
                    :value = "searchForm.course.id"
                    :limit="1"
                    size="small"
                    @getValue='(value) => {searchForm.course.id=value}'
                    :columns="[
                    {
                      prop: 'name',
                      label: '课程名'
                    }
                    ]"
                    :searchs="[
                    {
                      prop: 'name',
                      label: '课程名'
                    }
                    ]"
                    dataListUrl="/test/manytomany/course/list"
                    queryEntityUrl="/test/manytomany/course/queryById">
                  </GridSelect>
         </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="refreshList()" size="small" icon="el-icon-search">查询</el-button>
            <el-button @click="resetSearch()" size="small" icon="el-icon-refresh-right">重置</el-button>
          </el-form-item>
      </el-form>

     <div class="ultra-table-panel">
        <vxe-toolbar :refresh="{query: refreshList}" import export print custom>
          <template #buttons>
            <el-button v-if="hasPermission('test:manytomany:studentCourse:add')" type="primary" size="small" icon="el-icon-plus" @click="add()">新建</el-button>
            <el-button v-if="hasPermission('test:manytomany:studentCourse:edit')" type="warning" size="small" icon="el-icon-edit-outline" @click="edit()" :disabled="$refs.studentCourseTable && $refs.studentCourseTable.getCheckboxRecords().length !== 1" plain>修改</el-button>
            <el-button v-if="hasPermission('test:manytomany:studentCourse:del')" type="danger"   size="small" icon="el-icon-delete" @click="del()" :disabled="$refs.studentCourseTable && $refs.studentCourseTable.getCheckboxRecords().length === 0" plain>删除</el-button>
          </template>
          <template #tools>
            <vxe-button
    		  type="default"
    		  title="下载导入模板"
    		  v-if="hasPermission('test:manytomany:studentCourse:import')"
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
            ref="studentCourseTable"
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
                filename: `学生课程记录数据${moment(new Date()).format(
            		'YYYY-MM-DD'
                )}`,
                sheetName: '学生课程记录数据',
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
        field="student.name"
        sortable
        title="学生">
            <template slot-scope="scope">
              <el-link  type="primary" :underline="false" v-if="hasPermission('test:manytomany:studentCourse:edit')" @click="edit(scope.row.id)">{{scope.row.student && scope.row.student.name}}</el-link>
              <el-link  type="primary" :underline="false" v-else-if="hasPermission('test:manytomany:studentCourse:view')"  @click="view(scope.row.id)">{{scope.row.student &&  scope.row.student.name}}</el-link>
              <span v-else>{{scope.row.student && scope.row.student.name}}</span>
            </template>
      </vxe-column>
      <vxe-column
        field="course.name"
        sortable
        title="课程">
            <template slot-scope="scope">
                {{scope.row.course && scope.row.course.name}}
            </template>
      </vxe-column>
    <vxe-column
        field="score"
        sortable
        title="分数">
      </vxe-column>
    <vxe-column
        field="remarks"
        sortable
        title="备注信息">
      </vxe-column>
      <vxe-column
        fixed="right"
        align="center"
        width="200"
        title="操作">
        <template  slot-scope="scope">
          <el-button v-if="hasPermission('test:manytomany:studentCourse:view')" type="text" icon="el-icon-view" size="small" @click="view(scope.row.id)">查看</el-button>
          <el-button v-if="hasPermission('test:manytomany:studentCourse:edit')" type="text" icon="el-icon-edit" size="small" @click="edit(scope.row.id)">修改</el-button>
          <el-button v-if="hasPermission('test:manytomany:studentCourse:del')" type="text"  icon="el-icon-delete" size="small" @click="del(scope.row.id)">删除</el-button>
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
    <StudentCourseForm  ref="studentCourseForm" @refreshDataList="refreshList"></StudentCourseForm>
  </div>
</template>

<script>
  import StudentCourseForm from './StudentCourseForm'
  import studentCourseService from '@/api/test/manytomany/studentCourseService'
  import GridSelect from '@/components/gridSelect'
  export default {
    data () {
      return {
        searchForm: {
          student: {
            id: ''
          },
          course: {
            id: ''
          }
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
      GridSelect,
      StudentCourseForm
    },
    activated () {
      this.refreshList()
    },
    methods: {
      // 获取数据列表
      refreshList () {
        this.loading = true
        studentCourseService.list({
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
          this.tablePage.orders = [{ column: 'a.create_date', asc: false }]
        }
        this.refreshList()
      },
      // 新增
      add () {
        this.$refs.studentCourseForm.init('add', '')
      },
      // 修改
      edit (id) {
        id = id || this.$refs.studentCourseTable.getCheckboxRecords().map(item => {
          return item.id
        })[0]
        this.$refs.studentCourseForm.init('edit', id)
      },
      // 查看
      view (id) {
        this.$refs.studentCourseForm.init('view', id)
      },
      // 删除
      del (id) {
        let ids = id || this.$refs.studentCourseTable.getCheckboxRecords().map(item => {
          return item.id
        }).join(',')
        this.$confirm(`确定删除所选项吗?`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.loading = true
          studentCourseService.delete(ids).then(({data}) => {
            this.$message.success(data)
            this.refreshList()
            this.loading = false
          })
        })
      },
      // 下载模板
      downloadTpl () {
        this.loading = true
        studentCourseService.exportTemplate().then(({data}) => {
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
        studentCourseService.importExcel(formBody).then(({data}) => {
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
        return studentCourseService.exportExcel(params).then(({data}) => {
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

