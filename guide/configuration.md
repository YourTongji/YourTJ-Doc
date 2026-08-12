# 配置说明

YourTJ Hub 的论坛使用 **`apps/gooseforum/config.toml`** 进行配置（**不是环境变量**）。首次启动时由内嵌模板生成该文件，它已被 Git 忽略，**不应提交**——其中包含签名密钥与第三方服务凭据。

- 本地开发：`apps/gooseforum/config.toml`
- 服务器：`main/config.toml`（生产）/ `dev/config.toml`（测试线）

## `[app]` 应用设置

| 键 | 说明 |
|---|---|
| `env` | 运行环境。`local` 绑定 `127.0.0.1`；任何非 `local` 值都会强制 session cookie 携带 `Secure`（即使 `server.url` 是 `http://…`，issue #113） |
| `debug` | 调试模式开关 |
| `maintenance` | 维护模式 |
| `signingKey` | **签名密钥，必填且 fail-closed**：缺失、空白或 `REPLACE_SIGNING_KEY` 占位值都会导致启动直接退出（防止伪造密码重置令牌，issue #106） |
| `cdn_url` | CDN 前缀（可选） |

生成签名密钥：

```bash
openssl rand -base64 32
```

## `[server]` 服务设置

| 键 | 说明 |
|---|---|
| `url` | 站点 URL（用于生成链接与 cookie 判定） |
| `port` | 监听端口，默认 `5234` |
| `accessLog` | 访问日志开关 |
| `gzip` | gzip 压缩开关 |
| `trusted_proxies` | 信任的反向代理地址（默认仅信任 `127.0.0.1` / `::1`） |

## `[jwtopt]` 会话凭证

| 键 | 说明 |
|---|---|
| `validTime` | JWT 会话有效时长（秒），默认 `604800`（7 天） |

## `[db]` 数据库

| 键 | 说明 |
|---|---|
| `[db.default]` | **主库**：SQLite 默认，也支持 MySQL 与 PostgreSQL（issue #11） |
| `[db.file]` | **文件库**（附件 BLOB）：固定使用 SQLite |
| `migration` | 启动时执行迁移（`on` / `off`），默认 `on` |

切换主库到本地 PostgreSQL 示例：

```toml
[db.default]
connection = "postgres"
url = "host=127.0.0.1 user=yourtj password=yourtj dbname=yourtj port=5432 sslmode=disable"
```

二进制在首次启动时会对主库全部模型执行 AutoMigrate，并运行版本化数据迁移。

## `[meilisearch]` 搜索（可选）

| 键 | 说明 |
|---|---|
| `url` | Meilisearch 地址，本地默认 `http://localhost:7700` |
| `masterkey` | Meilisearch master key |

搜索是可选的：未配置时搜索功能整体不可用，但不影响论坛其余功能。

## `[log]` 日志

| 键 | 说明 |
|---|---|
| `type` / `path` / `rolling` | 日志类型、路径与轮转 |
| `level` | `debug` / `info` / `warn` / `error` |
| `format` | `json` / `console` |
| `errorPath` | WARN/ERROR 独立轮转文件 |
| `logIp` | 访问日志是否记录客户端 IP，默认关闭（隐私考量） |
| `slowSQL` | 慢 SQL 日志 |

> 日志配置修改后需要重启进程。

## `[github]` GitHub OAuth

配置 GitHub OAuth 的 `client_id` / `client_secret`，用于 GitHub 登录。

## `[oidc]` 内建 OIDC Provider

论坛内建 OIDC Provider 从 `[oidc]` 段读取配置，为第一方客户端（移动端、未来的校园服务）签发标准 OIDC 令牌：

| 键 | 说明 |
|---|---|
| `enabled` | 是否启用；启用时在 `/api/oauth` 下挂载 OIDC 端点 |
| `issuer` | issuer 值，默认取 `server.url` + `/api/oauth`；**必须与对外公布的 discovery 值完全一致** |
| `signing_key_file` | RS256 签名私钥文件（也可用内联 `signing_key`；二者都为空时自动生成并持久化） |
| `access_token_ttl` / `auth_request_ttl` / `id_token_ttl` | 各类令牌有效期（秒），默认 `3600` / `600` / `3600` |
| `[[oidc.clients]]` | 第一方客户端：`id` / `name` / `redirect_uris`；`secret` 可选（public 客户端不填，强制 PKCE） |

几点约束：

- 提供者只接受 loopback 的 `http` issuer；默认本地 issuer 为 `http://localhost:5234/api/oauth`；
- 没有管理后台 UI 修改这些值——改配置文件后**重启**生效；
- Android 模拟器必须通过 `adb reverse tcp:5234 tcp:5234` 访问该地址，`10.0.2.2` 不是合法的 local issuer。

完整示例见仓库内 `deploy/config.toml.example`。

## 安全提醒

- `config.toml` 含 `signingKey` 等敏感信息，**绝不提交到 Git**；
- `signingKey` 缺失或过弱时进程启动即退出（fail-closed），无默认回退；
- 轮换 `signingKey` 会让所有会话、TOTP 密钥加密与重置链接同时失效，且**不支持热加载**——轮换后必须重启进程，使各表面一致地切换到新密钥。

## 相关文档

- [部署指南](/guide/deployment)：生产环境配置与发布
- [数据库](/development/database)：主库选型与迁移
- [身份与 OIDC](/development/identity)：登录与会话细节
