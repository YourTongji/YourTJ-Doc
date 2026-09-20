# 贡献代码

YourTJ Hub 的主要开发分支是 `dev`。功能和修复从独立分支发起 Pull Request，不直接在共享分支上开发。

## 准备环境

论坛开发需要：

- Go 1.26.6+。
- Node.js 24。
- pnpm 11。
- Docker + Compose。

移动端开发还需要满足仓库 `apps/mobile/pubspec.yaml` 约束的 Flutter / Dart 环境和 Melos。

第一次参与先完成[本地开发环境](/development/local-development)，确认后端和 Web 都能启动。

## 从最新 dev 创建分支

```bash
git fetch origin
git switch dev
git pull --ff-only
git switch -c feat/example
```

常用前缀：

- `feat/`：新功能。
- `fix/`：修复。
- `docs/`：文档。

并行处理多个任务时优先使用 worktree，不要把几个不相关 Issue 的修改混在同一工作区。

## 提交

提交信息使用 Conventional Commits：

```text
feat: add ...
fix: handle ...
docs: update ...
refactor: simplify ...
test: cover ...
chore: update ...
```

只暂存当前任务拥有的文件。工作区里已有的其他未提交改动不要顺手回滚，也不要带进自己的提交。

## 行为变化要一起改什么

| 改动 | 同一 PR 通常还要更新 |
| --- | --- |
| JSON API | OpenAPI、生成 TS、fixtures；移动端使用时更新 Dart mirror |
| 数据模型 | migration、PostgreSQL migration test |
| Web design token | Flutter `tokens.json` |
| 部署配置 | template / instance config / 运维文档 |
| 用户可见行为 | 对应产品或技术文档 |

代码已经变了、文档仍写旧行为，也属于没有完成。

## 验证

按改动范围选择测试，不需要为了一个 Markdown 修改把整套移动端和数据库都跑一遍。

常见组合：

- Go：`go vet ./...` + 相关 `go test`。
- Web：`pnpm typecheck` + 相关 Vitest。
- OpenAPI：`make contract-check`。
- Flutter：`melos run analyze` + `melos run test`。

涉及 migration 时必须加真实 PostgreSQL 检查。完整说明见[测试](/development/testing)。

## Pull Request

PR 描述至少回答：

1. 为什么改。
2. 用户或系统行为变化了什么。
3. 实际运行了哪些验证。
4. 是否影响 API、数据库、文档或部署。
5. 哪些高风险路径还没有验证。

PR 目标为 `dev`。生产发布继续走仓库已有的 release workflow。
