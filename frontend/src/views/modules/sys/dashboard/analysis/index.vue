<template>
  <div class="el-scrollbar__wrap">
    <div class="el-scrollbar__view">
      <div class="analyze">
        <el-row class="m-3">
          <el-row :gutter="15">
            <el-col :span="12">
              <div class="card-panel">
                <div class="card-panel-icon-wrapper icon-location">
                  <i class="el-icon-s-claim card-panel-icon"></i>
                </div>
                <div class="card-panel-description">
                  <div class="card-panel-text">
                    门店数量
                  </div>
                  <count-to :start-val="0" :end-val="info[0]" :duration="maxinfo" class="card-panel-num" />
                </div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="card-panel">
                <div class="card-panel-icon-wrapper icon-sell">
                  <i class="el-icon-s-data card-panel-icon"></i>
                </div>
                <div class="card-panel-description">
                  <div class="card-panel-text">
                    平台用户数量
                  </div>
                  <count-to :start-val="0" :end-val="info[1]" :duration="maxinfo" class="card-panel-num" />
                </div>
              </div>
            </el-col>
            <!-- <el-col :span="6">
              <div class="card-panel">
                <div class="card-panel-icon-wrapper icon-sell">
                  <i class="el-icon-s-data card-panel-icon"></i>
                </div>
                <div class="card-panel-description">
                  <div class="card-panel-text">
                    正在进行
                  </div>
                  <count-to :start-val="0" :end-val="info[2]" :duration="maxinfo" class="card-panel-num" />
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="card-panel">
                <div class="card-panel-icon-wrapper icon-sell">
                  <i class="el-icon-s-data card-panel-icon"></i>
                </div>
                <div class="card-panel-description">
                  <div class="card-panel-text">
                    已完成
                  </div>
                  <count-to :start-val="0" :end-val="info[3]" :duration="maxinfo" class="card-panel-num" />
                </div>
              </div>
            </el-col> -->
            <!-- <el-col :span="6">
                                <div class="card-panel">
                                    <div class="card-panel-icon-wrapper icon-visit">
                                        <i class="el-icon-s-order card-panel-icon"></i>
                                    </div>
                                    <div class="card-panel-description">
                                        <div class="card-panel-text">
                                            订单量
                                        </div>
                                        <count-to :start-val="0" :end-val="info.totalVisit.num"
                                                  :duration="info.totalVisit.duration" class="card-panel-num"/>
                                    </div>
                                </div>
                            </el-col>
                            <el-col :span="6">
                                <div class="card-panel">
                                    <div class="card-panel-icon-wrapper icon-people">
                                        <i class="el-icon-user-solid card-panel-icon"></i>
                                    </div>
                                    <div class="card-panel-description">
                                        <div class="card-panel-text">
                                            新用户
                                        </div>
                                        <count-to :start-val="0" :end-val="info.totalVisit.num"
                                                  :duration="info.totalVisit.duration" class="card-panel-num"/>
                                    </div>
                                </div>
                            </el-col> -->
          </el-row>
        </el-row>
      </div>
    </div>
  </div>
</template>

<script>
/*eslint-disable */

import CountTo from 'vue-count-to'
import QuotaExplain from './QuotaExplain'
import ChartCard from './ChartCard'
import CellNum from './CellNum'
import VisitNum from './VisitNum'
export default {
  name: 'Analysis',
  components: {
    CountTo,
    CellNum,
    VisitNum,
    QuotaExplain,
    ChartCard
  },
  data () {
    return {
      info: [0, 0, 0, 0],
      maxinfo: 1
    }
  },
  watch: {
    '$route' (to, from) {
      if (to.path === '/sys/dashboard/analysis/index') {
        // 监听路由变化
        // 使用 to 和 from 访问新旧路由的参数和路径
        this.getinfo()
      }
    }
  },
  created () {
    this.getinfo()
  },
  methods: {
    getinfo () {
      // alarmLogService.queryStatus().then(({data}) => {
      //    console.log('ssss', data)
      //    this.$set(this.info, 0, data.aiBoxCount)
      //    this.$set(this.info, 1, data.todayAlgLogCount)
      // })
      // shopMerchantService.queryStatus().then(({data}) => {
      //    console.log('ssss', data)
      //    this.$set(this.info, 0, data.shopMerchantCount)
      //    this.$set(this.info, 1, data.shopUserCount)
      // })

      this.$set(this.info, 0, 100)
      this.$set(this.info, 1, 25489)
    }
  }
}
</script>

<style scoped lang="less">
.analyze {

  .top-1 {
    top: 0.55rem;
  }

  .mt-0 {
    margin-top: 0;
  }

  .m-3 {
    margin-bottom: 0.75rem;
  }

  .right-0 {
    right: 200px;
  }

  .absolute {
    position: absolute;
  }

  .float-left {
    float: left;
  }

  .flex {
    display: flex;
  }

  .card-panel {
    height: 108px;
    cursor: pointer;
    font-size: 12px;
    position: relative;
    overflow: hidden;
    color: #666;
    background: #ffffff;
    box-shadow: 4px 4px 40px rgba(0, 0, 0, .05);
    border-color: rgba(0, 0, 0, .05);

    &:hover {
      .card-panel-icon-wrapper {
        color: #fff;
      }

      .icon-sell {
        background: #6778fa;
      }

      .icon-people {
        background: #40c9c6;
      }

      .icon-location {
        background: #36a3f7;
      }

      .icon-visit {
        background: #f4516c;
      }
    }

    .icon-sell {
      color: #6778fa;
    }

    .icon-people {
      color: #40c9c6;
    }

    .icon-location {
      color: #36a3f7;
    }

    .icon-visit {
      color: #f4516c;
    }

    .card-panel-icon-wrapper {
      float: left;
      margin: 14px 0 0 14px;
      padding: 16px;
      transition: all 0.38s ease-out;
      border-radius: 6px;
    }

    .card-panel-icon {
      float: left;
      font-size: 48px;
    }

    .card-panel-description {
      float: right;
      font-weight: bold;
      margin: 26px;
      margin-left: 0px;

      .card-panel-text {
        line-height: 18px;
        color: rgba(0, 0, 0, 0.45);
        font-size: 16px;
        margin-bottom: 12px;
      }

      .card-panel-num {
        font-size: 20px;
      }
    }
  }
}

.el-scrollbar__wrap {
    overflow-x: hidden !important;
}
</style>
