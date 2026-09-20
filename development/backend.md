# 后端

论坛后端位于 `apps/gooseforum`，使用 Go、Gin 和 GORM。

理解后端时，先记住这个分工：controller 负责 HTTP 边界，service 负责业务，models 负责数据。跨领域操作通过对方的 service 完成，避免直接跨表写 SQL。

## 以“发布话题”为例

`POST /api/forum/topics/write` 会在一次请求中完成多项校验和写入。

请求进入后会依次经过：

1. 登录、可写账号和限流检查。
2. honeypot / captcha / 新用户冷却等浏览器侧防滥用规则。
3. 发帖权限、标题长度、正文长度和图片数量检查。
4. 敏感内容策略。
5. 新建或编辑时的业务约束。
6. 单个数据库事务。
7. 提交后的缓存、统计和事件处理。

事务内会一起处理：

- topic 主记录。
- 首帖。
- 首帖 revision。
- 分类索引。
- 搜索同步任务。

任何一步失败，整个事务回滚。

对应入口在 `apps/gooseforum/app/http/routes/route4api.go`，核心写入逻辑位于 `apps/gooseforum/app/http/controllers/api/topicController.go`。搜索任务的事务边界在 `apps/gooseforum/app/service/searchservice/indexservice.go`。

如果把“创建首帖”“写分类”“同步搜索”拆成互不关联的 controller 操作，用户就可能得到半个成功结果；当前事务边界正是为了避免这种状态。

## Controller 和 Service 的边界

后端主要目录：

```text
app/
  bundles/             基础设施
  models/              GORM 模型与数据访问
  migration/           schema / 数据迁移
  service/             业务逻辑
  http/controllers/    HTTP 边界
  http/middleware/     认证、CSRF、限流、安全头
  console/             CLI
```

适合放在 controller 的逻辑：

- 解析 URI / query / body。
- 判断 HTTP status。
- 设置 `Retry-After`、`Cache-Control` 等响应头。
- 调用领域 service。

适合放在 service 的逻辑：

- 一组业务规则。
- 多表事务。
- 跨 controller 复用的流程。
- 对外部服务的有界调用。
- 可重试任务的处理。

如果同一段规则已经被 Web、Agent 或后台任务复用，它通常就不该继续留在某个 controller 里。

## 请求取消要能向下传

请求范围内的数据库、HTTP 和 LLM 调用应继承请求的 `context.Context`。

例如课程 AI 总结在 HTTP 接口上仍是同步返回，但模型调用可以被取消，并有最大耗时。客户端断开后，应取消后续模型调用，避免继续占用模型额度。

事务提交后的副作用属于另一类生命周期。通知、搜索投影等工作使用明确的 detached context 或后台 worker，不继续依附已经结束的浏览器请求。

可以把两类工作简单区分为：

| 工作 | Context |
| --- | --- |
| 为这次请求生成响应所必需 | request context |
| 数据提交后仍应完成 | worker / detached context |

## 启动 gate

`go run . serve` 启动后，HTTP listener 可以先绑定端口，但业务并不会立即开放。

默认开启 migration 时：

```text
进程启动
  ↓
HTTP listener 已绑定
  ↓
schema + versioned migrations
  ↓
成功：启动 worker / cron / OAuth / Wiki 等
  ↓
打开 startup gate
```

gate 打开前，所有请求，包括 `GET /health`，都会返回：

```http
503 Service Unavailable
Retry-After: 5
```

硬迁移失败会让进程退出，避免带着半套 schema 接收业务请求。

## 不同认证入口保持独立边界

不同客户端使用不同凭据：

| 客户端 | 凭据 |
| --- | --- |
| Web | HttpOnly `access_token` Cookie |
| Flutter | 论坛 JWT Bearer |
| Agent | `agt_` Bearer token |

Web 写请求还需要 CSRF。Agent 则有独立 actor 类型和权限边界。

不要在业务 controller 中实现“Cookie 不行就再试 JWT、再试 Agent token”的 fallback。路由组应先决定允许哪种身份，再进入业务逻辑。

## 后台任务

需要重试、恢复或观察状态的副作用，优先进入任务模型。

典型例子是搜索：

1. 业务事务里写入 `task_queue`。
2. worker 领取任务。
3. worker 读取最新数据库状态。
4. 写入或删除 Meilisearch 文档。
5. 失败则走重试和 stale lease 恢复。

这让业务事实和外部投影之间有一个明确的恢复点。

## 修改后端时

推荐顺序：

1. 先写清行为、权限和失败语义。
2. 如果 wire shape 变化，更新 OpenAPI。
3. 如果存储变化，添加 migration。
4. 在 owner service 实现规则。
5. controller 只负责接线。
6. 补最小回归测试。
7. 按改动范围运行验证。

涉及模型或 migration 时，必须补真实 PostgreSQL 检查，见[数据库](/development/database)。
