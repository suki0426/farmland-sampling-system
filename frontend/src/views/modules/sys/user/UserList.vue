<template>
  <div class="jp-common-layout ultra-theme ultra-table-page">
    <div class="jp-common-layout-left">
      <div class="jp-common-title">
        <el-input placeholder="组织机构:请输入关键字过滤" size="small" clearable v-model="filterText">
        </el-input>
      </div>
      <div class="jp-common-el-tree-scrollbar el-scrollbar">
        <div class="el-scrollbar__wrap">
          <div class="el-scrollbar__view">
            <el-tree class="filter-tree jp-common-el-tree" :render-content="renderContent" :data="officeTreeData" :props="{
              value: 'id',             // ID字段名
              label: 'name',         // 显示名称
              children: 'children'    // 子级字段名
            }" node-key="id" default-expand-all :filter-node-method="filterNode" :expand-on-click-node="false"
              highlight-current @node-click="handleNodeClick" ref="officeTree">
            </el-tree>
          </div>
        </div>
      </div>
    </div>
    <div class="jp-common-layout-center jp-flex-main">
      <el-form size="small" :inline="true" class="ultra-query-form" ref="searchForm" :model="searchForm"
        @keyup.enter.native="refreshList()" @submit.native.prevent>
        <el-form-item prop="loginName">
          <el-input size="small" v-model="searchForm.loginName" placeholder="登录名" clearable></el-input>
        </el-form-item>
        <el-form-item prop="name">
          <el-input size="small" v-model="searchForm.name" placeholder="姓名" clearable></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="refreshList()" size="small" icon="el-icon-search">查询</el-button>
          <el-button @click="resetSearch()" size="small" icon="el-icon-refresh-right">重置</el-button>
        </el-form-item>
      </el-form>
      <div class="ultra-table-panel">
        <vxe-toolbar :refresh="{ query: refreshList }" import export print resizable custom>
          <template #buttons>
            <el-button v-if="hasPermission('sys:user:add')" type="primary" size="small" icon="el-icon-plus"
              @click="add()">新建</el-button>
            <el-button v-if="hasPermission('sys:user:edit')" type="warning" size="small" icon="el-icon-edit-outline"
              @click="edit()" :disabled="$refs.userTable && $refs.userTable.getCheckboxRecords().length !== 1"
              plain>修改</el-button>
            <el-button v-if="hasPermission('sys:user:del')" type="danger" size="small" icon="el-icon-delete"
              @click="del()" :disabled="$refs.userTable && $refs.userTable.getCheckboxRecords().length === 0"
              plain>删除</el-button>
            <el-button v-if="hasPermission('sys:user:import')" type="default" @click="downloadTpl()"
              size="small">下载模板</el-button>
            <el-button v-show="false" type="default" icon="el-icon-download" size="small" @click="synchronous">同步数据</el-button>
          </template>
        </vxe-toolbar>
        <div class="ultra-table-stage">
          <vxe-table border="inner" auto-resize resizable height="100%" :loading="loading" size="small" ref="userTable"
            show-header-overflow show-overflow highlight-hover-row :print-config="{}" :import-config="{
              importMethod: importMethod,
              types: ['csv', 'xls', 'xlsx'],
              remote: true
            }" :export-config="{
  remote: true,
  filename: `用户数据${moment(new Date()).format('YYYY-MM-DD')}`,
  sheetName: '用户数据',
  exportMethod: exportMethod,
  types: ['xlsx'],
  modes: ['current', 'selected', 'all']
}" @sort-change="sortChangeHandle" :sort-config="{ remote: true }" :data="dataList">
            <vxe-column type="seq" width="60"></vxe-column>
            <vxe-column type="checkbox" width="60px"></vxe-column>
            <vxe-column title="头像" field="photo">
              <template slot-scope="scope">
                <img :src="scope.row.photo === '' ? '/static/img/avatar.png' : scope.row.photo" style="height:35px" />
              </template>
            </vxe-column>
            <vxe-column title="登录名" field="loginName" sortable>
              <template slot-scope="scope">
                <el-link type="primary" :underline="false" v-if="hasPermission('sys:user:edit')"
                  @click="edit(scope.row.id)">{{ scope.row.loginName }}</el-link>
                <el-link type="primary" :underline="false" v-else-if="hasPermission('sys:user:view')"
                  @click="view(scope.row.id,)">{{ scope.row.loginName }}</el-link>
                <span v-else>{{ scope.row.loginName }}</span>
              </template>
            </vxe-column>

            <vxe-column title="姓名" field="name" sortable></vxe-column>
            <vxe-column title="公司" field="companyDTO.name" sort-by="c.name" sortable>
              <template slot-scope="scope">
                <el-tag>{{ scope.row.companyDTO && scope.row.companyDTO.name }}</el-tag>
              </template>
            </vxe-column>
            <vxe-column title="部门" field="officeDTO.name" sort-by="o.name" sortable>
              <template slot-scope="scope">
                <el-tag>{{ scope.row.officeDTO && scope.row.officeDTO.name }}</el-tag>
              </template>
            </vxe-column>
            <vxe-column title="状态" field="loginFlag" sortable>
              <template slot-scope="scope">
                <el-tag v-if="scope.row.loginFlag === '1'" size="small" type="success">正常</el-tag>
                <el-tag v-else-if="scope.row.loginFlag === '0'" size="small" type="danger">禁用</el-tag>
              </template>
            </vxe-column>
            <vxe-column title="操作" width="400px" fixed="right" align="center">
              <template slot-scope="scope">
                <el-button v-if="hasPermission('sys:user:view')" type="text" size="small" icon="el-icon-view"
                  @click="view(scope.row.id)">查看</el-button>
                <el-button v-if="hasPermission('sys:user:edit')" type="text" size="small" icon="el-icon-edit"
                  @click="edit(scope.row.id)">修改</el-button>
                <el-button v-if="hasPermission('sys:user:del')" type="text" size="small" icon="el-icon-delete"
                  @click="del(scope.row.id)">删除</el-button>
              </template>
            </vxe-column>
          </vxe-table>
        </div>
        <!-- 弹窗, 新增 / 修改 -->
        <user-form ref="userForm" @refreshDataList="refreshList"></user-form>
