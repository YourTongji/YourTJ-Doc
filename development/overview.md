# 开发概述

本章节详细介绍 YourTJ 项目的技术实现细节，帮助开发者深入理解项目架构。

YourTJ 包含两个核心项目：
- **选课社区**：课程评价与选课指南平台
- **积分系统**：去中心化钱包 + 任务/商品交易 + 管理后台

---

## 选课社区技术栈

### 前端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.2.0 | UI 框架 |
| TypeScript | 5.3.0 | 类型安全 |
| Vite | 5.0.0 | 构建工具 |
| React Router | 6.21.0 | 路由管理 |
| Framer Motion | 12.25.0 | 动画效果 |
| Tailwind CSS | CDN | 样式框架（通过 CDN 引入） |

### 后端技术

| 技术 | 用途 |
|------|------|
| Cloudflare Workers | Serverless 运行时 |
| Hono | Web 框架 |
| D1 Database | SQLite 数据库 |
| Sqids | ID 编码 |

### 外部服务

| 服务 | 用途 |
|------|------|
| YourTJCaptcha | 人机验证 |
| Waline | 评论系统 |
| Neon | PostgreSQL 数据库（Waline） |
| Vercel | 服务托管 |

### 选课社区架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户浏览器                               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Cloudflare CDN / Pages                        │
│                      (静态资源托管)                               │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   React SPA   │     │   Workers     │     │    Waline     │
│   (Frontend)  │────▶│   (Backend)   │     │   (Comments)  │
└───────────────┘     └───────────────┘     └───────────────┘
                              │                     │
                              ▼                     ▼
                      ┌───────────────┐     ┌───────────────┐
                      │  D1 Database  │     │     Neon      │
                      │   (SQLite)    │     │  (PostgreSQL) │
                      └───────────────┘     └───────────────┘
```

---

## 积分系统技术栈

### 前端技术

| 技术 | 用途 |
|------|------|
| React | UI 框架 |
| TypeScript | 类型安全 |
| Vite | 构建工具 |
| Tailwind CSS | 样式框架 |

### 后端技术

| 技术 | 用途 |
|------|------|
| Vercel Serverless Functions | Serverless 运行时 |
| Turso (libSQL) | 边缘 SQLite 数据库 |

### 安全特性

| 技术 | 用途 |
|------|------|
| PBKDF2 | 密钥派生（学号+PIN → 助记词） |
| HMAC-SHA256 | 请求签名（防重放） |
| JWT | 管理员认证 |

### 积分系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户浏览器                               │
│                    (React 前端 + 密钥派生)                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Vercel Edge Network                         │
│                      (静态资源托管)                               │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┴───────────────────────┐
        ▼                                               ▼
┌───────────────────────┐                 ┌───────────────────────┐
│   backend-core        │                 │   backend-market      │
│   /api/wallet/*       │                 │   /api/task/*         │
│   /api/transaction/*  │                 │   /api/product/*      │
│   /api/admin/*        │                 │   /api/report/*       │
└───────────────────────┘                 └───────────────────────┘
        │                                               │
        └───────────────────────┬───────────────────────┘
                                ▼
              ┌─────────────────────────────────┐
              │   Turso Database (libSQL)       │
              │   钱包/交易/任务/商品/举报       │
              └─────────────────────────────────┘
```

---

## 数据流详解

### 课程列表加载流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant UI as 前端 React
    participant API as Workers API
    participant DB as D1 Database

    User->>UI: 访问课程列表页
    UI->>UI: 初始化状态 (keyword, filters, page)
    UI->>API: GET /api/courses?page=1&limit=20
    API->>DB: 查询课程总数
    DB-->>API: 返回 total
    API->>DB: 查询分页数据 (SELECT ... LIMIT 20 OFFSET 0)
    DB-->>API: 返回课程列表
    API-->>UI: 返回 { data, total, page, totalPages }
    UI->>UI: 更新 courses 状态
    UI-->>User: 显示课程列表

    User->>UI: 应用筛选条件
    UI->>UI: 重置 page = 1
    UI->>API: GET /api/courses?departments=xxx&onlyWithReviews=true
    API->>DB: 构建带 WHERE 的查询
    DB-->>API: 返回筛选结果
    API-->>UI: 返回更新的课程列表
    UI-->>User: 显示筛选后的课程
