# 搜索

本文介绍 YourTJ Hub 的搜索能力：Meilisearch 集成、聚合搜索与索引同步机制。

## 定位

搜索为 **Partial**。Meilisearch 是**可选依赖**（`config.toml` 的 `[meilisearch]`），未配置时搜索功能整体不可用，但不影响论坛其余功能。

## 聚合搜索

- **一个搜索框**覆盖主题、用户、板块，结果分组展示 + scope tabs（issue #22）；
- 用户与板块支持**拼音 / 首字母匹配**，中文友好；
- 结果来自 Meilisearch 聚合索引。

## 索引同步

- 索引同步是**事件驱动**的：主题、用户、板块的发布/更新/删除事件驱动 Meilisearch 文档同步；
- 迁移 v13 触发一次重建；
- **可重建投影**：`rebuild-search-index` CLI 可全量重建，索引不承载唯一业务事实（数据库才是真相源）。

## 降级行为

- Meilisearch 不可用时：搜索页展示**全量不可用**状态（unavailable-state UI fallback）；
- 单索引失败：经 `failedScopes` **部分降级**，其余 scope 仍可用。

## 配置与本地开发

```toml
[meilisearch]
url = "http://localhost:7700"
masterkey = "yourtj-dev-master-key"
```

本地通过 `make dev` 由 Docker Compose 拉起 Meilisearch（默认 `:7700`，dev master key `yourtj-dev-master-key`）。详见[快速开始](/guide/getting-started)。

## 课评搜索范围

- 课评（courses）有独立的 `courses` scope，依赖**事务绑定的 outbox worker** 同步；
- 提供 `rebuild-course-search` / `reconcile-course-search` CLI 用于重建与对账（见[课评](/development/courses)）。

## 运维 runbook（待补）

- Meilisearch 索引重建、备份；
- 生产密钥管理。

## 相关文档

- [配置说明](/guide/configuration)：`[meilisearch]` 配置
- [课评](/development/courses)：course scope 与 outbox
- [测试策略](/development/testing)：索引相关验证
