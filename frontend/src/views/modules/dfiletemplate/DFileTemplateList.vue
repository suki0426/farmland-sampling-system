<template>
    <div class="page">
      <el-form size="small" :inline="true" class="query-form" ref="searchForm" :model="searchForm" @keyup.enter.native="refreshList()" @submit.native.prevent>
            <!-- 搜索框-->
          <el-form-item>
            <el-button type="primary" @click="refreshList()" size="small" icon="el-icon-search">查询</el-button>
            <el-button @click="resetSearch()" size="small" icon="el-icon-refresh-right">重置</el-button>
          </el-form-item>
      </el-form>

     <div class="bg-white top">
        <vxe-toolbar :refresh="{query: refreshList}" import export print custom>
          <template #buttons>
            <el-button v-if="hasPermission('dfiletemplate:dFileTemplate:add')" type="primary" size="small" icon="el-icon-plus" @click="add()">新建</el-button>
            <el-button v-if="hasPermission('dfiletemplate:dFileTemplate:edit')" type="warning" size="small" icon="el-icon-edit-outline" @click="edit()" :disabled="$refs.dFileTemplateTable && $refs.dFileTemplateTable.getCheckboxRecords().length !== 1" plain>修改</el-button>
            <el-button v-if="hasPermission('dfiletemplate:dFileTemplate:del')" type="danger"   size="small" icon="el-icon-delete" @click="del()" :disabled="$refs.dFileTemplateTable && $refs.dFileTemplateTable.getCheckboxRecords().length === 0" plain>删除</el-button>
          </template>
          <template #tools>
            <vxe-button
    		  type="default"
    		  title="下载导入模板"
    		  v-if="hasPermission('dfiletemplate:dFileTemplate:import')"
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
            ref="dFileTemplateTable"
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
                filename: `文档模板管理数据${moment(new Date()).format(
            		'YYYY-MM-DD'
                )}`,
                sheetName: '文档模板管理数据',
                exportMethod: exportMethod,
                types: ['xlsx'],
                modes: ['current', 'selected', 'all'],
            }"
            @sort-change="sortChangeHandle"
            :sort-config="{remote:true}"
            :expand-config="{accordion: true, lazy: true,loadMethod:detail}"
            :data="dataList"
            :checkbox-config="{}">
            <vxe-column type="seq" width="40"></vxe-column>
            <vxe-column type="checkbox"  width="40px"></vxe-column>
            <vxe-column type="expand" width="80" >
                <template #content="{ row }">
                    <el-tabs>
                            <el-tab-pane label="文件模板章节表">
                                <el-table
                                        size="small"
                                        :data="row.dFileTemplateSectionDTOList"
                                        style="width: 100%">
                                                    <el-table-column
                                                            prop="template.id"
                                                            show-overflow-tooltip
                                                            label="所属模板">
                                                    </el-table-column>
                                                    <el-table-column
                                                            prop="parentSectionId"
                                                            show-overflow-tooltip
                                                            label="上级章节">
                                                    </el-table-column>
                                                    <el-table-column
                                                            prop="sectionLevel"
                                                            show-overflow-tooltip
                                                            label="章节级别">
                                                    </el-table-column>
                                                    <el-table-column
                                                            prop="sectionTitle"
                                                            show-overflow-tooltip
                                                            label="章节名称">
                                                    </el-table-column>
                                                    <el-table-column
                                                            prop="sectionCode"
                                                            show-overflow-tooltip
                                                            label="章节编号">
                                                    </el-table-column>
                                                    <el-table-column
                                                            prop="sortNo"
                                                            show-overflow-tooltip
                                                            label="显示顺序">
                                                    </el-table-column>
                                                    <el-table-column
                                                            prop="requiredFlag"
                                                            show-overflow-tooltip
                                                            label="是否必填">
                                                    </el-table-column>
                                                    <el-table-column
                                                            prop="visibleFlag"
                                                            show-overflow-tooltip
                                                            label="是否可见">
                                                    </el-table-column>
                                                    <el-table-column
                                                            prop="componentType"
                                                            show-overflow-tooltip
                                                            label="组件类型">
                                                    </el-table-column>
                                                    <el-table-column
                                                            prop="placeHolderText"
                                                            show-overflow-tooltip
                                                            label="表单提示">
                                                    </el-table-column>
                                                    <el-table-column
                                                            prop="defaultvalue"
                                                            show-overflow-tooltip
                                                            label="默认值">
                                                    </el-table-column>
                                                    <el-table-column
                                                            prop="status"
                                                            show-overflow-tooltip
                                                            label="状态">
                                                    </el-table-column>
                                </el-table>
                            </el-tab-pane>
                    </el-tabs>
                </template>
            </vxe-column>
    <vxe-column
        field="templateCode"
        sortable
        title="模板编码">
            <template slot-scope="scope">
              <el-link  type="primary" :underline="false" v-if="hasPermission('dfiletemplate:dFileTemplate:edit')" @click="edit(scope.row.id)">{{scope.row.templateCode}}</el-link>
              <el-link  type="primary" :underline="false" v-else-if="hasPermission('dfiletemplate:dFileTemplate:view')"  @click="view(scope.row.id)">{{scope.row.templateCode}}</el-link>
              <span v-else>{{scope.row.templateCode}}</span>
            </template>
      </vxe-column>
    <vxe-column
        field="templateName"
        sortable
        title="模板名称">
      </vxe-column>
    <vxe-column
        field="docType"
        sortable
        title="文档类型">
      </vxe-column>
    <vxe-column
        field="versionNo"
        sortable
        title="模板版本">
      </vxe-column>
    <vxe-column
        field="applicableMajor"
        sortable
        title="适用课程范围">
      </vxe-column>
    <vxe-column
        field="applicableCourse"
        sortable
        title="适用课程范围">
      </vxe-column>
    <vxe-column
        field="isDefault"
        sortable
        title="是否默认模板">
      </vxe-column>
    <vxe-column
        field="status"
        sortable
        title="状态">
      </vxe-column>
    <vxe-column
        field="remark"
        sortable
        title="备注">
      </vxe-column>
    <vxe-column
        field="sortNo"
        sortable
        title="排序">
      </vxe-column>
      <vxe-column
        fixed="right"
        align="center"
        width="200"
        title="操作">
        <template  slot-scope="scope">
          <el-button v-if="hasPermission('dfiletemplate:dFileTemplate:view')" type="text" icon="el-icon-view" size="small" @click="view(scope.row.id)">查看</el-button>
          <el-button v-if="hasPermission('dfiletemplate:dFileTemplate:edit')" type="text" icon="el-icon-edit" size="small" @click="edit(scope.row.id)">修改</el-button>
          <el-button v-if="hasPermission('dfiletemplate:dFileTemplate:del')" type="text"  icon="el-icon-delete" size="small" @click="del(scope.row.id)">删除</el-button>
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
    <DFileTemplateForm  ref="dFileTemplateForm" @refreshDataList="refreshList"></DFileTemplateForm>
  </div>
