# 从这里开始

本页给出最短的本地启动路径：先把论坛跑起来，再按需要切 PostgreSQL、搜索和 Flutter。

## 环境

需要：

- Go 1.26.6+。
- Node.js 24。
- pnpm 11。
- Docker + Compose。

移动端开发再准备 Flutter 和 Melos。

## 1. 安装 Web 依赖

```bash
cd apps/gooseforum/resource
pnpm install --frozen-lockfile
cd ../../..
```

前端命令从 `apps/gooseforum/resource` 执行，避免被上层其他 pnpm workspace 干扰。

## 2. 启动依赖服务

```bash
make dev
```

这会启动本地 PostgreSQL 和 Meilisearch。

检查：

```bash
docker compose ps
```

需要停掉：

```bash
make down
```

本地论坛主库仍可以使用 SQLite；这里启动 PostgreSQL，是为了随时验证与生产数据库一致的 migration / SQL 行为。

## 3. 启动后端

```bash
make server
```

等价于：

```bash
cd apps/gooseforum
go run . serve
```

默认监听：

```text
http://localhost:5234
```

本地配置位于 `apps/gooseforum/config.toml`，其中包含签名密钥等敏感值，不提交 Git。

启动后先检查：

```bash
curl -i http://localhost:5234/health
```

如果 migration 还没完成，看到 `503 + Retry-After: 5` 是正常启动过程；完成后应返回 200。

## 4. 启动 Web

另开终端：

```bash
make web
```

Vite 默认监听：

```text
http://localhost:3010
```

这时浏览器访问 3010，前端热更新；API 和页面数据仍由 5234 后端提供。

::: info
3010 只存在于开发模式。生产构建没有独立 Vite 服务。
:::

## 5. 验证生产构建

```bash
make build
```

它会先构建 Vue，再生成：

```text
bin/yourtj-hub
```

如果你的改动涉及静态资源、GoHTML、构建配置或 `go:embed`，至少跑一次这个命令。

## 切到 PostgreSQL 主库

默认 SQLite 最适合快速开发。涉及 model、migration、数据库约束或 PostgreSQL 专有行为时，改本地配置：

```toml
[db.default]
connection = "postgres"
url = "host=127.0.0.1 user=yourtj password=yourtj dbname=yourtj port=5432 sslmode=disable"
```

然后重启后端。

不要把“SQLite 测试通过”当成 PostgreSQL migration 已验证。对应检查见[数据库](/development/database)。

## Flutter

```bash
cd apps/mobile
melos bootstrap
melos run analyze
melos run test
```

iOS Simulator 可以访问宿主机 localhost。

Android Emulator 普通 HTTP 可以使用 `10.0.2.2`，但 OIDC issuer 需要保持一致。调试 OIDC 时使用：

```bash
adb reverse tcp:5234 tcp:5234
```

这样设备侧仍访问 `http://localhost:5234`。

## 常见问题

### 后端一直返回 503

先看后端 migration 日志。

- migration 还在运行：等待完成。
- hard migration failure：进程会退出，需要修 schema / 数据。
- 如果你关闭了 migration：检查配置和数据库是否已经由运维准备好。

### 登录成功但 Cookie 不回传

本地 HTTP 环境使用 `app.env = "local"`。

非 local 环境会强制 `Secure` Cookie；如果你用纯 HTTP 模拟 production，浏览器不会把这个 Cookie 发回来。

### 搜索页面不可用

先检查：

```bash
docker compose ps
curl http://localhost:7700/health
```

Meilisearch 不在线不会改变数据库事实，但搜索相关页面会降级。
