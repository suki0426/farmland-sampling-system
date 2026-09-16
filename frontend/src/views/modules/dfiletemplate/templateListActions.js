export function runTemplateListAction (viewModel, action) {
  viewModel.loading = true
  return Promise.resolve().then(action).finally(() => {
    viewModel.loading = false
  })
}

export function downloadTemplateFile (utils, data, filename) {
  utils.downloadExcel(data, filename)
}

export function showTemplateImportResult (message, data) {
  message.success({
    dangerouslyUseHTMLString: true,
    message: data
  })
}

export function logFileTransferError (err) {
  if (err && err.response) {
    console.log(err.response)
  }
}
