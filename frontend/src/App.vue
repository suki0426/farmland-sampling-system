<template>
  <div class="ultra-theme" :style="themeStyleVars">
    <transition v-bind:css="false" name="fade">
      <router-view></router-view>
    </transition>
  </div>
</template>

<script>
  import themeRuntime from '@/components/colors/mixins/theme'
  import { createThemeStyleVars } from '@/utils/themeColor'

  export default {
    mixins: [themeRuntime],
    computed: {
      themeStyleVars () {
        return createThemeStyleVars(this.defaultTheme)
      }
    }
  }
</script>
<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

</style>
