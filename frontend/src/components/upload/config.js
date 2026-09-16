import fileService from '@/api/file/fileService'

// 上传配置

export default {
  apiObj: fileService, // 上传请求API对象
  filename: 'file', // form请求时文件的key
  successCode: 200, // 请求完成代码
  maxSize: 500, // 最大文件大小 默认10MB
  parseData: function (res) {
    return {
      src: res // 分析图片远程地址结构
    }
  }
}
