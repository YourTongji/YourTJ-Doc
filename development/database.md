# 数据表结构

本文档详细介绍 YourTJ 选课社区的数据库设计

## 数据库概述

YourTJ 选课社区使用两个独立的数据库系统：

| 数据库 | 类型 | 用途 |
|--------|------|------|
| **Cloudflare D1** | SQLite | 存储课程、教师、评价等核心数据 |
| **Neon PostgreSQL** | PostgreSQL | 存储 Waline 评论数据（独立部署） |

### 主数据库 (D1)

- **数据库类型**: Cloudflare D1 (SQLite 兼容)
- **字符编码**: UTF-8
- **时区**: UTC

### 评论数据库 (Neon)

- **数据库类型**: PostgreSQL (Neon Serverless)
- **字符编码**: UTF-8
- **部署方式**: 通过 Waline 服务托管
- **访问方式**: 通过 `VITE_WALINE_SERVER_URL` 环境变量配置

## ER 图

```
┌─────────────┐       ┌─────────────┐
│  teachers   │       │ categories  │
├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │
│ tid         │       │ name        │
│ name        │       └─────────────┘
│ title       │
│ pinyin      │
│ department  │
└──────┬──────┘
       │
       │ 1:N
       ▼
┌─────────────────────────────────────┐
│              courses                │
├─────────────────────────────────────┤
│ id (PK)                             │
│ code                                │
│ name                                │
│ credit                              │
│ department                          │
│ teacher_id (FK) ────────────────────┼──→ teachers.id
│ search_keywords                     │
│ review_count                        │
│ review_avg                          │
│ is_legacy                           │
└──────────────┬──────────────────────┘
               │
               │ 1:N
               ▼
┌─────────────────────────────────────┐
│              reviews                │
├─────────────────────────────────────┤
│ id (PK)                             │
│ course_id (FK) ─────────────────────┼──→ courses.id
│ rating                              │
│ comment                             │
│ semester                            │
│ score                               │
│ reviewer_name                       │
│ reviewer_avatar                     │
│ approve_count                       │
│ disapprove_count                    │
│ is_hidden                           │
│ is_legacy                           │
│ created_at (INTEGER)                │
└─────────────────────────────────────┘

┌─────────────┐
│  settings   │
├─────────────┤
│ key (PK)    │
│ value       │
└─────────────┘
```

## 表结构详解

### categories 表

存储课程分类信息。

```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);
```

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY | 主键 |
| name | TEXT | NOT NULL, UNIQUE | 分类名称 |

---

### teachers 表

存储教师信息。

```sql
CREATE TABLE teachers (
  id INTEGER PRIMARY KEY,
  tid TEXT,
  name TEXT NOT NULL,
  title TEXT,
  pinyin TEXT,
  department TEXT
);
```

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY | 主键 |
| tid | TEXT | - | 教师工号 |
| name | TEXT | NOT NULL | 教师姓名 |
| title | TEXT | - | 职称 |
| pinyin | TEXT | - | 姓名拼音 |
| department | TEXT | - | 所属院系 |

---

### courses 表

存储课程信息，是核心数据表。

```sql
CREATE TABLE courses (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  credit REAL DEFAULT 0,
  department TEXT,
  teacher_id INTEGER,
  review_count INTEGER DEFAULT 0,
  review_avg REAL DEFAULT 0,
  search_keywords TEXT,
  is_legacy INTEGER DEFAULT 0,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);
```

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY | 主键 |
| code | TEXT | NOT NULL | 课程代码 |
| name | TEXT | NOT NULL | 课程名称 |
| credit | REAL | DEFAULT 0 | 学分 |
| department | TEXT | - | 开课单位 |
| teacher_id | INTEGER | FOREIGN KEY | 教师 ID |
| review_count | INTEGER | DEFAULT 0 | 评价数量 |
| review_avg | REAL | DEFAULT 0 | 平均评分 |
| search_keywords | TEXT | - | 搜索关键词 |
| is_legacy | INTEGER | DEFAULT 0 | 是否为历史数据 |

**索引：**

```sql
CREATE INDEX idx_courses_code ON courses(code);
CREATE INDEX idx_courses_search ON courses(search_keywords);
CREATE INDEX idx_courses_legacy ON courses(is_legacy);
```

---

### reviews 表

存储课程评价信息。

```sql
CREATE TABLE reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  semester TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 0 AND rating <= 5),
  comment TEXT,
  score TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  approve_count INTEGER DEFAULT 0,
  disapprove_count INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT 0,
  is_legacy INTEGER DEFAULT 0,
  reviewer_name TEXT DEFAULT '',
  reviewer_avatar TEXT DEFAULT '',
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);
```

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY | 自增主键 |
| course_id | INTEGER | NOT NULL, FK | 课程 ID |
| semester | TEXT | - | 学期 |
| rating | INTEGER | NOT NULL, CHECK | 评分 (0-5) |
| comment | TEXT | - | 评价内容 (Markdown) |
| score | TEXT | - | 成绩（历史数据） |
| created_at | INTEGER | DEFAULT | 创建时间 (Unix 时间戳) |
| approve_count | INTEGER | DEFAULT 0 | 赞同数 |
| disapprove_count | INTEGER | DEFAULT 0 | 反对数 |
| is_hidden | BOOLEAN | DEFAULT 0 | 是否隐藏 |
| is_legacy | INTEGER | DEFAULT 0 | 是否为历史数据 |
| reviewer_name | TEXT | DEFAULT '' | 评价者昵称 |
| reviewer_avatar | TEXT | DEFAULT '' | 评价者头像 |

