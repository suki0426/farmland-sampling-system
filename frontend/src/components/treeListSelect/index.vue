<template>
  <div class="dialog-box">
    <el-input :placeholder="placeholder" :disabled="disabled" :size="size" :readonly="true" style="line-hight:40px" v-model="name" class="input-with-select" >
      <el-button slot="append" :disabled="disabled" @click="showSelectDialog" icon="el-icon-search"></el-button>
    </el-input>
    <el-dialog
    :title="title"
    :close-on-click-modal="false"
    :append-to-body="true"
     v-dialogDrag
     fullscreen
     class="gridDialog"
    :visible.sync="visible">
    <el-row :gutter="15">
    <el-col :span="24">
      <!-- <p>
      <vxe-input v-model="filterText" type="search" placeholder="关键词搜索"></vxe-input>
      </p> -->
      <div class="bg-white top">
      <vxe-toolbar :refresh="{query: refreshList}">
        <template #buttons>
              <el-button type="primary"
                  plain size="small" icon="el-icon-refresh" @click="refreshList()">刷新
              </el-button>
              <el-button type="primary" size="small" @click="expandAllEvent()">展开所有指标</el-button>
              <el-button type="warning" size="small" @click="claseExpandEvent()" plain>关闭所有指标</el-button>
        </template>
      </vxe-toolbar>
      <div style="height: calc(100% - 80px);">
        <vxe-table
          resizable
          ref="gridTable"
          border="inner"
          auto-resize
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
          @radio-change="radioChangeEvent"
          :data="dataList">
        <vxe-table-column type="checkbox" width="50px" v-if="limit > 1"> </vxe-table-column>
        <vxe-table-column type="radio" width="50px" v-if="limit <= 1"> 
        </vxe-table-column>
        <template   v-for="(column, index) in columns">
        <vxe-column
          :tree-node="column.prop === 'name' ? true : false"
          :field="column.prop"
          :title="column.label">
        </vxe-column>
        </template>
        <template #empty>
        <span>
          <p>未查询到数据</p>
        </span>
        </template>
      </vxe-table>
      </div>
      </div>

    </el-col>
    </el-row>
     <span slot="footer" class="dialog-footer">
      <el-button size="small" @click="visible = false" icon="el-icon-circle-close">关闭</el-button>
      <el-button size="small" type="primary" icon="el-icon-circle-check" @click="doSubmit()">确定</el-button>
    </span>
    </el-dialog>
  
  </div>
</template>

