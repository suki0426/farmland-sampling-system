export function mockDelay (data, delay = 500) {
  return new Promise(resolve => {
    window.setTimeout(() => resolve({ data }), delay)
  })
}
