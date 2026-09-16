# Git 协作流程

## 分支职责

- `main`：最终稳定版本。
- `develop`：团队日常集成版本。
- `feature/*`：个人功能分支。

## 开发流程

`develop` → 创建 `feature/*` 分支 → 开发 → commit → push → Pull Request → 合并到 `develop`

禁止成员直接在 `main` 分支开发。

当前只准备稳定骨架。本轮不创建 `develop` 或任何 `feature/*` 分支。
