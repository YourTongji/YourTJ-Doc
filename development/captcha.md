# 人机验证 (YourTJCaptcha)

本文档介绍 YourTJ 选课社区中 YourTJCaptcha 人机验证系统的集成

## 概述

YourTJCaptcha 是一个自托管的人机验证服务，用于防止恶意刷评和机器人攻击。

### 架构

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   前端      │────▶│  验证服务   │────▶│   后端      │
│  (Widget)   │     │  (Vercel)   │     │  (Workers)  │
└─────────────┘     └─────────────┘     └─────────────┘
      │                    │                    │
      │  1. 显示验证       │                    │
      │  2. 用户完成验证   │                    │
      │  3. 获取 token     │                    │
      │─────────────────────────────────────────▶
      │                    │  4. 验证 token     │
      │                    │◀───────────────────│
      │                    │  5. 返回结果       │
      │                    │───────────────────▶│
```

## 前端集成

### YourTJCaptchaWidget 组件

```tsx
interface TongjiCaptchaWidgetProps {
  siteKey: string
  onVerify: (token: string) => void
  onError?: (error: Error) => void
}

export default function TongjiCaptchaWidget({
  siteKey,
  onVerify,
  onError
}: TongjiCaptchaWidgetProps) {
  // 组件实现...
}
```

### 在评价页面使用

```tsx
// WriteReview.tsx
import TongjiCaptchaWidget from '../components/TongjiCaptchaWidget'

const [captchaToken, setCaptchaToken] = useState('')

// 渲染验证组件
<TongjiCaptchaWidget
  siteKey={import.meta.env.VITE_CAPTCHA_SITEKEY}
  onVerify={(token) => setCaptchaToken(token)}
  onError={(err) => console.error('Captcha error:', err)}
/>

// 提交时携带 token
const handleSubmit = async () => {
  if (!captchaToken) {
    alert('请完成人机验证')
    return
  }

  await submitReview({
    course_id,
    rating,
    comment,
    semester,
    turnstile_token: captchaToken  // 传递验证 token
  })
}
```

## 后端验证

### 验证函数

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

### 在 API 中使用

```typescript
app.post('/api/review', async (c) => {
  const body = await c.req.json()
  const { turnstile_token, ...reviewData } = body

  // 验证人机验证 token
  if (!(await verifyTongjiCaptcha(turnstile_token, c.env.CAPTCHA_SITEVERIFY_URL))) {
    return c.json({ error: '人机验证无效或已过期' }, 403)
  }

  // 继续处理评价提交...
})
```

## 部署验证服务

### 1. 准备代码

验证服务是一个简单的 API，部署在 Vercel 上。

### 2. 配置环境变量

在 Vercel 项目设置中添加：

| 变量名 | 说明 |
|--------|------|
| `CAPTCHA_SECRET` | 验证密钥 |

### 3. 部署

```bash
vercel deploy --prod
```

### 4. 获取服务 URL

部署完成后获取 URL，例如：
`https://tongji-captcha.vercel.app/api/siteverify`

## 配置说明

### 前端配置

```bash
# .env
VITE_CAPTCHA_SITEKEY=your-site-key
```

### 后端配置

```bash
# 设置验证服务 URL
wrangler secret put CAPTCHA_SITEVERIFY_URL
# 输入: https://your-captcha.vercel.app/api/siteverify
```

## 错误处理

### 常见错误

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| 验证无效 | token 过期或无效 | 重新完成验证 |
| 服务不可用 | 验证服务宕机 | 检查 Vercel 部署状态 |
| 配置错误 | 密钥不匹配 | 检查 sitekey 和 secret |

### 前端错误处理

```tsx
<TongjiCaptchaWidget
  siteKey={siteKey}
  onVerify={handleVerify}
  onError={(error) => {
    console.error('验证失败:', error)
    setError('人机验证加载失败，请刷新页面重试')
  }}
/>
```

### 后端错误处理

```typescript
if (!(await verifyTongjiCaptcha(token, siteverifyUrl))) {
  return c.json({
    error: '人机验证无效或已过期',
    code: 'CAPTCHA_INVALID'
  }, 403)
}
```

## 安全建议

::: tip 安全提示
- 验证服务 URL 应通过环境变量配置，不要硬编码
- 密钥应使用 `wrangler secret` 安全存储
- 定期轮换密钥
- 监控验证失败率，防止攻击
:::

## 下一步

- [验证系统](/development/verification) - 管理员验证
- [API 接口](/development/api) - 查看完整 API
