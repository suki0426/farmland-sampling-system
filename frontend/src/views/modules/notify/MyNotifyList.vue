<template>
  <div class="ultra-theme ultra-table-page">
      <el-form size="small" :inline="true" class="ultra-query-form" ref="searchForm" :model="searchForm" @keyup.enter.native="refreshList()" @submit.native.prevent>
            <!-- 搜索框-->
		     <el-form-item prop="title">
                <el-input size="small" v-model="searchForm.title" placeholder="标题" clearable></el-input>
		     </el-form-item>
          <el-form-item>
            <el-button  type="primary" @click="refreshList()" size="small" icon="el-icon-search">查询</el-button>
            <el-button @click="resetSearch()" size="small" icon="el-icon-refresh-right">重置</el-button>
          </el-form-item>
      </el-form>
       <div class="ultra-table-panel">
      <vxe-toolbar :refresh="{query: refreshList}" export print custom>
      </vxe-toolbar>
     <div class="ultra-table-stage">
        <vxe-table
            border="inner"
            auto-resize
            resizable
            height="100%"
            :loading="loading"
            size="small"
            ref="notifyTable"
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
            <vxe-column  title="标题" field="title" sortable>
              <template slot-scope="scope">
                 <el-link  type="primary" :underline="false" @click="view(scope.row.id)">{{scope.row.title}}</el-link>
              </template>
            </vxe-column>
            <vxe-column  title="类型" field="type" sortable> 
                <template slot-scope="scope">
                  {{ $dictUtils.getDictLabel("oa_notify_type", scope.row.type, '-') }}
                </template>
            </vxe-column>
            <vxe-column  title="内容" field="content" sortable></vxe-column>
            <vxe-column  title="附件" field="files" sortable>
              <template slot-scope="scope">
                <el-link
								:href="item"
								target="_blank"
								:key="index"
								style="margin-right: 8px"
								v-for="(item, index) in (
									scope.row.files || ''
								).split(',')"
							>
								<el-tag v-if="item">
									{{
										decodeURIComponent(
											item.substring(
												item.lastIndexOf("&name=") + 6
											)
										)
									}}</el-tag
								>
							</el-link>
              </template>
            </vxe-column>

            <vxe-column  title="查阅状态" field="status" sortable>
              <template slot-scope="scope">
                <el-tag type="success" v-if="scope.row.readFlag === '1'"> {{ $dictUtils.getDictLabel("oa_notify_read", scope.row.readFlag, '-') }}</el-tag>
                <el-tag type="danger" v-if="scope.row.readFlag === '0'"> {{ $dictUtils.getDictLabel("oa_notify_read", scope.row.readFlag, '-') }}</el-tag>
              </template>
            </vxe-column>
             <vxe-column  title="发布者" field="createBy.name" sortable></vxe-column>
            <vxe-column title="操作" width="200px" fixed="right" align="center">
                <template  slot-scope="scope">
                    <el-button  type="text" icon="el-icon-view" size="mini" @click="view(scope.row.id)">查看</el-button>
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
    <NotifyForm  ref="notifyForm" @refreshDataList="refreshList"></NotifyForm>
  </div>
  </div>
</template>

<script>
  import NotifyForm from './NotifyForm'
  import notifyService from '@/api/notify/notifyService'
  export default {
    data () {
      return {
        searchForm: {
          title: ''
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
      NotifyForm
    },
    activated () {
      this.refreshList()
    },

    methods: {
      // 获取数据列表
      refreshList () {
        this.loading = true
        notifyService.list({
          'current': this.tablePage.currentPage,
          'size': this.tablePage.pageSize,
          'orders': this.tablePage.orders,
          isSelf: true,
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
      // 查看
      view (id) {
        this.$refs.notifyForm.init('read', id)
      },
      resetSearch () {
        this.$refs.searchForm.resetFields()
        this.refreshList()
      }
    }
  }
</script>