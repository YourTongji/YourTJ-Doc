# 测试策略

本文介绍 YourTJ Hub 的测试原则、命令、分层与 CI 映射。完整说明见仓库内 `docs/development/testing.md`。

## 原则

- **验证强度随风险缩放**：认证 / PII / 治理 / 积分 / 搜索必须包含负例、重放、隐私、失败与对账用例；
- **本地子集 ≠ CI 通过**：报告实际运行的命令与结果；
- 上游已有扎实的 Go 单元测试（controller 层、i18n 渲染、SEO meta），保留并在改动时补充。

## 命令

```bash
# 后端
cd apps/gooseforum && go vet ./... && go test ./...

# 前端
cd apps/gooseforum/resource && pnpm typecheck && pnpm test && pnpm build

# 全量
make test

# 契约：lint、bundle、重新生成已提交的 OpenAPI TypeScript 产物
cd packages/api-contract && pnpm install --frozen-lockfile && pnpm run check
# 等价 Make 目标：make contract-lint / contract-generate-ts / contract-check

# 构建冒烟
make build && ./bin/yourtj-hub serve   # 然后 curl http://localhost:5234
```

## 分层测试

| 层 | 测试类型 | 工具 |
|---|---|---|
| bundles | 工具单元测试 | `go test` |
| models | 模型 / 迁移测试 | `go test` |
| service | 业务单元 + 事务用例 | `go test` + sqlmock / testcontainers |
| http/controllers | handler + 渲染测试 | `go test` + httptest |
| resource（前端） | typecheck + 组件测试 | vue-tsc + Vitest |
| contract | OpenAPI lint/bundle/类型生成 + 真实 Gin 路由链 fixture 断言 | pnpm + go test + httptest |
| mobile | widget / unit | `flutter test`（melos analyze + test） |
| mobile OIDC | controller 链单元 + E2E 脚本 | `auth/test/oidc_controller_test.dart` + `scripts/oidc_e2e.sh` |

## PostgreSQL 迁移测试

- `app/migration/migration_pg_test.go` 提供 `TestSchemaMigratesOnPostgreSQL` 与 `TestSchemaUpgradeCreatesNewTablesOnPostgreSQL`，由 `YOURTJ_TEST_PG_URL` 门控（CI 设置、本地未设置时跳过）；
- **任何模型 / 迁移改动必须过这些 PG 测试**——模型不得硬编码 MySQL-only 类型（`bigint unsigned` / `datetime` / `tinyint`），否则 GORM 原样渲染、PostgreSQL 拒绝，表静默不创建（issue #8 生产回归）；

```bash
YOURTJ_TEST_PG_URL=... go test ./app/migration/ -run 'TestSchema' -v
```

## CI 映射

| 工作流 / job | 触发 | 行为 |
|---|---|---|
| `ci-backend.yml` | 后端 / 契约 fixture 路径变更 | `go vet` + `go test` + `go build`；PostgreSQL 集成测试（`TEST_PG_DSN` 门控） |
| `ci-backend.yml` 内的 `ci-backend-pg` job | 模型 / 迁移 / SQL 连接 / Go module 变更 | 起 `postgres:16-alpine` 服务 + 迁移 schema 测试（`YOURTJ_TEST_PG_URL`）；**不是独立工作流**，由 `ci-backend` 的 `backend_pg` 路径过滤分支触发 |
| `ci-frontend.yml` | 前端路径变更 | pnpm typecheck + 站点单元测试 + build |
| `ci-contract.yml` | 契约输入变更 | OpenAPI lint + bundle + TypeScript 生成，拒绝 `@gooseforum/client/src/gen` 下未提交的 diff；路由级契约测试跑在 backend `go test` 里 |
| `ci-mobile.yml` | 移动端路径变更 | melos bootstrap + analyze + test（**非必选**，按路径过滤） |

CI 说明：

- 所有 `push` 触发**只限 `dev` 与 `main`**：推送到仓库内 PR 分支由一次 `pull_request` 运行校验，不会重复跑 push；
- 同一 PR/分支的 CI 运行取代旧的进行中运行；
- 必选工作流（backend/frontend/contract）对每个 PR 启动，其各自做路径检测，重活只在所属输入变更时跑。

## 冒烟清单

```bash
curl http://localhost:5234/           # 首页 HTML（三模式渲染，GoHTML）
curl http://localhost:5234/api/...    # JSON API
# 前端开发：http://localhost:3010
```

## 相关文档

- [概述与架构](/development/overview)：开发工作流
- [API 契约](/development/api)：契约测试
- [贡献指南](/guide/contributing)：PR 与验证要求
