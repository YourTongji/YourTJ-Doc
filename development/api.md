# API 接口

本文档详细介绍 YourTJ 选课社区的 RESTful API 接口

## 基础信息

### 请求格式

- **Base URL**: `https://your-api.workers.dev`
- **Content-Type**: `application/json`
- **认证方式**: 管理 API 需要 `x-admin-secret` 请求头

### 响应格式

成功响应：

```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

错误响应：

```json
{
  "error": "错误信息"
}
```

## 公开 API

### 获取显示设置

获取是否显示历史评价数据的设置。

```http
GET /api/settings/show_icu
```

**响应示例：**

```json
{
  "show_icu": false
}
```

---

### 获取开课单位列表

获取所有开课单位（学院/部门）列表。

```http
GET /api/departments
```

**查询参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| legacy | boolean | 是否获取历史数据的单位 |

**响应示例：**

```json
{
  "departments": [
    "电子与信息工程学院",
    "软件学院",
    "土木工程学院"
  ]
}
```

---

### 获取课程列表

分页获取课程列表，支持多种筛选条件。

```http
GET /api/courses
```

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| q | string | 否 | 搜索关键词 |
| legacy | boolean | 否 | 是否查询历史数据 |
| departments | string | 否 | 开课单位（逗号分隔） |
| onlyWithReviews | boolean | 否 | 只显示有评价的课程 |
| page | number | 否 | 页码（默认 1） |
| limit | number | 否 | 每页数量（默认 20） |

**响应示例：**

```json
{
  "data": [
    {
      "id": 1,
      "code": "CS101",
      "name": "计算机导论",
      "rating": 4.5,
      "review_count": 10,
      "is_legacy": 0,
      "teacher_name": "张三"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

---

### 获取课程详情

获取单个课程的详细信息及其所有评价。

```http
GET /api/course/:id
```

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 课程 ID |

**响应示例：**

```json
{
  "id": 1,
  "code": "CS101",
  "name": "计算机导论",
  "credit": 3,
  "department": "软件学院",
  "teacher_name": "张三",
  "review_count": 10,
  "review_avg": 4.5,
  "reviews": [
    {
      "id": 1,
      "sqid": "Xk9m",
      "rating": 5,
      "comment": "很棒的课程！",
      "semester": "2024春",
      "reviewer_name": "匿名用户",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### 提交评价

提交新的课程评价（需要人机验证）。

```http
POST /api/review
```

**请求体：**

```json
{
  "course_id": 1,
  "rating": 5,
  "comment": "课程内容丰富，老师讲解清晰",
  "semester": "2024春",
  "turnstile_token": "验证token",
  "reviewer_name": "匿名用户",
  "reviewer_avatar": ""
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| course_id | number | 是 | 课程 ID |
| rating | number | 是 | 评分（0-5） |
| comment | string | 是 | 评价内容（Markdown） |
| semester | string | 是 | 学期 |
| turnstile_token | string | 是 | 人机验证 token |
| reviewer_name | string | 否 | 评价者昵称 |
| reviewer_avatar | string | 否 | 评价者头像 URL |

**响应示例：**

```json
{
  "success": true
}
```

**错误响应：**

```json
{
  "error": "人机验证无效或已过期"
}
```

---

## 管理 API

::: warning 认证要求
所有管理 API 需要在请求头中携带 `x-admin-secret`。
:::

### 获取评价列表（管理）

```http
GET /api/admin/reviews
```

**请求头：**

```
x-admin-secret: your-admin-secret
```

**查询参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| q | string | 搜索关键词（支持 sqid） |
| page | number | 页码 |
| limit | number | 每页数量 |

---

### 更新评价

```http
PUT /api/admin/review/:id
```

**请求体：**

```json
{
  "comment": "更新后的评价内容",
  "rating": 4,
  "reviewer_name": "新昵称",
  "reviewer_avatar": ""
}
```

---

### 切换评价显示状态

```http
POST /api/admin/review/:id/toggle
```

切换评价的 `is_hidden` 状态。

---

### 删除评价

```http
DELETE /api/admin/review/:id
```

---

### 获取课程列表（管理）

```http
GET /api/admin/courses
```

**查询参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| q | string | 搜索关键词 |
| page | number | 页码 |
| limit | number | 每页数量 |

---

### 更新课程

```http
PUT /api/admin/course/:id
```

**请求体：**

```json
{
  "code": "CS101",
  "name": "计算机导论",
  "credit": 3,
  "department": "软件学院",
  "teacher_name": "张三",
  "search_keywords": "CS101 计算机导论 张三"
}
```

---

### 删除课程

```http
DELETE /api/admin/course/:id
```

::: danger 危险操作
删除课程会同时删除该课程的所有评价！
:::

---

### 创建课程

```http
POST /api/admin/course
```

**请求体：**

```json
{
  "code": "CS102",
  "name": "数据结构",
  "credit": 4,
  "department": "软件学院",
  "teacher_name": "李四",
  "search_keywords": "CS102 数据结构 李四"
}
```

---

### 获取所有设置

```http
GET /api/admin/settings
```

**响应示例：**

```json
{
  "show_legacy_reviews": "false"
}
```

---

### 更新设置

```http
PUT /api/admin/settings/:key
```

**请求体：**

```json
{
  "value": "true"
}
```

## 错误码

| HTTP 状态码 | 说明 |
|-------------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（管理 API） |
| 403 | 人机验证失败 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 下一步

- [筛选逻辑](/development/filtering) - 了解筛选实现
- [人机验证](/development/captcha) - YourTJCaptcha 集成
