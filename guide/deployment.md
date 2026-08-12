# 部署指南

本指南介绍 YourTJ Hub 的生产部署形态与 CI/CD 流程。更完整的操作细节见仓库内 `docs/operations/deployment.md`。

## 部署形态

- **单一二进制**：`make build` 产出 `bin/yourtj-hub`（Vue 前端产物 + GoHTML 模板通过 `go:embed` 嵌入）。生产环境不拆分前后端，无 nginx/CDN 拆分；
- 二进制运行在精简的 `alpine` 容器中（`deploy/Dockerfile`）；
- 运行时依赖：SQLite（默认，零外部依赖）、MySQL 或 PostgreSQL（仅主库；文件库固定 SQLite）、可选的 Meilisearch、可选的 OIDC Provider。

## 生产拓扑

线上部署采用 1Panel（openresty）做反向代理与 SSL 终止，前置 Cloudflare 隐藏源站 IP：

| 域名 | 内部端口 | 用途 |
|---|---|---|
| `forum.yourtj.de` | `127.0.0.1:5234` | 生产实例 |
| `dev.yourtj.de` | `127.0.0.1:5235` | 测试实例 |

- 后端容器只绑定 `127.0.0.1`，不对外暴露其他端口；
- 二进制默认只信任 `127.0.0.1` / `::1` 的反向代理。如果前面还有额外代理，必须在 `config.toml` 的 `server.trusted_proxies` 中登记，否则限流的 IP 归属可能被伪造的 `X-Forwarded-For` 绕过。

## 服务器布局

同一台 VM 上以一套 Compose 项目管理两个实例：

```text
/opt/yourtj/
  .env                    # MAIN_PORT/DEV_PORT/MAIN_TAG/DEV_TAG + 数据库/Meilisearch 凭据
  docker-compose.yaml     # main + dev 两个服务
  config.toml.example     # 模板，含 REPLACE_* 占位符
  build/Dockerfile
  scripts/                # snapshot-db.sh / sync-db-from-main.sh / backup-db.sh / deploy.sh
  main/                   # 生产配置与存储（config.toml、storage/）
  dev/                    # 测试配置与存储
  snapshots/              # main 的部署前备份（保留 7 份）
```

> `main/config.toml`、`dev/config.toml` 含签名密钥，**绝不进 Git**。首次初始化由 `init-server.sh` 生成，并自动产生随机签名密钥。

## 分支模型与 CI/CD

| 事件 | 工作流 | 行为 |
|---|---|---|
| 合并到 `dev` | `deploy-dev.yml` | 构建单一二进制 → scp 上传 → `sync-db-from-main.sh`（dev 同步 main 的一致性数据库快照）→ `deploy.sh dev <binary> dev-<sha> 5235`，健康检查失败自动回滚 |
| 合并到 `main` | `deploy-main.yml` | 先 `backup-db.sh main`（部署前一致快照）→ `deploy.sh main <binary> main-<sha> 5234`，失败回滚到 `prev` 镜像 tag |
| 手动触发 | `release-to-main.yml` | 把 `dev` 合并进 `main`，按 `vX.Y.Z` 最新 tag bump `patch`/`minor`/`major`（首次发布：patch → `v0.0.1`），打 tag 并通过 PAT 推送触发 `deploy-main` |

为什么 dev 要同步 main 的数据库：迁移在启动时执行，dev 每次部署都会"彩排"main 下次要跑的迁移。

### GitHub Actions Secrets

| Secret | 说明 |
|---|---|
| `VM_HOST` | 服务器公网 IP 或主机名 |
| `VM_USER` | SSH 用户 |
| `VM_SSH_KEY` | 该用户的私钥（完整 PEM） |

## 首次初始化

```bash
sudo bash /opt/yourtj/scripts/init-server.sh \
  https://forum.yourtj.de https://dev.yourtj.de
```

## 数据库迁移与回滚

