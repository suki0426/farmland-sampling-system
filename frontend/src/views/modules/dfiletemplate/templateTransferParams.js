export function createTemplateImportForm (file) {
  const formBody = new FormData()
  formBody.append('file', file)
  return formBody
}

export function buildTemplateExportParams ({
  options = {},
  tablePage = {},
  searchForm = {}
}) {
  return {
    current: tablePage.currentPage,
    size: tablePage.pageSize,
    orders: tablePage.orders,
    ...searchForm,
    filename: options.filename,
    sheetName: options.sheetName,
    isHeader: options.isHeader,
    original: options.original,
    mode: options.mode,
    selectIds: options.mode === 'selected' ? options.data.map((item) => item.id) : [],
    exportFields: options.columns.map((column) => column.property && column.property.split('.')[0])
  }
}
