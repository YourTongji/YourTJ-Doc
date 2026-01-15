# 后端架构

本文档详细介绍 YourTJ 选课社区后端的技术架构和实现细节

## 技术选型

| 技术 | 用途 | 选型理由 |
|------|------|----------|
| Cloudflare Workers | 运行时 | 全球边缘部署，低延迟 |
| Hono | Web 框架 | 轻量、快速、TypeScript 友好 |
| D1 Database | 数据库 | SQLite 兼容，与 Workers 深度集成 |
| Sqids | ID 编码 | 生成短且友好的唯一标识符 |

## 项目结构

```
backend/
├── src/
│   ├── index.ts          # 主入口，路由定义
│   └── sqids.ts          # ID 编码工具
│
├── schema.sql            # 数据库结构定义
├── wrangler.toml         # Cloudflare 配置
├── package.json          # 依赖配置
└── tsconfig.json         # TypeScript 配置
```

## 核心代码解析

### 应用入口 (index.ts)

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { encodeReviewId, decodeReviewId } from './sqids'

type Bindings = {
  DB: D1Database
  CAPTCHA_SITEVERIFY_URL: string
  ADMIN_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()
```

### CORS 配置

允许跨域请求：

```typescript
app.use('/*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'x-admin-secret'],
  allowMethods: ['POST', 'GET', 'DELETE', 'PUT', 'OPTIONS']
}))
```

### 缓存控制

禁用缓存确保数据实时性：

```typescript
app.use('/*', async (c, next) => {
  await next()
  c.res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  c.res.headers.set('Pragma', 'no-cache')
})
```

### 错误处理

统一的错误处理中间件：

```typescript
app.onError((err, c) => {
  console.error('Error:', err)
  return c.json({ error: err.message || 'Internal Server Error' }, 500)
})
```

## 人机验证

### YourTJCaptcha 验证函数

```typescript
async function verifyTongjiCaptcha(token: string, siteverifyUrl: string) {
  try {
    const res = await fetch(siteverifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
    const data = await res.json() as { success: boolean }
    return data.success === true
  } catch (e) {
    console.error('Captcha service error:', e)
    return false
  }
}
```

## 路由设计

### 公开 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/settings/show_icu` | 获取显示设置 |
| GET | `/api/departments` | 获取开课单位列表 |
| GET | `/api/courses` | 获取课程列表 |
| GET | `/api/course/:id` | 获取课程详情 |
| POST | `/api/review` | 提交评价 |

### 管理 API

所有管理 API 挂载在 `/api/admin` 路径下：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/reviews` | 获取评价列表 |
| PUT | `/api/admin/review/:id` | 更新评价 |
| POST | `/api/admin/review/:id/toggle` | 切换显示状态 |
| DELETE | `/api/admin/review/:id` | 删除评价 |
| GET | `/api/admin/courses` | 获取课程列表 |
| PUT | `/api/admin/course/:id` | 更新课程 |
| DELETE | `/api/admin/course/:id` | 删除课程 |
| POST | `/api/admin/course` | 创建课程 |
| GET | `/api/admin/settings` | 获取所有设置 |
| PUT | `/api/admin/settings/:key` | 更新设置 |

## 管理员认证

使用中间件验证管理员身份：

```typescript
const admin = new Hono<{ Bindings: Bindings }>()

admin.use('/*', async (c, next) => {
  const input = c.req.header('x-admin-secret')
  if (!input || input !== c.env.ADMIN_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
})

// 挂载管理路由
app.route('/api/admin', admin)
```

## 数据库操作

### 查询示例

```typescript
// 获取课程列表
const { results } = await c.env.DB.prepare(`
  SELECT c.id, c.code, c.name, c.review_avg as rating,
         c.review_count, c.is_legacy, t.name as teacher_name
  FROM courses c
  LEFT JOIN teachers t ON c.teacher_id = t.id
  WHERE 1=1 ${whereClause}
  ORDER BY c.review_count DESC
  LIMIT ? OFFSET ?
`).bind(...params, limit, offset).all()
```

### 插入示例

```typescript
// 提交评价
await c.env.DB.prepare(`
  INSERT INTO reviews (course_id, rating, comment, semester, is_legacy,
                       reviewer_name, reviewer_avatar)
  VALUES (?, ?, ?, ?, 0, ?, ?)
`).bind(course_id, rating, comment, semester,
        reviewer_name || '', reviewer_avatar || '').run()
```

### 更新统计

评价提交后自动更新课程统计：

```typescript
await c.env.DB.prepare(`
  UPDATE courses SET
    review_count = (SELECT COUNT(*) FROM reviews
                    WHERE course_id = ? AND is_hidden = 0),
    review_avg = (SELECT AVG(rating) FROM reviews
                  WHERE course_id = ? AND is_hidden = 0 AND rating > 0)
  WHERE id = ?
`).bind(course_id, course_id, course_id).run()
```

## Sqids 集成

为评价生成友好的短 ID：

```typescript
function addSqidToReviews(reviews: any[]): any[] {
  return reviews.map(review => ({
    ...review,
    sqid: encodeReviewId(review.id)
  }))
}
```

## 环境变量

| 变量 | 说明 | 设置方式 |
|------|------|----------|
| `DB` | D1 数据库绑定 | wrangler.toml |
| `CAPTCHA_SITEVERIFY_URL` | 验证服务地址 | wrangler secret |
| `ADMIN_SECRET` | 管理密钥 | wrangler secret |

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 部署
npm run deploy
```

## 性能优化

### 查询优化

- 使用索引加速查询
- 分页减少数据传输
- 只查询必要字段

### 缓存策略

- 禁用浏览器缓存确保数据实时
- 可考虑添加 KV 缓存热点数据

## 下一步

- [数据表结构](/development/database) - 了解数据库设计
- [API 接口](/development/api) - 查看完整 API 文档