- 迁移在启动时执行（`[db] migration = "on"`），追加式风格；
- **迁移失败会中止启动**（`serve` 非零退出），由 `deploy.sh` 的健康检查回滚与容器重启策略兜底，避免出现半套 schema 的运行时故障（issue #8）；
- `deploy.sh` 在健康检查失败时把镜像回滚到 `prev` tag；向前兼容的迁移保证旧二进制仍能启动。

### 升级前置检查

- **`app.signingKey` fail-closed**：`serve` 拒绝空值、内建默认值与 `REPLACE_SIGNING_KEY` 占位符，防止伪造密码重置令牌。升级前请为 `main/config.toml` 与 `dev/config.toml` 添加随机密钥（`openssl rand -base64 32`）。
- **session cookie `Secure` 按环境 fail-closed**：任何 `app.env != "local"` 都会强制 cookie `Secure`，与 `server.url` 的 scheme 无关（issue #113）。
- **`user_o_auth(provider, provider_uid)` 唯一索引预检**：已存在重复行的数据库在 `AutoMigrate` 时会静默失败，升级前先查重清理。
- **`users.username` 唯一索引预检**：人类与机器人账号共用同一索引，启动时会检查空值/重复用户名，脏数据会导致启动失败并给出报告，需在权威数据（main）上处理后再同步 dev 彩排。

## PostgreSQL 部署

1. 在 `deploy/docker-compose.yaml` 中启用 `postgres` 服务，在 `/opt/yourtj/.env` 设置 `POSTGRES_USER` / `POSTGRES_PASSWORD`；
2. 创建**两个独立数据库** `yourtj_main`（生产）与 `yourtj_dev`（测试），禁止两个实例共用同一库；
3. 在 `config.toml` 中配置：

```toml
[db.default]
connection = "postgres"
url = "host=postgres user=yourtj password=<secret> dbname=yourtj_main port=5432 sslmode=disable"
```

> `host=postgres` 是 Compose 服务名：论坛容器与 postgres 容器共享 Compose 网络，`127.0.0.1` 会指向论坛容器自身。

4. 首次启动时二进制对空库执行 AutoMigrate 与版本化迁移，然后开始服务。

SQLite → PostgreSQL 的数据迁移是**手动的**（Blueprint 明确不提供自动化工具）：导出 SQLite 数据 → 类型调整（`bigint unsigned`→`bigint`、`tinyint`→`smallint`、`datetime`→`timestamp`）→ 导入 PG → 验证 `/health` → 保留 SQLite 文件作为回滚快照。

## 备份与同步

`backup-db.sh` / `sync-db-from-main.sh` 会根据各实例 `config.toml` 自动识别主库模式：

- **SQLite**：使用 SQLite `.backup` API；
- **PostgreSQL**：`backup-db.sh` 运行 `pg_dump`；`sync-db-from-main.sh` 重建 `yourtj_dev` 并从 `yourtj_main` 管道导入（dev 是 main 的干净单向快照）。

## 对象存储（可选）

文件默认存于 SQLite BLOB（无外部依赖）。要迁移到 S3 兼容对象存储（MinIO / Tencent COS / Alibaba OSS / Cloudflare R2）：

1. 在管理后台（设置 → 存储设置）配置 `s3` provider、endpoint、bucket、region、access/secret 与可选的公网 URL 前缀；
2. 迁移存量 BLOB：后台"存储设置 → 迁移文件"创建后台任务，或执行 `./bin/yourtj-hub migrate-files --endpoint ... --bucket ...`（游标驱动、可续跑）。

> 保持 bucket 私有；未配置公网前缀时，论坛通过 `/file/img/*` 代理读取。

## 健康检查

`GET /health`：服务与主库 ping 均正常返回 200，否则 503。容器健康检查失败即触发回滚。

## 相关文档

- [配置说明](/guide/configuration)：`config.toml` 详解
- [数据库](/development/database)：主库选型与迁移
- [测试策略](/development/testing)：CI 与验证命令
