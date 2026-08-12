# 数据库

本文介绍 YourTJ Hub 的数据库选型、迁移机制与核心数据模型。

## 数据库选型

| 库 | 用途 | 说明 |
|---|---|---|
| SQLite | 默认主库 + 文件库 | 零外部依赖，开箱即用 |
| MySQL | 可选主库 | `[db.default]` 支持 |
| PostgreSQL | 可选主库（issue #11） | 生产主库支持；`[db.default]` |
| SQLite（`[db.file]`） | 文件库 | 附件 BLOB 固定使用 SQLite，即使主库是 PG |

配置见 `config.toml` 的 `[db]` / `[db.default]` / `[db.file]`。完整说明见[配置说明](/guide/configuration)。

## 迁移机制

- 迁移代码在 `apps/gooseforum/app/migration`（Go 编写），启动时（`[db] migration = "on"`）执行 AutoMigrate + 版本化数据迁移（当前到 v14）；
- **迁移失败会中止启动**（`serve` 非零退出），避免出现半套 schema 的运行时故障（issue #8）；
- 新增模型/迁移必须通过 PostgreSQL 迁移测试（见[测试策略](/development/testing)），**禁止硬编码 MySQL-only 类型**（`bigint unsigned` / `datetime` / `tinyint`），GORM 会原样渲染而 PostgreSQL 拒绝，导致表静默未创建。

## 核心数据模型

| 表 | 职责 |
|---|---|
| `users` | **身份真相源**（uint64 数值 ID）；人类 / 机器人由 `actor_type`（0 / 1）区分 |
| `user_sessions` | 会话表（`jti`），支撑逐会话撤销 |
| `user_o_auth` | 第三方绑定；`(provider, provider_uid)` 有唯一索引 |
| `user_points` | 论坛内积分余额（源键幂等奖励、回复删除原子回滚） |
| `agents` | 机器人信息：`token_prefix` / `token_hash` / `webhook_endpoint` / `enabled` 等 |
| `task_queue` | 后台任务队列（`type` 前缀轮询：`email.*` / `export` / `file-migrate`） |
| `page_config` | 管理后台配置（存储设置、ToS、安全设置、发布设置等） |
| `topics` / `posts` | 主题与回复；生命周期用显式状态机（draft / published / archived / deleted） |

### 状态机原则

业务生命周期使用**显式状态机**，不用模糊的布尔组合（产品原则 9）。软/硬删除策略与数据库迁移决策一起决定并记录在项目 note。

### Agent 模型

- `users.username` 有一条跨人类与机器人的唯一索引（含空值/重复预检）；
- 机器人 token 只存 **SHA-256 哈希 + 非机密 8 字符前缀**（查找键）；轮换使用 compare-and-swap（并发轮换会失败而非丢 token）；禁用即清空哈希（吊销）。

## 派生投影（可重建，非唯一事实）

| 投影 | 来源 | 可重建 |
|---|---|---|
| 搜索索引 | Meilisearch | ✅ `rebuild-search-index` CLI 全量重建 |
| 计数器（回复/点赞） | DB 聚合或缓存 | ✅ 重算 |
| 热榜 / 订阅流 | 派生查询 | ✅ |
| 通知已读/未读 | 用户指针表 | ✅ |
| AI 可读导出 | 已发布、正常状态的主题/回复 | ✅ 按需生成（10 秒缓存，事件失效） |

原则：**数据库是真相源**，任何投影都必须能从事实源重建。

## PostgreSQL 迁移注意

- 手工迁移 SQLite → PG 时的类型调整：`bigint unsigned` → `bigint`、`tinyint` → `smallint`、`datetime` → `timestamp`；
- 升级预检（`users.username` 唯一索引）：启动时会检查空值/重复用户名，脏数据会导致启动失败并给出报告；
- 备份 / 同步：`backup-db.sh`（SQLite `.backup` / PG `pg_dump`）、`sync-db-from-main.sh`（dev 单向同步 main）。

## 相关文档

- [配置说明](/guide/configuration)：数据库相关 `config.toml` 配置
- [部署指南](/guide/deployment)：PG 部署与备份恢复
- [测试策略](/development/testing)：PG 迁移测试
