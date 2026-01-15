# 部署指南

本指南详细介绍如何将 YourTJ 选课社区部署到生产环境。

## 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare CDN                           │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌───────────────────────┐       ┌───────────────────────┐
│   Cloudflare Pages    │       │  Cloudflare Workers   │
│      (Frontend)       │       │      (Backend)        │
└───────────────────────┘       └───────────────────────┘
                                            │
                                            ▼
                                ┌───────────────────────┐
                                │    Cloudflare D1      │
                                │     (Database)        │
                                └───────────────────────┘
```

## 后端部署

### 步骤 1：准备 Cloudflare 账户

1. 注册 [Cloudflare](https://dash.cloudflare.com/) 账户
2. 安装 Wrangler CLI：

```bash
npm install -g wrangler
wrangler login
```

### 步骤 2：创建 D1 数据库

```bash
# 创建数据库
wrangler d1 create jcourse-db

# 记录返回的 database_id
# 更新 wrangler.toml 中的 database_id
```

### 步骤 3：初始化数据库

```bash
# 执行建表语句
wrangler d1 execute jcourse-db --file=schema.sql
```

### 步骤 4：配置密钥

```bash
# 人机验证服务地址
wrangler secret put CAPTCHA_SITEVERIFY_URL

# 管理后台密钥（建议使用 32 位以上随机字符串）
wrangler secret put ADMIN_SECRET
```

### 步骤 5：部署 Workers

```bash
wrangler deploy
```

::: tip 部署成功
部署成功后会显示 Workers URL，例如：
`https://jcourse-backend.your-subdomain.workers.dev`
:::

## 前端部署

### 方式一：Cloudflare Pages（推荐）

#### 通过 Git 集成

1. 将代码推送到 GitHub/GitLab
2. 在 Cloudflare Dashboard 创建 Pages 项目
3. 连接 Git 仓库
4. 配置构建设置：

| 设置项 | 值 |
|--------|-----|
| 构建命令 | `npm run build` |
| 输出目录 | `dist` |
| 根目录 | `main/frontend` |

5. 添加环境变量：
   - `VITE_API_URL`
   - `VITE_TURNSTILE_SITE_KEY`
   - `VITE_CAPTCHA_URL`

#### 通过 CLI 部署

```bash
cd main/frontend

# 构建
npm run build

# 部署
wrangler pages deploy dist --project-name jcourse-web
```

### 方式二：Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
cd main/frontend
vercel
```

配置 `vercel.json`：

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

## YourTJCaptcha 部署

人机验证服务需要单独部署：

### 部署到 Vercel

1. Fork YourTJCaptcha 仓库
2. 在 Vercel 导入项目
3. 配置环境变量：

| 变量名 | 说明 |
|--------|------|
| `CAPTCHA_SECRET` | 验证密钥 |

4. 部署完成后获取验证服务 URL

## Waline 评论系统部署

### 步骤 1：创建 Neon 数据库

1. 注册 [Neon](https://neon.tech/) 账户
2. 创建新项目和数据库
3. 获取连接字符串

### 步骤 2：部署 Waline

1. Fork [Waline](https://github.com/walinejs/waline) 仓库
2. 在 Vercel 导入项目
3. 配置环境变量：

```bash
DATABASE_URL=postgresql://user:pass@host/db
SITE_NAME=YourTJ 选课社区
SITE_URL=https://yourtj.com
```

4. 部署完成后获取 Waline 服务 URL

## 域名配置

### Cloudflare 域名

1. 在 Cloudflare 添加域名
2. 配置 DNS 记录：

```
# 前端
yourtj.com -> Cloudflare Pages

# API
api.yourtj.com -> Cloudflare Workers
```

### 自定义域名

在 Pages/Workers 设置中添加自定义域名。

## CI/CD 配置

### GitHub Actions

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
        working-directory: main/backend
      - run: npx wrangler deploy
        working-directory: main/backend
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
        working-directory: main/frontend
      - run: npm run build
        working-directory: main/frontend
        env:
          VITE_API_URL: ${{ vars.VITE_API_URL }}
          VITE_CAPTCHA_SITEKEY: ${{ vars.VITE_CAPTCHA_SITEKEY }}
          VITE_WALINE_SERVER_URL: ${{ vars.VITE_WALINE_SERVER_URL }}
      - run: npx wrangler pages deploy dist --project-name jcourse-web
        working-directory: main/frontend
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
```

## 监控与日志

### Cloudflare Analytics

- Workers 分析：请求量、错误率、延迟
- Pages 分析：访问量、带宽使用

### 日志查看

```bash
# 实时日志
wrangler tail

# 过滤错误
wrangler tail --format=json | jq 'select(.level == "error")'
```

## 故障排除

### 常见问题

| 问题 | 解决方案 |
|------|----------|
| 502 错误 | 检查 Workers 日志，确认代码无语法错误 |
| CORS 错误 | 确认后端 CORS 配置包含前端域名 |
| 数据库错误 | 检查 D1 绑定配置和 database_id |
| 验证失败 | 确认 CAPTCHA 密钥配置正确 |

### 回滚部署

```bash
# 查看部署历史
wrangler deployments list

# 回滚到指定版本
wrangler rollback [deployment-id]
```

## 下一步

- [环境变量](/development/env-variables) - 完整的环境变量参考
- [Cloudflare Workers](/development/cloudflare) - Workers 开发详解
