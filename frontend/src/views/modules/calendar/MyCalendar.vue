<template>
<div class=" bg-white">
    <full-calendar
      ref="calendar"
      :config="config"
      :events="calendarEvents"
    ></full-calendar>
      <MyCalendarForm :start="start" :end="end" ref="myCalendarForm" @refreshDataList="refreshList"></MyCalendarForm>
</div>
</template>
<script>
  import MyCalendarForm from './MyCalendarForm'
  import { FullCalendar } from 'vue-full-calendar'
  import 'fullcalendar/dist/fullcalendar.css'
  import myCalendarService from '@/api/calendar/myCalendarService'
  export default {
    data () {
      return {
        config: {
          header: {
            left: 'prev,next today',
            center: 'title',
            right: 'month,agendaWeek,agendaDay,list'
          },
          buttonText: { today: '今天', month: '月', week: '周', day: '日', list: '日程' },
          locale: 'zh-cn',
          defaultView: 'month', // 显示默认视图
          weekMode: 'liquid',
          weekNumbers: true,
          height: 'auto',
          timeFormat: 'HH:mm',
          firstDay: 1,
          navLinks: true,       // can click day/week names to navigate views
          // eventLimit: 3,        // 限制一天中显示的事件数，默认false
          allDayText: '排班',   // 日历上显示全天的文本
          editable: true,
          droppable: true,
          selectable: true,     // 允许用户通过单击或拖动选择日历中的对象，包括天和时间。
          selectHelper: false,  // 当点击或拖动选择时间时，显示默认加载的提示信息，该属性只在周/天视图里可用。
          unselectAuto: true,   // 当点击页面日历以外的位置时，自动取消当前的选中状态。
          eventBackgroundColor: '#3a87ad',    // 设置日程事件的背景色
          select: this.selectHandler,
          eventClick: this.handleEventClick,
          eventDrop: this.handelEventDrop
          // editable: false, //是否允许修改事件
          // eventLimit: 4, //事件个数
          // eventLimitText:"更多",
          // allDaySlot: false, //是否显示allDay
          // eventClick: this.eventClick, //点击事件
          // dayClick: this.dayClick, //点击日程表上面某一天
          // selectable:true, // 开启多选
          // select:this.handleSelect,  //多选执行的方法
  
        },
        calendarEvents: [],
        start: new Date(),
        end: new Date()
      }
    },
    components: {
      FullCalendar,
      MyCalendarForm
    },
    activated () {
      this.refreshList()
    },
    methods: { // 选择月份
      selectHandler (start, end, allDay) {
        this.start = this.moment(start).format('YYYY-MM-DD HH:mm:ss')
        this.end = this.moment(end).format('YYYY-MM-DD HH:mm:ss')
        this.$refs.myCalendarForm.init('add', '', this.start, this.end)
      },
      handleEventClick (info) {
        this.$refs.myCalendarForm.init('edit', info.id)
      },
      handelEventDrop ({id, start, end}) {
        myCalendarService.save({
          id: id,
          start: this.moment(start).format('YYYY-MM-DD HH:mm:ss'),
          end: this.moment(end).format('YYYY-MM-DD HH:mm:ss')
        }).then(({data}) => {
          this.$message.success(data)
        })
      },
      refreshList () {
        myCalendarService.list().then(({data}) => {
          this.calendarEvents = data
        })
      }
    }
  }
</script>
<style lang='less'>
    //用什么插件必须引入相应的样式表，否则不能正常显示

    #external-events {
        padding: 0 10px;
        background: #eee;
        text-align: left;
    }

    #external-events h4 {
        font-size: 16px;
        margin-top: 0;
        padding-top: 1em;
    }

    #external-events .fc-event {
        margin: 10px 0;
        cursor: pointer;
    }

    #external-events p {
        margin: 1.5em 0;
        font-size: 11px;
        color: #666;
    }

    #external-events p input {
        margin: 0;
        vertical-align: middle;
    }

</style>