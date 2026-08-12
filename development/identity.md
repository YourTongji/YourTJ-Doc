# 身份与 OIDC

本文介绍 YourTJ Hub 的身份模型、登录方式、内建 OIDC Provider 与会话生命周期。完整规格见仓库内 `docs/product/identity-and-access.md`。

## 身份模型

- **身份真相源 = 论坛的 `users` 表**（uint64 数值 ID）。内建 OIDC Provider 面向第一方客户端（选课站、移动端等）签发标准 OIDC 令牌，`sub` = 用户的数值 ID；
- **数值 ID 是硬约束**：credit 的 `GetID()` 用 `strconv.ParseUint` 解析 sub，UUID 解析失败会塌缩为 0，导致所有用户碰撞；OIDC provider 在服务端强制 `sub` 恒为数值 `users.id`；
- 论坛 JWT 只是**会话凭证**（HS256、自签、7 天 TTL、携带 `jti`），不是身份真相，**绝不发给外部 OIDC 客户端**——外部客户端只拿到限定 scope 的 opaque access token；
- 本部署不启用 Casdoor（无 Casdoor 路由/配置/依赖）。

## Web 登录

| 方式 | 说明 |
|---|---|
| 密码 | RSA-OAEP 加密密码 → `users.Verify`；若用户开启 TOTP 2FA，先签发 5 分钟 `totp_challenge` 一次性令牌（成功验证后原子消费，重放无法再造会话），再由 `/api/auth/totp/verify` 换成正式会话令牌 |
| GitHub OAuth | 经 goth 完成绑定或登录并签发会话令牌 |
| 内建 OIDC Provider | 面向第一方客户端，见下 |

## 内建 OIDC Provider

- **发现端点**：issuer 路径 `/api/oauth` 下的 `/.well-known/openid-configuration`；端点包括 `/authorize`、`/authorize/callback`（登录桥）、`/token`、`/userinfo`、`/keys`；
- **仅授权码 + PKCE S256**；强制 `state`、`nonce`、精确 redirect-URI 匹配、code 单次使用；登录桥要求已认证的论坛会话，且**绝不跟随客户端提供的重定向目标**（open-redirect 安全）；
- ID token 用持久提供者密钥（内联 PEM 或 key 文件，否则自动生成）RS256 签名；`sub` = 数值 `users.id`；opaque access token 只存 token-ID 行；
- 配置来自 `config.toml` 的 `[oidc]` 段（见[配置说明](/guide/configuration)），无管理后台 UI，改后重启生效。

## 移动端登录

1. AppAuth + PKCE 打开内建 OIDC 授权页，拿到回调授权码（内存中保留对应 PKCE verifier 与 nonce）；
2. 应用把 `{code, codeVerifier, nonce, redirectUri}` 发到 `POST /api/auth/oidc/exchange`；
3. 后端校验精确 redirect-URI、原子兑换 code（单次使用、PKCE 校验）、绑定 nonce 与数值 sub，签发论坛 JWT 会话；
4. JWT 存 Keychain/Keystore（`flutter_secure_storage`）；OIDC 令牌服务端校验、**应用永不持久化**。

## 会话生命周期

- 论坛 JWT 有效期 7 天；每个会话 token 带 `jti`，映射到 `user_sessions` 行；auth 中间件拒绝 session 行缺失/过期的 token，撤销即时生效；
- **撤销**：设置 → 安全 中可列出会话（IP 打码、设备/UA）、逐会话撤销、或全端登出；"全端登出"同时 bump `TokenVersion`（对既往所有 token 全局失效，也连带使 userinfo 端点的 OIDC access token 失效）；
- 改密会 bump `TokenVersion`；普通登出删除当前 session 行，撤销出错时大声失败（不静默留存 token）。

## 双因子认证（TOTP 2FA）

- 密码登录受论坛侧 TOTP 保护（RFC 6238，可选、opt-in）；
- secret 用 **AES-256-GCM** 加密存储（密钥派生自 `app.signingKey`）；恢复码哈希存储、单次使用；验证限流（每用户 10 次失败 / 15 分钟）；
- GitHub OAuth 与内建 OIDC 登录**不走**论坛 TOTP；这些路径的 MFA 是 `Decision needed`。

## 密码重置

- 重置链接是短时签名 JWT，claims 绑定 `userId + email + TokenVersion`（签发时点）；重置端点对实时用户行重查三者，账号一旦被重置/找回/撤销链接即失效；
- 签发（forgot-password）与确认（reset-password）都限流；forgot-password 强制验证码 + 24 小时邮箱变更冷却；
- 旧密钥签发的链接在密钥轮换后无法通过校验（签名密钥 fail-closed，issue #106）。

## 账号生命周期

- 注册：论坛自助密码注册（可选邮箱验证）；GitHub OAuth 可自动创建账号；**内建 OIDC Provider 不创建账号**，只认证已有用户；
- 邮箱变更：密码账号走 `Current`（改前验旧密码、旧邮箱收通知、24 小时内禁用密码重置）；OAuth-only 自助改邮箱为 `Partial`（OAuth 重认证通道未实现）；
- 封禁/冻结：`users.is_frozen` 权威；userinfo 与 exchange 路径拒绝冻结账户；
- 删除/导出：`Planned`（产品原则 12：持久化前回答目的/可见性/保留/导出/删除）。

## 机器人（Agent）隔离

- Agent 是 `users.actor_type = bot` 行 + `agents` 行；由管理员创建，无邮箱、无可用密码、无角色；
- 认证用唯一 bearer token（`agt_…`），创建/轮换时仅展示一次；库中只存 SHA-256 哈希 + 非机密 8 字符前缀；
- 机器人行被密码登录、找回/重置密码、OAuth 绑定、OIDC 绑定、改密、TOTP 管理、人形会话创建/列出**一律拒绝**（会话中间件不解析 bot 用户）；
- Agent 公开 API（六操作）与令牌细节见[后端（Go）](/development/backend#agent机器人)。

## 安全要点

- PKCE S256 强制；nonce 防重放；state 防回调 CSRF；授权码单次使用；登录桥不可作开放重定向；
- 论坛 HS256 JWT 在 userinfo 端点**不接受**（只收 opaque access token）；
- 客户端 secret 服务端配置、绝不记录日志；id_token / access token 客户端不持久化；
- 登录枚举抵抗：错误不区分"用户不存在 / 密码错误"，未知账号也执行同成本 PBKDF2 验证；
- Cookie `Secure` 按环境 fail-closed（`app.env != "local"` 即强制，与 `server.url` scheme 无关，issue #113）。

## 相关文档

- [配置说明](/guide/configuration)：`[oidc]` 与 `[app]` 配置
- [后端（Go）](/development/backend)：会话与中间件实现
- [移动端](/development/mobile)：OIDC exchange 登录
