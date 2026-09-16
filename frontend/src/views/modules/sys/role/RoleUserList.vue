<template>
  <div class="ultra-theme ultra-table-page">
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
      <vxe-toolbar :refresh="{ query: refreshList }" custom>
        <template #buttons>
          <el-button v-if="hasPermission('sys:role:assign')" type="primary" size="small" icon="el-icon-plus"
            @click="add()">添加用户</el-button>
        </template>
      </vxe-toolbar>
      <div class="ultra-table-stage">
        <vxe-table border="inner" auto-resize resizable height="100%" :loading="loading" size="small" ref="roleTable"
          show-header-overflow show-overflow highlight-hover-row :menu-config="{}" :print-config="{}" :import-config="{}"
          :export-config="{}" @sort-change="sortChangeHandle" :sort-config="{ remote: true }" :data="dataList"
          :checkbox-config="{}">
          <vxe-column type="seq" width="50"></vxe-column>
          <vxe-column type="checkbox" width="60px"></vxe-column>
          <vxe-column title="头像" field="photo">
            <template slot-scope="scope">
              <img :src="scope.row.photo === '' ? '/static/img/avatar.png' : scope.row.photo" style="height:35px" />
            </template>
          </vxe-column>
          <vxe-column title="登录名" field="loginName" sortable></vxe-column>
          <vxe-column title="用户名" field="name" sortable></vxe-column>
          <vxe-column title="所属机构" field="companyDTO.name" sort-by="c.name" sortable></vxe-column>
          <vxe-column title="所属部门" field="officeDTO.name" sort-by="o.name" sortable></vxe-column>
          <vxe-column title="操作" width="120px" fixed="right" align="center">
            <template slot-scope="scope">
              <el-button v-if="hasPermission('sys:role:assign')" type="text" size="small" @click="del(scope.row.id)">
                移除
              </el-button>
            </template>
          </vxe-column>
        </vxe-table>
      </div>
      <vxe-pager background size="small" :current-page="tablePage.currentPage" :page-size="tablePage.pageSize"
        :total="tablePage.total" :page-sizes="[10, 20, 100, 1000, { label: '全量数据', value: 1000000 }]"
        :layouts="['PrevPage', 'JumpNumber', 'NextPage', 'FullJump', 'Sizes', 'Total']"
        @page-change="currentChangeHandle">
      </vxe-pager>
      <user-select ref="userSelect" @doSubmit="selectUsersToRole"></user-select>
    </div>
  </div>
</template>

<script>
import UserSelect from '@/components/userSelect/UserSelectDialog'
import roleService from '@/api/sys/roleService'
import UserService from '@/api/sys/userService'

export default {
  data () {
    return {
      searchForm: {
        loginName: '',
        name: ''
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
    UserSelect
  },
  props: ['roleUserTitle', 'roleId'],
  activated () {
    this.refreshList()
  },
  methods: {

    // 获取数据列表
    refreshList () {
      this.loading = true
      roleService.assign({
        'current': this.tablePage.currentPage,
        'size': this.tablePage.pageSize,
        'orders': this.tablePage.orders,
        'roleDTO.id': this.roleId,
        ...this.searchForm
      }).then(({ data }) => {
        this.dataList = data.records
        this.tablePage.total = data.total
        this.tablePage.currentPage = data.current
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
        this.tablePage.orders.push({
          column: obj.column.sortBy || this.$utils.toLine(obj.property),
          asc: obj.order === 'asc'
        })
      } else {
        this.tablePage.orders = [{ column: 'a.create_date', asc: false }]
      }
      this.refreshList()
    },
    // 新增
    add () {
      this.$refs.userSelect.init()
    },

    // 删除
    del (id) {
      this.$confirm(`确认把用户从角色中移除吗?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        UserService.queryById(id).then(({ data }) => {
          if (data.roleIdList.length === 1) {
            this.$confirm(`这已经是该用户的唯一角色，确认把用户从角色中移除吗?`, '提示', {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning'
            }).then(() => {
              roleService.removeUserFromRole(id, this.roleId).then(({ data }) => {
                this.$message.success({
                  dangerouslyUseHTMLString: true,
                  message: data
                })
                this.refreshList()
              })
            })
          } else {
            roleService.removeUserFromRole(id, this.roleId).then(({ data }) => {
              this.$message.success({
                dangerouslyUseHTMLString: true,
                message: data
              })
              this.refreshList()
            })
          }
        })
      })
    },
    closeRight () {
      this.$emit('closeRight')
    },
    resetSearch () {
      this.$refs.searchForm.resetFields()
      this.refreshList()
    },
    selectUsersToRole (users) {
      let userIds = users.map(user => { return user.id }).join(',')
      this.loading = true
      roleService.addUserToRole(this.roleId, userIds).then(({ data }) => {
        this.loading = false
        this.$message.success({
          dangerouslyUseHTMLString: true,
          message: data
        })
        this.refreshList()
      })
    }
  }
}
</script>
<style scoped>
.el-button,.vxe-toolbar .vxe-custom--wrapper,.vxe-custom--wrapper {
  margin-right: 10px !important;
}
</style>
