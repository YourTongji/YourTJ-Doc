# 快速开始

本指南将帮助你快速搭建和运行 YourTJ 选课社区项目。

## 环境要求

在开始之前，请确保你的开发环境满足以下要求：

| 工具 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | >= 18.0.0 | 推荐使用 LTS 版本 |
| npm | >= 9.0.0 | 随 Node.js 安装 |
| Wrangler | >= 3.0.0 | Cloudflare CLI 工具 |
| Git | >= 2.0.0 | 版本控制 |

## 项目结构

```
YourTJCourse-Serverless/
├── frontend/          # 前端项目
│   ├── src/
│   │   ├── components/  # React 组件
│   │   ├── pages/       # 页面组件
│   │   └── services/    # API 服务
│   ├── public/          # 静态资源
│   └── package.json
│
└── backend/           # 后端项目
    ├── src/
    │   ├── index.ts     # 主入口
    │   └── sqids.ts     # ID 编码
    ├── schema.sql       # 数据库结构
    └── wrangler.toml    # Cloudflare 配置
```

## 克隆项目

```bash
git clone https://github.com/YourTongji/YourTJCourse-Serverless.git
```

## 后端部署

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置 Cloudflare

首先登录 Cloudflare：

```bash
npx wrangler login
```

### 3. 创建 D1 数据库

```bash
# 创建数据库
npx wrangler d1 create jcourse-db

# 初始化数据库结构
npx wrangler d1 execute jcourse-db --file=schema.sql
```

### 4. 配置环境变量

设置必要的密钥：

```bash
# 人机验证服务 URL
npx wrangler secret put CAPTCHA_SITEVERIFY_URL

# 管理后台密钥
npx wrangler secret put ADMIN_SECRET
```

### 5. 部署后端

```bash
npx wrangler deploy
```

部署成功后，你将获得一个 Workers URL，例如：`https://jcourse-backend.your-subdomain.workers.dev`

## 前端部署

### 1. 安装依赖

```bash
cd frontend
npm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```bash
# API 地址（后端 Workers URL）
VITE_API_URL=https://jcourse-backend.your-subdomain.workers.dev

# Cloudflare Turnstile 站点密钥
VITE_TURNSTILE_SITE_KEY=your-turnstile-site-key

# YourTJCaptcha 服务地址
VITE_CAPTCHA_URL=https://your-captcha.vercel.app
```

::: tip Waline 配置说明
Waline 评论服务的地址目前是硬编码在 `src/pages/Feedback.tsx:52` 中的，如需修改请直接编辑该文件中的 `serverURL` 配置项。
:::
::: tip
国内网络环境访问需要把Workers默认域名用自定义子域替换
:::

### 3. 本地开发

```bash
npm run dev
```

访问 `http://localhost:3000` 查看效果。

### 4. 构建部署

```bash
# 构建
npm run build

# 部署到 Cloudflare Pages
npm run deploy
```

## 验证部署

部署完成后，检查以下功能是否正常：

- 首页课程列表加载
- 课程搜索功能
- 课程详情页面
- 评价提交（需要人机验证）
- 评论系统（Waline）

## 常见问题

### CORS 错误

确保后端 `wrangler.toml` 中配置了正确的 CORS 设置，或在代码中允许前端域名。

### 数据库连接失败

检查 `wrangler.toml` 中的 `database_id` 是否正确。

### 人机验证失败

确认 `CAPTCHA_SITEVERIFY_URL` 和 `VITE_CAPTCHA_URL` 配置正确。

## 下一步

- [配置说明](/guide/configuration) - 详细的配置选项
- [部署指南](/guide/deployment) - 生产环境部署
- [开发文档](/development/overview) - 深入了解技术实现
