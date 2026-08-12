---
layout: home

hero:
  name: "YourTJ Hub"
  text: "校园社区平台"
  tagline: "面向同济校园的社区平台，以板块化论坛沉淀长期有价值的信息与讨论"
  image:
    src: /favicon.svg
    alt: YourTJ Hub Logo
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 查看文档
      link: /guide/introduction
    - theme: alt
      text: 进入站点
      link: https://forum.yourtj.de

features:
  - title: "💬板块化论坛"
    details: 主题与回复、板块、通知、私信、草稿与 Markdown，RBAC 管理与多语言界面，核心能力为 Current
  - title: "🔐统一身份"
    details: 密码 + TOTP 2FA + GitHub OAuth，内置 OIDC Provider 签发数值型 sub，一处登录处处可用（Partial）
  - title: "🔍聚合搜索"
    details: Meilisearch 聚合搜索，主题/用户/板块统一搜索框，支持拼音匹配与事件驱动索引（Partial）
  - title: "⚙️单一二进制"
    details: Go + Vue 通过 go:embed 打包进一个可执行文件，SQLite/MySQL/PostgreSQL 可选，一键部署
  - title: "📱多端访问"
    details: Flutter 移动端与 Web 共享同一 API 与体验语义，OIDC 授权码 + PKCE 登录（Partial）
  - title: "💕开源共建"
    details: Monorepo 完全开源，从 origin/dev 开分支、PR 目标 dev，欢迎参与社区共建
---
