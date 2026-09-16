<template>
  <StructureWorkspaceLayout
    v-model="activeStepIndex"
    :loading="loading"
    :title="detail.title || '教学文档详情'"
    :tags="headerTags"
    :info-items="detailInfoItems"
    :sections="sections"
    back-text="返回列表"
    navigator-title="文档结构"
    navigator-mode="readonly"
    canvas-mode="readonly"
    @back="goList"
  >
    <template #actions>
      <el-button size="small" type="primary" @click="goList">完成查看</el-button>
    </template>
  </StructureWorkspaceLayout>
</template>

<script>
import dTeachingDocumentBusinessService from '@/api/dteachingdocument/dTeachingDocumentBusinessService'
import StructureWorkspaceLayout from '@/components/documentStructure/StructureWorkspaceLayout'
import { getTemplateDocTypeLabel } from '@/components/fileTemplate/constants'

export default {
  name: 'DTeachingDocumentDetail',
  components: {
    StructureWorkspaceLayout
  },
  data () {
    return {
      loading: false,
      activeStepIndex: 0,
      detail: {},
      sections: []
    }
  },
  computed: {
    docTypeLabel () {
      if (this.$dictUtils && this.$dictUtils.getDictLabel) {
        return this.$dictUtils.getDictLabel('teaching_doc_type', this.detail.docType, getTemplateDocTypeLabel(this.detail.docType) || '-')
      }
      return getTemplateDocTypeLabel(this.detail.docType) || '-'
    },
    statusLabel () {
      if (this.$dictUtils && this.$dictUtils.getDictLabel) {
        return this.$dictUtils.getDictLabel('teaching_doc_status', this.detail.status, this.detail.status || '-')
      }
      return this.detail.status || '-'
    },
    inputMethodLabel () {
      if (this.$dictUtils && this.$dictUtils.getDictLabel) {
        return this.$dictUtils.getDictLabel('teaching_input_method', this.detail.inputMethod, this.detail.inputMethod || '-')
      }
      return this.detail.inputMethod || '-'
    },
    headerTags () {
      return [
        { label: this.docTypeLabel },
        { label: this.statusLabel },
        { label: this.detail.templateName || '未关联模板' }
      ]
    },
    detailInfoItems () {
      return [
        { label: '课程名称', value: this.detail.courseName },
        { label: '课程编码', value: this.detail.courseCode },
        { label: '录入方式', value: this.inputMethodLabel },
        { label: '来源文件', value: this.detail.sourceFileName }
      ]
    }
  },
  created () {
    this.loadDetail()
  },
  activated () {
    const id = this.$route.query.id
    if (id) {
      this.loadDetail()
    }
  },
  methods: {
    async loadDetail () {
      const id = this.$route.query.id
      if (!id) {
        this.$message.warning('缺少教学文档 ID')
        this.goList()
        return
      }
      this.loading = true
      try {
        const { data } = await dTeachingDocumentBusinessService.queryDetail(id)
        const detail = data
        if (!detail) {
          this.$message.warning('未找到教学文档')
          this.goList()
          return
        }
        this.detail = detail

        // ========== 完整数据链路调试 ==========
        console.log('========== [数据链路] loadDetail 开始 ==========')
        console.log('[数据链路] detail 所有键:', detail ? Object.keys(detail) : 'null')
        console.log('[数据链路] detail.content 存在:', !!detail.content)
        console.log('[数据链路] detail.content 类型:', typeof detail.content, Array.isArray(detail.content))
        console.log('[数据链路] detail.content 长度:', detail.content ? detail.content.length : 'null')
        console.log('[数据链路] detail.contentJson:', detail.contentJson ? detail.contentJson.substring(0, 200) + '...' : 'null')
        console.log('[数据链路] detail.title:', detail.title)
        console.log('[数据链路] detail.template:', detail.template)

        // 优先使用 content 数据，如果没有则使用模板的 sections
        let sourceData = null
        let sourceName = ''
        if (detail.content && detail.content.length > 0) {
          sourceName = 'detail.content'
          sourceData = detail.content
          console.log(`[数据链路] ✅ 使用 ${sourceName}，长度:`, sourceData.length)
          console.log('[数据链路] 数据预览:', JSON.stringify(sourceData).substring(0, 500))
        } else if (detail.template && detail.template.sections && detail.template.sections.length > 0) {
          sourceName = 'detail.template.sections'
          sourceData = detail.template.sections
          console.log(`[数据链路] ✅ 使用 ${sourceName}，长度:`, sourceData.length)
        } else {
          console.log('[数据链路] ❌ 没有可用的数据源')
          console.log('[数据链路] detail.content 为空原因:', !detail.content ? 'content is null/undefined' : 'content.length === 0')
        }

        this.sections = this.normalizeDocumentSections(sourceData || [])
        console.log('[数据链路] 最终 sections 数量:', this.sections.length)
        console.log('========== [数据链路] loadDetail 结束 ==========')
        this.activeStepIndex = 0
      } catch (error) {
        this.$message.error(this.resolveErrorMessage(error))
      } finally {
        this.loading = false
      }
    },
    normalizeDocumentSections (sections) {
      console.log('========== [DEBUG] normalizeDocumentSections 开始 ==========')
      console.log('[DTeachingDocumentDetail] 输入 sections:', sections)
      console.log('[DTeachingDocumentDetail] 输入 sections 类型:', typeof sections, Array.isArray(sections))
      console.log('[DTeachingDocumentDetail] 输入 sections 长度:', sections ? sections.length : 'null')

      if (!sections || sections.length === 0) {
        console.log('[DTeachingDocumentDetail] 没有数据，返回空数组')
        console.log('========== [DEBUG] normalizeDocumentSections 结束 ==========')
        return []
      }

      // 深拷贝避免修改原数据
      const normalized = JSON.parse(JSON.stringify(sections))
      console.log('[DTeachingDocumentDetail] 深拷贝后 normalized 长度:', normalized.length)
      console.log('[DTeachingDocumentDetail] normalized[0] 的键:', normalized[0] ? Object.keys(normalized[0]) : 'null')

      // 检查数据是否已经是带 children 的分组结构
      const alreadyGrouped = this.isGroupedSections(normalized)
      console.log('[DTeachingDocumentDetail] alreadyGrouped:', alreadyGrouped)

      if (alreadyGrouped) {
        console.log('[DTeachingDocumentDetail] 数据已经是分组结构，使用分组逻辑')
        // 数据已经是分组结构，直接使用
        console.log('[DTeachingDocumentDetail] 文档标题 (用于过滤):', this.detail.title)

        const finalSections = normalized.filter(section => {
          const level = String(section.sectionLevel || section.level || '').trim()
          const title = section.sectionTitle || section.title || ''
          const isLevel1 = level === '1'
          const notSameAsDocTitle = title !== this.detail.title
          console.log(`[DTeachingDocumentDetail] 检查 section "${title}": level=${level}, isLevel1=${isLevel1}, notSameAsDocTitle=${notSameAsDocTitle}`)
          return isLevel1 && notSameAsDocTitle
        }).map(section => {
          const rawChildren = section.children || section.sections || []
          console.log(`[DTeachingDocumentDetail] section "${section.sectionTitle}" 的 children 数量:`, rawChildren.length)
          const children = rawChildren.map(block => ({
            ...block,
            componentType: block.componentType || 'richtext',
            value: block.value || block.defaultvalue || block.content || '',
            visibleFlag: block.visibleFlag !== undefined ? block.visibleFlag : '1'
          }))
          return {
            ...section,
            children: children
          }
        })
        console.log('[DTeachingDocumentDetail] 分组数据最终结果数量:', finalSections.length)
        console.log('[DTeachingDocumentDetail] 分组数据最终结果:', JSON.stringify(finalSections))
        console.log('========== [DEBUG] normalizeDocumentSections 结束 ==========')
        return finalSections
      }

      // 如果是扁平数据，需要先分组
      console.log('[DTeachingDocumentDetail] 扁平数据，开始分组...')
      const grouped = this.groupFlatSections(normalized)
      console.log('[DTeachingDocumentDetail] 分组后 grouped 数量:', grouped.length)
      console.log('[DTeachingDocumentDetail] 分组后 grouped:', JSON.stringify(grouped))

      const finalSections = grouped.filter(section => {
        const level = String(section.sectionLevel || section.level || '').trim()
        return level === '1'
      }).map(section => {
        const rawChildren = section.children || section.sections || []
        const children = rawChildren.map(block => ({
          ...block,
          componentType: block.componentType || 'richtext',
          value: block.value || block.defaultvalue || block.content || '',
          visibleFlag: block.visibleFlag !== undefined ? block.visibleFlag : '1'
        }))
        return {
          ...section,
          children: children
        }
      })

      console.log('[DTeachingDocumentDetail] 扁平数据最终结果数量:', finalSections.length)
      console.log('[DTeachingDocumentDetail] 扁平数据最终结果:', JSON.stringify(finalSections))
      console.log('========== [DEBUG] normalizeDocumentSections 结束 ==========')
      return finalSections
    },
    isGroupedSections (sections) {
      return sections.some(item => Array.isArray(item.children) || Array.isArray(item.sections))
    },
    groupFlatSections (sections) {
      const result = []
      let currentSection = null

      sections.forEach(item => {
        const level = String(item.sectionLevel || item.level || '').trim()
        const title = item.sectionTitle || item.title || item.level1Title || item.sectionTitle || ''
        const value = item.value || item.defaultvalue || item.content || ''

        if (level === '1') {
          // 一级标题：创建新的Section作为导航项
          currentSection = {
            ...item,
            sectionTitle: title || '未命名一级标题',
            sectionLevel: '1',
            children: []
          }
          result.push(currentSection)

          // 如果一级标题本身有内容，也添加到children中
          if (value) {
            currentSection.children.push({
              ...item,
              sectionTitle: title,
              componentType: 'richtext',
              value
            })
          }
        } else if (currentSection) {
          // 二级及以上标题：添加到当前Section的children中
          currentSection.children.push({
            ...item,
            sectionTitle: title || '未命名二级标题',
            componentType: 'richtext',
            value
          })
        } else {
          // 如果第一个条目不是一级标题，创建一个默认的一级标题容器
          currentSection = {
            sectionTitle: '未命名一级标题',
            sectionLevel: '1',
            children: []
          }
          result.push(currentSection)

          currentSection.children.push({
            ...item,
            sectionTitle: title || '未命名二级标题',
            componentType: 'richtext',
            value
          })
        }
      })

      return result
    },
    resolveErrorMessage (error) {
      if (error && error.message) return error.message
      if (error && error.response && error.response.data) return error.response.data
      return '教学文档详情加载失败'
    },
    goList () {
      this.$router.push({ name: 'dteachingdocument-list' })
    }
  }
}
</script>