```

### 评价提交流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant UI as 前端 React
    participant Captcha as YourTJCaptcha
    participant API as Workers API
    participant DB as D1 Database
    participant Credit as 积分系统 API

    User->>UI: 填写评价表单
    UI->>UI: 检查积分钱包绑定状态
    UI->>UI: 实时验证输入和字数
    User->>UI: 点击提交按钮
    UI->>Captcha: 获取人机验证 token
    Captcha-->>UI: 返回 captcha_token
    UI->>UI: 构建评价数据 (含 walletUserHash)
    UI->>API: POST /api/review 提交评价数据
    API->>Captcha: 验证 token
    Captcha-->>API: 返回验证结果
    alt 验证失败
        API-->>UI: 返回 401 验证失败
        UI-->>User: 提示验证失败
    else 验证成功
        API->>DB: INSERT INTO reviews (含 wallet_user_hash)
        DB->>DB: 更新课程统计 (review_count++, review_avg)
        API->>API: 检查积分奖励资格
        alt 满足积分条件 (50字以上 + 已绑定钱包)
            API->>Credit: POST /api/integration/jcourse/event
            Credit-->>API: 返回积分奖励结果
            API-->>UI: 返回 { success: true, creditReward }
            UI->>UI: 显示积分奖励提示 (+10积分)
        else 不满足积分条件
            API-->>UI: 返回 { success: true, creditReward: { skipped: true } }
        end
        API->>DB: 查询更新后的课程数据
        DB-->>API: 返回课程详情
        UI->>UI: 更新课程状态
        UI-->>User: 提示提交成功，跳转到课程详情
    end
```

### 高级筛选流程

```mermaid
flowchart TD
    Start([用户打开筛选面板]) --> Input{选择筛选类型}

    Input -->|开课单位| Dept[选择多个单位]
    Input -->|校区| Campus[选择校区]
    Input -->|课程名称| CourseName[输入关键词]
    Input -->|课程代码| CourseCode[输入代码]
    Input -->|教师工号| TeacherCode[输入工号]
    Input -->|教师姓名| TeacherName[输入姓名]
    Input -->|只看有评价| OnlyReviews[切换开关]

    Dept --> Build[构建筛选条件]
    Campus --> Build
    CourseName --> Build
    CourseCode --> Build
    TeacherCode --> Build
    TeacherName --> Build
    OnlyReviews --> Build

    Build --> Check{是否为高级筛选?}

    Check -->|是| Heavy[使用 25s 超时]
    Check -->|否| Normal[使用 15s 超时]

    Heavy --> API[调用 /api/courses]
    Normal --> API

    API --> Query[后端构建 SQL 查询]
    Query --> DB[(D1 Database)]
    DB --> Result[返回筛选结果]
    Result --> Update[更新课程列表]
    Update --> End([显示结果])

    style Start fill:#e1f5fe
    style End fill:#c8e6c9
    style API fill:#fff9c4
    style DB fill:#f3e5f5
```

### 评论系统流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant UI as Feedback 页面
    participant Waline as Waline Client
    participant Server as Waline Server
    participant Neon as Neon PostgreSQL

    User->>UI: 访问反馈页面
    UI->>UI: 组件可见，触发懒加载
    UI->>UI: 读取 VITE_WALINE_SERVER_URL
    UI->>Waline: 动态加载 waline.js (import from CDN)
    Waline-->>UI: 返回 Waline 对象
    UI->>Waline: 初始化 Waline.init (el, serverURL, locale, emoji)
    Waline->>Server: GET /api/comment?path=/feedback
    Server->>Neon: SELECT * FROM wl_Comment WHERE objectId = '/feedback'
    Neon-->>Server: 返回评论列表
    Server-->>Waline: 返回 JSON 评论数据
    Waline-->>UI: 渲染评论列表
    UI-->>User: 显示评论

    User->>UI: 填写评论表单
    User->>Waline: 点击提交
    Waline->>Server: POST /api/comment 提交评论
    Server->>Server: 验证评论内容 (反垃圾、字数限制)
    Server->>Neon: INSERT INTO wl_Comment
    Neon-->>Server: 插入成功
    Server-->>Waline: 返回新评论
    Waline->>UI: 更新评论列表
    UI-->>User: 实时显示新评论
```

### 点赞积分流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant UI as 前端 React
    participant API as Workers API
    participant DB as D1 Database
    participant Credit as 积分系统 API

    User->>UI: 点击点赞按钮
    UI->>UI: 检查当前点赞状态
    alt 未点赞
        UI->>UI: 乐观更新 UI (点赞数+1, liked=true)
        UI->>API: POST /api/review/:id/like (clientId)
        API->>DB: 查询是否已点赞
        DB-->>API: 返回点赞记录
        alt 首次点赞
            API->>DB: INSERT INTO review_likes
            API->>DB: UPDATE reviews SET approve_count = approve_count + 1
            API->>DB: 查询评价信息 (wallet_user_hash)
            DB-->>API: 返回钱包哈希
            alt 评价作者已绑定积分钱包
                API->>Credit: POST /api/integration/jcourse/event (kind=like)
                Credit-->>API: 返回积分事件结果 (每日结算 +3)
                API-->>UI: 返回 { success: true, creditLike }
                UI->>UI: 更新 UI 显示最新点赞数
            else 作者未绑定钱包
                API-->>UI: 返回 { success: true, creditLike: { skipped: true } }
            end
        else 已经点赞过
            API-->>UI: 返回错误或跳过
            UI->>UI: 回滚 UI 状态
        end
    else 已点赞
        User->>UI: 点击取消点赞
        UI->>API: DELETE /api/review/:id/like
        API->>DB: DELETE FROM review_likes
        API->>DB: UPDATE reviews SET approve_count = approve_count - 1
        API-->>UI: 返回成功
        UI->>UI: 更新 UI (点赞数-1, liked=false)
    end
    UI-->>User: 显示更新后的点赞状态
```

