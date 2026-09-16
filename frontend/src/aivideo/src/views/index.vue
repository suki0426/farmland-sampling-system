<template>
  <div id="index" ref="appRef">
    <div class="bg">
      <dv-loading v-if="loading">加载中...</dv-loading>
      <div v-else class="host-body">
        <div class="d-flex jc-center">
          <dv-decoration-10 class="dv-dec-10" />
          <div class="d-flex jc-center">
            <dv-decoration-8 class="dv-dec-8" :color="decorationColor" />
            <div class="title">
              <span class="title-text">AI视频预警平台</span>
              <dv-decoration-6
                class="dv-dec-6"
                :reverse="true"
                :color="['#50e3c2', '#67a1e5']"
              />
            </div>
            <dv-decoration-8
              class="dv-dec-8"
              :reverse="true"
              :color="decorationColor"
            />
          </div>
          <dv-decoration-10 class="dv-dec-10-s" />
        </div>

        <!-- 第二行 -->
        <div class="d-flex jc-between px-2">
          <div class="d-flex aside-width">
            <div class="react-left ml-4 react-l-s">
              <!-- <span class="react-left"></span> -->
              <span class="text">最新图片</span>
            </div>
            <div class="react-left ml-3">
              <span class="text"></span>
            </div>
          </div>
          <div class="d-flex aside-width">
            <div class="react-right mr-3">
              <span class="text fw-b"></span>
            </div>
            <div class="react-right mr-4 react-l-s">
              <span class="react-after"></span>
              <span class="text"
                >{{ dateYear }} {{ dateWeek }} {{ dateDay }}</span
              >
            </div>
          </div>
        </div>

        <div class="body-box">
          <!-- 第三行数据 -->
          <div class="content-box">
            <div>
              <dv-border-box-12>
                <centerLeft1 />
              </dv-border-box-12>
            </div>
            <div>
              <dv-border-box-13>
                <centerRight1 />
              </dv-border-box-13>
            </div>
          </div>

          <!-- 第四行数据 -->
          <div class="bottom-box">
            <dv-border-box-13>
              <bottomLeft />
            </dv-border-box-13>
            <dv-border-box-13>
              <bottomRight />
            </dv-border-box-13>
          </div>
        </div>
      </div>
    </div>

   <!-- Modal -->
<div class="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h1 class="modal-title fs-5 text-primary" id="staticBackdropLabel">选择类型</h1>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" @click="showModal('staticBackdrop', 'hide')"></button>
      </div>
      <div class="modal-body">
        <form>
          <div class="mb-3">
            <label for="recipient-name" class="col-form-label text-primary">Recipient:</label>
            <input type="text" class="form-control" id="recipient-name">
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" @click="showModal('staticBackdrop', 'hide')">Close</button>
        <button type="button" class="btn btn-primary">确定</button>
      </div>
    </div>
  </div>
</div>



  </div>
</template>

<script>
import drawMixin from '../utils/drawMixin'
import { formatTime } from '../utils/index.js'
import centerLeft1 from './centerLeft1'
import centerRight1 from './centerRight1'
import bottomLeft from './bottomLeft'
import bottomRight from './bottomRight'

export default {
  mixins: [ drawMixin ],
  data () {
    return {
      timing: null,
      loading: true,
      dateDay: null,
      dateYear: null,
      dateWeek: null,
      weekday: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
      decorationColor: ['#568aea', '#000000']
    }
  },
  components: {
    centerLeft1,
    centerRight1,
    bottomLeft,
    bottomRight
  },
  mounted () {
    this.timeFn()
    this.cancelLoading()
  },
  beforeDestroy () {
    clearInterval(this.timing)
  },
  methods: {
    timeFn () {
      this.timing = setInterval(() => {
        this.dateDay = formatTime(new Date(), 'HH: mm: ss')
        this.dateYear = formatTime(new Date(), 'yyyy-MM-dd')
        this.dateWeek = this.weekday[new Date().getDay()]
      }, 1000)
    },
    cancelLoading () {
      setTimeout(() => {
        this.loading = false
      }, 500)
    },
    showModal (modalId, action) {
      console.log('showModal----', modalId, action)
      // if (action === 'show') {
      //   // 创建一个新的 div 元素
      //   const modalBackdrop = document.createElement('div');
      //   modalBackdrop.className = 'modal-backdrop fade show';
      //   modalBackdrop.style.zIndex = '1010';
      //   // 判断是否存在相同的元素，并且 left 属性相同
      //   const existingBackdrop = document.querySelector('.modal-backdrop.fade.show');
      //   if (!existingBackdrop || existingBackdrop) {
      //     // 插入到 body 元素的末尾
      //     document.body.appendChild(modalBackdrop);
      //   }
      // }

      // if (action === 'hide') {
      //   // 获取所有具有指定类名的元素
      //   const elementsToRemove = document.querySelectorAll('.modal-backdrop.fade.show');
      //   // 遍历并移除每个元素
      //   elementsToRemove.forEach(element => {
      //     element.parentNode.removeChild(element);
      //   });
      // }

      const modal = document.getElementById(modalId)
      if (modal) {
        // 移除 show 和 hide 类
        modal.classList.remove('show', 'hide')

        // 根据 action 参数设置类和显示属性
        if (action === 'show') {
          modal.classList.add('show')
          modal.style.display = 'block'
        } else if (action === 'hide') {
          modal.classList.add('hide')
          modal.style.display = 'none'
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../assets/scss/index.scss';
</style>
