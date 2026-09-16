<template>
    <div class="page">
      <el-form size="small" :inline="true" class="query-form" ref="searchForm" :model="searchForm" @keyup.enter.native="refreshList()" @submit.native.prevent>
            <!-- 搜索框-->
         <el-form-item prop="experimentName">
                <el-input size="small" v-model="searchForm.experimentName" placeholder="实验方案名称" clearable></el-input>
         </el-form-item>
         <el-form-item prop="courseName">
                <el-input size="small" v-model="searchForm.courseName" placeholder="课程名称" clearable></el-input>
         </el-form-item>
         <el-form-item prop="majorName">
                <el-input size="small" v-model="searchForm.majorName" placeholder="专业名称" clearable></el-input>
         </el-form-item>
         <el-form-item prop="experimentType">
                <el-input size="small" v-model="searchForm.experimentType" placeholder="实验类型" clearable></el-input>
         </el-form-item>
         <el-form-item prop="scenarioName">
                <el-input size="small" v-model="searchForm.scenarioName" placeholder="实验应用场景" clearable></el-input>
         </el-form-item>
         <el-form-item prop="classHours">
                <el-input size="small" v-model="searchForm.classHours" placeholder="实验所需课时" clearable></el-input>
         </el-form-item>
         <el-form-item prop="goalText">
                <el-input size="small" v-model="searchForm.goalText" placeholder="实验目标" clearable></el-input>
         </el-form-item>
         <el-form-item prop="selectedDevicesJson">
                <el-input size="small" v-model="searchForm.selectedDevicesJson" placeholder="已选择的设备清单" clearable></el-input>
         </el-form-item>
         <el-form-item prop="contentSourceId">
                <el-input size="small" v-model="searchForm.contentSourceId" placeholder="内容引用来源" clearable></el-input>
         </el-form-item>
         <el-form-item prop="contentSourceType">
                <el-input size="small" v-model="searchForm.contentSourceType" placeholder="来源类型标识" clearable></el-input>
         </el-form-item>
         <el-form-item prop="contentText">
                <el-input size="small" v-model="searchForm.contentText" placeholder="实验内容正文" clearable></el-input>
         </el-form-item>
         <el-form-item prop="algorithmType">
                <el-input size="small" v-model="searchForm.algorithmType" placeholder="评分或推荐算法类型" clearable></el-input>
         </el-form-item>
         <el-form-item prop="deviceScore">
                <el-input size="small" v-model="searchForm.deviceScore" placeholder="设备部分评分" clearable></el-input>
         </el-form-item>
         <el-form-item prop="contentScore">
                <el-input size="small" v-model="searchForm.contentScore" placeholder="内容部分评分" clearable></el-input>
         </el-form-item>
         <el-form-item prop="finalScore">
                <el-input size="small" v-model="searchForm.finalScore" placeholder="综合评分" clearable></el-input>
         </el-form-item>
         <el-form-item prop="status">
                <el-input size="small" v-model="searchForm.status" placeholder="状态" clearable></el-input>
         </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="refreshList()" size="small" icon="el-icon-search">查询</el-button>
            <el-button @click="resetSearch()" size="small" icon="el-icon-refresh-right">重置</el-button>
          </el-form-item>
      </el-form>

     <div class="bg-white top">
        <vxe-toolbar :refresh="{query: refreshList}" import export print custom>
          <template #buttons>
            <el-button v-if="hasPermission('dexperimentdesign:dExperimentDesign:add')" type="primary" size="small" icon="el-icon-plus" @click="add()">新建</el-button>
            <el-button v-if="hasPermission('dexperimentdesign:dExperimentDesign:edit')" type="warning" size="small" icon="el-icon-edit-outline" @click="edit()" :disabled="$refs.dExperimentDesignTable && $refs.dExperimentDesignTable.getCheckboxRecords().length !== 1" plain>修改</el-button>
            <el-button v-if="hasPermission('dexperimentdesign:dExperimentDesign:del')" type="danger"   size="small" icon="el-icon-delete" @click="del()" :disabled="$refs.dExperimentDesignTable && $refs.dExperimentDesignTable.getCheckboxRecords().length === 0" plain>删除</el-button>
          </template>
          <template #tools>
            <vxe-button
    		  type="default"
    		  title="下载导入模板"
    		  v-if="hasPermission('dexperimentdesign:dExperimentDesign:import')"
    		  class="el-icon-document m-r-12"
    		  @click="downloadTpl()"
    		  circle
            >
            </vxe-button>
          </template>
        </vxe-toolbar>
        <div style="height: calc(100% - 80px);">
        <vxe-table
            border="inner"
            auto-resize
            resizable
            height="auto"
            :loading="loading"
            size="small"
            ref="dExperimentDesignTable"
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
                filename: `实验设计管理数据${moment(new Date()).format(
            		'YYYY-MM-DD'
                )}`,
                sheetName: '实验设计管理数据',
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
        field="experimentName"
        sortable
        title="实验方案名称">
            <template slot-scope="scope">
              <el-link  type="primary" :underline="false" v-if="hasPermission('dexperimentdesign:dExperimentDesign:edit')" @click="edit(scope.row.id)">{{scope.row.experimentName}}</el-link>
              <el-link  type="primary" :underline="false" v-else-if="hasPermission('dexperimentdesign:dExperimentDesign:view')"  @click="view(scope.row.id)">{{scope.row.experimentName}}</el-link>
              <span v-else>{{scope.row.experimentName}}</span>
            </template>
      </vxe-column>
    <vxe-column
        field="courseName"
        sortable
        title="课程名称">
      </vxe-column>
    <vxe-column
        field="majorName"
        sortable
        title="专业名称">
      </vxe-column>
    <vxe-column
        field="experimentType"
        sortable
        title="实验类型">
      </vxe-column>
    <vxe-column
        field="scenarioName"
        sortable
        title="实验应用场景">
      </vxe-column>
    <vxe-column
        field="classHours"
        sortable
        title="实验所需课时">
      </vxe-column>
    <vxe-column
        field="goalText"
        sortable
        title="实验目标">
      </vxe-column>
    <vxe-column
        field="selectedDevicesJson"
        sortable
        title="已选择的设备清单">
      </vxe-column>
    <vxe-column
        field="contentSourceId"
        sortable
        title="内容引用来源">
      </vxe-column>
    <vxe-column
        field="contentSourceType"
        sortable
        title="来源类型标识">
      </vxe-column>
    <vxe-column
        field="contentText"
        sortable
        title="实验内容正文">
      </vxe-column>
    <vxe-column
        field="algorithmType"
        sortable
        title="评分或推荐算法类型">
      </vxe-column>
    <vxe-column
        field="deviceScore"
        sortable
        title="设备部分评分">
      </vxe-column>
    <vxe-column
        field="contentScore"
        sortable
        title="内容部分评分">
      </vxe-column>
    <vxe-column
        field="finalScore"
        sortable
        title="综合评分">
      </vxe-column>
    <vxe-column
        field="status"
        sortable
        title="状态">
      </vxe-column>
      <vxe-column
        fixed="right"
        align="center"
        width="200"
        title="操作">
        <template  slot-scope="scope">
          <el-button v-if="hasPermission('dexperimentdesign:dExperimentDesign:view')" type="text" icon="el-icon-view" size="small" @click="view(scope.row.id)">查看</el-button>
          <el-button v-if="hasPermission('dexperimentdesign:dExperimentDesign:edit')" type="text" icon="el-icon-edit" size="small" @click="edit(scope.row.id)">修改</el-button>
          <el-button v-if="hasPermission('dexperimentdesign:dExperimentDesign:del')" type="text"  icon="el-icon-delete" size="small" @click="del(scope.row.id)">删除</el-button>
        </template>
      </vxe-column>
    </vxe-table>
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
    </div>
        <!-- 弹窗, 新增 / 修改 -->
    <DExperimentDesignForm  ref="dExperimentDesignForm" @refreshDataList="refreshList"></DExperimentDesignForm>
  </div>
