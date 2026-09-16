<template>
  <div class="parse-result-table">
    <el-table
      :data="items"
      border
      size="small"
      empty-text="暂无解析结果"
    >
      <el-table-column prop="name" label="文件名" min-width="220" show-overflow-tooltip />
      <el-table-column label="识别类型" width="120">
        <template slot-scope="scope">
          {{ getDocTypeLabel(scope.row.docType) }}
        </template>
      </el-table-column>
      <el-table-column label="解析状态" width="120">
        <template slot-scope="scope">
          <el-tag size="mini" :type="getStatusType(scope.row.status)">
            {{ getStatusLabel(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="recordId" label="生成记录" width="150">
        <template slot-scope="scope">
          <el-button
            v-if="scope.row.recordId"
            type="text"
            size="mini"
            @click="$emit('view-record', scope.row)"
          >
            {{ scope.row.recordId }}
          </el-button>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="errorMessage" label="失败原因" min-width="180">
        <template slot-scope="scope">
          <span :class="{ 'parse-result-table__error': scope.row.errorMessage }">
            {{ scope.row.errorMessage || '-' }}
          </span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { STATUS_META } from './constants'
import { getTemplateDocTypeLabel } from '@/components/fileTemplate/constants'

export default {
  name: 'ParseResultTable',
  props: {
    items: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    getStatusLabel (status) {
      return (STATUS_META[status] && STATUS_META[status].label) || status || '-'
    },
    getStatusType (status) {
      return (STATUS_META[status] && STATUS_META[status].type) || 'info'
    },
    getDocTypeLabel (docType) {
      if (this.$dictUtils && this.$dictUtils.getDictLabel) {
        return this.$dictUtils.getDictLabel('teaching_doc_type', docType, getTemplateDocTypeLabel(docType) || '-')
      }
      return getTemplateDocTypeLabel(docType) || '-'
    }
  }
}
</script>

<style scoped>
.parse-result-table {
  width: 100%;
}

.parse-result-table__error {
  color: #b91c1c;
}
</style>
