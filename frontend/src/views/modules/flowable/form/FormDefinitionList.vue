<template>
    <div class="jp-common-layout ultra-theme ultra-table-page">
      <div class="jp-common-layout-left">
        <div class="jp-common-title"> 
          <el-row :gutter="5">
            <el-col :span="20">
              <el-input
                placeholder="输入关键字进行过滤"
                size="small"
                v-model="filterText">
              </el-input>
            </el-col>
            <el-col :span="4">
                <el-button type="primary" @click="addTreeNode" size="small" icon="el-icon-plus" circle></el-button>
            </el-col>
          </el-row>
        </div>
      <div class="jp-common-el-tree-scrollbar el-scrollbar">
        <div class="el-scrollbar__wrap">
          <div class="el-scrollbar__view">
              <el-tree
                class="filter-tree"
                :data="formCategoryTreeData"
                :props="{
                      value: 'id',             // ID字段名
                      label: 'name',         // 显示名称
                      children: 'children'    // 子级字段名
                    }"
                default-expand-all
                :filter-node-method="filterNode"
                :expand-on-click-node="false"
                highlight-current
                node-key="id"
                @node-click="handleNodeClick"
                ref="formCategoryTree">
                  <span class="custom-tree-node" slot-scope="{ node, data}">
                    <span>{{ node.label }}</span>
                    <span>
                      <el-button type="text" class="tree-item-button" icon="el-icon-plus" @click="() => addChildTreeNode(data)">
                      </el-button>
                        <el-button type="text" class="tree-item-button" icon="el-icon-edit-outline" @click="() => editTreeNode(data)">
                      </el-button>
                        <el-button type="text" class="tree-item-button" icon="el-icon-delete" @click="() => delTreeNode(data)">
                      </el-button>
                    </span>
                  </span>
              </el-tree>
          </div>
        </div>
      </div>
    </div>
    <div class="jp-common-layout-center jp-flex-main">
      <el-form size="small" :inline="true"  class="ultra-query-form" ref="searchForm" :model="searchForm" @keyup.enter.native="refreshList()" @submit.native.prevent>
            <!-- 搜索框-->
		     <el-form-item prop="category.id">
		          <SelectTree
                      ref="category"
                      :props="{
                          value: 'id',             // ID字段名
                          label: 'name',         // 显示名称
                          children: 'children'    // 子级字段名
                        }"
                      size="small"
                      url="/extension/formCategory/treeData"
                      :value="searchForm.category.id"
                      :clearable="true"
                      :accordion="true"
                      @getValue="(value) => {searchForm.category.id=value}"/>
		     </el-form-item>
		     <el-form-item prop="name">
                <el-input size="small" v-model="searchForm.name" placeholder="表单名称" clearable></el-input>
		     </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="refreshList()" size="small" icon="el-icon-search">查询</el-button>
            <el-button @click="resetSearch()" size="small" icon="el-icon-refresh-right">重置</el-button>
          </el-form-item>
      </el-form>
      <div class="ultra-table-panel">
        <vxe-toolbar :refresh="{query: refreshList}" export print custom>
          <template #buttons>
            <el-button v-if="hasPermission('extension:formDefinition:add')" type="primary" size="small" icon="el-icon-plus" @click="add()">新建</el-button>
            <el-button v-if="hasPermission('extension:formDefinition:edit')" type="warning" size="small" icon="el-icon-edit-outline" @click="edit()" :disabled="$refs.formDefinitionTable && $refs.formDefinitionTable.getCheckboxRecords().length !== 1" plain>修改</el-button>
            <el-button v-if="hasPermission('extension:formDefinition:del')" type="danger"   size="small" icon="el-icon-delete" @click="del()" :disabled="$refs.formDefinitionTable && $refs.formDefinitionTable.getCheckboxRecords().length === 0" plain>删除</el-button>
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
            ref="formDefinitionTable"
            show-header-overflow
            show-overflow
            highlight-hover-row
            :menu-config="{}"
            :print-config="{}"
            :import-config="{}"
            :export-config="{}"
            @sort-change="sortChangeHandle"
            :sort-config="{remote:true}"
            :data="dataList"
            :checkbox-config="{}">
            <vxe-column type="seq" width="40"></vxe-column>
            <vxe-column type="checkbox"  width="40px"></vxe-column>
            <vxe-column  title="表单名称" field="name" sortable>
                <template slot-scope="scope">
                  <el-link  type="primary" :underline="false" v-if="hasPermission('extension:formDefinition:edit')" @click="edit(scope.row.id)">{{scope.row.name}}</el-link>
                  <el-link  type="primary" :underline="false" v-else-if="hasPermission('extension:formDefinition:view')"  @click="view(scope.row.id)">{{scope.row.name}}</el-link>
                  <span v-else>{{scope.row.name}}</span>
                </template>
            </vxe-column>
            <vxe-column  title="分类" field="category.name" sort-by="b.name" sortable> </vxe-column>
            <vxe-column  title="版本号" field="formDefinitionJson.version" sort-by="c.version" sortable> </vxe-column>
            <vxe-column  title="状态" field="formDefinitionJson.status" sort-by="c.status" sortable>
              <template slot-scope="scope">
                <el-tag v-if="scope.row.formDefinitionJson.status === '1'" size="small" type="success">已发布</el-tag>
                <el-tag v-else size="small" type="danger">未发布</el-tag>
              </template>
            </vxe-column>
            <vxe-column  title="是否主版本" field="formDefinitionJson.isPrimary" sort-by="c.is_primary" sortable>
                <template slot-scope="scope">
                  <el-tag v-if="scope.row.formDefinitionJson.isPrimary === '1'" size="small" type="success">主版本</el-tag>
                  <el-tag v-else size="small" type="danger">非主版本</el-tag>
                </template>
            </vxe-column>
            <vxe-column title="操作" width="300px" fixed="right" align="center">
              <template  slot-scope="scope">
                  <el-button v-if="hasPermission('extension:formDefinition:view')" type="text" icon="el-icon-view" size="small" @click="showDesignForm(scope.row.id, scope.row.formDefinitionJson.id)">设计</el-button>
                  <el-button v-if="hasPermission('extension:formDefinition:edit')" type="text" icon="el-icon-edit" size="small" @click="edit(scope.row.id)">修改</el-button>
                  <el-button v-if="hasPermission('extension:formDefinition:edit')" type="text" icon="el-icon-edit" size="small" @click="manage(scope.row.id)">版本管理</el-button>
                  <el-button v-if="hasPermission('extension:formDefinition:del')" type="text"  icon="el-icon-delete" size="small" @click="del(scope.row.id)">删除</el-button>
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
      <FormDefinitionForm  ref="formDefinitionForm" @showDesignForm="showDesignForm" @refreshDataList="refreshList"></FormDefinitionForm>
      <FormCategoryForm  ref="formCategoryForm"  @refreshTree="refreshTree"></FormCategoryForm>
      <DesignForm  ref="designForm" @refreshDataList="refreshList"></DesignForm>
      </div>
  </div>
