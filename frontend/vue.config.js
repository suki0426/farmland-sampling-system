const path = require('path')
const webpack = require('webpack')
const CompressionPlugin = require('compression-webpack-plugin')
const zlib = require('zlib')
const ENV = process.env.NODE_ENV
const Timestamp = new Date().getTime();
const ISPROD = process.env.NODE_ENV === 'production'

function resolve (dir) {
  return path.join(__dirname, dir)
}

module.exports = {
  publicPath: "./",
  runtimeCompiler: true,
  productionSourceMap: false,
  chainWebpack: (config) => {
    config.resolve.alias.set('@/', resolve('src'))
    // config.plugins.delete('prefetch')
    // 删除需要预先加载(当前页面)的资源，当需要这些资源的时候，页面会自动加载
    config.plugins.delete('preload')
    // 删除需要预先获取(将来的页面)的资源
    config.plugins.delete('prefetch')
    // 配置 Babel 加载器
    config.module
      .rule('babel')
      .test(/\.js$/)
      .exclude.add(/node_modules/)
      .end()
      .use('babel-loader')
      .loader('babel-loader')
      .options({
        presets: ['@babel/preset-env']
      })
    // 只在生产环境中使用压缩插件
    if (process.env.NODE_ENV === 'production') {
      // Legacy vendor CSS in this project can break Vue CLI 4's extracted
      // CSS minifier. Skip that step to keep production builds stable.
      config.plugins.delete('optimize-css')
      // 使用 compression-webpack-plugin 进行文件压缩 
      config.plugin('compressionPlugin').use(new CompressionPlugin({
        test: /\.(js|css|less)$/, // 匹配文件名
        threshold: 1024, // 对超过10k的数据压缩
        deleteOriginalAssets: false, // 不删除源文件
        minRatio: 0.8, // 压缩比
      }))
    }
  },
  css: {
    loaderOptions: {
      less: {
        modifyVars: {
        },
        javascriptEnabled: true,
      }
    }
  },

  // 入口设置
  pages: {
    index: {
      entry: 'src/main.js',
      template: 'public/index.html',
      title: 'index.html',
      filename: 'index.html'
    },
    aivideo: {
      entry: 'src/aivideo/main.js',
      template: 'src/aivideo/index.html',
      title: '',
      filename: 'aivideo.html',
      chunks: ['chunk-vendors', 'chunk-common', 'aivideo']
    },
    // 1号(前端GIS) 新增：独立 GIS 演示入口，无需登录/后端菜单即可访问
    // 访问地址：http://localhost:3000/gis.html
    gis: {
      entry: 'src/gisdemo/main.js',
      template: 'src/gisdemo/index.html',
      title: '农田智能采样GIS演示',
      filename: 'gis.html',
      chunks: ['chunk-vendors', 'chunk-common', 'gis']
    }
  },
  devServer: {
    index: '/index.html', // 运行时，默认打开index页面
    port: 3000,
    proxy: {
      // 通用代理规则
      '/58.87.103.192:3333': {
        target: process.env.VUE_APP_SERVER_URL,
        changeOrigin: true,
        pathRewrite: {
          '^/58.87.103.192:3333': '/58.87.103.192:3333' // 保持路径不变
        }
      },
      '/api': {
        target: process.env.VUE_APP_SERVER_URL,
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        }
      },
      '/file': {
        target: process.env.VUE_APP_SERVER_URL,
        changeOrigin: true,
        pathRewrite: {
          '^/file': '/file'
        }
      },
      '/live': {
        target: process.env.VUE_APP_SERVER_URL,
        changeOrigin: true,
        pathRewrite: {
          '^/live': ''
        }
      },
    }
  },

  lintOnSave: false
}
