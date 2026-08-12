# 声明

## 简介

YourTJ Hub（[https://forum.yourtj.de](https://forum.yourtj.de)）是一个**非官方网站**，由同济大学在校（或曾在校）学生开发维护。我们的愿景是：让校园经验、问题与观点不再消失在短暂的信息流中，沉淀为长期有价值、可检索的信息。

本项目不代替任何官方系统或教务机构，平台上的内容不代表同济大学官方立场。

## 身份机制

YourTJ Hub 是**可登录社区**：论坛 `users` 表是身份真相源，主题与回复对注册用户可见作者；Web 与移动端共享同一账号；内置 OIDC Provider 只对外签发数值型 `sub`（等于 `users.id`），**不暴露学号或校园邮箱作为公开身份**。

## 内容治理原则

平台遵循"可回退、可审计、可申诉"的治理原则：

- 不修改正常内容、不评判内容真实性；
- 只处理违规内容（广告、刷屏、人身攻击、违法违规等）与事实性修正；
- 敏感词拦截或进入待审队列，管理员操作有审计日志；
- 服务条款（ToS）可在管理后台编辑并在 `/terms` 查看。

## 数据与隐私

- 会话可逐条撤销或全端登出（`jti` + `user_sessions` + `TokenVersion`）；
- TOTP 密钥加密存储、恢复码哈希存储；
- 访问日志默认不记录客户端 IP（`logIp` 默认关闭）；
- 账号删除与数据导出能力仍为 `Planned`，会在落地后更新本声明。

## 许可与致谢

`apps/gooseforum` 基于 [GooseForum](https://github.com/leancodebox/GooseForum) 修改并保留其 **MIT License**。感谢 GooseForum 作者和所有上游贡献者提供的坚实基础。

> 本 monorepo 目前尚未提供覆盖全部目录的根级许可证。在维护者明确整体授权方式之前，不应假定 `apps/gooseforum` 之外的内容自动适用 MIT 许可。

## 联系方式

- 邮箱：[support@yourtj.de](mailto:support@yourtj.de)
- GitHub：[YourTongji/YourTJ-Hub](https://github.com/YourTongji/YourTJ-Hub)
