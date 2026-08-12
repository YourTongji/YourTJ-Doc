# 后端（Go）

本文介绍 YourTJ Hub 后端（`apps/gooseforum`）的技术栈、分层与关键机制。

## 技术栈

- **Go 1.26 + Gin + GORM + Cobra**
- 前端产物通过 `go:embed` 嵌入，输出单一二进制

## CLI 子命令

`main.go` 使用 Cobra 提供命令行入口：

| 子命令 | 用途 |
|---|---|
| `serve` | 启动论坛服务（默认端口 5234） |
| `mock` | 生成模拟数据 |
| `rebuild-search-index` | 全量重建 Meilisearch 索引 |
| `migrate-files` | BLOB → 对象存储的游标式文件迁移 |

## 分层

| 目录 | 职责 |
|---|---|
| `app/bundles` | 工具集：连接、事件总线、jwtopt、i18n、captcha、日志、缓存等 |
| `app/models` | GORM 模型 + `app/migration` 迁移 |
| `app/service` | 业务逻辑：users、topics、mail、oauth、theme 等 |
| `app/http/controllers/api` | JSON API：auth、topic、user、admin、chat、notification、file 等 |
| `app/http/controllers/forum` | 页面渲染（GoHTML 三模式：payload + render + SEO） |
| `app/http/middleware` | JWT 认证、访问日志、维护模式、限流等 |

## 关键机制

### 会话与认证

- JWT 会话凭证（HS256、自签、7 天 TTL、携带 `jti`），仅作**会话凭证**而非身份真相；
- 会话由 `jti` + `user_sessions` 支撑，可逐条撤销；`TokenVersion` 作为全局失效兜底；
- 登录枚举抵抗：登录错误不区分"用户不存在 / 密码错误"，未知账号也执行同成本的 PBKDF2 验证。

### 限流（滥用防护）

- **每动作**固定窗口限流（IP + user），覆盖注册/登录/找回密码/改密/TOTP/发帖/评论/上传/交互/llms/mcp/课评等 30+ 动作；
- 触发返回 `429 + Retry-After`；
- 另有验证码开关、蜜罐（honeypot）、提交时间检测、新用户发帖阈值；全部限流与开关可在管理后台热调。

### 任务队列与后台任务

- `task_queue` 行携带 `type` 字符串，worker 按 **type 前缀**轮询，任务类型互不泄漏：
  - `email.*`（激活 / 重置密码）
  - `export`（数据导出）
  - `file-migrate`（BLOB → 对象存储迁移）
- 导出与迁移任务把进度写入 `task_json`（processed/total/errorCount、游标 lastId），管理后台可渲染实时进度，重启后可续跑；
- 导出文件落在 `data/export/`，保留 7 天（每日 cron 清理）。

### Agent（机器人）

- Agent 是 `users` 行 + `agents` 行（同一 user id 主键关联），`users.actor_type` 区分人类（0）/ 机器人（1）；
- 每个 Agent 有唯一 bearer token（`agt_…`），创建/轮换时仅展示一次；数据库只存 **SHA-256 哈希 + 8 字符非机密前缀**；
- 禁用即**吊销**凭据（清空哈希，泄出的 token 永远无法再通过校验），重新启用必须先轮换；
- 机器人行被人形认证路径（密码 / OAuth / OIDC / 会话中间件）一律拒绝；
- Agent 公开 API：`/api/v1/agent/*` 六操作（me、主题列表/创建、帖子列表/创建、搜索），已由 OpenAPI 契约覆盖。

### 审计与治理

- 敏感词拦截或进入待审队列（ProcessStatus=2，管理后台批准/拒绝）；
- 保留/禁用用户名治理，禁用用户名自动冻结既有账号；
- 审核操作有审计日志；服务条款（ToS）可在管理后台编辑并在 `/terms` 渲染。

## 一致性约束

- 关键副作用（通知、索引同步、积分分发）幂等、可重试、可观测；
- 业务生命周期用显式状态机（如主题 draft / published / archived / deleted），不用布尔组合；
- 迁移在启动时执行，失败即中止启动（fail-fast）。

## 验证

```bash
cd apps/gooseforum
go vet ./... && go test ./...
```

## 相关文档

- [概述与架构](/development/overview)
- [身份与 OIDC](/development/identity)
- [数据库](/development/database)
- [测试策略](/development/testing)
