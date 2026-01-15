# 配置说明

本文档详细介绍 YourTJ 选课社区的各项配置选项。

## 后端配置

### wrangler.toml

后端使用 Cloudflare Workers，配置文件为 `wrangler.toml`：

```toml
name = "jcourse-backend"
main = "src/index.ts"
compatibility_date = "2026-01-01"

[[d1_databases]]
binding = "DB"
database_name = "jcourse-db"
database_id = "your-database-id"
```

| 配置项 | 说明 |
|--------|------|
| `name` | Workers 项目名称 |
| `main` | 入口文件路径 |
| `compatibility_date` | 兼容性日期 |
| `binding` | 数据库绑定名称 |
| `database_name` | D1 数据库名称 |
| `database_id` | D1 数据库 ID |

### 环境变量

通过 `wrangler secret` 设置的敏感配置：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `CAPTCHA_SITEVERIFY_URL` | YourTJCaptcha 验证服务地址 | `https://captcha.example.com` |
| `ADMIN_SECRET` | 管理后台访问密钥 | 随机生成的强密码 |

设置方法：

```bash
# 设置人机验证 URL
npx wrangler secret put CAPTCHA_SITEVERIFY_URL
# 输入: https://your-captcha-service.vercel.app

# 设置管理密钥
npx wrangler secret put ADMIN_SECRET
# 输入: your-secure-admin-secret
```

## 前端配置

### 环境变量

前端使用 Vite，环境变量以 `VITE_` 前缀开头：

```bash
# .env 文件
VITE_API_URL=https://jcourse-backend.workers.dev
VITE_TURNSTILE_SITE_KEY=your-turnstile-site-key
VITE_CAPTCHA_URL=https://your-captcha.vercel.app
```

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `VITE_API_URL` | 后端 API 地址 | 是 |
| `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile 公钥 | 是 |
| `VITE_CAPTCHA_URL` | YourTJCaptcha 服务地址 | 是 |

::: tip Waline 配置说明
Waline 评论服务的地址目前是硬编码在 `src/pages/Feedback.tsx:52` 中的，如需修改请直接编辑该文件中的 `serverURL` 配置项。
:::

### 环境文件

支持多环境配置：

- `.env` - 所有环境的默认配置
- `.env.local` - 本地开发配置（不提交到 Git）
- `.env.development` - 开发环境配置
- `.env.production` - 生产环境配置

::: tip 优先级
`.env.local` > `.env.[mode]` > `.env`
:::

## 数据库配置

### 初始化数据库

使用 `schema.sql` 初始化数据库结构：

```bash
npx wrangler d1 execute jcourse-db --file=schema.sql
```

### 数据库设置表

`settings` 表用于存储应用配置：

| key | 说明 | 默认值 |
|-----|------|--------|
| `show_legacy_reviews` | 是否显示历史评价数据 | `false` |

通过管理 API 修改设置：

```bash
curl -X PUT \
  -H "x-admin-secret: your-secret" \
  -H "Content-Type: application/json" \
  -d '{"value": "true"}' \
  https://your-api.workers.dev/api/admin/settings/show_legacy_reviews
```

## YourTJCaptcha 配置

### 获取密钥

1. 访问 YourTJCaptcha 管理后台
2. 创建新站点，获取 `sitekey` 和 `secret`
3. 部署验证服务到 Vercel

### 验证服务配置

验证服务需要配置以下环境变量：

| 变量名 | 说明 |
|--------|------|
| `CAPTCHA_SECRET` | YourTJCaptcha 密钥 |

## Waline 评论配置

### 部署 Waline

1. Fork Waline 仓库
2. 在 Vercel 部署
3. 配置 Neon 数据库

### Vercel 环境变量

| 变量名 | 说明 |
|--------|------|
| `DATABASE_URL` | Neon PostgreSQL 连接字符串 |
| `SITE_NAME` | 站点名称 |
| `SITE_URL` | 站点 URL |

### 前端集成

Waline 服务地址目前是硬编码在 `src/pages/Feedback.tsx:52` 中的，如需修改请直接编辑该文件：

```tsx
serverURL: 'https://your-waline.vercel.app',  // 修改此处
```

## 安全建议

::: warning 安全提示
- 不要将敏感信息提交到代码仓库
- 使用强密码作为 `ADMIN_SECRET`
- 定期轮换密钥
- 启用 Cloudflare 的安全功能
:::

### 推荐的安全配置

1. **启用 HTTPS** - Cloudflare 默认提供
2. **配置 CORS** - 限制允许的来源域名
3. **速率限制** - 防止 API 滥用
4. **输入验证** - 后端验证所有输入

## 下一步

- [部署指南](/guide/deployment) - 生产环境部署详解
- [环境变量](/development/env-variables) - 完整的环境变量列表
