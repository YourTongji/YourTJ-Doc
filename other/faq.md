# 常见问题

## YourTJ Hub 是什么？

YourTJ Hub 是一个面向同济校园的社区平台，以板块化论坛为核心，希望让校园经验、问题与观点沉淀为长期有价值、可检索的信息。线上站点：[https://forum.yourtj.de](https://forum.yourtj.de)。

## 它和旧的选课社区是什么关系？

YourTJ Hub 是新平台，核心论坛直接演进自 [GooseForum](https://github.com/leancodebox/GooseForum)，不是旧选课社区的延续。课程评价（课评）是平台中一项 **Partial** 能力：课程目录、匿名课评与审核已可用，移动端 UI 与正文检索仍在规划中。

## 如何注册 / 登录？

- 密码注册（可选邮箱验证）+ GitHub OAuth；
- 登录后可在设置中开启 **TOTP 2FA**（10 次失败 / 15 分钟限流）；
- 移动端通过内置 OIDC Provider（AppAuth + PKCE）完成授权码登录。

## 会暴露我的学号 / 校园邮箱吗？

不会。公开身份不暴露校园身份：统一身份是论坛的数值用户 ID（`users.id`），内置 OIDC Provider 只签发数值型 `sub`。校园身份与公开身份分离（YourTJ 原则）。

## 谁开发部署的？

同济在校（或曾在校）学生开发维护，代码与文档全部开源。社区是非官方网站，不代替任何官方系统。

## 内容如何管理？

内容治理遵循"可回退"原则：

- 敏感词拦截或进入待审队列（管理后台批准/拒绝）；
- 不修改正常内容、不评判内容真实性，只处理违规（广告、刷屏、人身攻击、违法违规）与事实性修正；
- 管理员操作有审计与申诉渠道；服务条款（ToS）可在 `/terms` 查看。

## 哪些内容不被接受？

广告、刷屏、侵害他人、违法违规内容一律不被接受，管理员会按规则删除违规内容并可能处理账号。

## 积分是什么？

积分是面向贡献的**封闭闭环虚拟权益**：主题/回复奖励在论坛内记账（`Current`），但**不可充值、不可提现、不可自由转账**。跨平台结算（services/credit）仍为 `Planned`，尚未上线。

## AI 可读内容是什么？

论坛提供 `/llms.txt`、`/llms-full.txt`、`/p/posts/{id}.md` 等公开文本导出，只包含已发布、正常状态的主题与回复，供 AI 工具阅读。详见[开发文档](/development/overview)。

## 如何联系 / 反馈问题？

- 线上论坛：[https://forum.yourtj.de](https://forum.yourtj.de)
- GitHub Issues：[https://github.com/YourTongji/YourTJ-Hub/issues](https://github.com/YourTongji/YourTJ-Hub/issues)（含 Bug 报告与功能建议模板）
- 邮箱：[support@yourtj.de](mailto:support@yourtj.de)
