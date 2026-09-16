import E from 'wangeditor' // npm 安装
import util from '../../utils/bus'

// 获取必要的变量，这些在下文中都会用到
const { BtnMenu } = E
export default class AlertMenu extends BtnMenu {
  constructor (editor) {
    // data-title属性表示当鼠标悬停在该按钮上时提示该按钮的功能简述
    const $elem = E.$(
      `<div class="w-e-menu" data-title="视频">
                <div class="iconfont iconshipin"></div>
            </div>`
    )
    super($elem, editor)
  }
  // 菜单点击事件
  clickHandler () {
    util.$emit('Video')
    // getvideoint()
  }
  tryChangeActive () {
    this.active()
  }
}
