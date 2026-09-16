// 初始化地图
export default {
  init () {
    return new Promise((resolve, reject) => {
       // 如果已加载直接返回
      if (window.T) {
        console.log('天地图脚本初始化成功...')
        resolve(window.T)
        reject('初始化地图-error')
      }
    })
  }
}
