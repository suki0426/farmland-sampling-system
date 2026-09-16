<template>
    <div class="jp-common-layout ultra-theme ultra-table-page">
     <div class="jp-common-layout-left">
        <div class="jp-common-title">
            <el-row :gutter="5">
                 <el-col :span="20">
                      <el-input placeholder="输入关键字进行过滤" size="small" v-model="filterText"></el-input>
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
                :data="carKindTreeData"
                :props="{
                      value: 'id',             // ID字段名
                      label: 'name',         // 显示名称
                      children: 'children'    // 子级字段名
                    }"
                default-expand-all
                highlight-current
                node-key="id"
                :filter-node-method="filterNode"
                :expand-on-click-node="false"
                @node-click="handleNodeClick"
                ref="carKindTree">
                   <span class="custom-tree-node" slot-scope="{ node, data}">
                    <span>{{ node.label }}</span>
                    <span>
                        <el-button type="text" class="tree-item-button" icon="el-icon-plus" @click="() => addChildTreeNode(data)"></el-button>
                        <el-button type="text" class="tree-item-button" icon="el-icon-edit-outline" @click="() => editTreeNode(data)"></el-button>
                        <el-button type="text" class="red tree-item-button" icon="el-icon-delete" @click="() => delTreeNode(data)"></el-button>
                    </span>
                  </span>
              </el-tree>
            </div>
          </div>
         </div>
     </div>
     <div class="jp-common-layout-center jp-flex-main">
        <el-form size="small" :inline="true" class="ultra-query-form" ref="searchForm" :model="searchForm" @keyup.enter.native="refreshList()" @submit.native.prevent>
            <!-- 搜索框-->
         <el-form-item prop="kind.id">
                 <SelectTree
                  ref="kind"
                  :props="{
                      value: 'id',             // ID字段名
                      label: 'name',         // 显示名称
                      children: 'children'    // 子级字段名
                    }"
                  size="small"
                  url="/test/treetable/carKind/treeData"
                  :value="searchForm.kind.id"
                  :clearable="true"
                  :accordion="true"
                  @getValue="(value) => {searchForm.kind.id=value}"/>
         </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="refreshList()" size="small" icon="el-icon-search">查询</el-button>
            <el-button @click="resetSearch()" size="small" icon="el-icon-refresh-right">重置</el-button>
          </el-form-item>
      </el-form>

     <div class="ultra-table-panel">
        <vxe-toolbar :refresh="{query: refreshList}" import export print custom>
          <template #buttons>
            <el-button v-if="hasPermission('test:treetable:car:add')" type="primary" size="small" icon="el-icon-plus" @click="add()">新建</el-button>
            <el-button v-if="hasPermission('test:treetable:car:edit')" type="warning" size="small" icon="el-icon-edit-outline" @click="edit()" :disabled="$refs.carTable && $refs.carTable.getCheckboxRecords().length !== 1" plain>修改</el-button>
            <el-button v-if="hasPermission('test:treetable:car:del')" type="danger"   size="small" icon="el-icon-delete" @click="del()" :disabled="$refs.carTable && $refs.carTable.getCheckboxRecords().length === 0" plain>删除</el-button>
          </template>
          <template #tools>
            <vxe-button
    		  type="default"
    		  title="下载导入模板"
    		  v-if="hasPermission('test:treetable:car:import')"
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
            ref="carTable"
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
                filename: `车辆数据${moment(new Date()).format(
            		'YYYY-MM-DD'
                )}`,
                sheetName: '车辆数据',
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
        field="name"
        sortable
        title="品牌">
            <template slot-scope="scope">
              <el-link  type="primary" :underline="false" v-if="hasPermission('test:treetable:car:edit')" @click="edit(scope.row.id)">{{scope.row.name}}</el-link>
              <el-link  type="primary" :underline="false" v-else-if="hasPermission('test:treetable:car:view')"  @click="view(scope.row.id)">{{scope.row.name}}</el-link>
              <span v-else>{{scope.row.name}}</span>
            </template>
      </vxe-column>
      <vxe-column
        field="kind.name"
        sortable
        title="车系">
            <template slot-scope="scope">
                {{scope.row.kind && scope.row.kind.name}}
            </template>
      </vxe-column>
    <vxe-column
        field="remarks"
        sortable
        title="简介">
      </vxe-column>
      <vxe-column
        fixed="right"
        align="center"
        width="200"
        title="操作">
        <template  slot-scope="scope">
          <el-button v-if="hasPermission('test:treetable:car:view')" type="text" icon="el-icon-view" size="small" @click="view(scope.row.id)">查看</el-button>
          <el-button v-if="hasPermission('test:treetable:car:edit')" type="text" icon="el-icon-edit" size="small" @click="edit(scope.row.id)">修改</el-button>
          <el-button v-if="hasPermission('test:treetable:car:del')" type="text"  icon="el-icon-delete" size="small" @click="del(scope.row.id)">删除</el-button>
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
        <!-- 弹窗, 新增 / 修改 -->
    <CarForm  ref="carForm" @refreshDataList="refreshList"></CarForm>
    <CarKindForm  ref="carKindForm" @refreshTree="refreshTree"></CarKindForm>
   </div>
   </div>
  </div>