**索引：**

```sql
CREATE INDEX idx_reviews_course ON reviews(course_id);
CREATE INDEX idx_reviews_created ON reviews(created_at);
CREATE INDEX idx_reviews_legacy ON reviews(is_legacy);
```

---

### settings 表

存储应用配置。

```sql
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
```

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| key | TEXT | PRIMARY KEY | 配置键 |
| value | TEXT | - | 配置值 |

**预设配置：**

| key | 说明 | 默认值 |
|-----|------|--------|
| show_legacy_reviews | 是否显示历史评价 | false |

## 数据关系

### 课程与教师 (N:1)

一个课程对应一个教师，一个教师可以教授多门课程。

```sql
-- 查询课程及其教师
SELECT c.*, t.name as teacher_name
FROM courses c
LEFT JOIN teachers t ON c.teacher_id = t.id
```

### 课程与评价 (1:N)

一个课程可以有多条评价。

```sql
-- 查询课程的所有评价
SELECT * FROM reviews
WHERE course_id = ? AND is_hidden = 0
ORDER BY created_at DESC
```

## 统计字段维护

课程的 `review_count` 和 `review_avg` 字段需要在评价变更时更新：

```sql
UPDATE courses SET
  review_count = (
    SELECT COUNT(*) FROM reviews
    WHERE course_id = ? AND is_hidden = 0
  ),
  review_avg = (
    SELECT AVG(rating) FROM reviews
    WHERE course_id = ? AND is_hidden = 0 AND rating > 0
  )
WHERE id = ?
```

## 数据迁移

### 初始化数据库

```bash
wrangler d1 execute jcourse-db --file=schema.sql
```

### 导入数据

```bash
wrangler d1 execute jcourse-db --file=import_data.sql
```

---

## Waline 评论数据库

Waline 使用独立的 Neon PostgreSQL 数据库，表结构由 Waline 自动管理。

### 主要数据表

| 表名 | 说明 |
|------|------|
| `wl_Comment` | 存储评论内容 |
| `wl_User` | 存储用户信息 |
| `wl_Count` | 存储页面评论统计 |

### wl_Comment 表

存储用户发表的评论：

```sql
-- Waline 自动创建的表结构（简化版）
CREATE TABLE wl_Comment (
  id BIGSERIAL PRIMARY KEY,
  objectId TEXT NOT NULL,           -- 评论路径（课程ID）
  nick TEXT NOT NULL,               -- 用户昵称
  mail TEXT,                        -- 邮箱
  link TEXT,                        -- 网址
  comment TEXT NOT NULL,            -- 评论内容
  ip TEXT,                          -- IP地址
  userAgent TEXT,                   -- 用户代理
  createdAt TIMESTAMP DEFAULT NOW(), -- 创建时间
  updatedAt TIMESTAMP DEFAULT NOW(), -- 更新时间
  status INTEGER DEFAULT 0,         -- 状态：0-待审核，1-已通过
  INSERT INTEGER DEFAULT 0          -- 插入标记
);
```

**主要字段说明：**

| 字段 | 说明 |
|------|------|
| `objectId` | 评论路径标识，使用课程 ID（如 `/course/123`） |
| `nick` | 评论者昵称 |
| `mail` | 评论者邮箱 |
| `comment` | 评论内容（支持 Markdown） |
| `status` | 评论状态（0: 待审核, 1: 已通过, 2: 垃圾评论） |

### wl_User 表

存储评论用户信息：

```sql
CREATE TABLE wl_User (
  email TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  link TEXT,
  password TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### wl_Count 表

存储页面评论统计：

```sql
CREATE TABLE wl_Count (
  objectId TEXT PRIMARY KEY,  -- 页面路径
  count INTEGER DEFAULT 0     -- 评论数量
);
```

### 数据隔离

评论数据完全独立于主数据库，通过以下方式关联：

- **课程 ID**：使用 Waline 的 `path` 或 `objectId` 字段存储课程 ID
- **查询方式**：前端通过 `path: '/course/${courseId}'` 参数获取特定课程的评论
- **管理方式**：通过 Waline 管理后台（`/ui`）进行评论审核和管理

### 配置连接

Waline 数据库连接通过环境变量配置（在 Vercel 部署时）：

```bash
# Waline 服务端环境变量
DATABASE_URL=postgresql://user:pass@ep-xxx.region.neon.tech/neondb?sslmode=require

# 前端环境变量
VITE_WALINE_SERVER_URL=https://your-waline.vercel.app
```

## 下一步

- [API 接口](/development/api) - 了解数据访问方式
- [筛选逻辑](/development/filtering) - 了解查询实现
- [Waline 部署](/development/waline) - 了解评论系统部署
