# Waline 部署

本文档详细介绍 Waline 评论系统的部署流程

## 概述

Waline 是 YourTJ 选课社区使用的评论系统，部署在 Vercel 上，使用 Neon PostgreSQL 作为数据库。

### 架构

```
┌─────────────────────────────────────────────────────────┐
│                      Vercel                              │
│                   (Waline Server)                        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                       Neon                               │
│                   (PostgreSQL)                           │
└─────────────────────────────────────────────────────────┘
```

## 步骤 1：创建 Neon 数据库

### 1.1 注册 Neon

1. 访问 [Neon](https://neon.tech/)
2. 使用 GitHub 或邮箱注册
3. 创建新项目

### 1.2 创建数据库

1. 在 Dashboard 点击 "New Project"
2. 选择区域（推荐选择离用户近的区域）
3. 设置项目名称，如 `yourtj-waline`

### 1.3 获取连接字符串

在项目 Dashboard 找到连接字符串：

```
postgresql://username:password@ep-xxx.region.neon.tech/neondb?sslmode=require
```

::: warning 注意
保存好连接字符串，后续部署需要使用。
:::

## 步骤 2：部署 Waline 到 Vercel

### 2.1 Fork 仓库

Fork [walinejs/waline](https://github.com/walinejs/waline) 到你的 GitHub 账户。

### 2.2 导入到 Vercel

1. 登录 [Vercel](https://vercel.com/)
2. 点击 "Add New Project"
3. 选择刚才 Fork 的 waline 仓库
4. 配置项目：

| 设置项 | 值 |
|--------|-----|
| Framework Preset | Other |
| Root Directory | `packages/server` |
| Build Command | `npm run build` |
| Output Directory | `.` |

### 2.3 配置环境变量

在 Vercel 项目设置中添加环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DATABASE_URL` | `postgresql://...` | Neon 连接字符串 |
| `SITE_NAME` | `YourTJ 选课社区` | 站点名称 |
| `SITE_URL` | `https://yourtj.com` | 站点 URL |
| `SECURE_DOMAINS` | `yourtj.com` | 安全域名 |

### 2.4 部署

点击 "Deploy" 开始部署。部署完成后获得 URL：

```
https://your-waline-xxx.vercel.app
```

## 步骤 3：配置管理后台

### 3.1 注册管理员

访问 `https://your-waline.vercel.app/ui/register` 注册第一个账户，该账户自动成为管理员。

### 3.2 管理后台功能

- 评论审核
- 用户管理
- 数据统计
- 系统设置

## 步骤 4：前端集成

### 4.1 环境变量配置

在前端项目的 `.env` 文件中添加 Waline 服务地址：

```bash
VITE_WALINE_SERVER_URL=https://your-waline.vercel.app
```

### 4.2 集成实现

项目使用动态加载和懒加载方式集成 Waline：

```tsx
// 从环境变量读取服务地址
const walineServerUrl = import.meta.env.VITE_WALINE_SERVER_URL || ''

// 动态加载 Waline
const initWaline = async () => {
  if (!walineServerUrl) return

  const { default: Waline } = await import('https://unpkg.com/@waline/client@v3/dist/waline.js')

  Waline.init({
    el: walineRef.current,
    serverURL: walineServerUrl,  // 使用环境变量
    lang: 'zh-CN',
    emoji: [
      'https://unpkg.com/@waline/emojis@1.2.0/weibo',
      'https://unpkg.com/@waline/emojis@1.2.0/bilibili',
    ],
    dark: false,
  })
}

// 使用 IntersectionObserver 实现懒加载
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !isWalineLoaded.current) {
        isWalineLoaded.current = true
        initWaline()
      }
    })
  },
  { threshold: 0.1 }
)
```

::: tip 配置说明
- Waline 服务地址通过环境变量配置，无需修改源代码
- 使用动态加载减少初始包体积
- 懒加载确保只在组件可见时加载 Waline
:::

## 高级配置

### 反垃圾评论

#### Akismet

```bash
# Vercel 环境变量
AKISMET_KEY=your-akismet-key
```

#### 关键词过滤

```bash
FORBIDDEN_WORDS=spam,广告,代写
```

### 邮件通知

```bash
# SMTP 配置
SMTP_SERVICE=QQ
SMTP_USER=your-email@qq.com
SMTP_PASS=your-smtp-password
AUTHOR_EMAIL=admin@yourtj.com
```

### 自定义域名

1. 在 Vercel 项目设置中添加域名
2. 配置 DNS 记录：

```
waline.yourtj.com -> CNAME -> cname.vercel-dns.com
```

## 数据备份

### 导出评论数据

在管理后台可以导出 JSON 格式的评论数据。

### 数据库备份

Neon 提供自动备份功能，也可以手动导出：

```bash
pg_dump $DATABASE_URL > backup.sql
```

## 故障排除

### 常见问题

| 问题 | 解决方案 |
|------|----------|
| 评论加载失败 | 检查 `serverURL` 配置 |
| 数据库连接错误 | 验证 `DATABASE_URL` 格式 |
| CORS 错误 | 检查 `SECURE_DOMAINS` 配置 |
| 邮件发送失败 | 验证 SMTP 配置 |

### 查看日志

在 Vercel Dashboard 的 "Functions" 标签查看运行日志。

## 升级 Waline

### 同步上游更新

```bash
# 添加上游仓库
git remote add upstream https://github.com/walinejs/waline.git

# 拉取更新
git fetch upstream
git merge upstream/main

# 推送到你的仓库
git push origin main
```

Vercel 会自动重新部署。

## 下一步

- [评论系统](/development/comments) - 前端集成详解
- [环境变量](/development/env-variables) - 完整配置参考
