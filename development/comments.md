# 评论系统 (Waline)

本文档介绍 YourTJ 选课社区中 Waline 评论系统的集成

## 概述

[Waline](https://waline.js.org/) 是一款简洁、安全的评论系统，用于课程详情页的用户讨论。

### 架构

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   前端      │────▶│   Waline    │────▶│    Neon     │
│  (Widget)   │     │  (Vercel)   │     │ (PostgreSQL)│
└─────────────┘     └─────────────┘     └─────────────┘
```

## 为什么选择 Waline？

| 特性 | 说明 |
|------|------|
| **轻量** | 前端 gzip 后约 40KB |
| **安全** | 支持多种反垃圾策略 |
| **多数据库** | 支持 PostgreSQL、MySQL、SQLite 等 |
| **Serverless** | 可部署在 Vercel、Netlify 等平台 |
| **Markdown** | 支持 Markdown 语法 |

## 前端集成

### 安装依赖

```bash
npm install @waline/client
```

### 实际集成实现

当前项目中 Waline 集成在 `src/pages/Feedback.tsx` 中，服务地址是硬编码的：

```tsx
// src/pages/Feedback.tsx (实际实现)
const handleWalineLoaded = () => {
  if (window.Waline && walineRef.current) {
    window.Waline.init({
      el: walineRef.current,
      serverURL: 'https://waline.07211024.xyz',  // 硬编码地址
      emoji: [
        'https://unpkg.com/@waline/emojis@1.2.0/weibo',
        'https://unpkg.com/@waline/emojis@1.2.0/bilibili',
      ],
      lang: 'zh-CN',
      dark: 'auto',
    })
  }
}
```

::: tip 配置说明
Waline 服务地址目前是硬编码在源代码中的，如需修改请直接编辑 `src/pages/Feedback.tsx:52` 中的 `serverURL` 配置项。
:::

### 配置选项

| 选项 | 类型 | 说明 |
|------|------|------|
| `el` | HTMLElement | 挂载元素 |
| `serverURL` | string | Waline 服务地址 |
| `path` | string | 评论路径标识 |
| `lang` | string | 语言设置 |
| `emoji` | string[] | 表情包 |
| `requiredMeta` | string[] | 必填字段 |
| `wordLimit` | number | 字数限制 |
| `pageSize` | number | 每页评论数 |

## 后端部署

### 1. 创建 Neon 数据库

1. 注册 [Neon](https://neon.tech/) 账户
2. 创建新项目
3. 获取连接字符串：
   ```
   postgresql://user:password@host/database?sslmode=require
   ```

### 2. 部署到 Vercel

1. Fork [waline/waline](https://github.com/walinejs/waline) 仓库
2. 在 Vercel 导入项目
3. 设置根目录为 `packages/server`
4. 配置环境变量

### 环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DATABASE_URL` | 数据库连接字符串 | `postgresql://...` |
| `SITE_NAME` | 站点名称 | `YourTJ 选课社区` |
| `SITE_URL` | 站点 URL | `https://yourtj.com` |
| `SECURE_DOMAINS` | 安全域名 | `yourtj.com` |

### 3. 配置管理后台

访问 `https://your-waline.vercel.app/ui` 注册管理员账号。

## 评论路径设计

使用课程 ID 作为评论路径，确保每个课程有独立的评论区：

```typescript
path: `/course/${courseId}`
```

这样设计的好处：
- 评论与课程一一对应
- 便于管理和统计
- 支持评论迁移

## 样式定制

### 主题色适配

```css
:root {
  --waline-theme-color: #06b6d4;
  --waline-active-color: #3b82f6;
}
```

### 暗色模式

```css
[data-theme='dark'] {
  --waline-bgcolor: #1e293b;
  --waline-color: #e2e8f0;
}
```

## 反垃圾配置

### Akismet

```bash
# 环境变量
AKISMET_KEY=your-akismet-key
```

### 关键词过滤

```bash
# 环境变量
FORBIDDEN_WORDS=spam,广告,代写
```

## 安全建议

::: tip 安全提示
- 配置 `SECURE_DOMAINS` 限制评论来源
- 启用 Akismet 反垃圾
- 定期审核评论内容
- 设置字数限制防止滥用
:::

## 下一步

- [Waline 部署](/development/waline) - 详细部署指南
- [环境变量](/development/env-variables) - 完整配置参考
