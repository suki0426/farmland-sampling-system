# 团队开发指南

## 第一次加入项目

```bash
git clone https://github.com/suki0426/farmland-sampling-system.git
cd farmland-sampling-system
git checkout develop
git pull origin develop
git checkout -b 自己的feature分支
git push -u origin 自己的feature分支
```

## 每天开工

```bash
git status
git checkout develop
git pull origin develop
git checkout 自己的feature分支
git merge develop
```

## 每天收工

```bash
git status
git add .
git commit -m "feat: 简要说明"
git push
```

完成一个稳定功能后，在 GitHub 创建 Pull Request：`feature/xxx` → `develop`。不要创建 `feature/xxx` → `main` 的 PR；由组长审核后合并。

## AI 协作规范

向 Codex、Claude 等 AI 提问时，必须明确当前负责模块、允许修改文件、禁止修改文件、输入输出接口和验收标准。

禁止提示：“帮我把整个项目完善一下”或“帮我重构整个工程”。

推荐模板：

```text
你正在参与一个5人Git协作项目。
当前分支：【feature分支】
我负责：【模块】
允许修改：【具体目录】
禁止修改：其他成员模块、依赖版本、Git配置。
本次任务：【一个明确功能】
验收标准：
1.
2.
3.
要求：不重构其他模块；不改变既定API；不升级依赖；
不执行git push/merge；完成后列出修改文件；给出测试方法。
```
