# 唯一标识符 (Sqids)

本文档介绍 YourTJ 选课社区中使用 Sqids 生成唯一标识符的实现

## 什么是 Sqids？

[Sqids](https://sqids.org/) 是一个用于生成短且友好的唯一标识符的库。它可以将数字 ID 编码为短字符串，同时支持解码回原始数字。

### 为什么使用 Sqids？

| 特性 | 说明 |
|------|------|
| **短小** | 生成的 ID 比 UUID 短得多 |
| **可读** | 避免生成脏话或易混淆字符 |
| **可逆** | 可以解码回原始数字 ID |
| **无冲突** | 相同输入总是产生相同输出 |

### 对比示例

| 类型 | 示例 |
|------|------|
| 数字 ID | `12345` |
| UUID | `550e8400-e29b-41d4-a716-446655440000` |
| Sqids | `Xk9m` |

## 实现代码

### sqids.ts

```typescript
import Sqids from 'sqids'

// 自定义字典：去掉元音字母和易混淆字符
// 防止生成脏话和提高可读性
const CUSTOM_ALPHABET = 'bcdfghjkmnpqrstvwxyzBCDFGHJKMNPQRSTVWXYZ23456789'

// 创建 Sqids 实例，设置最小长度为 4
const sqids = new Sqids({
  alphabet: CUSTOM_ALPHABET,
  minLength: 4
})

/**
 * 将数字 ID 编码为 Sqid
 * @param id 数字 ID
 * @returns 4位字符的 Sqid
 */
export function encodeReviewId(id: number): string {
  return sqids.encode([id])
}

/**
 * 将 Sqid 解码为数字 ID
 * @param sqid Sqid 字符串
 * @returns 数字 ID，如果解码失败返回 null
 */
export function decodeReviewId(sqid: string): number | null {
  try {
    const decoded = sqids.decode(sqid)
    return decoded.length > 0 ? decoded[0] : null
  } catch {
    return null
  }
}
```

## 配置说明

### 自定义字母表

```typescript
const CUSTOM_ALPHABET = 'bcdfghjkmnpqrstvwxyzBCDFGHJKMNPQRSTVWXYZ23456789'
```

**排除的字符：**

| 排除字符 | 原因 |
|----------|------|
| `a, e, i, o, u` | 元音字母，防止生成脏话 |
| `A, E, I, O, U` | 大写元音字母 |
| `0, 1, l` | 易与 O、I、1 混淆 |

### 最小长度

```typescript
minLength: 4
```

设置最小长度为 4，确保生成的 ID 不会太短，提高可读性。

## 使用场景

### 评价 ID 编码

在返回评价数据时，为每条评价添加 sqid 字段：

```typescript
function addSqidToReviews(reviews: any[]): any[] {
  return reviews.map(review => ({
    ...review,
    sqid: encodeReviewId(review.id)
  }))
}
```

### 管理后台搜索

管理员可以通过 sqid 搜索评价：

```typescript
admin.get('/reviews', async (c) => {
  const keyword = c.req.query('q')

  if (keyword) {
    // 尝试将关键词解码为数字 ID
    const decodedId = decodeReviewId(keyword)
    if (decodedId !== null) {
      // 如果是有效的 sqid，直接按 ID 查询
      whereClause = 'WHERE r.id = ?'
      params = [decodedId.toString()]
    } else {
      // 否则按原来的方式模糊搜索
      // ...
    }
  }
})
```

## 前端展示

评价卡片上显示 sqid 作为评价编号：

```tsx
<div className="text-xs text-gray-400">
  #{review.sqid}
</div>
```

用户可以通过这个编号快速定位和引用特定评价。

## 安全考虑

::: warning 注意
Sqids 不是加密算法，不应用于安全敏感场景。它只是一种编码方式，可以被解码。
:::

### 适用场景

-  生成友好的 URL
-  用户可见的 ID 展示
-  评价引用编号

### 不适用场景

-  密码或敏感数据
-  需要不可逆的场景
-  安全令牌

## 安装依赖

```bash
npm install sqids
```

## 下一步

- [API 接口](/development/api) - 查看 API 中的 sqid 使用
- [后端架构](/development/backend) - 了解后端实现
