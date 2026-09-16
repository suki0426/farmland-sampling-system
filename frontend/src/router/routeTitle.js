export function updateDocumentTitle () {
  document.title = localStorage.getItem('productName') || '加载中...'
}
