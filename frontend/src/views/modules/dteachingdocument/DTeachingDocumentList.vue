<template>
    <div class="page">
      <el-form size="small" :inline="true" class="ultra-query-form" ref="searchForm" :model="searchForm" @keyup.enter.native="refreshList()" @submit.native.prevent>
            <!-- 搜索框-->
         <el-form-item prop="title">
                <el-input size="small" v-model="searchForm.title" placeholder="文档标题" clearable></el-input>
         </el-form-item>
         <el-form-item prop="docType">
                  <el-select v-model="searchForm.docType" placeholder="请选择文档分类" size="small" style="width: 100%;">
                    <el-option
                      v-for="item in $dictUtils.getDictList('teaching_doc_type')"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value">
                    </el-option>
                  </el-select>
         </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="refreshList()" size="small" icon="el-icon-search">查询</el-button>
            <el-button @click="resetSearch()" size="small" icon="el-icon-refresh-right">重置</el-button>
          </el-form-item>
      </el-form>

     <div class="bg-white top">
        <vxe-toolbar :refresh="{query: refreshList}" custom>
          <template #buttons>
            <el-button v-if="hasPermission('dteachingdocument:dTeachingDocument:add')" type="primary" size="small" icon="el-icon-plus" @click="add()">新建</el-button>
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
            ref="dTeachingDocumentTable"
            show-header-overflow
            show-overflow
            highlight-hover-row
            highlight-current-row
            :menu-config="{}"
            :print-config="{}"
            @sort-change="sortChangeHandle"
            :sort-config="{remote:true}"
            :data="dataList"
            :row-class-name="rowClassName">
            <vxe-column type="seq" width="70" title="序号"></vxe-column>
    <vxe-column
        field="title"
        min-width="280"
        sortable
        title="标题">
            <template slot-scope="scope">
              <el-link  type="primary" :underline="false" v-if="hasPermission('dteachingdocument:dTeachingDocument:view')" @click="view(scope.row.id)">{{scope.row.title}}</el-link>
              <el-link  type="primary" :underline="false" v-else-if="hasPermission('dteachingdocument:dTeachingDocument:edit')" @click="edit(scope.row.id)">{{scope.row.title}}</el-link>
              <span v-else>{{scope.row.title}}</span>
            </template>
      </vxe-column>
    <vxe-column
        field="docType"
        sortable
        width="180"
        title="类型">
        <template slot-scope="scope">
              {{ $dictUtils.getDictLabel("teaching_doc_type", scope.row.docType, '-') }}
        </template>
      </vxe-column>
    <vxe-column
        field="courseName"
        sortable
        :visible="false"
        min-width="160"
        title="课程名称">
      </vxe-column>
    <vxe-column
        field="courseCode"
        sortable
        :visible="false"
        min-width="140"
        title="课程编码">
      </vxe-column>
    <vxe-column
        field="inputMethod"
        sortable
        :visible="false"
        width="130"
        title="录入方式">
        <template slot-scope="scope">
              {{ $dictUtils.getDictLabel("teaching_input_method", scope.row.inputMethod, scope.row.inputMethod || '-') }}
        </template>
      </vxe-column>
    <vxe-column
        field="status"
        sortable
        :visible="false"
        width="120"
        title="文档状态">
        <template slot-scope="scope">
              {{ $dictUtils.getDictLabel("teaching_doc_status", scope.row.status, scope.row.status || '-') }}
        </template>
      </vxe-column>
    <vxe-column
        field="sourceFileName"
        sortable
        :visible="false"
        min-width="180"
        title="来源文件">
      </vxe-column>
    <vxe-column
        field="templateName"
        sortable
        :visible="false"
        min-width="180"
        title="关联模板">
      </vxe-column>
    <vxe-column
        field="updateDate"
        sortable
        :visible="false"
        width="170"
        title="更新时间">
      </vxe-column>
    <vxe-column
        field="createDate"
        sortable
        :visible="false"
        width="170"
        title="创建时间">
      </vxe-column>
      <vxe-column
        fixed="right"
        align="center"
        width="330"
        title="操作">
        <template  slot-scope="scope">
          <div class="document-action-group">
            <el-button type="text" size="small" @click="showKeywords(scope.row)">关键词</el-button>
            <span v-if="hasPermission('dteachingdocument:dTeachingDocument:view')" class="document-action-divider"></span>
            <el-button v-if="hasPermission('dteachingdocument:dTeachingDocument:view')" type="text" size="small" @click="view(scope.row.id)">详情</el-button>
            <span v-if="hasPermission('dteachingdocument:dTeachingDocument:edit')" class="document-action-divider"></span>
            <el-button v-if="hasPermission('dteachingdocument:dTeachingDocument:edit')" type="text" size="small" @click="edit(scope.row.id)">编辑</el-button>
            <span v-if="hasPermission('dteachingdocument:dTeachingDocument:add')" class="document-action-divider"></span>
            <el-button v-if="hasPermission('dteachingdocument:dTeachingDocument:add')" type="text" size="small" @click="copy(scope.row.id)">复制</el-button>
            <span v-if="hasPermission('dteachingdocument:dTeachingDocument:del')" class="document-action-divider"></span>
            <el-button v-if="hasPermission('dteachingdocument:dTeachingDocument:del')" class="document-action-danger" type="text" size="small" @click="del(scope.row.id)">删除</el-button>
          </div>
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
    <TeachingDocumentCreateDialog
      :visible.sync="createDialogVisible"
      :default-method="createDialogDefaultMethod"
      :default-doc-type="createDialogDefaultDocType"
      :default-template-id="createDialogDefaultTemplateId"
      @close="closePageDialogs"
      @create="handleCreateDocument"
    />
    <el-dialog
      title="文档关键词"
      width="520px"
      :visible.sync="keywordDialogVisible"
    >
      <div class="document-keyword-dialog">
        <strong>{{ keywordDialogRow.title || '教学文档' }}</strong>
        <p>{{ keywordDialogRow.keywordsJson || '暂无关键词' }}</p>
      </div>
      <span slot="footer">
        <el-button size="small" type="primary" @click="keywordDialogVisible = false">知道了</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
  import TeachingDocumentCreateDialog from '@/components/teachingDocument/TeachingDocumentCreateDialog'
  import dTeachingDocumentBusinessService from '@/api/dteachingdocument/dTeachingDocumentBusinessService'
  import {
    buildCreateDocumentRoute,
    getCreateDialogOptionsFromRoute,
    pushRouteLater
  } from './createDialogRoute'
  import {
    isHighlightedRecord,
    mergeHighlightedRecord,
    resolveDocumentRecord,
    resolveDocumentRecordId
  } from './highlightState'
  export default {
    data () {
      return {
        searchForm: {
          title: '',
          docType: ''
        },
        dataList: [],
        tablePage: {
          total: 0,
          currentPage: 1,
          pageSize: 10,
          orders: [{ column: 'create_date', asc: false }]
        },
        createDialogVisible: false,
        createDialogDefaultMethod: 'manual',
        createDialogDefaultDocType: '',
        createDialogDefaultTemplateId: '',
        highlightedRecordId: '',
        highlightedRecordSnapshot: null,
        pendingHighlightedRecordSync: false,
        keywordDialogVisible: false,
        keywordDialogRow: {},
        loading: false
      }
    },
    components: {
      TeachingDocumentCreateDialog
    },
    created () {
      this.refreshList()
      this.openCreateDialogFromRoute()
    },
    activated () {
      this.refreshList()
      this.openCreateDialogFromRoute()
    },
    deactivated () {
      this.closePageDialogs()
    },
    beforeRouteLeave (to, from, next) {
      this.closePageDialogs()
      next()
    },
    watch: {
      '$route.name' (name) {
        if (name !== 'dteachingdocument-list') {
          this.closePageDialogs()
        }
      }
    },
    methods: {
      closePageDialogs () {
        this.createDialogVisible = false
        this.keywordDialogVisible = false
      },
      // 获取数据列表
      refreshList () {
        this.syncHighlightFromRoute()
        this.loading = true
        return dTeachingDocumentBusinessService.list({
          'current': this.tablePage.currentPage,
          'size': this.tablePage.pageSize,
          'orders': this.tablePage.orders,
          ...this.searchForm
        }).then(({data}) => {
          const mergeResult = mergeHighlightedRecord({
            records: data.records,
            highlightedRecordId: this.highlightedRecordId,
            highlightedRecordSnapshot: this.highlightedRecordSnapshot,
            pendingHighlightedRecordSync: this.pendingHighlightedRecordSync,
            pageSize: this.tablePage.pageSize
          })
          this.dataList = mergeResult.records
          this.tablePage.total = mergeResult.inserted ? Number(data.total || 0) + 1 : Number(data.total || 0)
          if (mergeResult.matchedRecord) {
            this.highlightedRecordSnapshot = mergeResult.matchedRecord
          }
          this.pendingHighlightedRecordSync = mergeResult.pendingHighlightedRecordSync
          this.applyHighlightedRow()
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
        this.openCreateDialog('manual')
      },
      // 修改
      edit (id) {
        this.$router.push({
          name: 'dteachingdocument-editor',
          query: { id: id, from: 'list' }
        })
      },
      // 查看
      view (id) {
        this.$router.push({
          name: 'dteachingdocument-detail',
          query: { id: id }
        })
      },
      // 删除
      del (id) {
        let ids = id || this.$refs.dTeachingDocumentTable.getCheckboxRecords().map(item => {
          return item.id
        }).join(',')
        const deletingIds = ids.split(',').map(item => String(item).trim()).filter(Boolean)
        this.$confirm(`确定删除所选项吗?`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.loading = true
          return dTeachingDocumentBusinessService.delete(ids).then(({data}) => {
            this.$message.success(data)
            if (this.highlightedRecordId && deletingIds.includes(String(this.highlightedRecordId))) {
              this.clearHighlightedRecordState()
            }
            return this.refreshList()
          })
        }).catch(() => {
          this.loading = false
        })
      },
      copy (id) {
        this.loading = true
        return dTeachingDocumentBusinessService.copy(id).then(({data}) => {
          this.$message.success(data.message || '复制成功')
          this.highlightedRecordSnapshot = resolveDocumentRecord(data)
          this.highlightedRecordId = resolveDocumentRecordId(data)
          this.pendingHighlightedRecordSync = !!this.highlightedRecordId && !!this.highlightedRecordSnapshot
          this.tablePage.currentPage = 1
          return this.refreshList()
        }).catch(error => {
          this.$message.error(error && error.message ? error.message : '复制失败')
          this.loading = false
        })
      },
      openCreateDialog (method = 'manual', defaults = {}) {
        this.createDialogDefaultMethod = method
        this.createDialogDefaultDocType = defaults.docType || ''
        this.createDialogDefaultTemplateId = defaults.templateId || ''
        this.createDialogVisible = true
      },
      openCreateDialogFromRoute () {
        const options = getCreateDialogOptionsFromRoute(this.$route.query || {})
        this.syncHighlightFromRoute()
        if (!options) return
        this.openCreateDialog(options.method, options.defaults)
        this.$nextTick(() => {
          this.$router.replace({ name: 'dteachingdocument-list' })
        })
      },
      handleCreateDocument (payload) {
        this.closePageDialogs()
        pushRouteLater(this.$router, buildCreateDocumentRoute(payload))
      },
      showKeywords (row) {
        this.keywordDialogRow = row || {}
        this.keywordDialogVisible = true
      },
      syncHighlightFromRoute () {
        const highlightId = this.$route.query && this.$route.query.highlightId
        if (highlightId) {
          this.highlightedRecordId = highlightId
        }
      },
      clearHighlightedRecordState () {
        this.highlightedRecordId = ''
        this.highlightedRecordSnapshot = null
        this.pendingHighlightedRecordSync = false
      },
      applyHighlightedRow () {
        this.$nextTick(() => {
          const table = this.$refs.dTeachingDocumentTable
          if (!table) return
          if (!this.highlightedRecordId) {
            if (table.clearCurrentRow) {
              table.clearCurrentRow()
            }
            return
          }
          const row = Array.isArray(this.dataList)
            ? this.dataList.find(item => item && String(item.id) === String(this.highlightedRecordId))
            : null
          if (row && table.setCurrentRow) {
            table.setCurrentRow(row)
          }
        })
      },
      rowClassName ({ row }) {
        return isHighlightedRecord(row, this.highlightedRecordId) ? 'document-highlight-row' : ''
      },
      resetSearch () {
        this.$refs.searchForm.resetFields()
        this.refreshList()
      }
    }
  }
</script>

<style scoped>
.document-keyword-dialog strong {
  display: block;
  color: #0f172a;
  font-size: 16px;
}

.document-keyword-dialog p {
  min-height: 54px;
  margin: 12px 0 0;
  padding: 12px;
  border: 1px solid #edf2f7;
  border-radius: 8px;
  background: #f8fafc;
  color: #334155;
  line-height: 1.7;
}

.document-action-group {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
}

.document-action-group >>> .el-button {
  padding-left: 0;
  padding-right: 0;
}

.document-action-divider {
  width: 1px;
  height: 14px;
  background: #d8e3f1;
}

.document-action-danger {
  color: #ef4444;
}

::v-deep(.document-highlight-row),
::v-deep(.document-highlight-row > .vxe-body--column) {
  background: #fff7d6;
}

::v-deep(.document-highlight-row:hover),
::v-deep(.document-highlight-row:hover > .vxe-body--column) {
  background: #ffefb0;
}
</style>
