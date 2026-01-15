# Cloudflare Workers

本文档详细介绍 YourTJ 选课社区在 Cloudflare Workers 上的部署

## 概述

[Cloudflare Workers](https://workers.cloudflare.com/) 是一个 Serverless 计算平台，代码运行在全球边缘节点，提供极低延迟。

### 优势

| 特性 | 说明 |
|------|------|
| **全球部署** | 代码自动部署到 300+ 边缘节点 |
| **低延迟** | 就近响应，毫秒级延迟 |
| **免运维** | 无需管理服务器 |
| **按需计费** | 免费额度充足 |
| **D1 集成** | 原生 SQLite 数据库支持 |

## 项目配置

### wrangler.toml

```toml
name = "jcourse-backend"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "jcourse-db"
database_id = "ced26cfd-a3a7-4b06-ac3f-587c9c939c1c"

# 环境变量需要通过 wrangler secret 设置:
# wrangler secret put CAPTCHA_SITEVERIFY_URL
# wrangler secret put ADMIN_SECRET
```

### 配置说明

| 字段 | 说明 |
|------|------|
| `name` | Workers 项目名称，影响默认域名 |
| `main` | TypeScript 入口文件 |
| `compatibility_date` | API 兼容性日期 |
| `binding` | 代码中访问数据库的变量名 |
| `database_name` | D1 数据库名称 |
| `database_id` | D1 数据库唯一 ID |

## D1 数据库

### 创建数据库

```bash
# 创建新数据库
wrangler d1 create jcourse-db

# 输出示例：
# Successfully created DB 'jcourse-db'
# database_id = "ced26cfd-a3a7-4b06-ac3f-587c9c939c1c"
```

### 初始化表结构

```bash
# 执行 SQL 文件
wrangler d1 execute jcourse-db --file=schema.sql
```

### 数据库操作

```bash
# 执行单条 SQL
wrangler d1 execute jcourse-db --command="SELECT COUNT(*) FROM courses"

# 导出数据
wrangler d1 export jcourse-db --output=backup.sql

# 本地开发数据库
wrangler d1 execute jcourse-db --local --file=schema.sql
```

## 代码中使用

### 类型定义

```typescript
type Bindings = {
  DB: D1Database
  CAPTCHA_SITEVERIFY_URL: string
  ADMIN_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()
```

### 数据库查询

```typescript
// 查询单条
const course = await c.env.DB.prepare(
  'SELECT * FROM courses WHERE id = ?'
).bind(id).first()

// 查询多条
const { results } = await c.env.DB.prepare(
  'SELECT * FROM courses LIMIT ?'
).bind(20).all()

// 插入数据
await c.env.DB.prepare(
  'INSERT INTO reviews (course_id, rating, comment) VALUES (?, ?, ?)'
).bind(courseId, rating, comment).run()
```

## 本地开发

### 启动开发服务器

```bash
wrangler dev
```

这会启动本地开发服务器，支持：
- 热重载
- 本地 D1 数据库
- 环境变量模拟

### 本地环境变量

创建 `.dev.vars` 文件：

```bash
CAPTCHA_SITEVERIFY_URL=http://localhost:3001/api/siteverify
ADMIN_SECRET=dev-secret
```

## 部署

### 部署到生产环境

```bash
wrangler deploy
```

### 部署输出

```
✨ Compiled Worker successfully
🌀 Uploading... (1.23 KB)
✨ Success! Deployed to:
   https://jcourse-backend.your-subdomain.workers.dev
```

### 查看部署历史

```bash
wrangler deployments list
```

### 回滚部署

```bash
wrangler rollback [deployment-id]
```

## 日志与监控

### 实时日志

```bash
# 查看实时日志
wrangler tail

# 过滤错误日志
wrangler tail --format=json | jq 'select(.level == "error")'
```

### Cloudflare Dashboard

在 Cloudflare Dashboard 可以查看：
- 请求量统计
- 错误率
- CPU 使用时间
- 带宽使用

## 自定义域名

### 添加自定义域名

1. 在 Cloudflare Dashboard 进入 Workers 项目
2. 点击 "Triggers" 标签
3. 添加自定义域名

### DNS 配置

```
api.yourtj.com -> Workers Route
```

## 环境管理

### 多环境配置

```toml
# wrangler.toml

[env.staging]
name = "jcourse-backend-staging"

[env.production]
name = "jcourse-backend"
```

### 部署到指定环境

```bash
# 部署到 staging
wrangler deploy --env staging

# 部署到 production
wrangler deploy --env production
```

## 限制与配额

### 免费计划

| 限制项 | 额度 |
|--------|------|
| 请求数 | 100,000/天 |
| CPU 时间 | 10ms/请求 |
| 脚本大小 | 1MB |
| D1 存储 | 5GB |
| D1 读取 | 5M/天 |
| D1 写入 | 100K/天 |

### 付费计划

Workers Paid 计划提供更高额度，适合生产环境。

## 最佳实践

::: tip 建议
- 使用 TypeScript 获得更好的类型支持
- 合理使用 D1 索引优化查询
- 启用 Cloudflare 缓存减少数据库压力
- 监控 CPU 时间避免超时
- 使用 Secrets 管理敏感配置
:::

## 下一步

- [Waline 部署](/development/waline) - 评论系统部署
- [环境变量](/development/env-variables) - 完整配置参考