</template>

<script>
  import CarForm from './CarForm'
  import CarKindForm from './CarKindForm'
  import carService from '@/api/test/treetable/carService'
  import carKindService from '@/api/test/treetable/carKindService'
  import SelectTree from '@/components/treeSelect/treeSelect.vue'
  export default {
    data () {
      return {
        searchForm: {
          kind: {
            id: ''
          }
        },
        filterText: '',
        carKindTreeData: [],
        selectCarKindName: '',
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
      CarForm,
      CarKindForm
    },
    activated () {
      this.refreshTree()
      this.refreshList()
    },
    computed: {
    },
    watch: {
      filterText (val) {
        this.$refs.carKindTree.filter(val)
      }
    },
    methods: {
      filterNode (value, data) {
        if (!value) return true
        return data.name.indexOf(value) !== -1
      },
      refreshTree () {
        carKindService.treeData().then(({data}) => {
          this.carKindTreeData = data
        })
      },
      handleNodeClick (data) {
        this.searchForm.kind.id = data.id
        this.refreshList()
      },
      addChildTreeNode (node) {
        this.$refs.carKindForm.init('addChild', {id: '', parent: {id: node.id, name: node.name}})
      },
       // 新增
      addTreeNode () {
        this.$refs.carKindForm.init('add', {id: '', parent: {id: '', name: ''}})
      },
      // 修改
      editTreeNode (data) {
        this.$refs.carKindForm.init('edit', {id: data.id, parent: {id: '', name: ''}})
      },
      delTreeNode (data) {
        this.$confirm(`确定删除所选项吗?`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.loading = true
          carKindService.delete(data.id).then(({data}) => {
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
        carService.list({
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
        this.$refs.carForm.init('add', '')
      },
      // 修改
      edit (id) {
        id = id || this.$refs.carTable.getCheckboxRecords().map(item => {
          return item.id
        })[0]
        this.$refs.carForm.init('edit', id)
      },
      // 查看
      view (id) {
        this.$refs.carForm.init('view', id)
      },
      // 删除
      del (id) {
        let ids = id || this.$refs.carTable.getCheckboxRecords().map(item => {
          return item.id
        }).join(',')
        this.$confirm(`确定删除所选项吗?`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.loading = true
          carService.delete(ids).then(({data}) => {
            this.$message.success(data)
            this.refreshList()
            this.loading = false
          })
        })
      },
    // 下载模板
      downloadTpl () {
        this.loading = true
        carService.exportTemplate().then(({data}) => {
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
        carService.importExcel(formBody).then(({data}) => {
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
        return carService.exportExcel(params).then(({data}) => {
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
        this.filterText = ''
        this.$refs.carKindTree.setCurrentKey(null)
        this.refreshList()
      }
    }
  }
</script>

