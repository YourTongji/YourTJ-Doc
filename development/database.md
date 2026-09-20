# 数据库

生产主数据库使用 PostgreSQL。本地开发和测试默认使用 SQLite。

文件库 `[db.file]` 始终是 SQLite。MySQL 当前不受支持。

## 两类数据库分别存什么

| 数据库 | 主要内容 |
| --- | --- |
| 主数据库 | 用户、话题、回复、课程、权限、设置、任务等业务数据 |
| `file.db` | 本地文件内容与文件相关数据 |

部署使用 PostgreSQL 主库，并不会把 `file.db` 一起变成 PostgreSQL。

本地最小配置：

```toml
[db.default]
connection = "sqlite"
path = "./storage/database/sqlite.db"

[db.file]
connection = "sqlite"
path = "./storage/database/file.db"
```

生产：

```toml
[db.default]
connection = "postgres"
url = "host=postgres user=... password=... dbname=... port=5432 sslmode=disable"
```

::: warning
Compose 中的 `host=postgres` 是 PostgreSQL 的 service name。论坛容器里的 `127.0.0.1` 只指向论坛容器自己。
:::

## 启动时怎么迁移

默认 `migration = "on"`。

进程启动后会先做：

1. schema migration。
2. 版本化数据 migration。
3. 初始化需要依赖 schema 的服务。
4. 打开 startup gate。

在这之前，HTTP listener 虽然已经绑定，但请求会得到 503。

硬迁移失败会终止启动，schema 错误会在发布阶段直接暴露。

也可以单独执行：

```bash
cd apps/gooseforum
go run . migrate
```

## 为什么 SQLite 通过还不够

SQLite 对类型、默认值和约束的处理比 PostgreSQL 宽松。

model 或 migration 改动需要在普通测试之外再跑真实 PostgreSQL：

```bash
YOURTJ_TEST_PG_URL="host=127.0.0.1 port=5432 user=postgres password=postgres dbname=postgres sslmode=disable" \
  go test ./app/migration/ -run 'TestSchema' -v
```

不要写 `bigint unsigned`、`datetime`、`tinyint` 等 MySQL-only 类型。

## dev 为什么从 main 同步快照

dev 和 main 使用两个独立数据库：

```text
yourtj_main
    │
    │ 单向快照
    ▼
yourtj_dev
```

dev 部署前同步生产数据形状，再在 dev 上运行新 migration。

这样可以在不向生产数据库写测试数据的前提下，提前发现“空库能迁移、真实历史数据迁移失败”的问题。

不要让 dev 和 main 直接连接同一个数据库。

## 业务事实和投影

主数据库里的业务行是事实源。下面这些状态即使也会落库或外部存储，仍按“可重建投影”处理：

- Meilisearch 索引。
- 搜索任务状态。
- 聚合统计。
- 缓存。
- 热榜。

可从主数据重新计算的内容按投影处理，不应反过来决定业务事实。

## 删除内容不要直接 DELETE

帖子、课评等用户内容有软删、恢复和最终清理生命周期。

业务代码应调用所属领域的 service，让它同时处理：

- 用户侧可见性。
- 引用关系。
- 搜索投影。
- 文件引用。
- 审核 / 审计边界。

直接删主表一行很容易留下搜索残影或孤立文件。

## 对象存储

默认文件可以保存在 SQLite BLOB 中。配置 S3-compatible provider 后，文件内容进入对象存储，但文件归属和生命周期仍由论坛管理。

已有 BLOB 可以通过迁移任务或 `migrate-files` 迁移。迁移时不要把“对象已经上传”当成“业务引用已经完成”，发布和清理仍看论坛侧文件状态。
