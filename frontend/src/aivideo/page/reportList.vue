<template>
  <div id="scroll-board">
   <dv-border-box-13>
         <dv-scroll-board :config="config" ref="scrollBoard"  @click="showImg"/>
   </dv-border-box-13>
  </div>
</template>

<script>
import dataScreenService from '@/api/datav/dataScreenService'
export default {
  name: 'ReportList',
  data () {
    return {
      config: {
        header: [],
        data: [],
        index: true,
        columnWidth: [50, 170, 300],
        align: ['center'],
        rowNum: 7,
        headerBGC: '#1981f6',
        headerHeight: 45,
        oddRowBGC: 'rgba(0, 44, 81, 0.8)',
        evenRowBGC: 'rgba(10, 29, 50, 0.8)'
      },
      dataList: []
    }
  },
  methods: {
    // 获取数据列表
    refreshList () {
      this.loading = true
      dataScreenService.list({
        'pageNo': 1,
        'pageSize': -1
      }).then(({data}) => {
        console.log('获取数据列表', data)
        this.dataList = data.records
        // 设置图片
        this.$emit('showImg', this.dataList[0].screenShot)
        let dataList = this.transformData(this.dataList)
        this.getData(dataList)
      })
    },
    /**
     * 将给定的Vue2 JSON数据转换为指定格式的二维数组
     * @param {Array} vue2Data - 包含Vue2 JSON数据的数组
     * @returns {Array} - 转换后的二维数组
     */
    transformData (vue2Data) {
      const result = []

      // 遍历Vue2数据数组
      for (const item of vue2Data) {
        const createDate = item.createDate // 获取创建日期
        const typeName = item.name // 获取类型名称
        const price = item.status // 获取价格
        const barCode = item.status // 获取条形码

        // 将提取的数据放入一个新数组
        const newData = [createDate, typeName, price.toString(), barCode]

        // 将新数组添加到结果数组
        result.push(newData)
      }

      return result
    },
    // 获取数据
    getData (dataList) {
      this.config = {
        header: ['时间', '信息', '类型', '预留字段'],
        data: dataList,
        // data: [
        //   ['2023-07-01 19:25:00', '路面危害-松散', '5', 'xxxxxxx'],
        //   ['2023-07-02 17:25:00', '路面危害-路面油污清理', '13', 'xxxxxxx'],
        //   ['2023-07-03 16:25:00', '交安设施-交通标志牌结构', '6', 'xxxxxxx'],
        //   ['2023-07-04 15:25:00', '路基危害-防尘网', '2', 'xxxxxxx'],
        //   ['2023-07-05 14:25:00', '交安设施-交通标志牌结构', '1', 'xxxxxxx'],
        //   ['2023-07-06 13:25:00', '路面危害-松散', '3', 'xxxxxxx'],
        //   ['2023-07-07 12:25:00', '路基危害-防尘网', '4', 'xxxxxxx'],
        //   ['2023-07-08 11:25:00', '路面危害-路面油污清理', '2', 'xxxxxxx'],
        //   ['2023-07-09 10:25:00', '交安设施-交通标志牌结构', '5', 'xxxxxxx'],
        //   ['2023-07-10 09:25:00', '路基危害-防尘网', '3', 'xxxxxxx']
        // ],
        index: true,
        columnWidth: [50, 170, 300],
        align: ['center'],
        rowNum: 6,
        headerBGC: '#1981f6',
        headerHeight: 45,
        oddRowBGC: 'rgba(0, 44, 81, 0.8)',
        evenRowBGC: 'rgba(10, 29, 50, 0.8)'
      }
    },
    // 单击事件
    showImg (e) {
      console.log('文字列表页单击事件', e)
      // 获取列表中的图片
      this.$emit('showImg', this.dataList[e.rowIndex].image)
    }
  },
  mounted () {
    console.log('reportList-mounted')
    setInterval(this.refreshList(), 30000)
  }
}
</script>

<style lang="less">
#scroll-board {
  width: 100%;
  box-sizing: border-box;
  height: 100%;
  overflow: hidden;
}
.dv-scroll-board .header {
 background-color: rgba(19, 25, 47, 0.6) !important;
 font-size: 20px;
 font-weight: bold;
 padding-top: 10px;
}
// .border-box-content {
//    height: 514px !important;
// }
.rows {
   height: 450px !important;
}
</style>
