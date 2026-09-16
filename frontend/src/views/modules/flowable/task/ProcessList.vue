<template>
    <div class="jp-common-layout page">
      <div class="jp-common-layout-left">
        <div class="jp-common-title"> 
          <el-input
          placeholder="分类:请输入关键字过滤"
          size="small"
          clearable
          v-model="filterText">
        </el-input>
        </div>
      <div class="jp-common-el-tree-scrollbar el-scrollbar">
      <div class="el-scrollbar__wrap">
        <div class="el-scrollbar__view">
      <el-tree
        class="filter-tree"
        :data="categoryTreeData"
        :props="{
              value: 'id',             // ID字段名
              label: 'name',         // 显示名称
              children: 'children'    // 子级字段名
            }"
        default-expand-all
        :filter-node-method="filterNode"
        :expand-on-click-node="false"
        node-key="id"
        highlight-current
        @node-click="handleNodeClick"
        ref="categoryTree">
      </el-tree>
     </div>
      </div>
      </div>
      </div>
      <div class="jp-common-layout-center jp-flex-main">
      <el-form size="small" :inline="true"   class="query-form" ref="searchForm" :model="searchForm" @keyup.enter.native="refreshList()" @submit.native.prevent>
         <el-form-item label="流程名称" prop="name">
            <el-input v-model="searchForm.name" size="small" placeholder="请输入流程名称"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button  type="primary" @click="refreshList()" size="small" icon="el-icon-search">查询</el-button>
          <el-button @click="resetSearch()" size="small" icon="el-icon-refresh-right">重置</el-button>
        </el-form-item>
      </el-form>
      <div class="bg-white top" style="overflow:auto">
      <el-row :gutter="12">
      <el-col :span="8" v-for="data in dataList2" :key="data.id">
        <el-card class="box-card" style="margin-bottom:10px">
            <!-- <div slot="header" class="clearfix">
              <span> {{data.category }}</span>
              <el-button style="float: right; padding: 3px 0" type="text" @click="start(data)">启动</el-button>
            </div> -->
            <div class="actCard">
              <img src='@/assets/img/Scheme.png'/>
              <el-button :style="{ color: 'var(--defaultTheme, #0f172a)', marginLeft: '10px', width: '150px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }"  type="text" @click="start(data)">{{data.name+' '+data.version}}</el-button>
            </div>
          </el-card>
      </el-col>
      </el-row>
      </div>
      </div>
  </div>
</template>

<script>
  import actCategoryService from '@/api/flowable/actCategoryService'
  import processService from '@/api/flowable/processService'
  import taskService from '@/api/flowable/taskService'
  export default {
    data () {
      return {
        searchForm: {
          category: '',
          name: ''
        },
        filterText: '',
        dataList: [],
        categoryTreeData: [],
        total: 0,
        isSearchCollapse: false,
        loading: false,
        visible: false,
        processPhotoUrl: '',
        pickerOptions: {
          shortcuts: [{
            text: '最近一周',
            onClick (picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
              picker.$emit('pick', [start, end])
            }
          }, {
            text: '最近一个月',
            onClick (picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
              picker.$emit('pick', [start, end])
            }
          }, {
            text: '最近三个月',
            onClick (picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
              picker.$emit('pick', [start, end])
            }
          }]
        }
      }
    },
    activated () {
      this.refreshTree()
      this.refreshList()
    },
    watch: {
      filterText (val) {
        this.$refs.categoryTree.filter(val)
      }
    },
    computed: {
      dataList2 () {
        return this.dataList.filter((data) => {
          return data.name.indexOf(this.searchForm.name) >= 0
        })
      },
      userName () {
        return JSON.parse(localStorage.getItem('user')).name
      }
    },
    methods: {
      filterNode (value, data) {
        if (!value) return true
        return data.name.indexOf(value) !== -1
      },
      // 获取树数据
      refreshTree () {
        actCategoryService.treeData().then(({data}) => {
          this.categoryTreeData = data
        })
      },
      // 获取数据列表
      refreshList () {
        this.loading = true
        processService.list({
          ...this.searchForm
        }).then(({data}) => {
          this.dataList = data.records
          this.total = data.total
          this.loading = false
        })
      },
      start (row) {
              // 读取流程表单
        let tabTitle = `发起流程【${row.name}】`
        let processTitle = `${this.userName} 在 ${this.moment(new Date()).format('YYYY-MM-DD HH:mm')} 发起了 [${row.name}]`
        taskService.getTaskDef({ procDefId: row.id,
          status: 'start'}).then(({data}) => {
            this.$router.push({
              path: '/flowable/task/TaskForm',
              query: {procDefId: row.id, procDefKey: row.key, status: 'start', title: tabTitle, formType: data.formType, formUrl: data.formUrl, formTitle: processTitle}
            })
          })
      },
      handleNodeClick (data) {
        this.searchForm.category = data.name
        this.refreshList()
      },
      resetSearch () {
        this.$refs.searchForm.resetFields()
        this.searchForm.category = ''
        this.filterText = ''
        this.$refs.categoryTree.setCurrentKey(null)
        this.refreshList()
      }
    }
  }
</script>
<style scoped>
.actCard{
 padding: 0px;
}
</style>
