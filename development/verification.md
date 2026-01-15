# 验证系统

本文档介绍 YourTJ 选课社区的管理员验证系统

## 概述

管理后台使用简单的密钥验证机制，通过 HTTP 请求头传递管理员密钥。

## 验证机制

### 请求头认证

所有管理 API 需要在请求头中携带 `x-admin-secret`：

```http
GET /api/admin/reviews
x-admin-secret: your-admin-secret
```

### 后端中间件

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

## 前端实现

### 管理后台访问

管理后台通过 URL 参数传递密钥：

```
https://xk.yourtj.de/admin?access=your-admin-secret
```

### Admin 组件

```tsx
// Admin.tsx
export default function Admin() {
  const [secret, setSecret] = useState('')

  useEffect(() => {
    // 从 URL 参数获取密钥
    const params = new URLSearchParams(window.location.search)
    const secretParam = params.get('secret')
    if (secretParam) {
      setSecret(secretParam)
    }
  }, [])

  // API 调用时携带密钥
  const fetchAdminData = async () => {
    const res = await fetch('/api/admin/reviews', {
      headers: {
        'x-admin-secret': secret
      }
    })
    // ...
  }
}
```

## 配置密钥

### 设置管理密钥

```bash
wrangler secret put ADMIN_SECRET
# 输入一个强密码，建议 32 位以上随机字符串
```

### 生成强密码

```bash
# 使用 openssl 生成
openssl rand -base64 32

# 或使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 安全建议

::: warning 安全提示
- 使用强密码（32 位以上随机字符串）
- 不要在代码中硬编码密钥
- 定期轮换密钥
- 使用 HTTPS 传输
- 限制管理后台访问 IP（可选）
:::

### 密钥强度要求

| 级别 | 长度 | 示例 |
|------|------|------|
| 弱 | < 16 位 | 不推荐 |
| 中 | 16-32 位 | 可接受 |
| 强 | > 32 位 | 推荐 |

## 错误处理

### 401 未授权

```json
{
  "error": "Unauthorized"
}
```

**可能原因：**
- 未提供 `x-admin-secret` 请求头
- 密钥不正确
- 密钥已过期（如果实现了过期机制）

### 前端处理

```typescript
const response = await fetch('/api/admin/reviews', {
  headers: { 'x-admin-secret': secret }
})

if (response.status === 401) {
  alert('管理密钥无效，请检查后重试')
  return
}
```

## 未来改进

当前的密钥验证是一个简单的实现，未来可以考虑：

1. **JWT 认证** - 支持 token 过期和刷新
2. **OAuth 集成** - 使用第三方身份提供商
3. **RBAC** - 基于角色的访问控制
4. **审计日志** - 记录管理操作

## 下一步

- [人机验证](/development/captcha) - 用户提交验证
- [API 接口](/development/api) - 管理 API 文档
