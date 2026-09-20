# 关于 YourTJ Hub

YourTJ Hub 是面向同济校园的学生社区。Web 站点位于 [f.yourtj.de](https://f.yourtj.de)，源码托管在 [YourTongji/YourTJ-Hub](https://github.com/YourTongji/YourTJ-Hub)。

## 主要功能

- **社区**：瞬间、提问、文章、回复、通知、私信、收藏。
- **课程**：课程目录、课评、课程收藏。
- **排课**：多方案排课、冲突检查、周次视图、云同步。
- **我的校园**：课表、成绩、校历、学校消息。
- **Wiki**：站内阅读，GitHub Pull Request 协作编辑。
- **移动端**：Flutter 客户端，与 Web 使用同一账号和 API。

## 文档怎么读

| 你想做什么 | 从这里开始 |
| --- | --- |
| 第一次使用 YourTJ | [快速开始](/guide/getting-started) |
| 查课、看课评、排课 | [课程与排课](/guide/courses) |
| 连接学校身份 | [我的校园](/guide/campus) |
| 部署自己的实例 | [部署 YourTJ Hub](/guide/deployment) |
| 参与开发 | [从这里开始](/development/local-development) |
| 理解系统怎么运行 | [架构](/development/overview) |

## 技术形态

论坛主应用使用 Go + Vue 3，生产环境保持单一二进制。开发时 Vue 由 Vite 提供热更新，构建后静态资源会通过 `go:embed` 进入 Go 可执行文件。

部署默认使用 PostgreSQL，开发和测试默认 SQLite；Meilisearch 负责可重建的搜索索引。移动端使用 Flutter。

如果你需要理解“一个发帖请求为什么会同时涉及数据库事务、后台任务和搜索投影”，直接阅读[架构](/development/overview)。