</template>

<script>
  import DFileTemplateForm from './DFileTemplateForm'
  import dFileTemplateService from '@/api/dfiletemplate/dFileTemplateService'
  import {
    buildTemplateExportParams,
    createTemplateImportForm
  } from './templateTransferParams'
  import {
    downloadTemplateFile,
    logFileTransferError,
    runTemplateListAction,
    showTemplateImportResult
  } from './templateListActions'
  export default {
    data () {
      return {
        searchForm: {
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
      DFileTemplateForm
    },
    activated () {
      this.refreshList()
    },
    methods: {
      // 获取数据列表
      refreshList () {
        this.loading = true
        return dFileTemplateService.list({
          'current': this.tablePage.currentPage,
          'size': this.tablePage.pageSize,
          'orders': this.tablePage.orders,
          ...this.searchForm
        }).then(({data}) => {
          this.dataList = data.records
          this.tablePage.total = data.total
        }).finally(() => {
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
        this.$refs.dFileTemplateForm.init('add', '')
      },
      // 修改
      edit (id) {
        id = id || this.$refs.dFileTemplateTable.getCheckboxRecords().map(item => {
          return item.id
        })[0]
        this.$refs.dFileTemplateForm.init('edit', id)
      },
      // 查看
      view (id) {
        this.$refs.dFileTemplateForm.init('view', id)
      },
      // 删除
      del (id) {
        let ids = id || this.$refs.dFileTemplateTable.getCheckboxRecords().map(item => {
          return item.id
        }).join(',')
        this.$confirm(`确定删除所选项吗?`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          return runTemplateListAction(this, () => dFileTemplateService.delete(ids).then(({data}) => {
            this.$message.success(data)
            return this.refreshList()
          }))
        }).catch(() => {})
      },
      // 下载模板
      downloadTpl () {
        return runTemplateListAction(this, () => dFileTemplateService.exportTemplate().then(({data}) => {
          downloadTemplateFile(this.$utils, data, '请假表单导入模板')
        }).catch((err) => {
          logFileTransferError(err)
        }))
      },
      // 自定义服务端导入
      importMethod ({ file }) {
        return runTemplateListAction(this, () => dFileTemplateService.importExcel(createTemplateImportForm(file)).then(({data}) => {
          showTemplateImportResult(this.$message, data)
          return this.refreshList()
        }))
      },
      // 自定义服务端导出
      exportMethod ({ options }) {
        const params = buildTemplateExportParams({
          options,
          tablePage: this.tablePage,
          searchForm: this.searchForm
        })
        return runTemplateListAction(this, () => dFileTemplateService.exportExcel(params).then(({data}) => {
          downloadTemplateFile(this.$utils, data, options.filename)
        }).catch((err) => {
          logFileTransferError(err)
        }))
      },
      // 查看详情
      detail ({row}) {
        return dFileTemplateService.queryById(row.id).then(({data}) => {
          this.dataList.forEach((item, index) => {
            if (item.id === row.id) {
              item.dFileTemplateSectionDTOList = data.dFileTemplateSectionDTOList
            }
          })
        })
      },
      resetSearch () {
        this.$refs.searchForm.resetFields()
        this.refreshList()
      }
    }
  }
</script>
