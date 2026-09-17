# Git 协作流程

## 分支职责

- `main`：最终稳定版，只用于答辩、最终提交和发布；禁止日常直接开发。
- `develop`：团队公共集成版，所有功能通过 Pull Request 合入。
- `feature/*`：个人开发分支。

## 标准流程

`develop` → 创建自己的 `feature/*` 分支 → 开发 → commit → push → Pull Request → `develop` → 组长审核并合并

最终答辩前：`develop` → 完整测试 → `main`

## 严禁事项

- 直接在 `main` 开发。
- `git push -f` 或 `git push --force`。
- `git reset --hard`。
- 擅自 rebase 公共分支。
- 直接修改他人核心模块。
- 提交密码、Token、Secret。
- 提交 `node_modules`、`target`、`dist`、JAR、WAR 或 `.idea`。
- 让 AI 无边界重构整个项目。