<vxe-pager background size="small" :current-page="tablePage.currentPage" :page-size="tablePage.pageSize"
            :total="tablePage.total" :page-sizes="[10, 20, 100, 1000, { label: '全量数据', value: 1000000 }]"
            :layouts="['PrevPage', 'JumpNumber', 'NextPage', 'FullJump', 'Sizes', 'Total']"
            @page-change="currentChangeHandle">
          </vxe-pager>
      </div>
    </div>
  </div>
</template>

<script>
import UserForm from './UserForm'
import userService from '@/api/sys/userService'
import officeService from '@/api/sys/officeService'

// import XEAjax from 'xe-ajax'
// import XEUtils from 'xe-utils'

export default {
  data () {
    return {
      searchForm: {
        loginName: '',
        name: '',
        companyDTO: {
          id: ''
        },
        officeDTO: {
          id: ''
        }
      },
      filterText: '',
      dataList: [],
      officeTreeData: [],
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
    UserForm
  },
  activated () {
    this.refreshTree()
    this.refreshList()
  },
  watch: {
    filterText (val) {
      this.$refs.officeTree.filter(val)
    }
  },
  methods: {
    // 同步数据
    synchronous () {
      this.$confirm('此操作将同步用户信息 在进行此操作前 请确保您已同步部门信息, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$http({
          url: `/school/schoolTeacher/update`,
          method: 'get'
        }).then(({ data }) => {
          this.$message.success(data)
        }).cache((e) => {
          this.$message.error(e)
        })
      })
    },
    filterNode (value, data) {
      if (!value) return true
      return data.name.indexOf(value) !== -1
    },
    renderContent (h, { node, data, store }) {
      return (
        <span class="custom-tree-node">
          {
            data.type === '1' ? <i class="fa fa-sitemap"></i> : <i class="fa fa-users"></i>
          }
          <span class="text">{node.label}</span>
        </span>
      )
    },
    // 获取数据列表
    refreshList () {
      this.loading = true
      userService.list({
        'current': this.tablePage.currentPage,
        'size': this.tablePage.pageSize,
        'orders': this.tablePage.orders,
        ...this.searchForm
      }).then(({ data }) => {
        this.dataList = data.records
        this.tablePage.total = data.total
        this.loading = false
      })
    },
    refreshTree () {
      officeService.treeData().then(({ data }) => {
        this.officeTreeData = data
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
        this.tablePage.orders = [
          {
            column: obj.column.sortBy || this.$utils.toLine(obj.property),
            asc: obj.order === 'asc'
          }
        ]
      } else {
        this.tablePage.orders = [{ column: 'a.create_date', asc: false }]
      }
      this.refreshList()
    },
    // 新增
    add () {
      this.$refs.userForm.init('add', '')
    },
    // 修改
    edit (id) {
      id = id || this.$refs.userTable.getCheckboxRecords().map(item => {
        return item.id
      })[0]
      this.$refs.userForm.init('edit', id)
    },
    // 查看
    view (id) {
      this.$refs.userForm.init('view', id)
    },
    // 删除
    del (id) {
      let ids = id || this.$refs.userTable.getCheckboxRecords().map(item => {
        return item.id
      }).join(',')
      this.$confirm(`确定删除所选项吗?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.loading = true
        userService.delete(ids).then(({ data }) => {
          this.loading = false
          this.$message.success({
            dangerouslyUseHTMLString: true,
            message: data
          })
          this.refreshList()
        }).catch(() => {
          this.loading = false
        })
      })
    },
    // 下载模板
    downloadTpl () {
      // this.$utils.downloadExcel('/sys/user/import/template')
      userService.exportTemplate().then(({ data }) => {
        // 将二进制流文件写入excel表，以下为重要步骤
        this.$utils.downloadExcel(data, '用户导入模板')
      }).catch(function (err) {
        if (err.response) {
          console.log(err.response)
        }
      })
    },
    handleNodeClick (data) {
      if (data.type === '1') {
        this.searchForm.companyDTO.id = data.id
        this.searchForm.officeDTO.id = ''
      } else {
        this.searchForm.companyDTO.id = ''
        this.searchForm.officeDTO.id = data.id
      }
      this.refreshList()
    },
    // 自定义服务端导入
    importMethod ({ file }) {
      // 处理表单
      const formBody = new FormData()
      formBody.append('file', file)
      userService.importExcel(formBody).then(({ data }) => {
        this.$message.success({ dangerouslyUseHTMLString: true, message: data })
      })
    },
    // 自定义服务端导出
    exportMethod ({ options }) {
      // 传给服务端的参数
      const params = {
        'current': this.tablePage.currentPage,
        'size': this.tablePage.pageSize,
        'orders': this.tablePage.orders,
        ...this.searchForm,
        filename: options.filename,
        sheetName: options.sheetName,
        isHeader: options.isHeader,
        original: options.original,
        mode: options.mode,
        selectIds: options.mode === 'selected' ? options.data.map(item => item.id) : [],
        exportFields: options.columns.map(column => column.property && column.property.split('.')[0])
      }
      return userService.exportExcel(params).then(({ data }) => {
        // 将二进制流文件写入excel表，以下为重要步骤
        this.$utils.downloadExcel(data, options.filename)
      }).catch(function (err) {
        if (err.response) {
          console.log(err.response)
        }
      })
    },
    resetSearch () {
      this.searchForm.companyDTO.id = ''
      this.searchForm.officeDTO.id = ''
      this.filterText = ''
      this.$refs.officeTree.setCurrentKey(null)
      this.$refs.searchForm.resetFields()
      this.refreshList()
    }
  }
}
</script>
<style lang="scss" scoped>
.el-card__body {
  overflow: auto;
}

.c--tooltip .el-button {
    padding: 0 0.2rem !important;
}
.jp-common-layout .jp-common-layout-left {
    margin-top: 5px;
}
</style>
