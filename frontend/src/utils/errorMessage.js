export function resolveErrorMessage (error, fallback) {
  if (!error) return fallback
  if (error.message) return error.message
  if (error.response && error.response.data) {
    const data = error.response.data
    return data.message || data.msg || data
  }
  return fallback
}
