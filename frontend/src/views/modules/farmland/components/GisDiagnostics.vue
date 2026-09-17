<template>
  <div class="gis-diagnostics">
    <el-table :data="items" size="mini" border empty-text="尚未发起接口调用">
      <el-table-column label="接口资源" prop="label" min-width="110" />
      <el-table-column label="数据来源" width="86" align="center">
        <template slot-scope="scope">
          <el-tag size="mini" :type="scope.row.source === 'api' ? 'success' : 'warning'">
            {{ scope.row.source === 'api' ? '后端接口' : '模拟数据' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="说明" prop="message" min-width="200" show-overflow-tooltip />
    </el-table>

    <el-alert
      v-if="hasFallback"
      title="当前部分数据来自 mock：后端 5号 接口尚未就绪或不可达。页面字段与正式接口完全一致，后端就绪后无需改动页面代码。"
      type="warning"
      :closable="false"
      show-icon
      class="gis-diagnostics__alert" />
    <el-alert
      v-else-if="items.length"
      title="全部数据来自后端接口"
      type="success"
      :closable="false"
      show-icon
      class="gis-diagnostics__alert" />
  </div>
</template>

<script>
/**
 * 接口诊断面板（1号 前端GIS 岗位）
 *
 * 对应验收标准：「接口断开时有合理提示」。
 * 逐项列出每个资源是从后端接口取到的还是降级成 mock 的，以及失败原因，
 * 便于联调时快速定位是哪个接口没通。
 */
export default {
  name: 'GisDiagnostics',
  props: {
    items: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    hasFallback () {
      return this.items.some(item => item.source !== 'api' || item.ok === false)
    }
  }
}
</script>

<style lang="scss" scoped>
.gis-diagnostics {
  &__alert {
    margin-top: 8px;
  }
}
</style>