<script>
  import XEUtils from 'xe-utils'
  export default {
    data () {
      return {
        searchForms: [],
        filterText: '',
        dataListAllSelections: [],   // 所有选中的数据包含跨页数据
        dataListSelections: [],
        idKey: 'id', // 标识列表数据中每一行的唯一键的名称(需要按自己的数据改一下)
        dataList: [],
        dynamicTags: [],
        selectData: [],
        pageNo: 1,
        pageSize: 10,
        total: 0,
        orders: [],
        loading: false,
        visible: false,
        name: '',
        tableData: []
      }
    },
    props: {
      limit: {
        type: Number,
        default: 999999
      },
      columns: {
        type: Array,
        default: () => { return [] }
      },
      disabled: {
        type: Boolean,
        default: false
      },
      searchs: {
        type: Array,
        default: () => { return [] }
      },
      dataListUrl: {
        type: String,
        default: () => { return null }
      },
      queryEntityUrl: {
        type: String,
        default: () => { return null }
      },
      value: {
        type: String,
        default: () => { return null }
      },
      title: {
        type: String,
        default: () => { return '' }
      },
      placeholder: {
        type: String,
        default: () => { return '请选择' }
      },
      labelName: {
        type: String,
        default: () => { return '' }
      },
      labelValue: {
        type: String,
        default: () => { return '' }
      },
      size: {
        type: String,
        default: () => { return 'small' }
      }
    },
    watch: {
      filterText (val) {
        this.searchEvent()
      }
    },
    methods: {
      // 在树形结构中通过 ID 查找索引的方法
      findIndexByIdInTree (id, tree) {
        let foundIndex = -1 // 初始索引设置为 -1，表示未找到目标节点

        // 递归函数，用于在树中搜索目标 ID 的节点
        function searchIndex (node, targetId, index) {
          if (node.taskDetailId === targetId) { // 如果当前节点的 ID 匹配目标 ID
            foundIndex = index // 将当前节点的索引赋给 foundIndex
            return true // 返回 true 表示找到了目标节点，停止搜索
          }

          if (node.children && node.children.length > 0) { // 如果当前节点有子节点
            for (let i = 0; i < node.children.length; i++) { // 遍历子节点
              const child = node.children[i]
              const childIndex = index === -1 ? String(i) : `${index}.${i}` // 记录子节点的索引
              const found = searchIndex(child, targetId, childIndex) // 递归调用搜索函数
              if (found) { // 如果找到目标节点
                return true // 停止搜索
              }
            }
          }
          return false // 返回 false 表示未找到目标节点
        }

        // 调用搜索函数开始搜索
        searchIndex(tree, id, -1)
        return foundIndex // 返回找到的节点的索引
      },
      searchEvent () {
        const filterVal = XEUtils.toValueString(this.filterText).trim().toLowerCase()
        if (filterVal) {
          const filterRE = new RegExp(filterVal, 'gi')
          const options = { children: 'children' }
          const searchProps = ['name']
          console.log('rest1111', this.dataList)
          const rest = XEUtils.searchTree(this.dataList, item => searchProps.some(key => String(item[key]).toLowerCase().indexOf(filterVal) > -1), options)
          console.log('rest', rest, this.dataList)
          XEUtils.eachTree(rest, item => {
            searchProps.forEach(key => {
              item[key] = String(item[key]).replace(filterRE, match => `<span class="keyword-lighten">${match}</span>`)
            })
          }, options)
          this.dataList = rest
          // 搜索之后默认展开所有子节点
          this.$nextTick(() => {
            this.$refs.gridTable.setAllTreeExpand(true)
          })
        } else {
          this.dataList = this.tableData
          this.$nextTick(() => {
            this.$refs.gridTable.setAllTreeExpand(true)
          })
        }
      },
      // 展开所有
      expandAllEvent () {
        this.$refs.gridTable.setAllTreeExpand(true)
      },
      // 关闭所有
      claseExpandEvent () {
        this.$refs.gridTable.clearTreeExpand()
      },
      // 选择事件
      radioChangeEvent (newValue, oldValue) {
        console.log('1111', newValue, oldValue)
        this.dataListSelections = []
        this.dataListSelections.push(newValue.row)
        console.log('2222', newValue, this.dataListSelections)
      },
      // 初始化查询条件
      initQueryEntity (queryEntityUrl, id) {
        this.name = ''
        this.dataListSelections = []
        this.selectData = []
        if (id) {
          this.$http.get(`${queryEntityUrl}?id=${id}`).then(({data}) => {
            this.selectData.push(data)
            this.name = this.selectData[0].name
            this.$emit('getValue', this.selectData[0].id)
          })
        }
      },
      init () {
        this.visible = true
        this.$nextTick(() => {
          this.resetSearch()
        })
      },
      // 获取数据列表
      refreshList () {
        this.loading = true
        this.$http({
          url: this.dataListUrl,
          method: 'get'
        }).then(({data}) => {
          this.tableData = data
          this.dataList = data
          this.total = data.length
          this.loading = false
          this.$nextTick(() => {
            if (this.selectData.length > 0) {
              console.log('555', this.selectData[0].id, this.dataList)
              let index = this.findIndexByIdInTree(this.selectData[0].id, this.dataList)
              if (index > -1) {
                this.$refs.gridTable.setRadioRow(this.dataList[index])
              }
              console.log('index', index, this.dataList, this.selectData)
            }
            this.$refs.gridTable.setAllTreeExpand(true)
          })
        })
      },
      handleSearch () {
        let options = { children: 'children' }
        let searchProps = ['name']
        this.dataList = XEUtils.searchTree(this.dataList, item => searchProps.every(key => XEUtils.toValueString(this.searchForm[key]).trim() === '' || XEUtils.toValueString(item[key]).indexOf(this.searchForm[key]) > -1), options)
        this.$nextTick(() => {
          this.$refs.gridTable.setAllTreeExpand(true)
        })
      },
      resetSearch () {
        this.filterText = ''
        this.refreshList()
      },
      doSubmit () {
        if (this.limit < this.dataListAllSelections.length) {
          this.$message.error(`你最多只能选择${this.limit}条数据`)
          return
        }
        this.visible = false
        this.name = this.dataListSelections.map((item) => {
          return item[this.labelName]
        }).join(',')
        let value = this.dataListSelections.map((item) => {
          return item['taskDetailId']
        }).join(',')
        console.log('3333', this.dataListSelections, value)
        this.$emit('getValue', value)
      },
      showSelectDialog () {
        this.visible = true
        this.init()
      }
    }
  }
</script>
<style lang="scss">
.gridDialog{
  .el-dialog__body {
    padding: 10px 0px 0px 10px;
    color: #606266;
    font-size: 14px;
    word-break: break-all;
  }
  .el-pagination{
    margin-top: 5px;
    margin-bottom: 4px;
  }
}
</style>
<style scoped>
.el-tag {
    height: 100% !important;
    white-space: normal !important
}
</style>