# 课评

本文介绍 YourTJ Hub 的课程评价（课评）能力。状态为 **Partial**：课程目录 + 匿名课评 + 审核已可用；移动端课程 UI 与课评正文内搜索仍为 Planned。

## 课程目录

- **跨方言课程目录 schema**：course / alias / term / offering / instructor / offering-instructor / import-run / source-ref；
- **离线导入 CLI**：`course-import`（`catalog` 与 `reviews` 两个子命令），支持 manifest 校验和、dry-run、quarantine（隔离）与幂等重试；reviews 子命令受 manifest `rights_approval_ref` 门控（需有权利批准引用才能导入课评）。

## 读取服务

- PostgreSQL 只读服务，支持关键词 / 教师 / 学期 / 校区过滤；
- SSR 页面：`/courses`、`/courses/:courseId`；
- JSON 接口：`GET /api/forum/courses`、`GET /api/forum/courses/{courseId}`（**已由 OpenAPI 覆盖**，路由契约测试通过）。

## 匿名课评

- 课评支持写 / 改 / 删 / 点赞（helpful）/ 举报（report）；
- **零泄漏 DTO**：课评写入/读取的 DTO 不携带会泄露作者身份的数据；
- **审核**：CourseManager 可 hide/show 与处理举报队列；**Admin 在审计记录下可揭示匿名作者身份**（受限能力）。

## 搜索同步

- Meilisearch 有独立的 `courses` scope，由**事务绑定的 outbox worker** 同步（写入与索引同步在同一事务边界，进程崩溃不丢事件）；
- CLI：`rebuild-course-search`（全量重建）、`reconcile-course-search`（对账）。

## 统计与治理

- `rebuild-course-stats` CLI 重建课程统计；
- 课评相关动作（catalog 读取、review 写/点赞/举报/揭示）有独立的每动作限流与审计。

## 缺口

- 移动端课程浏览 UI（Planned）；
- 课评正文内搜索（Planned）。

## 相关文档

- [搜索](/development/search)：course scope 与索引
- [API 契约](/development/api)：课程只读接口覆盖
- [路线图](/roadmap/)：课评状态