</template>

<script>
  import FormDefinitionForm from './FormDefinitionForm'
  import FormCategoryForm from './FormCategoryForm'
  import DesignForm from './MakeFlowableForm'
  import SelectTree from '@/components/treeSelect/treeSelect.vue'
  import formCategoryService from '@/api/flowable/formCategoryService'
  import formDefinitionService from '@/api/flowable/formDefinitionService'
  export default {
    data () {
      return {
        searchForm: {
          category: {
            id: ''
          },
          name: ''
        },
        filterText: '',
        formCategoryTreeData: [],
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
      FormDefinitionForm,
      FormCategoryForm,
      DesignForm
    },
    activated () {
      this.refreshTree()
      this.refreshList()
    },
    watch: {
      filterText (val) {
        this.$refs.formCategoryTree.filter(val)
      }
    },
    methods: {
      filterNode (value, data) {
        if (!value) return true
        return data.name.indexOf(value) !== -1
      },
      refreshTree () {
        formCategoryService.treeData().then(({data}) => {
          this.formCategoryTreeData = data
        })
      },
      handleNodeClick (data) {
        this.searchForm.category.id = data.id
        this.refreshList()
      },
      addChildTreeNode (node) {
        this.$refs.formCategoryForm.init('addChild', {id: '', parent: {id: node.id, name: node.name}})
      },
       // 新增
      addTreeNode () {
        this.$refs.formCategoryForm.init('add', {id: '', parent: {id: '', name: ''}})
      },
      // 修改
      editTreeNode (data) {
        this.$refs.formCategoryForm.init('edit', {id: data.id, parent: {id: '', name: ''}})
      },
      delTreeNode (data) {
        this.$confirm(`确定删除所选项吗?`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.loading = true
          formCategoryService.delete(data.id).then(({data}) => {
            this.$message.success(data)
            this.loading = false
            this.refreshTree()
            this.refreshList()
          })
        })
      },
      // 获取数据列表
      refreshList () {
        this.loading = true
        formDefinitionService.list({
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
        this.$refs.formDefinitionForm.init('add', '')
      },
            // 新增
      showDesignForm (id, jsonId) {
        this.$refs.designForm.init(id, jsonId)
      },
      manage (id) {
        this.$router.push(`/flowable/form/FormDefinitionJsonList?id=${id}`)
      },
      // 修改
      edit (id) {
        id = id || this.$refs.formDefinitionTable.getCheckboxRecords().map(item => {
          return item.id
        })[0]
        this.$refs.formDefinitionForm.init('edit', id)
      },
      // 查看
      view (id) {
        this.$refs.formDefinitionForm.init('view', id)
      },
      // 删除
      del (id) {
        let ids = id || this.$refs.formDefinitionTable.getCheckboxRecords().map(item => {
          return item.id
        }).join(',')
        this.$confirm(`确定删除所选流程表单以及级联的表单版本吗?`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.loading = true
          formDefinitionService.delete(ids).then(({data}) => {
            this.loading = false
            this.$message.success(data)
            this.refreshList()
          })
        })
      },
      resetSearch () {
        this.$refs.searchForm.resetFields()
        this.filterText = ''
        this.$refs.formCategoryTree.setCurrentKey(null)
        this.refreshList()
      }
    }
  }
</script>