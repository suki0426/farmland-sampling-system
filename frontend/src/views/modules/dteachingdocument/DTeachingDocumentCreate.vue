<template>
  <div class="teaching-document-create-redirect" v-loading="true"></div>
</template>

<script>
export default {
  name: 'DTeachingDocumentCreate',
  created () {
    this.redirectToListDialog()
  },
  activated () {
    this.redirectToListDialog()
  },
  methods: {
    redirectToListDialog () {
      const query = this.$route.query || {}
      this.$router.replace({
        name: 'dteachingdocument-list',
        query: {
          openCreate: '1',
          docType: query.docType || '',
          templateId: query.templateId || '',
          preferredMethod: query.preferredMethod || 'manual'
        }
      })
    }
  }
}
</script>

<style scoped>
.teaching-document-create-redirect {
  min-height: 180px;
}
</style>
