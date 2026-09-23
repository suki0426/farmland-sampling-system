<template>
  <div class="no-permission">
    <div class="no-permission__card">
      <i class="el-icon-lock no-permission__icon"></i>

      <h2 class="no-permission__title">当前账号没有该功能的访问权限</h2>

      <p class="no-permission__desc">
        这是一个<b>按角色授权</b>的系统：能看到哪些功能由管理员在「系统管理 → 角色管理 /
        菜单管理」里分配，前端不提供自助开通。
      </p>

      <div class="no-permission__detail">
        <div v-if="from" class="no-permission__row">
          <span>被拦截的页面</span>
          <b>{{ from }}</b>
        </div>
        <div v-if="need" class="no-permission__row">
          <span>缺少的权限码</span>
          <b class="no-permission__code">{{ need }}</b>
        </div>
        <div class="no-permission__row">
          <span>当前账号已有权限</span>
          <b>{{ permissions.length ? permissions.join('、') : '（无）' }}</b>
        </div>
      </div>

      <p class="no-permission__hint">
        请联系管理员为你的角色分配上述权限码；账号由管理员统一创建，无需自行注册。
      </p>

      <div class="no-permission__actions">
        <el-button type="primary" size="small" icon="el-icon-s-home" @click="goHome">返回首页</el-button>
        <el-button size="small" icon="el-icon-refresh" @click="reload">重新加载权限</el-button>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * 无权限提示页
 *
 * 被 `permissions.js` 的 `requirePermission()` 拦截时跳到这里。
 *
 * 为什么不让它跳 `/404`：那会显示「404未找到」，用户会以为是地址敲错了，
 * 而实际原因是**角色没被授权**。这一页把「缺哪个权限码、当前有哪些权限」直接摆出来，
 * 既方便用户自查，也方便管理员照着配。
 *
 * 本页自身**不做任何权限校验**（否则会出现"拦截页也被拦截"的死循环）。
 */
import { currentPermissions } from './permissions'

export default {
  name: 'AgriNoPermission',
  data () {
    return {
      from: '',
      need: '',
      permissions: []
    }
  },
  created () {
    this.from = this.$route.query.from || ''
    this.need = this.$route.query.need || ''
    this.permissions = currentPermissions()
  },
  methods: {
    goHome () {
      this.$router.push({ name: 'home' })
    },
    reload () {
      // 管理员刚改完角色，用户不必重新登录也能刷新权限（权限列表在登录时写入 localStorage）
      this.permissions = currentPermissions()
      this.$message.info('已重新读取本地权限列表。若管理员刚为你调整了角色，请重新登录以获取最新权限。')
    }
  }
}
</script>

<style lang="scss" scoped>
$line: rgba(79, 195, 247, 0.24);
$text: #cfe8ff;
$dim: #8fb8d8;

.no-permission {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  padding: 24px;
  box-sizing: border-box;

  &__card {
    width: 100%;
    max-width: 560px;
    padding: 28px 30px 24px;
    border: 1px solid $line;
    border-radius: 8px;
    background:
      radial-gradient(600px 260px at 50% -20%, rgba(21, 101, 192, 0.35), transparent 70%),
      rgba(6, 26, 50, 0.72);
    color: $text;
  }

  &__icon {
    display: block;
    font-size: 40px;
    color: #ffb74d;
    margin-bottom: 10px;
  }

  &__title {
    margin: 0 0 10px;
    font-size: 20px;
    font-weight: 700;
    color: #81d4fa;
  }

  &__desc {
    margin: 0 0 14px;
    font-size: 13px;
    line-height: 22px;
    color: $dim;

    b { color: $text; }
  }

  &__detail {
    padding: 10px 12px;
    border-radius: 5px;
    background: rgba(4, 18, 36, 0.6);
    border: 1px solid rgba(79, 195, 247, 0.14);
    font-size: 12px;
  }

  &__row {
    display: flex;
    gap: 10px;
    line-height: 22px;

    span {
      flex: none;
      width: 118px;
      color: $dim;
    }

    b {
      flex: 1;
      min-width: 0;
      word-break: break-all;
      font-weight: 400;
      color: $text;
    }
  }

  &__code {
    font-family: Consolas, Monaco, monospace;
    color: #ffcc80 !important;
  }

  &__hint {
    margin: 14px 0 16px;
    font-size: 12px;
    line-height: 20px;
    color: #6d90ad;
  }

  &__actions {
    display: flex;
    gap: 10px;
  }
}
</style>
