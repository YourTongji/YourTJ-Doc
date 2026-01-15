# 环境变量

本文档列出 YourTJ 选课社区所有环境变量配置

## 后端环境变量

### wrangler.toml 配置

```toml
name = "jcourse-backend"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "jcourse-db"
database_id = "your-database-id"
```

| 配置项 | 说明 | 必填 |
|--------|------|------|
| `name` | Workers 项目名称 | 是 |
| `main` | 入口文件路径 | 是 |
| `compatibility_date` | 兼容性日期 | 是 |
| `binding` | D1 数据库绑定名 | 是 |
| `database_name` | D1 数据库名称 | 是 |
| `database_id` | D1 数据库 ID | 是 |

### Wrangler Secrets

通过 `wrangler secret put` 设置的敏感变量：

| 变量名 | 说明 | 设置命令 |
|--------|------|----------|
| `CAPTCHA_SITEVERIFY_URL` | YourTJCaptcha 验证服务地址 | `wrangler secret put CAPTCHA_SITEVERIFY_URL` |
| `ADMIN_SECRET` | 管理后台访问密钥 | `wrangler secret put ADMIN_SECRET` |

**设置示例：**

```bash
# 设置人机验证 URL
wrangler secret put CAPTCHA_SITEVERIFY_URL
# 输入: https://your-captcha.vercel.app/api/siteverify

# 设置管理密钥（建议 32 位以上随机字符串）
wrangler secret put ADMIN_SECRET
# 输入: your-very-secure-admin-secret-key
```

## 前端环境变量

### .env 文件

```bash
# API 地址
VITE_API_URL=https://jcourse-backend.your-subdomain.workers.dev

# Cloudflare Turnstile 站点密钥
VITE_TURNSTILE_SITE_KEY=your-turnstile-site-key

# YourTJCaptcha 服务地址
VITE_CAPTCHA_URL=https://your-captcha.vercel.app
```

| 变量名 | 说明 | 必填 | 示例 |
|--------|------|------|------|
| `VITE_API_URL` | 后端 API 地址 | 是 | `https://api.yourtj.com` |
| `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile 公钥 | 是 | `0x4AAAAAAA...` |
| `VITE_CAPTCHA_URL` | YourTJCaptcha 服务地址 | 是 | `https://captcha.yourtj.com` |

::: tip Waline 配置说明
Waline 评论服务的地址目前是硬编码在 `src/pages/Feedback.tsx` 中的，如需修改请直接编辑该文件中的 `serverURL` 配置项。
:::

### 环境文件优先级

```
.env.local        # 本地开发（不提交）
.env.development  # 开发环境
.env.production   # 生产环境
.env              # 默认配置
```

::: tip 提示
`.env.local` 优先级最高，适合存放本地开发的敏感配置。
:::

## YourTJCaptcha 环境变量

### 验证服务（Vercel）

| 变量名 | 说明 |
|--------|------|
| `CAPTCHA_SECRET` | 验证密钥 |

## Waline 环境变量

### 评论服务（Vercel）

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | 是 |
| `SITE_NAME` | 站点名称 | 否 |
| `SITE_URL` | 站点 URL | 否 |
| `SECURE_DOMAINS` | 安全域名列表 | 否 |
| `AKISMET_KEY` | Akismet 反垃圾密钥 | 否 |
| `FORBIDDEN_WORDS` | 禁止词列表 | 否 |

## 环境变量模板

### 后端 (.dev.vars)

```bash
# 本地开发变量
CAPTCHA_SITEVERIFY_URL=http://localhost:3001/api/siteverify
ADMIN_SECRET=dev-admin-secret
```

### 前端 (.env.example)

```bash
# 复制此文件为 .env 并填写实际值

# 后端 API 地址
VITE_API_URL=

# Cloudflare Turnstile 站点密钥
VITE_TURNSTILE_SITE_KEY=

# YourTJCaptcha 服务地址
VITE_CAPTCHA_URL=
```

## CI/CD 环境变量

### GitHub Actions Secrets

| Secret 名称 | 说明 |
|-------------|------|
| `CF_API_TOKEN` | Cloudflare API Token |

### GitHub Actions Variables

| Variable 名称 | 说明 |
|---------------|------|
| `VITE_API_URL` | 生产环境 API 地址 |
| `VITE_TURNSTILE_SITE_KEY` | 生产环境 Turnstile 密钥 |
| `VITE_CAPTCHA_URL` | 生产环境 YourTJCaptcha 地址 |

## 安全建议

::: warning 安全提示
- **永远不要**将敏感变量提交到代码仓库
- 使用 `.gitignore` 忽略 `.env.local` 和 `.dev.vars`
- 定期轮换密钥
- 使用强密码（32 位以上随机字符串）
- 生产环境使用 Secrets 管理服务
:::

### 生成安全密钥

```bash
# 使用 openssl
openssl rand -base64 32

# 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 使用 Python
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## 下一步

- [Cloudflare Workers](/development/cloudflare) - Workers 部署详解
- [部署指南](/guide/deployment) - 完整部署流程
