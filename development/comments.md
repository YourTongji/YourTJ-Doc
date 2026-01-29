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

### 数据流

```
用户发表评论
     │
     ▼
┌─────────────────┐
│  前端 Feedback  │
│     页面        │
└────────┬────────┘
         │
         │ 1. 用户填写评论信息
         │    (昵称、邮箱、评论内容)
         │
         ▼
┌─────────────────┐
│  Waline 客户端  │
│   (动态加载)    │
└────────┬────────┘
         │
         │ 2. 发送到 Waline 服务器
         │    POST /api/comment
         │
         ▼
┌─────────────────┐
│  Waline 服务端  │
│   (Vercel)      │
└────────┬────────┘
         │
         │ 3. 验证并存储到数据库
         │
         ▼
┌─────────────────┐
│   Neon 数据库   │
│  (PostgreSQL)   │
│  - wl_Comment   │
│  - wl_User      │
│  - wl_Count     │
└─────────────────┘
```

**数据流说明：**

1. **用户交互**：用户在 Feedback 页面填写评论表单（昵称、邮箱、评论内容）
2. **客户端处理**：Waline 客户端通过 `VITE_WALINE_SERVER_URL` 环境变量连接到服务器
3. **服务端验证**：Waline 服务端验证评论内容（反垃圾、字数限制、必填字段）
4. **数据持久化**：验证通过后存储到 Neon PostgreSQL 数据库
5. **实时展示**：评论立即显示在页面上，无需刷新

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

当前项目中 Waline 集成在 `src/pages/Feedback.tsx` 中，通过环境变量配置服务地址：

```tsx
// src/pages/Feedback.tsx (实际实现)
const walineServerUrl = import.meta.env.VITE_WALINE_SERVER_URL || ''

const initWaline = async () => {
  if (!walineServerUrl) return

  // 动态加载 Waline
  const { default: Waline } = await import('https://unpkg.com/@waline/client@v3/dist/waline.js')

  Waline.init({
    el: walineRef.current,
    serverURL: walineServerUrl,  // 从环境变量读取
    lang: 'zh-CN',
    locale: {
      nick: '昵称',
      nickError: '昵称不能少于3个字符',
      mail: '邮箱',
      mailError: '请填写正确的邮件地址',
      link: '网址',
      optional: '可选',
      placeholder: '欢迎留言...',
      sofa: '来发评论吧~',
      submit: '提交',
      reply: '回复',
      cancelReply: '取消回复',
      comment: '评论',
      refresh: '刷新',
      more: '加载更多...',
      preview: '预览',
      emoji: '表情',
      uploadImage: '上传图片',
      seconds: '秒前',
      minutes: '分钟前',
      hours: '小时前',
      days: '天前',
      now: '刚刚',
      uploading: '正在上传',
      login: '登录',
      logout: '退出',
      admin: '管理员',
      sticky: '置顶',
      word: '字',
      wordHint: '评论字数应在 $0 到 $1 字之间！',
    },
    emoji: [
      'https://unpkg.com/@waline/emojis@1.2.0/weibo',
      'https://unpkg.com/@waline/emojis@1.2.0/bilibili',
    ],
    dark: false,
    meta: ['nick', 'mail'],
    requiredMeta: ['nick'],
    pageSize: 10,
    wordLimit: [0, 1000],
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
Waline 服务地址通过环境变量 `VITE_WALINE_SERVER_URL` 配置，无需修改源代码。
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
