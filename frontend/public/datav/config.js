window.$website = {
  isDemo: false,
  isDemoTip: '演示环境不允许操作',
  title: '数据大屏',
  name: 'WELCOME TO DATAV',
  subName: '可视化数据大屏（演示环境-请勿放生产数据）',
  url: '',
  autoSave: false,
  autoSaveTime: 60000,
  tabsList: [0, 1, 2, 3, 4, 5, 6],
  componentsList: [{
    name: 'test',
    component: 'testComponents',
    option: 'testOption',
    data: true
  }],
  baseList: [{
    label: '图表',
    icon: 'icon-bar',
    children: [{
      label: '通用型',
      option: {
        name: '通用型',
        title: '通用型',
        icon: 'icon-bar',
        img: '/datav/img/assets/text5.png',
        dataType: 1,
        'dataMethod': 'get',
        data: {
          'categories': [
            '苹果',
            '三星',
            '小米',
            'oppo',
            'vivo'
          ],
          'series': [{
            name: '手机品牌',
            data: [
              1000879,
              3400879,
              2300879,
              5400879,
              3400879
            ]
          }]
        },
        echartFormatter: "(data,params)=>{\nconsole.log(data);\nreturn {\n            title: {\n\t\t\t\t textStyle: {\n\t\t\t\t\tfontWeight: 'normal',      \n\t\t\t\t\tcolor: '#fff'\n\t\t\t\t},\n                text: 'ECharts 入门示例'\n            },\n            tooltip: {},\n            legend: {\n                data:['销量'],\n\t\t\t\ttextStyle: {\n\t\t\t\t\tfontWeight: 'normal',      \n\t\t\t\t\tcolor: '#fff'\n\t\t\t\t},\n            },\n            xAxis: {\n                data: [\'衬衫\',\'羊毛衫\',\'雪纺衫\',\'裤子\',\'高跟鞋\',\'袜子\']\n            },\n            yAxis: {},\n            series: [{\n                name: '销量',\n                type: 'bar',\n                data: [5, 20, 36, 10, 10, 20]\n            }]\n        };\n}",
        dataFormatter: '',
        stylesFormatter: '',
        'url': '/bar',
        component: {
          width: 600,
          height: 300,
          name: 'common',
          prop: 'common'
        }
      }
    }, {
      label: 'datav',
      option: {
        name: 'datav',
        title: 'datav',
        icon: 'icon-datav',
        img: '/datav/img/assets/text6.png',
        dataType: 0,
        'dataMethod': 'get',
        data: {
          value: 66
        },
        dataFormatter: '',
        echartFormatter: '(data,params)=>{\n  console.log(data);\n  return {\n    config:{\n\t    data: [66] \n\t  }\n  }\n}',

        component: {
          width: 150,
          height: 200,
          name: 'datav',
          prop: 'datav'
        },
        option: {
          is: 'dv-water-level-pond'
        }
      }
    }, {
      label: '柱形图',
      option: {
        name: '柱状图',
        title: '柱状图',
        icon: 'icon-bar',
        img: '/datav/img/assets/bar.png',
        data: {
          categories: [
            '苹果',
            '三星',
            '小米',
            'oppo',
            'vivo'
          ],
          series: [{
            name: '手机品牌',
            data: [
              1000879,
              3400879,
              2300879,
              5400879,
              3400879
            ]
          }]
        },
        dataType: 0,
        dataFormatter: '',
        stylesFormatter: '',
        component: {
          width: 600,
          height: 300,
          name: 'bar',
          prop: 'bar'
        },
        option: {
          gridX: 90,
          gridY: 47,
          gridX2: 43,
          gridY2: 25,
          legend: true,
          tipShow: true,
          xAxisShow: true,
          yAxisShow: true,
          barWidth: 30,
          barRadius: 8,
          barColor: [{
            color1: '#83bff6',
            color2: '#188df0',
            postion: 90
          }, {
            color1: '#23B7E5',
            color2: '#564AA3',
            postion: 50
          }],
          barMinHeight: 2
        }
      }
    }, {
      label: '折线图',
      option: {
        name: '折线图',
        title: '折线图',
        icon: 'icon-line',
        img: '/datav/img/assets/line.png',
        data: {
          categories: [
            '苹果',
            '三星',
            '小米',
            'oppo',
            'vivo'
          ],
          series: [{
            name: '手机品牌',
            data: [
              1000879,
              3400879,
              2300879,
              5400879,
              3400879
            ]
          }]
        },
        dataType: 0,
        dataFormatter: '',
        stylesFormatter: '',
        component: {
          width: 600,
          height: 300,
          name: 'line',
          prop: 'line'
        },
        option: {
          gridX: 84,
          gridY: 35,
          gridX2: 26,
          gridY2: 31,
          legend: true,
          tipShow: true,
          xAxisShow: true,
          yAxisShow: true,
          barColor: [{
            color1: '#83bff6',
            color2: '#188df0',
            postion: 90
          }, {
            color1: '#23B7E5',
            color2: '#564AA3',
            postion: 50
          }],
          symbolShow: true,
          symbolSize: 6,
          smooth: true
        }
      }
    }, {
      label: '饼图',
      option: {
        name: '饼图',
        title: '饼图',
        icon: 'icon-pie',
        img: '/datav/img/assets/pie.png',
        data: [{
          name: '苹果',
          value: 1000879,
          url: 'http://www.baidu.com'
        }, {
          name: '三星',
          value: 3400879,
          url: 'http://www.baidu.com'
        }, {
          name: '小米',
          value: 2300879,
          url: 'http://www.baidu.com'
        }, {
          name: 'oppo',
          value: 5400879,
          url: 'http://www.baidu.com'
        }, {
          name: '大疆',
          value: 3000,
          url: 'http://www.baidu.com'
        }],
        dataType: 0,
        dataFormatter: '',
        stylesFormatter: '',
        component: {
          width: 600,
          height: 300,
          name: 'pie',
          prop: 'pie'
        },
        option: {
          legend: true,
          labelShow: true,
          barColor: [
            {
              color1: '#83bff6'
            },
            {
              color1: '#23B7E5'
            },
            {
              color1: 'rgba(154, 168, 212, 1)'
            },
            {
              color1: '#188df0'
            },
            {
              color1: '#564AA3'
            }
          ]
        }
      }
    }, {
      label: '象形图',
      option: {
        title: '象形图',
        name: '象形图',
        icon: 'icon-pictorialBar',
        img: '/datav/img/assets/bar2.png',
        data: [{
          name: '苹果',
          value: 1000879
        }, {
          name: '三星',
          value: 3400879
        }, {
          name: '小米',
          value: 2300879
        }, {
          name: 'oppo',
          value: 5400879
        }, {
          name: '大疆',
          value: 3000
        }, {
          name: '抖音',
          value: 2000
        }],
        dataType: 0,
        dataFormatter: '',
        stylesFormatter: '',
        component: {
          width: 600,
          height: 300,
          name: 'pictorialbar',
          prop: 'pictorialbar'
        },
        option: {
          symbolSize: 30,
          split: 30,
          symbol: '/datav/img/source/source256.png',
          labelFontSize: '24',
          labelColor: '#4dffff',
          fontSize: 20,
          color: '#fff',
          gridX: 76,
          gridY: 4,
          gridX2: 127,
          gridY2: 0
        }
      }
    }, {
      label: '雷达图',
      option: {
        title: '雷达图',
        name: '雷达图',
        icon: 'icon-radar',
        img: '/datav/img/assets/radar.png',
        dataType: 0,
        data: {
          indicator: [{
            name: '销售',
            max: 6500
          },
          {
            name: '管理',
            max: 16000
          },
          {
            name: '信息技术',
            max: 30000
          },
          {
            name: '客服',
            max: 38000
          },
          {
            name: '研发',
            max: 52000
          },
          {
            name: '市场',
            max: 25000
          }
          ],
          series: [{
            data: [{
              value: [4300, 10000, 28000, 35000, 50000, 19000],
              name: '预算分配（Allocated Budget）'
            },
            {
              value: [5000, 14000, 28000, 31000, 42000, 21000],
              name: '实际开销（Actual Spending）'
            }
            ]
          }]
        },
        dataFormatter: '',
        stylesFormatter: '',
        component: {
          width: 970,
          height: 400,
          name: 'radar',
          prop: 'radar'
        },
        option: {
          width: '100%',
          height: 600,
          color: '#fff',
          fontSize: 18,
          areaOpacity: 0.3,
          legend: true,
          tipShow: true,
          barColor: [{
            color1: '#564AA3'
          },
          {
            color1: '#188df0'
          }]
        }
      }
    }, {
      label: '散点图',
      option: {
        title: '散点图',
        name: '散点图',
        icon: 'icon-scatter',
        img: '/datav/img/assets/scatter.png',
        dataType: 0,
        data: [{
          data: [
            [1, 8.04],
            [2, 6.95]
          ]
        },
        {
          data: [
            [1, 4.04],
            [2, 3.95]
          ]
        }],
        dataFormatter: '',
        stylesFormatter: '',
        component: {
          width: 600,
          height: 300,
          name: 'scatter',
          prop: 'scatter'
        },
        option: {
          gridX: 26,
          gridY: 12,
          gridX2: 14,
          gridY2: 30,
          lineSize: 25,
          tipShow: true,
          labelShow: true,
          legend: true,
          xAxisSplitLineShow: true,
          yAxisSplitLineShow: true,
          barColor: [{
            postion: 0.2,
            color1: '#91c7ae'
          },
          {
            postion: 0.8,
            color1: '#63869e'
          },
          {
            postion: 1,
            color1: '#c23531'
          }]
        }
      }
    }, {
      label: '漏斗图',
      option: {
        title: '漏斗图',
        name: '漏斗图',
        icon: 'icon-funnel',
        img: '/datav/img/assets/funnel.png',
        dataType: 0,
        data: [
          { value: 60, name: 'Visit' },
          { value: 40, name: 'Inquiry' },
          { value: 20, name: 'Order' },
          { value: 80, name: 'Click' },
          { value: 100, name: 'Show' }
        ],
        dataFormatter: '',
        stylesFormatter: '',
        component: {
          width: 450,
          height: 350,
          name: 'funnel',
          prop: 'funnel'
        },
        option: {
          legend: true,
          labelShow: true,
          tipShow: true,
          barColor: [{
            color1: '#83bff6'
          },
          {
            color1: '#23B7E5'
          },
          {
            color1: 'rgba(154, 168, 212, 1)'
          },
          {
            color1: '#188df0'
          },
          {
            color1: '#564AA3'
          }]
        }
      }
    }, {
      label: '地图',
      option: {
        name: '地图',
        title: '地图',
        icon: 'icon-map',
        img: '/datav/img/assets/map.png',
        dataType: 0,
        data: [
          {
            name: '测试坐标1',
            value: 1,
            lng: 118.30078125,
            lat: 36.91915611148194,
            zoom: 1
          },
          {
            name: '测试坐标2',
            value: 1,
            lng: 112.21435546875,
            lat: 37.965854128749434,
            zoom: 1
          }
        ],
        formatter: "(name,data)=>{\n  return '名称:'+name.data.name+name.data.value\n}",
        dataFormatter: '',
        stylesFormatter: '',
        component: {
          width: 800,
          height: 607,
          name: 'map',
          prop: 'map'
        },
        option: {
          tipBackgroundColor: 'rgba(13, 255, 255, .5)',
          tipColor: 'rgba(217, 38, 10, 1)',
          tipFontSize: '30',
          borderWidth: 1,
          scale: 87,
          type: 0,
          borderColor: '#0dffff',
          areaColor: 'rgba(6, 29, 51, 0.59)',
          banner: true,
          bannerTime: 3000,
          fontSize: 14,
          zoom: 0.5,
          roam: true,
          empAreaColor: 'rgba(35, 183, 229, 0.42)',
          empColor: 'rgba(217, 38, 10, 1)',
          index: '894edc1d-d2f0-4616-962c-8e61083ada71',
          mapData: '',
          color: 'rgba(13, 255, 255, 1)'
        }
      }
    }, {
      label: '矩形图',
      option: {
        name: '矩形图',
        title: '矩形图',
        icon: 'icon-juxing',
        img: '/datav/img/assets/rectangle.png',
        data: [
          {
            name: '分类 1',
            value: 560
          },
          {
            name: '分类 2',
            value: 500
          },
          {
            name: '分类 3',
            value: 150
          },
          {
            name: '分类 4',
            value: 140
          },
          {
            name: '分类 5',
            value: 115
          },
          {
            name: '分类 6',
            value: 95
          },
          {
            name: '分类 7',
            value: 90
          },
          {
            name: '分类 8',
            value: 75
          },
          {
            name: '分类 9',
            value: 98
          },
          {
            name: '分类 10',
            value: 60
          },
          {
            name: '分类 11',
            value: 45
          },
          {
            name: '分类 12',
            value: 40
          },
          {
            name: '分类 13',
            value: 40
          },
          {
            name: '分类 14',
            value: 35
          },
          {
            name: '分类 15',
            value: 40
          },
          {
            name: '分类 16',
            value: 40
          },
          {
            name: '分类 17',
            value: 40
          },
          {
            name: '分类 18',
            value: 30
          },
          {
            name: '分类 19',
            value: 28
          },
          {
            name: '分类 20',
            value: 16
          }
        ],
        dataType: 0,
        component: {
          width: 754,
          height: 377,
          name: 'rectangle',
          prop: 'rectangle'
        },
        option: {
          tipShow: true,
          labelShow: true,
          labelShowColor: '#fff',
          labelShowFontSize: 14
        }
      }
    }, {
      label: '定时器',
      option: {
        name: '定时器',
        title: '定时器',
        icon: 'icon-datetime',
        img: '/datav/img/assets/time.png',
        echartFormatter: '(refs)=>{\n    console.log(refs)\n}',
        component: {
          width: 100,
          height: 100,
          name: 'time',
          prop: 'time'
        },
        option: {
          time: 0
        }
      }
    }, {
      label: '自定义Vue组件',
      option: {
        name: '自定义Vue组件',
        title: '自定义Vue组件',
        icon: 'icon-bar',
        img: '/datav/img/assets/text4.png',
        dataType: 0,
        data: {
          name: 'avue'
        },
        dataFormatter: '',
        stylesFormatter: '',
        component: {
          width: 800,
          height: 500,
          name: 'vue',
          prop: 'vue'
        },
        option: {
          content: '<template>\n    <div class="test">\n        <h1 @click="handleClick">{{$parent.dataChart}}<h1>\n    </div>\n</template>\n<script>\nexport default{\n    data(){\n        return{\n            \n        }\n    },\n    created(){\n        console.log(this.$parent);\n    },\n    methods:{\n        handleClick(){\n            this.$message.success(this.dataChart.name)\n        }\n    }\n}\n</script>\n<style>\n    .test{\n        text-align:center;\n        color:red;\n        font-size:40px;\n    }\n</style>'
        }
      }
    }]
  }, {
    label: '文字',
    icon: 'icon-text',
    children: [{
      label: '文本框',
      option: {
        title: '文本框',
        name: '文本框',
        icon: 'icon-text',
        img: '/datav/img/assets/text.png',
        dataType: 0,
        dataFormatter: '',
        stylesFormatter: '',
        child: {
          index: [],
          paramName: ''
        },
        data: {
          value: '文本框'
        },
        component: {
          width: 100,
          height: 40,
          name: 'text',
          prop: 'text'
        },
        option: {
          textAlign: 'center',
          fontSize: 26,
          fontWeight: 'normal',
          color: '#fff'
        }
      }
    }, {
      label: '跑马灯',
      option: {
        title: '跑马灯',
        name: '跑马灯',
        icon: 'icon-scroll',
        img: '/datav/img/assets/text2.png',
        top: 0,
        left: 0,
        dataType: 0,
        data: {
          value: '跑马灯'
        },
        dataFormatter: '',
        stylesFormatter: '',
        component: {
          width: 100,
          height: 50,
          name: 'text',
          prop: 'text'
        },
        option: {
          scroll: true,
          speed: 70,
          textAlign: 'center',
          fontSize: 26,
          fontWeight: 'normal',
          color: '#fff'
        }
      }
    }, {
      label: '超链接',
      option: {
        title: '超链接',
        name: '超链接',
        icon: 'icon-link',
        img: '/datav/img/assets/text3.png',
        top: 0,
        left: 0,
        data: {
          value: '超链接'
        },
        dataType: 0,
        dataFormatter: '',
        stylesFormatter: '',
        component: {
          width: 100,
          height: 50,
          name: 'text',
          prop: 'text'
        },
        option: {
          link: true,
          linkHref: 'http://avue.top',
          linkTarget: '_self',
          textAlign: 'center',
          fontSize: 26,
          fontWeight: 'normal',
          color: '#fff'
        }
      }
    }, {
      label: '实时时间',
      option: {
        name: '实时时间',
        title: '实时时间',
        icon: 'icon-datetime',
        img: '/datav/img/assets/datetime.png',
        top: 78,
        left: 1604,
        component: {
          width: 250,
          height: 50,
          name: 'datetime',
          prop: 'datetime'
        },
        option: {
          format: 'yyyy-MM-dd hh:mm:ss',
          color: '#fff',
          textAlign: 'left',
          fontSize: 24,
          fontWeight: 'normal'
        }
      }
    }]
  }, {
    label: '媒体',
    icon: 'icon-img',
    children: [{
      label: '图片',
      option: {
        title: '图片',
        name: '图片',
        icon: 'icon-img',
        img: '/datav/img/assets/img.png',
        top: 0,
        left: 0,
        dataType: 0,
        data: {
          value: '/datav/img/img-default.png'
        },
        dataFormatter: '',
        stylesFormatter: '',
        component: {
          width: 180,
          height: 120,
          name: 'img',
          prop: 'img'
        },
        option: {
          duration: '1000'
        }
      }
    }, {
      label: '图片框',
      option: {
        title: '图片框',
        name: '图片框',
        icon: 'icon-img',
        img: '/datav/img/assets/imgborder.png',
        top: 0,
        left: 0,
        dataType: 0,
        data: '/datav/img/border/border1.png',
        component: {
          width: 140,
          height: 140,
          name: 'imgborder',
          prop: 'imgborder'
        },
        option: {
          backgroundColor: 'rgba(180, 181, 198, 0.1)'
        }
      }
    }, {
      label: '轮播图',
      option: {
        title: '轮播图',
        name: '轮播图',
        icon: 'icon-banner',
        img: '/datav/img/assets/swiper.png',
        top: 0,
        left: 0,
        dataType: 0,
        data: [{
          value: 'https://datav/img.alicdn.com/tfs/TB1v28TC8v0gK0jSZKbXXbK2FXa-1880-640.jpg'
        }, {
          value: 'https://datav/img.alicdn.com/tfs/TB1uevcCrj1gK0jSZFuXXcrHpXa-1880-640.jpg'
        }, {
          value: 'http://www.w3school.com.cn/i/movie.ogg'
        }],
        dataFormatter: '',
        stylesFormatter: '',
        component: {
          width: 670,
          height: 370,
          name: 'swiper',
          prop: 'swiper'
        },
        option: {
          type: '',
          interval: 5000,
          opacity: 100,
          indicator: 'none',
          autoplay: true,
          controls: true,
          loop: true
        }
      }
    }, {
      label: 'iframe',
      option: {
        title: 'iframe',
        name: 'iframe',
        icon: 'icon-iframe',
        img: '/datav/img/assets/iframe.png',
        top: 0,
        left: 0,
        component: {
          width: 670,
          height: 370,
          option: {},
          name: 'iframe',
          prop: 'iframe'
        },
        dataType: 0,
        data: {
          value: 'https://avuejs.com'
        },
        dataFormatter: '',
        stylesFormatter: '',
        option: {}
      }
    }, {
      label: 'video播放器',
      option: {
        title: 'video',
        name: 'video',
        icon: 'icon-video',
        img: '/datav/img/assets/video.png',
        top: 0,
        left: 0,
        dataType: 0,
        data: {
          value: 'http://www.w3school.com.cn/i/movie.ogg'
        },
        option: {
          autoplay: false,
          controls: true,
          loop: true,
          poster: ''
        },
        dataFormatter: '',
        stylesFormatter: '',
        component: {
          width: 670,
          height: 370,
          name: 'video',
          prop: 'video'
        }
      }
    }, {
      label: 'hls播放器',
      option: {
        title: 'hls',
        name: 'hls',
        icon: 'icon-video',
        img: '/datav/img/assets/video.png',
        top: 0,
        left: 0,
        dataType: 0,
        data: {
          value: 'https://open.ys7.com/v3/openlive/E10668433_1_1.m3u8?expire=1664027961&id=363444666731335680&t=346b970f0d5cb5d5b5e4734d966275a61fb9efd5038c7a75b7435423c5716908&ev=100'
        },
        option: {
          autoplay: true
        },
        dataFormatter: '',
        stylesFormatter: '',
        component: {
          width: 670,
          height: 370,
          option: {},
          name: 'clapper',
          prop: 'clapper'
        }
      }
    }]
  }, {
    label: '指标',
    icon: 'icon-flop',
    children: [{
      label: '翻牌器',
      option: {
        title: '翻牌器',
        name: '翻牌器',
        icon: 'icon-flop',
        img: '/datav/img/assets/flop.png',
        top: 0,
        left: 0,
        dataType: 0,
        child: {
          index: [],
          paramName: ''
        },
        data: {
          value: '12345'
        },
        dataFormatter: '',
        stylesFormatter: '',
        component: {
          width: 445.6,
          height: 86.56,
          name: 'flop',
          prop: 'flop'
        },
        option: {
          textAlign: 'center',
          paddingLeft: 10,
          marginLeft: 10,
          border: true,
          borderColor: '#fff',
          borderWidth: 10,
          backgroundBorder: '/datav/img/border/border1.png',
          fontSize: 50,
          color: '#afdef2',
          backgroundColor: '#132d4f'
        }
      }
    }, {
      label: '颜色块',
      option: {
        title: '颜色块',
        name: '颜色块',
        icon: 'icon-flop',
        img: '/datav/img/assets/flop2.png',
        'child': {
          'index': [],
          'paramName': ''
        },
        top: 0,
        left: 0,
        dataType: 0,
        data: [{
          backgroundColor: '#67C23A',
          prefixText: '某某某总人数',
          value: '12345',
          suffixText: '人'
        }, {
          backgroundColor: '#409EFF',
          prefixText: '某某某总人数',
          value: '12345',
          suffixText: '人'
        }, {
          backgroundColor: '#E6A23C',
          prefixText: '某某某总人数',
          value: '12345',
          suffixText: '人'
        }, {
          backgroundColor: '#F56C6C',
          prefixText: '某某某总人数',
          value: '12345',
          suffixText: '人'
        }, {
          backgroundColor: '#7232dd',
          prefixText: '某某某总人数',
          value: '12345',
          suffixText: '人'
        }, {
          backgroundColor: 'blue',
          prefixText: '某某某总人数',
          value: '12345',
          suffixText: '人'
        }],
        dataFormatter: '',
        stylesFormatter: '',
        component: {
          width: 543.04,
          height: 196.28,
          name: 'flop',
          prop: 'flop'
        },
        option: {
          width: 180,
          whole: true,
          fontSize: 28,
          prefixFontSize: 13,
          backgroundColor: '#F56C6C',
          suffixFontSize: 18,
          marginTop: 10,
          marginLeft: 5,
          paddingTop: 10,
          paddingLeft: 30,
          color: '#fff',
          suffixInline: true,
          fontWeight: 'bolder'
        }
      }
    }, {
      label: '环形图',
      option: {
        title: '环形图',
        name: '环形图',
        icon: 'icon-circle',
        img: '/datav/img/assets/progress.png',
        top: 0,
        left: 0,
        dataType: 0,
        data: {
          label: '人数增涨',
          value: 40,
          data: 80
        },
        dataFormatter: '',
        stylesFormatter: '',
        component: {
          width: 300,
          height: 300,
          name: 'progress',
          prop: 'progress'
        },
        option: {
          type: 'circle',
          color: '#60d3da',
          fontSize: 25,
          suffixColor: '#60d3da',
          strokeWidth: 20,
          fontWeight: 'normal',
          borderColor: '#60d3da',
          suffixFontSize: 30,
          FontWeight: 'normal'
        }
      }
    }, {
      label: '进度条',
      option: {
        title: '进度条',
        name: '进度条',
        icon: 'icon-progress',
        img: '/datav/img/assets/progress2.png',
        top: 0,
        left: 0,
        data: {
          label: '人数增涨',
          value: 40,
          data: 80
        },
        dataType: 0,
        dataFormatter: '',
        stylesFormatter: '',
        component: {
          width: 500,
          height: 100,
          name: 'progress',
          prop: 'progress'
        },
        option: {
          type: 'line',
          color: '#60d3da',
          fontSize: 25,
          suffixColor: '#60d3da',
          strokeWidth: 10,
          fontWeight: 'normal',
          borderColor: '#60d3da',
          suffixFontSize: 30,
          FontWeight: 'normal'
        }
      }
    }, {
      label: '仪表盘',
      option: {
        title: '仪表盘',
        icon: 'icon-gauge',
        img: '/datav/img/assets/gauge.png',
        name: '仪表盘',
        dataType: 0,
        data: {
          value: 4
        },
        dataFormatter: '',
        stylesFormatter: '',
        component: {
          width: 390,
          height: 314,
          name: 'gauge',
          prop: 'gauge'
        },
        option: {
          lineSize: 15,
          axisLabelShow: true,
          axisLabelFontSize: 15,
          nameFontSize: 40,
          lineColor: '#eee',
          barColor: [
            {
              color1: 'rgba(154, 168, 212, 1)',
              postion: '0.2'
            },
            {
              color1: '#23B7E5',
              postion: '0.8'
            },
            {
              color1: '#564AA3',
              postion: '1'
            }
          ]
        }
      }
    }, {
      label: '字符云',
      option: {
        title: '字符云',
        name: '字符云',
        icon: 'icon-wordCloud',
        img: '/datav/img/assets/wordcloud.png',
        top: 0,
        left: 0,
        dataType: 0,
        data: [{
          name: '三星',
          value: '1'
        }, {
          name: '小米',
          value: '10'
        }, {
          name: '华为',
          value: '20'
        }, {
          name: 'oppo',
          value: '30'
        }, {
          name: '抖音',
          value: '40'
        }, {
          name: '快手',
          value: '50'
        }, {
          name: '淘宝',
          value: '60'
        }, {
          name: '百度',
          value: '70'
        }, {
          name: '京东',
          value: '80'
        }, {
          name: '天猫',
          value: '100'
        }, {
          name: '字符1',
          value: '110'
        }, {
          name: '字符1',
          value: '200',
          textStyle: {
            color: 'red'
          }
        }],
        dataFormatter: '',
        stylesFormatter: '',
        component: {
          name: 'wordcloud',
          prop: 'wordcloud',
          width: 600,
          height: 300
        },
        option: {
          minFontSize: 30,
          maxFontSize: 80,
          split: 30,
          rotate: true
        }
      }
    }]
  }, {
    label: '表格',
    icon: 'icon-table',
    children: [{
      label: '表格',
      option: {
        title: '表格',
        name: '表格',
        icon: 'icon-table',
        img: '/datav/img/assets/table.png',
        top: 0,
        left: 0,
        dataType: 0,
        data: [{
          type1: '数据1',
          type2: '数据1'
        }, {
          type1: '数据2',
          type2: '数据2'
        }, {
          type1: '数据3',
          type2: '数据3'
        }, {
          type1: '数据4',
          type2: '数据4'
        }],
        dataFormatter: '',
        stylesFormatter: '',
        component: {
          width: 700,
          height: 350,
          name: 'table',
          prop: 'table'
        },
        option: {
          showHeader: true,
          columnShow: true,
          columnViews: true,
          headerBackground: '#050e18',
          headerColor: '#69bfe7',
          headerTextAlign: 'center',
          nthColor: '#09192c',
          bodyBackground: 'rgba(0, 0, 0, 0.01)',
          bodyColor: '#69bfe7',
          bodyTextAlign: 'center',
          align: 'center',
          headerAlign: 'center',
          header: false,
          scrollSpeed: 1,
          fontSize: 15,
          count: 4,
          index: true,
          column: [
            {
              label: '列1',
              prop: 'type1',
              $index: 0
            },
            {
              label: '列2',
              prop: 'type2',
              $index: 1
            },
            {
              label: '列3',
              prop: 'type3',
              $index: 2
            },
            {
              label: '列4',
              prop: 'type4',
              $index: 3
            }
          ],
          othColor: '#142a40',
          headerFontSize: 20,
          bodyFontSize: 18
        }
      }
    }, {
      label: '选项卡',
      option: {
        title: '选项卡',
        name: '选项卡',
        icon: 'icon-tabs',
        img: '/datav/img/assets/tabs.png',
        child: {
          index: [],
          paramName: ''
        },
        dataFormatter: '',
        stylesFormatter: '',
        dataType: 0,
        data: [
          {
            label: '选项卡1',
            value: '1'
          },
          {
            label: '选项卡2',
            value: '2'
          }
        ],
        component: {
          width: 356,
          height: 46,
          name: 'tabs',
          prop: 'tabs'
        },
        option: {
          type: 'tabs',
          color: '#eee',
          empColor: '#4dffff',
          fontSize: 20,
          split: 8,
          empBackgroundImage: '/datav/img/banner/banner5.png',
          backgroundImage: '/datav/img/banner/banner4.png'
        }
      }
    } ]
  }, {
    label: '边框',
    icon: 'icon-biankuang',
    children: [{
      label: '边框1',
      option: {
        title: '边框1',
        name: 'datav',
        icon: 'icon-biankuang',
        img: '/datav/img/assets/borderBox/borderBox_01.gif',
        top: 0,
        left: 0,
        data: {},
        component: {
          width: 300,
          height: 150,
          name: 'borderBox',
          prop: 'borderBox'
        },
        option: {
          type: 1,
          color1: '#83bff6',
          color2: '#00CED1',
          dur: undefined
        }
      }
    }, {
      label: '边框2',
      option: {
        title: '边框2',
        name: 'datav',
        icon: 'icon-biankuang',
        img: '/datav/img/assets/borderBox/borderBox_02.png',
        top: 0,
        left: 0,
        data: {},
        component: {
          width: 300,
          height: 150,
          name: 'borderBox',
          prop: 'borderBox'
        },
        option: {
          type: 2,
          color1: '#83bff6',
          color2: '#00CED1',
          dur: undefined
        }
      }
    }, {
      label: '边框3',
      option: {
        title: '边框3',
        name: 'datav',
        icon: 'icon-biankuang',
        img: '/datav/img/assets/borderBox/borderBox_03.png',
        top: 0,
        left: 0,
        data: {},
        component: {
          width: 300,
          height: 150,
          name: 'borderBox',
          prop: 'borderBox'
        },
        option: {
          type: 3,
          color1: '#83bff6',
          color2: '#00CED1',
          dur: undefined
        }
      }
    }, {
      label: '边框4',
      option: {
        title: '边框4',
        name: 'datav',
        icon: 'icon-biankuang',
        img: '/datav/img/assets/borderBox/borderBox_04.png',
        top: 0,
        left: 0,
        component: {
          width: 300,
          height: 150,
          name: 'borderBox',
          prop: 'borderBox'
        },
        option: {
          type: 4,
          color1: '#83bff6',
          color2: '#00CED1',
          dur: undefined
        }
      }
    }, {
      label: '边框5',
      option: {
        title: '边框5',
        name: 'datav',
        icon: 'icon-biankuang',
        img: '/datav/img/assets/borderBox/borderBox_05.png',
        top: 0,
        left: 0,
        data: {},
        component: {
          width: 300,
          height: 150,
          name: 'borderBox',
          prop: 'borderBox'
        },
        option: {
          type: 5,
          color1: '#83bff6',
          color2: '#00CED1',
          dur: undefined
        }
      }
    }, {
      label: '边框6',
      option: {
        title: '边框6',
        name: 'datav',
        icon: 'icon-biankuang',
        img: '/datav/img/assets/borderBox/borderBox_06.png',
        top: 0,
        left: 0,
        data: {},
        component: {
          width: 300,
          height: 150,
          name: 'borderBox',
          prop: 'borderBox'
        },
        option: {
          type: 6,
          color1: '#83bff6',
          color2: '#00CED1',
          dur: undefined
        }
      }
    }, {
      label: '边框7',
      option: {
        title: '边框7',
        name: 'datav',
        icon: 'icon-biankuang',
        img: '/datav/img/assets/borderBox/borderBox_07.png',
        top: 0,
        left: 0,
        data: {},
        component: {
          width: 300,
          height: 150,
          name: 'borderBox',
          prop: 'borderBox'
        },
        option: {
          type: 7,
          color1: '#83bff6',
          color2: '#00CED1',
          dur: undefined
        }
      }
    }, {
      label: '边框8',
      option: {
        title: '边框8',
        name: 'datav',
        icon: 'icon-biankuang',
        img: '/datav/img/assets/borderBox/borderBox_08.gif',
        top: 0,
        left: 0,
        data: {},
        component: {
          width: 300,
          height: 150,
          name: 'borderBox',
          prop: 'borderBox'
        },
        option: {
          type: 8,
          color1: '#83bff6',
          color2: '#00CED1',
          dur: undefined
        }
      }
    }, {
      label: '边框9',
      option: {
        title: '边框9',
        name: 'datav',
        icon: 'icon-biankuang',
        img: '/datav/img/assets/borderBox/borderBox_09.png',
        top: 0,
        left: 0,
        data: {},
        component: {
          width: 300,
          height: 150,
          name: 'borderBox',
          prop: 'borderBox'
        },
        option: {
          type: 9,
          color1: '#83bff6',
          color2: '#00CED1',
          dur: undefined
        }
      }
    }, {
      label: '边框10',
      option: {
        title: '边框10',
        name: 'datav',
        icon: 'icon-biankuang',
        img: '/datav/img/assets/borderBox/borderBox_10.png',
        top: 0,
        left: 0,
        data: {},
        component: {
          width: 300,
          height: 150,
          name: 'borderBox',
          prop: 'borderBox'
        },
        option: {
          type: 10,
          color1: '#83bff6',
          color2: '#00CED1',
          dur: undefined
        }
      }
    }, {
      label: '边框11',
      option: {
        title: '边框11',
        name: 'datav',
        icon: 'icon-biankuang',
        img: '/datav/img/assets/borderBox/borderBox_11.png',
        top: 0,
        left: 0,
        data: {},
        component: {
          width: 300,
          height: 150,
          name: 'borderBox',
          prop: 'borderBox'
        },
        option: {
          type: 11,
          color1: '#83bff6',
          color2: '#00CED1',
          dur: undefined
        }
      }
    }, {
      label: '边框12',
      option: {
        title: '边框12',
        name: 'datav',
        icon: 'icon-biankuang',
        img: '/datav/img/assets/borderBox/borderBox_12.png',
        top: 0,
        left: 0,
        data: {},
        component: {
          width: 300,
          height: 150,
          name: 'borderBox',
          prop: 'borderBox'
        },
        option: {
          type: 12,
          color1: '#83bff6',
          color2: '#00CED1',
          dur: undefined
        }
      }
    }]
  }, {
    label: 'datav例子',
    icon: 'icon-datav',
    children: [
      {
        label: '滚动排名',
        option: {
          name: '滚动排名',
          title: '滚动排名',
          icon: 'icon-datav',
          img: '/datav/img/assets/table1.gif',
          dataType: 0,
          data: [
            {
              name: '周口',
              value: 55
            },
            {
              name: '南阳',
              value: 120
            },
            {
              name: '西峡',
              value: 78
            },
            {
              name: '驻马店',
              value: 66
            },
            {
              name: '新乡',
              value: 80
            },
            {
              name: '信阳',
              value: 45
            },
            {
              name: '漯河',
              value: 29
            }
          ],
          dataFormatter: '',
          echartFormatter: "(data)=>{\n  return {\n    config:{\n\t    data: data,\n      //carousel: 'page',\n      valueFormatter ({ value }) {\n        return value+'单位'\n      }\n\t  }\n  }\n}",
          component: {
            width: 652.35,
            height: 248.45,
            name: 'datav',
            prop: 'datav'
          },
          option: {
            is: 'dv-scroll-ranking-board'
          }
        }
      },
      {
        label: '胶囊排名',
        option: {
          name: '胶囊排名',
          title: '胶囊排名',
          icon: 'icon-datav',
          img: '/datav/img/assets/table3.png',
          dataType: 0,
          data: [
            {
              name: '周口',
              value: 55
            },
            {
              name: '南阳',
              value: 120
            },
            {
              name: '西峡',
              value: 78
            },
            {
              name: '驻马店',
              value: 66
            },
            {
              name: '新乡',
              value: 80
            },
            {
              name: '信阳',
              value: 45
            },
            {
              name: '漯河',
              value: 29
            }
          ],
          dataFormatter: '',
          echartFormatter: "(data)=>{\n  return {\n    config:{\n\t    data: data,\n      colors: ['#e062ae', '#fb7293', '#e690d1', '#32c5e9', '#96bfff'],\n      unit: '单位',\n      showValue: true\n\t  }\n  }\n}",
          component: {
            width: 652.35,
            height: 248.45,
            name: 'datav',
            prop: 'datav'
          },
          option: {
            is: 'dv-capsule-chart'
          }
        }
      }, {
        label: '水位图',
        option: {
          name: '水位图',
          title: 'datav',
          icon: 'icon-datav',
          img: '/datav/img/assets/datav/datav1.png',
          dataType: 0,
          data: {
            value: 66
          },
          dataFormatter: '',
          echartFormatter: "(data)=>{\n  return {\n    config:{\n\t    data: [data.value],\n      shape: 'roundRect'\n\t  }\n  }\n}",
          component: {
            width: 150,
            height: 200,
            name: 'datav',
            prop: 'datav'
          },
          option: {
            is: 'dv-water-level-pond'
          }
        }
      }, {
        label: '进度池',
        option: {
          name: '进度池',
          title: 'datav',
          icon: 'icon-datav',
          img: '/datav/img/assets/datav/datav2.png',
          dataType: 0,
          data: {
            value: 66
          },
          dataFormatter: '',
          echartFormatter: '(data)=>{\n  return {\n    config:{\n      value: data.value,\n      borderWidth: 5,\n      borderRadius: 10,\n      borderGap: 5,\n      lineDash: [10, 2],\n      localGradient: true\n    }\n  }\n}',
          component: {
            width: 369,
            height: 153,
            name: 'datav',
            prop: 'datav'
          },
          option: {
            is: 'dv-percent-pond'
          }
        }
      }, {
        label: '锥形柱图',
        option: {
          name: '锥形柱图',
          title: 'datav',
          icon: 'icon-datav',
          img: '/datav/img/assets/datav/datav3.png',
          dataType: 0,
          data: [
            {
              name: '周口',
              value: 55
            },
            {
              name: '南阳',
              value: 120
            },
            {
              name: '西峡',
              value: 71
            },
            {
              name: '驻马店',
              value: 66
            },
            {
              name: '新乡',
              value: 80
            },
            {
              name: '信阳',
              value: 35
            },
            {
              name: '漯河',
              value: 15
            }
          ],
          dataFormatter: '',
          echartFormatter: "(data)=>{\n  return {\n    config:{\n      data:data,\n      img: [\n        '/datav/img/conicalColumnChart/1st.png',\n        '/datav/img/conicalColumnChart/2st.png',\n        '/datav/img/conicalColumnChart/3st.png',\n        '/datav/img/conicalColumnChart/4st.png',\n        '/datav/img/conicalColumnChart/5st.png',\n        '/datav/img/conicalColumnChart/6st.png',\n        '/datav/img/conicalColumnChart/7st.png'\n      ],\n      showValue: true\n    }\n  }\n}",
          component: {
            width: 549.18,
            height: 262.98,
            name: 'datav',
            prop: 'datav'
          },
          option: {
            is: 'dv-conical-column-chart'
          }
        }
      }, {
        label: '飞线图',
        option: {
          name: '飞线图',
          title: 'datav',
          icon: 'icon-datav',
          img: '/datav/img/assets/datav/datav4.png',
          dataType: 0,
          data: {
            'points': [
              {
                name: '郑州',
                'coordinate': [
                  0.48,
                  0.35
                ],
                'halo': {
                  'show': true
                },
                icon: {
                  'src': '/datav/img/flylineChart/mapCenterPoint.png',
                  width: 30,
                  height: 30
                },
                'text': {
                  'show': false
                }
              },
              {
                name: '新乡',
                'coordinate': [
                  0.52,
                  0.23
                ]
              },
              {
                name: '焦作',
                'coordinate': [
                  0.43,
                  0.29
                ]
              },
              {
                name: '开封',
                'coordinate': [
                  0.59,
                  0.35
                ]
              },
              {
                name: '许昌',
                'coordinate': [
                  0.53,
                  0.47
                ]
              },
              {
                name: '平顶山',
                'coordinate': [
                  0.45,
                  0.54
                ]
              },
              {
                name: '洛阳',
                'coordinate': [
                  0.36,
                  0.38
                ]
              },
              {
                name: '周口',
                'coordinate': [
                  0.62,
                  0.55
                ],
                'halo': {
                  'show': true,
                  'color': '#8378ea'
                }
              },
              {
                name: '漯河',
                'coordinate': [
                  0.56,
                  0.56
                ]
              },
              {
                name: '南阳',
                'coordinate': [
                  0.37,
                  0.66
                ],
                'halo': {
                  'show': true,
                  'color': '#37a2da'
                }
              },
              {
                name: '信阳',
                'coordinate': [
                  0.55,
                  0.81
                ]
              },
              {
                name: '驻马店',
                'coordinate': [
                  0.55,
                  0.67
                ]
              },
              {
                name: '济源',
                'coordinate': [
                  0.37,
                  0.29
                ]
              },
              {
                name: '三门峡',
                'coordinate': [
                  0.2,
                  0.36
                ]
              },
              {
                name: '商丘',
                'coordinate': [
                  0.76,
                  0.41
                ]
              },
              {
                name: '鹤壁',
                'coordinate': [
                  0.59,
                  0.18
                ]
              },
              {
                name: '濮阳',
                'coordinate': [
                  0.68,
                  0.17
                ]
              },
              {
                name: '安阳',
                'coordinate': [
                  0.59,
                  0.1
                ]
              }
            ],
            'lines': [
              {
                'source': '新乡',
                'target': '郑州'
              },
              {
                'source': '焦作',
                'target': '郑州'
              },
              {
                'source': '开封',
                'target': '郑州'
              },
              {
                'source': '周口',
                'target': '郑州',
                'color': '#fb7293',
                width: 2
              },
              {
                'source': '南阳',
                'target': '郑州',
                'color': '#fb7293',
                width: 2
              },
              {
                'source': '济源',
                'target': '郑州'
              },
              {
                'source': '三门峡',
                'target': '郑州'
              },
              {
                'source': '商丘',
                'target': '郑州'
              },
              {
                'source': '鹤壁',
                'target': '郑州'
              },
              {
                'source': '濮阳',
                'target': '郑州'
              },
              {
                'source': '安阳',
                'target': '郑州'
              },
              {
                'source': '许昌',
                'target': '南阳',
                'color': '#37a2da'
              },
              {
                'source': '平顶山',
                'target': '南阳',
                'color': '#37a2da'
              },
              {
                'source': '洛阳',
                'target': '南阳',
                'color': '#37a2da'
              },
              {
                'source': '驻马店',
                'target': '周口',
                'color': '#8378ea'
              },
              {
                'source': '信阳',
                'target': '周口',
                'color': '#8378ea'
              },
              {
                'source': '漯河',
                'target': '周口',
                'color': '#8378ea'
              }
            ]
          },
          'lines': [
            {
              'source': '新乡',
              'target': '郑州'
            },
            {
              'source': '焦作',
              'target': '郑州'
            },
            {
              'source': '开封',
              'target': '郑州'
            },
            {
              'source': '周口',
              'target': '郑州',
              'color': '#fb7293',
              width: 2
            },
            {
              'source': '南阳',
              'target': '郑州',
              'color': '#fb7293',
              width: 2
            },
            {
              'source': '济源',
              'target': '郑州'
            },
            {
              'source': '三门峡',
              'target': '郑州'
            },
            {
              'source': '商丘',
              'target': '郑州'
            },
            {
              'source': '鹤壁',
              'target': '郑州'
            },
            {
              'source': '濮阳',
              'target': '郑州'
            },
            {
              'source': '安阳',
              'target': '郑州'
            },
            {
              'source': '许昌',
              'target': '南阳',
              'color': '#37a2da'
            },
            {
              'source': '平顶山',
              'target': '南阳',
              'color': '#37a2da'
            },
            {
              'source': '洛阳',
              'target': '南阳',
              'color': '#37a2da'
            },
            {
              'source': '驻马店',
              'target': '周口',
              'color': '#8378ea'
            },
            {
              'source': '信阳',
              'target': '周口',
              'color': '#8378ea'
            },
            {
              'source': '漯河',
              'target': '周口',
              'color': '#8378ea'
            }
          ],
          dataFormatter: '',
          echartFormatter: "(data)=>{\n  return {\n    config:{\n      points:data.points,\n      lines:data.lines,\n      icon: {\n        show: true,\n        src: '/datav/img/flylineChart/mapPoint.png'\n      },\n      text: {\n        show: true,\n      },\n      k: 0.5,\n      bgImgSrc: '/datav/img/flylineChart/map.jpg'\n    }\n  }\n}",
          component: {
            width: 949.32,
            height: 515.7,
            name: 'datav',
            prop: 'datav'
          },
          option: {
            is: 'dv-flyline-chart-enhanced'
          }
        }
      }, {
        label: '动态环图',
        option: {
          name: '动态环图',
          title: 'datav',
          icon: 'icon-datav',
          img: '/datav/img/assets/datav/datav5.png',
          dataType: 0,
          data: [
            {
              name: '周口',
              value: 55
            },
            {
              name: '南阳',
              value: 120
            },
            {
              name: '西峡',
              value: 78
            },
            {
              name: '驻马店',
              value: 66
            },
            {
              name: '新乡',
              value: 80
            }
          ],
          dataFormatter: '',
          echartFormatter: "(data)=>{\n  return {\n    config:{\n      radius: '40%',\n      activeRadius: '45%',\n      data: data,\n      digitalFlopStyle: {\n        fontSize: 20\n      },\n      showOriginValue: true\n    }\n  }\n}",
          component: {
            width: 949.32,
            height: 515.7,
            name: 'datav',
            prop: 'datav'
          },
          option: {
            is: 'dv-active-ring-chart'
          }
        }
      }]
  }, {
    label: '装饰',
    icon: 'icon-jianzhuzhuangshi',
    children: [{
      label: '装饰1',
      option: {
        title: '装饰1',
        name: 'datav',
        icon: 'icon-jianzhuzhuangshi',
        img: '/datav/img/assets/decorate/decorate_01.gif',
        top: 0,
        left: 0,
        data: {},
        component: {
          width: 670,
          height: 370,
          name: 'decoration',
          prop: 'decoration'
        },
        option: {
          type: 1,
          color1: '#00CED1',
          color2: '#FAD400',
          dur: undefined
        }
      }
    }, {
      label: '装饰2',
      option: {
        title: '装饰2',
        name: 'datav',
        icon: 'icon-jianzhuzhuangshi',
        img: '/datav/img/assets/decorate/decorate_02.gif',
        top: 0,
        left: 0,
        data: {},
        component: {
          width: 670,
          height: 370,
          name: 'decoration',
          prop: 'decoration'
        },
        option: {
          type: 2,
          color1: '#00CED1',
          color2: '#FAD400',
          dur: undefined
        }
      }
    }, {
      label: '装饰3',
      option: {
        title: '装饰3',
        name: 'datav',
        icon: 'icon-jianzhuzhuangshi',
        img: '/datav/img/assets/decorate/decorate_03.gif',
        top: 0,
        left: 0,
        data: {},
        component: {
          width: 670,
          height: 370,
          name: 'decoration',
          prop: 'decoration'
        },
        option: {
          type: 3,
          color1: '#00CED1',
          color2: '#FAD400',
          dur: undefined
        }
      }
    }, {
      label: '装饰4',
      option: {
        title: '装饰4',
        name: 'datav',
        icon: 'icon-jianzhuzhuangshi',
        img: '/datav/img/assets/decorate/decorate_04.gif',
        top: 0,
        left: 0,
        data: {},
        component: {
          width: 670,
          height: 370,
          name: 'decoration',
          prop: 'decoration'
        },
        option: {
          type: 4,
          color1: '#00CED1',
          color2: '#FAD400',
          dur: undefined
        }
      }
    }, {
      label: '装饰5',
      option: {
        title: '装饰5',
        name: 'datav',
        icon: 'icon-jianzhuzhuangshi',
        img: '/datav/img/assets/decorate/decorate_05.png',
        top: 0,
        left: 0,
        data: {},
        component: {
          width: 670,
          height: 370,
          name: 'decoration',
          prop: 'decoration'
        },
        option: {
          type: 5,
          color1: '#00CED1',
          color2: '#FAD400',
          dur: undefined
        }
      }
    }, {
      label: '装饰6',
      option: {
        title: '装饰6',
        name: 'datav',
        icon: 'icon-jianzhuzhuangshi',
        img: '/datav/img/assets/decorate/decorate_06.gif',
        top: 0,
        left: 0,
        data: {},
        component: {
          width: 670,
          height: 370,
          name: 'decoration',
          prop: 'decoration'
        },
        option: {
          type: 6,
          color1: '#00CED1',
          color2: '#FAD400',
          dur: undefined
        }
      }
    }, {
      label: '装饰7',
      option: {
        title: '装饰7',
        name: 'datav',
        icon: 'icon-jianzhuzhuangshi',
        img: '/datav/img/assets/decorate/decorate_07.png',
        top: 0,
        left: 0,
        data: {},
        component: {
          width: 670,
          height: 370,
          name: 'decoration',
          prop: 'decoration'
        },
        option: {
          type: 7,
          color1: '#00CED1',
          color2: '#FAD400',
          dur: undefined
        }
      }
    }, {
      label: '装饰8',
      option: {
        title: '装饰8',
        name: 'datav',
        icon: 'icon-jianzhuzhuangshi',
        img: '/datav/img/assets/decorate/decorate_08.png',
        top: 0,
        left: 0,
        data: {},
        component: {
          width: 670,
          height: 370,
          name: 'decoration',
          prop: 'decoration'
        },
        option: {
          type: 8,
          color1: '#00CED1',
          color2: '#FAD400',
          dur: undefined
        }
      }
    }, {
      label: '装饰9',
      option: {
        title: '装饰9',
        name: 'datav',
        icon: 'icon-jianzhuzhuangshi',
        img: '/datav/img/assets/decorate/decorate_09.gif',
        top: 0,
        left: 0,
        data: {},
        component: {
          width: 440.5,
          height: 377.65,
          name: 'decoration',
          prop: 'decoration'
        },
        option: {
          type: 9,
          color1: '#00CED1',
          color2: '#FAD400',
          dur: undefined
        }
      }
    }, {
      label: '装饰10',
      option: {
        title: '装饰10',
        name: 'datav',
        icon: 'icon-jianzhuzhuangshi',
        img: '/datav/img/assets/decorate/decorate_10.png',
        top: 0,
        left: 0,
        data: {},
        component: {
          width: 670,
          height: 370,
          name: 'decoration',
          prop: 'decoration'
        },
        option: {
          type: 10,
          color1: '#00CED1',
          color2: '#FAD400',
          dur: undefined
        }
      }
    }, {
      label: '装饰11',
      option: {
        title: '装饰11',
        name: 'datav',
        icon: 'icon-jianzhuzhuangshi',
        img: '/datav/img/assets/decorate/decorate_11.png',
        top: 0,
        left: 0,
        data: {},
        component: {
          width: 670,
          height: 370,
          name: 'decoration',
          prop: 'decoration'
        },
        option: {
          type: 11,
          color1: '#00CED1',
          color2: '#FAD400',
          dur: undefined
        }
      }
    }, {
      label: '装饰12',
      option: {
        title: '装饰12',
        name: 'datav',
        icon: 'icon-jianzhuzhuangshi',
        img: '/datav/img/assets/decorate/decorate_12.gif',
        top: 0,
        left: 0,
        data: {},
        component: {
          width: 430,
          height: 430,
          name: 'decoration',
          prop: 'decoration'
        },
        option: {
          type: 12,
          color1: '#00CED1',
          color2: '#FAD400',
          dur: undefined
        }
      }
    }]
  }, {
    label: '二次开发',
    icon: 'el-icon-info',
    children: [{
      label: '自定义组件',
      option: {
        name: '自定义组件',
        title: '自定义组件',
        ico: 'icon-bar',
        img: '/datav/img/assets/text4.png',
        dataType: 0,
        data: [],
        dataFormatter: '',
        stylesFormatter: '',
        component: {
          width: 800,
          height: 500,
          name: 'test',
          prop: 'test'
        },
        option: {
          fontSize: 20
        }
      }
    }, {
      label: '滚动选项卡',
      option: {
        name: '滚动选项卡',
        title: '滚动选项卡',
        icon: 'icon-bar',
        img: '/datav/img/assets/text4.png',
        dataType: 0,
        data: [{
          text: '领导调研',
          list: [
            'https://datav/img.alicdn.com/tfs/TB1v28TC8v0gK0jSZKbXXbK2FXa-1880-640.jpg',
            'https://datav/img.alicdn.com/tfs/TB1uevcCrj1gK0jSZFuXXcrHpXa-1880-640.jpg'
          ]
        }, {
          text: '先进事件',
          list: [
            'https://datav/img.alicdn.com/datav/imgextra/i1/O1CN01NAnI6W1Vf1kZScscd_!!6000000002679-0-tps-2880-1070.jpg',
            'https://datav/img.alicdn.com/datav/imgextra/i2/O1CN011FMQT21RF8u1nHsem_!!6000000002081-0-tps-2880-1070.jpg'
          ]
        }],
        dataFormatter: '',
        stylesFormatter: '',
        component: {
          width: 800,
          height: 400,
          name: 'imgTabs',
          prop: 'imgTabs'
        },
        option: {
          direction: 'horizontal',
          interval: 3000,
          time: 3000,
          autoplay: true
        }
      }
    }, {
      label: '滚动列表',
      option: {
        name: '滚动列表',
        title: '滚动列表',
        icon: 'icon-bar',
        img: '/datav/img/assets/text4.png',
        dataType: 0,
        data: [
          {
            name: 'smallwei',
            time: '11:26',
            color: '#7c324c',
            date: '2022-05-22',
            dept: '设计部',
            img: 'https://img.alicdn.com/tfs/TB1v28TC8v0gK0jSZKbXXbK2FXa-1880-640.jpg'
          },
          {
            name: 'smallwei',
            time: '11:26',
            color: '#6b6230',
            date: '2022-05-22',
            dept: '设计部',
            img: 'https://img.alicdn.com/tfs/TB1v28TC8v0gK0jSZKbXXbK2FXa-1880-640.jpg'
          },
          {
            name: 'smallwei',
            time: '11:26',
            date: '2022-05-22',
            color: '#274d86',
            dept: '设计部',
            img: 'https://img.alicdn.com/tfs/TB1v28TC8v0gK0jSZKbXXbK2FXa-1880-640.jpg'
          }
        ],
        dataFormatter: '',
        stylesFormatter: '',
        component: {
          width: 800,
          height: 500,
          name: 'imgList',
          prop: 'imgList'
        },
        option: {
          step: 1,
          direction: 1,
          hoverStop: true
        }
      }
    }]
  }]
}