</template>

<script>
  import DExperimentDesignForm from './DExperimentDesignForm'
  import dExperimentDesignService from '@/api/dexperimentdesign/dExperimentDesignService'
  export default {
    data () {
      return {
        searchForm: {
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
      DExperimentDesignForm
    },
    activated () {
      this.refreshList()
    },
    methods: {
      // 获取数据列表
      refreshList () {
        this.loading = true
        dExperimentDesignService.list({
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
        this.$refs.dExperimentDesignForm.init('add', '')
      },
      // 修改
      edit (id) {
        id = id || this.$refs.dExperimentDesignTable.getCheckboxRecords().map(item => {
          return item.id
        })[0]
        this.$refs.dExperimentDesignForm.init('edit', id)
      },
      // 查看
      view (id) {
        this.$refs.dExperimentDesignForm.init('view', id)
      },
      // 删除
      del (id) {
        let ids = id || this.$refs.dExperimentDesignTable.getCheckboxRecords().map(item => {
          return item.id
        }).join(',')
        this.$confirm(`确定删除所选项吗?`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.loading = true
          dExperimentDesignService.delete(ids).then(({data}) => {
            this.$message.success(data)
            this.refreshList()
            this.loading = false
          })
        })
      },
      // 下载模板
      downloadTpl () {
        this.loading = true
        dExperimentDesignService.exportTemplate().then(({data}) => {
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
        dExperimentDesignService.importExcel(formBody).then(({data}) => {
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
        return dExperimentDesignService.exportExcel(params).then(({data}) => {
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

