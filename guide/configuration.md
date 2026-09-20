# 配置参考

论坛使用 TOML 配置。本地开发可以直接维护 `apps/gooseforum/config.toml`；生产配置由 CI 渲染和下发。

先区分这两种来源，可以避免一个常见问题：在服务器上临时改好了配置，下一次 CI 又把它覆盖回去。

## 本地配置

本地后端读取：

```text
apps/gooseforum/config.toml
```

该文件包含签名密钥等敏感值，已经被 Git 忽略。

最小数据库配置：

```toml
[db.default]
connection = "sqlite"
path = "./storage/database/sqlite.db"

[db.file]
connection = "sqlite"
path = "./storage/database/file.db"
```

需要验证 PostgreSQL 时，把 `[db.default]` 切到本地 PG；`[db.file]` 仍保持 SQLite。

## 生产配置

生产配置来自：

- `deploy/config.toml.tmpl`
- `deploy/instances/<env>.json`
- GitHub Environment secrets

CI 渲染完整 TOML，检查占位符和实例 DSN，再原子应用到服务器。

修改生产配置时，非敏感值写入模板或实例 JSON；secret 写入 GitHub Environment。

## `app` 和 `server`

```toml
[app]
env = "production"
maintenance = false
signingKey = "<secret>"

[server]
url = "https://f.yourtj.de"
port = 5234
```

`app.signingKey` 是安全根密钥。空值、默认值和部署占位符都会让生产服务拒绝启动。

它同时影响 JWT、会话 Cookie、TOTP 密钥、密码重置 / 激活 token 和 OIDC 的部分密钥派生。

::: warning
轮换 `app.signingKey` 必须重启进程。运行中只热改配置，会让不同组件使用不同密钥世代。
:::

非 `local` 环境会强制登录 Cookie 使用 `Secure`。生产 `server.url` 应使用实际 HTTPS 地址。

## 数据库

```toml
[db]
migration = "on"

[db.default]
connection = "postgres"
url = "host=postgres user=... password=... dbname=yourtj_main port=5432 sslmode=disable"
```

生产默认 PostgreSQL，本地 / 测试默认 SQLite。MySQL 不受支持。

`migration = "off"` 表示由运维人员自行保证 schema；这时启动 gate 不等待 migration。除非有明确运维方案，不要随意关闭。

## Meilisearch

```toml
[meilisearch]
maintenance_enabled = true
url = "http://meilisearch:7700"
masterkey = "<secret>"
```

`maintenance_enabled` 决定当前实例是否负责共享搜索索引的维护任务。main / dev 如果指向同一套 Meili，只应让权威实例执行维护。

搜索索引可以重建，数据库才是业务事实源。

## OAuth 和 OIDC

GitHub 和 Google 分别使用 `[github]`、`[google]`。

内建 OIDC Provider 使用 `[oidc]`。生产环境需要固定 issuer，并为客户端登记精确 redirect URI；public client 使用 PKCE。

OIDC 属于启动时配置。修改 issuer、客户端或关键密钥后按重启处理。

## Wiki

```toml
[wiki.git]
repo = "https://github.com/YourTongji/YourTJ-Wiki.git"
branch = "main"
clone_dir = "./storage/wiki-repo"
schedule = "0 3 * * *"
webhook_secret = "<secret>"
```

GitHub 是 Wiki 正文事实源。`webhook_secret` 用于验证 GitHub push webhook。

## 推送

Web Push 使用 `[webpush]` 的 VAPID 密钥。

原生推送分为：

- `[push.apns]`：iOS。
- `[push.fcm]`：Android FCM。
- `[push.jpush]`：Android JPush / 厂商通道。

缺少完整凭据时，对应 provider 按关闭处理。dev 环境应保持真实外发通道关闭，避免把从 main 快照同步来的设备注册当成测试目标。

## 我的校园

`[campus]` 包含学校 OAuth 客户端、回调地址，以及凭据加密和身份 HMAC 密钥。

全部留空即可关闭校园连接。这里保存的是实例级 secret；用户自己的学校 token 会另外加密存储。

## 哪些设置在管理后台

下面这些运行时设置不要求直接改 TOML：

- SMTP。
- S3-compatible 对象存储。
- 站点品牌和公开页面。
- 发帖 / 限流设置。
- 一系统同步凭据。
- 部分 AI 总结配置。

敏感字段通过 securestore 保存，管理页面只应返回“是否已配置”，不回显原始密钥。

## 修改后怎么验证

| 改动 | 验证 |
| --- | --- |
| 端口 / DB / signingKey / OIDC | 重启，检查日志和 `/health` |
| Meilisearch | 执行真实搜索，检查索引任务 |
| OAuth | 完整走一次登录 / 绑定回调 |
| Wiki | 触发同步并查看 run 记录 |
| Push | 用真实设备测试 |
| 对象存储 | 连接测试 + 实际上传图片 |
| Campus | 完成学校授权并读取一项私密数据 |
