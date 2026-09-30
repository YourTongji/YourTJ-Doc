# 测试

测试按改动风险选，不要求每个 PR 都机械跑完所有平台。

判断方法很简单：你改变了哪一层的行为，就至少验证那一层；如果改动跨越契约、数据库或客户端边界，再把对应检查一起加上。

## 快速选择

| 改动 | 最少检查 |
| --- | --- |
| Go service / controller | `go vet ./...` + 相关 `go test` |
| model / migration | 上一项 + PostgreSQL migration test |
| Web 组件 / composable | `pnpm typecheck` + 相关 Vitest |
| 浏览器布局 / focus / viewport | Browser test |
| JSON API wire shape | `make contract-check` + route test |
| Flutter | `melos run analyze` + 相关 Flutter test |
| 文档 | VitePress build + link / diff check |

## Go

```bash
cd apps/gooseforum
go vet ./...
go test ./...
```

日常开发可以先跑受影响包。例如只改课程 service：

```bash
go test ./app/service/courseservice/...
```

Bug 修复优先写一个能复现问题的失败测试，再改实现。

## PostgreSQL migration

涉及模型和 migration 时，需要真实 PostgreSQL：

```bash
YOURTJ_TEST_PG_URL="host=127.0.0.1 port=5432 user=postgres password=postgres dbname=postgres sslmode=disable" \
  go test ./app/migration/ -run 'TestSchema' -v
```

这一步专门发现 SQLite 容易放过的类型、默认值、索引和升级路径问题。

## Web

```bash
cd apps/gooseforum/resource
pnpm typecheck
pnpm test
pnpm build
```

Browser tests 用于普通 DOM 模拟器覆盖不到的问题，例如：

- viewport / resize。
- focus 恢复。
- Escape 和键盘导航。
- fixed / sticky 层级。
- reduced motion。
- 多语言长文本。

运行：

```bash
pnpm test:browser
```

## OpenAPI

```bash
make contract-check
```

这会检查 OpenAPI、生成 TypeScript、fixtures 相关产物和 route coverage。

新增 JSON route 但未更新 contract 时，这个门禁会失败。

## Flutter

```bash
cd apps/mobile
melos bootstrap
melos run analyze
melos run test
```

真机依赖的能力，例如学校登录、APNs / Android 推送，单元测试通过后仍需要设备验收。

## 全量常规门禁

```bash
make test
```

它会运行后端 vet / test、contract check 和 Web typecheck / test。

Browser tests、Flutter 和部分部署检查有独立 workflow，不包含在这一条命令里。

## 高风险功能要测失败路径

只测 happy path 往往不够。

### 身份

至少考虑 session 撤销、TOTP challenge 重放、CSRF、frozen / deleted / bot 用户，以及 OIDC state / nonce / PKCE。

### 搜索

测试 Meilisearch 不可用、任务重试、隐藏 / 删除内容移出索引，以及全量 rebuild。

### 排课同步

测试两端从同一版本修改，其中一端先保存，另一端拿旧 `baseRevision` 得到 409；方案已被另一设备删除时得到 410。

### 我的校园

测试 session 切换、在途响应失效、`no-store` 和私密数据不进入持久化缓存。

## PR 里怎么报告

不要只写 `tests passed`。列出你真正运行的命令，以及没有验证的高风险路径。

```text
go test ./app/service/courseservice/...  ✅
make contract-check                    ✅
mobile physical-device login           未验证
```

这样 Reviewer 能直接判断还缺哪一层验证。
