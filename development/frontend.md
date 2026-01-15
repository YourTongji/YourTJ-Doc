# 前端架构

本文档详细介绍 YourTJ 选课社区前端的技术架构和实现细节。

## 技术选型

| 技术 | 版本 | 选型理由 |
|------|------|----------|
| React | 18.2.0 | 成熟的组件化框架，生态丰富 |
| TypeScript | 5.3.0 | 类型安全，提升代码质量 |
| Vite | 5.0.0 | 快速的开发体验，优秀的构建性能 |
| React Router | 6.21.0 | 声明式路由，支持嵌套路由 |
| Framer Motion | 12.25.0 | 流畅的动画效果 |
| Tailwind CSS | CDN | 原子化 CSS，通过 CDN 引入 |

## 项目结构

```
frontend/
├── public/                 # 静态资源
│   ├── favicon.svg           # 网站图标
│   └── ...
│
├── src/
│   ├── components/         # 可复用组件
│   │   ├── Navbar.tsx        # 顶部导航栏
│   │   ├── BottomNavigation.tsx # 移动端底部导航
│   │   ├── Footer.tsx        # 页脚
│   │   ├── GlassCard.tsx     # 玻璃态卡片组件
│   │   ├── FilterPanel.tsx   # 筛选面板
│   │   ├── BottomSheet.tsx   # 底部弹出面板
│   │   ├── SegmentedControl.tsx # 分段控制器
│   │   ├── MarkdownEditor.tsx # Markdown 编辑器
│   │   ├── MarkdownToolbar.tsx # 编辑器工具栏
│   │   ├── TemplateSelector.tsx # 评价模板选择
│   │   ├── TongjiCaptchaWidget.tsx # 人机验证组件
│   │   └── Logo.tsx          # Logo 组件
│   │
│   ├── pages/              # 页面组件
│   │   ├── Courses.tsx       # 课程列表
│   │   ├── Course.tsx        # 课程详情
│   │   ├── WriteReview.tsx   # 写评价
│   │   ├── Admin.tsx         # 管理后台
│   │   ├── About.tsx         # 关于我们
│   │   ├── FAQ.tsx           # 常见问题
│   │   └── Feedback.tsx      # 反馈页面
│   │
│   ├── services/           # 服务层
│   │   └── api.ts            # API 调用封装
│   │
│   ├── App.tsx             # 应用入口
│   └── main.tsx            # 渲染入口
│
├── index.html              # HTML 模板
├── package.json            # 依赖配置
├── tsconfig.json           # TypeScript 配置
└── vite.config.ts          # Vite 配置
```

## 核心组件

### App.tsx - 应用入口

```tsx
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import BottomNavigation from './components/BottomNavigation'
import Footer from './components/Footer'
import Courses from './pages/Courses'
import Course from './pages/Course'
// ...

export default function App() {
  return (
    <div className="min-h-screen text-slate-800 flex flex-col">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 mt-6 md:mt-8 flex-1 w-full pb-20 md:pb-0">
        <Routes>
          <Route path="/" element={<Courses />} />
          <Route path="/course/:id" element={<Course />} />
          <Route path="/write-review/:id" element={<WriteReview />} />
          {/* ... */}
        </Routes>
      </main>
      <BottomNavigation />
      <Footer />
    </div>
  )
}
```

### GlassCard - 玻璃态卡片

项目使用玻璃态（Glassmorphism）设计风格：

```tsx
interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export default function GlassCard({ children, className, hover }: GlassCardProps) {
  return (
    <div className={`
      backdrop-blur-md bg-white/70
      rounded-2xl shadow-lg
      border border-white/20
      ${hover ? 'hover:shadow-xl transition-shadow' : ''}
      ${className}
    `}>
      {children}
    </div>
  )
}
```

### FilterPanel - 筛选面板

支持多维度筛选：

- 开课单位筛选
- 只看有评价的课程
- 关键词搜索

```tsx
interface FilterPanelProps {
  departments: string[]
  selectedDepartments: string[]
  onDepartmentChange: (departments: string[]) => void
  onlyWithReviews: boolean
  onOnlyWithReviewsChange: (value: boolean) => void
}
```

### MarkdownEditor - Markdown 编辑器

支持 Markdown 语法的评价编辑器：

- 工具栏快捷操作
- 实时预览
- 模板快速填充

## 路由设计

| 路径 | 组件 | 说明 |
|------|------|------|
| `/` | Courses | 课程列表首页 |
| `/course/:id` | Course | 课程详情页 |
| `/write-review/:id` | WriteReview | 写评价页 |
| `/admin` | Admin | 管理后台 |
| `/about` | About | 关于页面 |
| `/faq` | FAQ | 常见问题 |
| `/feedback` | Feedback | 反馈页面 |

## 状态管理

项目采用轻量级状态管理方案：

- **组件内状态**：使用 `useState`
- **跨组件状态**：通过 props 传递
- **异步状态**：使用 `useEffect` + `useState`

```tsx
// 课程列表状态示例
const [courses, setCourses] = useState<Course[]>([])
const [loading, setLoading] = useState(true)
const [page, setPage] = useState(1)
const [hasMore, setHasMore] = useState(true)

useEffect(() => {
  loadCourses()
}, [keyword, departments, onlyWithReviews])
```

## API 服务层

所有 API 调用封装在 `services/api.ts`：

```typescript
const API_BASE = import.meta.env.VITE_API_URL || ''

// 带超时的 fetch 封装
async function fetchWithTimeout(url: string, options?: RequestInit, timeout = 15000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(id)
    return res
  } catch (err) {
    clearTimeout(id)
    throw err
  }
}

// 获取课程列表
export async function fetchCourses(
  keyword?: string,
  legacy?: boolean,
  page = 1,
  limit = 20,
  departments?: string[],
  onlyWithReviews?: boolean
) {
  let url = `${API_BASE}/api/courses?page=${page}&limit=${limit}&`
  // ...构建查询参数
  const res = await fetchWithTimeout(url)
  return res.json()
}
```

## 响应式设计

使用 Tailwind CSS 的响应式前缀：

| 前缀 | 断点 | 说明 |
|------|------|------|
| `sm:` | 640px | 小屏幕 |
| `md:` | 768px | 中等屏幕 |
| `lg:` | 1024px | 大屏幕 |
| `xl:` | 1280px | 超大屏幕 |

```tsx
// 响应式布局示例
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 移动端单列，平板双列，桌面三列 */}
</div>
```

### 移动端适配

- **底部导航**：移动端显示 `BottomNavigation`
- **底部弹出面板**：筛选面板在移动端使用 `BottomSheet`
- **触摸优化**：增大点击区域，优化滑动体验

## 动画效果

使用 Framer Motion 实现流畅动画：

```tsx
import { motion } from 'framer-motion'

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {/* 内容 */}
</motion.div>
```

## 性能优化

### 代码分割

Vite 自动进行代码分割，按路由懒加载：

```tsx
import { lazy, Suspense } from 'react'

const Admin = lazy(() => import('./pages/Admin'))

<Suspense fallback={<Loading />}>
  <Admin />
</Suspense>
```

### 图片优化

- 使用 SVG 图标
- 图片懒加载
- WebP 格式支持

### 请求优化

- API 请求超时处理
- 分页加载
- 防抖搜索

## 开发调试

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

## 下一步

- [后端架构](/development/backend) - 了解 API 实现
- [API 接口](/development/api) - 查看接口文档