---

## 选课社区核心模块

### 前端模块

```
frontend/src/
├── components/          # 可复用组件
│   ├── Navbar.tsx         # 导航栏
│   ├── BottomNavigation.tsx # 移动端底部导航
│   ├── GlassCard.tsx      # 玻璃态卡片
│   ├── FilterPanel.tsx    # 筛选面板
│   ├── MarkdownEditor.tsx # Markdown 编辑器
│   └── TemplateSelector.tsx # 评价模板选择器
│
├── pages/               # 页面组件
│   ├── Courses.tsx        # 课程列表页
│   ├── Course.tsx         # 课程详情页
│   ├── WriteReview.tsx    # 写评价页
│   ├── Admin.tsx          # 管理后台
│   ├── About.tsx          # 关于页面
│   ├── FAQ.tsx            # 常见问题
│   └── Feedback.tsx       # 反馈页面
│
├── services/            # API 服务
│   └── api.ts             # API 调用封装
│
└── App.tsx              # 应用入口
```

### 后端模块

```
backend/src/
├── index.ts             # 主入口，路由定义
└── sqids.ts             # ID 编码工具
```

---

## 积分系统核心模块

### 前端模块

```
frontend/src/
├── components/          # 可复用组件
├── pages/               # 页面组件
│   ├── Wallet.tsx        # 钱包页面
│   ├── Task.tsx          # 任务市场
│   ├── Product.tsx       # 商品市场
│   ├── Admin.tsx         # 管理后台
│   └── Report.tsx        # 申诉/举报
│
└── shared/              # 共享工具
    └── utils/            # 加密、签名等工具
```

### 后端模块

```
backend-core/
├── api/                 # Core API
│   ├── wallet/           # 钱包接口
│   ├── transaction/      # 交易接口
│   ├── admin/            # 管理接口
│   └── redeem/           # 兑换码接口
│
└── shared/              # 前后端共享代码
    └── utils/            # 加密、签名工具

backend-market/
├── api/                 # Market API
│   ├── task/             # 任务接口
│   ├── product/          # 商品接口
│   └── report/           # 举报接口
│
└── shared/              # 前后端共享代码
```

---

## 开发规范

### 代码风格

- 使用 TypeScript 严格模式
- 组件使用函数式写法 + Hooks
- 样式使用 Tailwind CSS 工具类
- API 调用统一封装在 services 目录

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件文件 | PascalCase | `CourseCard.tsx` |
| 工具文件 | camelCase | `api.ts` |
| CSS 类名 | kebab-case | `course-card` |
| 常量 | UPPER_SNAKE_CASE | `API_BASE_URL` |

### Git 提交规范

遵循 Conventional Commits：

```
feat: 新功能
fix: Bug 修复
docs: 文档更新
style: 代码格式
refactor: 重构
perf: 性能优化
test: 测试
chore: 构建/工具
```

---

## 文档导航

### 选课社区

#### 架构详解
- [前端架构](/development/frontend) - React 组件设计
- [后端架构](/development/backend) - Workers API 设计
- [数据表结构](/development/database) - D1 数据库设计
- [API 接口](/development/api) - RESTful API 文档

#### 核心功能
- [筛选逻辑](/development/filtering) - 课程筛选实现
- [验证系统](/development/verification) - 管理员验证
- [人机验证](/development/captcha) - YourTJCaptcha 集成
- [评论系统](/development/comments) - Waline 集成
- [唯一标识符](/development/sqids) - Sqids ID 编码

#### 部署配置
- [环境变量](/development/env-variables) - 配置参考
- [Cloudflare Workers](/development/cloudflare) - Workers 部署
- [Waline 部署](/development/waline) - 评论系统部署

### 积分系统

#### 项目文档
- [GitHub 仓库](https://github.com/YourTongji/YourTJ-Credit-Serverless) - 源代码与详细文档
- [项目 README](https://github.com/YourTongji/YourTJ-Credit-Serverless/blob/main/README.md) - 快速开始指南
- [部署文档](https://github.com/YourTongji/YourTJ-Credit-Serverless/blob/main/DEPLOYMENT.md) - 部署说明
- [管理后台](https://github.com/YourTongji/YourTJ-Credit-Serverless/blob/main/ADMIN_PANEL.md) - 管理功能文档
