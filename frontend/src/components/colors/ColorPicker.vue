<template>
    <el-color-picker size="small"
                     class="theme-picker"
                     popper-class="theme-picker-dropdown"
                     v-model="theme"></el-color-picker>
</template>

<script>
    import { resolveThemeColor } from '@/utils/themeColor'

    export default {
        name: "ColorPicker",
        computed: {
            theme: {
                get () {
                    return resolveThemeColor(this.$store.state.config.defaultTheme)
                },
                set (val) {
                    const theme = resolveThemeColor(val)
                    localStorage.setItem('defaultTheme', theme)
                    this.$events.$emit('updateTheme', theme)
                    this.$store.commit('config/updateDefaultTheme', theme)
                }
            }
        }
    };
</script>

<style>
    .theme-picker .el-color-picker__trigger {
        vertical-align: middle;
    }

    .theme-picker-dropdown .el-color-dropdown__link-btn {
        display: none;
    }
</style>
