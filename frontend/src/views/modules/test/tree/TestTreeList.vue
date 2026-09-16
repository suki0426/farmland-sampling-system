<template>
    <div class="ultra-theme ultra-table-page">
      <el-form size="small" :inline="true" class="ultra-query-form" ref="searchForm" :model="searchForm" @keyup.enter.native="refreshList()" @submit.native.prevent>
            <!-- 搜索框-->
         <el-form-item prop="name">
                <el-input size="small" v-model="searchForm.name" placeholder="名称" clearable></el-input>
         </el-form-item>
         <el-form-item prop="remarks1">
                <el-input size="small" v-model="searchForm.remarks1" placeholder="备注信息" clearable></el-input>
         </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="refreshList()" size="small" icon="el-icon-search">查询</el-button>
            <el-button @click="resetSearch()" size="small" icon="el-icon-refresh-right">重置</el-button>
          </el-form-item>
      </el-form>
    <div class="ultra-table-panel">
    <vxe-toolbar :refresh="{query: refreshList}" export print custom>
      <template #buttons>
            <el-button v-if="hasPermission('test:tree:testTree:add')" type="primary" size="small" icon="el-icon-plus" @click="add()">新建</el-button>
            <el-button v-if="hasPermission('test:tree:testTree:edit')" type="warning" size="small" icon="el-icon-edit-outline" @click="edit()"
                 :disabled="$refs.testTreeTreeTable && $refs.testTreeTreeTable.getCheckboxRecords().length !== 1" plain>修改</el-button>
            <el-button v-if="hasPermission('test:tree:testTree:del')" type="danger"   size="small" icon="el-icon-delete" @click="del()"
                  :disabled="$refs.testTreeTreeTable && $refs.testTreeTreeTable.getCheckboxRecords().length === 0" plain>删除</el-button>
      </template>
    </vxe-toolbar>
    <div class="ultra-table-stage">
      <vxe-table
        resizable
        ref="testTreeTreeTable"
        border="inner"
        auto-resize
        height="100%"
        row-id="id"
        size="small"
        show-header-overflow
        show-overflow
        highlight-hover-row
        :print-config="{}"
        :export-config="{}"
        :tree-config="{}"
        :loading="loading"
        :checkbox-config="{checkStrictly: true}"
        :data="dataList">
      <vxe-table-column type="checkbox" width="40px"> </vxe-table-column>
    <vxe-table-column
        field="name"
        align="left"
        tree-node
        title="名称">
            <template slot-scope="scope">
              <el-link  type="primary" :underline="false" v-if="hasPermission('test:tree:testTree:edit')" @click="edit(scope.row.id)">{{scope.row.name}}</el-link>
              <el-link  type="primary" :underline="false" v-else-if="hasPermission('test:tree:testTree:view')"  @click="view(scope.row.id)">{{scope.row.name}}</el-link>
              <span v-else>{{scope.row.name}}</span>
            </template>
      </vxe-table-column>
    <vxe-table-column
        field="remarks1"
        title="备注信息">
      </vxe-table-column>
      <vxe-table-column title="操作" width="300px" fixed="right" align="center">
        <template  slot-scope="scope">
          <el-button v-if="hasPermission('test:tree:testTree:view')" type="text" size="small" icon="el-icon-view" @click="view(scope.row.id)">查看</el-button>
          <el-button v-if="hasPermission('test:tree:testTree:edit')" type="text" size="small" icon="el-icon-edit" @click="edit(scope.row.id)">修改</el-button>
          <el-button v-if="hasPermission('test:tree:testTree:del')" type="text" size="small" icon="el-icon-delete" @click="del(scope.row.id)">删除</el-button>
          <el-button v-if="hasPermission('test:tree:testTree:add')" type="text" size="small" icon="el-icon-circle-plus-outline" @click="addChild(scope.row.id, scope.row.name)">添加下级组织机构</el-button>
        </template>
      </vxe-table-column>
    </vxe-table>
    </div>
    </div>
        <!-- 弹窗, 新增 / 修改 -->
    <TestTreeForm  ref="testTreeForm" @refreshDataList="refreshList"></TestTreeForm>
  </div>
</template>

<script>
  import TestTreeForm from './TestTreeForm'
  import XEUtils from 'xe-utils'
  import testTreeService from '@/api/test/tree/testTreeService'
  export default {
    data () {
      return {
        searchForm: {
          name: '',
          remarks1: ''
        },
        dataList: [],
        loading: false
      }
    },
    components: {
      TestTreeForm
    },
    activated () {
      this.refreshList()
    },

    methods: {
      // 获取数据列表
      refreshList () {
        this.loading = true
        testTreeService.treeData().then(({data}) => {
          this.dataList = data
          this.handleSearch()
          this.loading = false
        })
      },
      handleSearch () {
        let options = { children: 'children' }
        let searchProps = ['name', 'remarks1']
        this.dataList = XEUtils.searchTree(this.dataList, item => searchProps.every(key => XEUtils.toValueString(this.searchForm[key]).trim() === '' || XEUtils.toValueString(item[key]).indexOf(this.searchForm[key]) > -1), options)
        this.$nextTick(() => {
          this.$refs.testTreeTreeTable.setAllTreeExpand(true)
        })
      },
      resetSearch () {
        this.$refs.searchForm.resetFields()
        this.refreshList()
      },
        // 新增下级
      addChild (id, name) {
        this.$refs.testTreeForm.init('addChild', {id: '', parent: {id: id, name: name}})
      },
       // 新增
      add () {
        this.$refs.testTreeForm.init('add', {id: '', parent: {id: '', name: ''}})
      },
      // 修改
      edit (id) {
        this.$refs.testTreeForm.init('edit', {id: id, parent: {id: '', name: ''}})
      },
      // 查看
      view (id) {
        this.$refs.testTreeForm.init('view', {id: id, parent: {id: '', name: ''}})
      },
      // 删除
      del (id) {
        let ids = id || this.$refs.testTreeTreeTable.getCheckboxRecords().map(item => {
          return item.id
        }).join(',')
        this.$confirm(`确定删除所选项吗?`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.loading = true
          this.testTreeService.delete(ids).then(({data}) => {
            this.$message.success(data)
            this.refreshList()
            this.loading = false
          })
        })
      }
    }
  }
</script>

