# 贡献指南

感谢你对 YourTJ 选课社区的关注！我们欢迎任何形式的贡献。

## 贡献方式

### 🐛 报告 Bug

如果你发现了 Bug，请在 GitHub Issues 中提交，包含以下信息：

- Bug 描述
- 复现步骤
- 期望行为
- 实际行为
- 截图（如有）
- 环境信息（浏览器、操作系统等）

### 💡 功能建议

有新功能想法？欢迎提交 Feature Request：

- 功能描述
- 使用场景
- 可能的实现方案

### 📝 改进文档

文档改进同样重要：

- 修复错别字
- 补充说明
- 添加示例
- 翻译文档

### 🔧 提交代码

#### 开发流程

1. **Fork 仓库**

```bash
# Fork 后克隆到本地
git clone https://github.com/your-username/your-repository-name.git
```

2. **创建分支**

```bash
# 从 main 分支创建新分支
git checkout -b feature/your-feature-name
```

3. **安装依赖**

```bash
# 后端
cd backend
npm install

# 前端
cd frontend
npm install
```

4. **本地开发**

```bash
# 启动后端（需要配置 wrangler）
cd backend
npm run dev

# 启动前端
cd frontend
npm run dev
```

5. **提交代码**

```bash
git add .
git commit -m "feat: add your feature"
```

6. **推送并创建 PR**

```bash
git push origin feature/your-feature-name
```

然后在 GitHub 上创建 Pull Request。

## 代码规范

### 提交信息格式

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**类型（type）：**

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响功能） |
| `refactor` | 重构 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具相关 |

**示例：**

```bash
feat(frontend): add course filter by department
fix(backend): correct review count calculation
docs: update deployment guide
```

### 代码风格

#### TypeScript

- 使用 TypeScript 严格模式
- 为函数参数和返回值添加类型注解
- 避免使用 `any` 类型

```typescript
// Good
function fetchCourse(id: string): Promise<Course> {
  // ...
}

// Bad
function fetchCourse(id): any {
  // ...
}
```

#### React

- 使用函数组件和 Hooks
- 组件文件使用 PascalCase 命名
- 保持组件职责单一

```tsx
// Good
export default function CourseCard({ course }: CourseCardProps) {
  return (
    <div className="course-card">
      {/* ... */}
    </div>
  )
}

// Bad
export default function coursecard(props) {
  // ...
}
```

#### CSS

- 使用 Tailwind CSS 工具类
- 避免内联样式
- 保持类名顺序一致

```tsx
// Good
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">

// Bad
<div style={{ display: 'flex', padding: '16px' }}>
```

### 目录结构

```
src/
├── components/     # 可复用组件
│   ├── Button.tsx
│   └── Card.tsx
├── pages/          # 页面组件
│   ├── Home.tsx
│   └── Course.tsx
├── services/       # API 服务
│   └── api.ts
├── hooks/          # 自定义 Hooks
│   └── useAuth.ts
├── utils/          # 工具函数
│   └── format.ts
└── types/          # 类型定义
    └── index.ts
```

## Pull Request 指南

### PR 标题

使用与 Commit 相同的格式：

```
feat(frontend): add course search functionality
```

### PR 描述模板

```markdown
## 变更说明

简要描述这个 PR 做了什么。

## 变更类型

- [ ] Bug 修复
- [ ] 新功能
- [ ] 重构
- [ ] 文档更新
- [ ] 其他

## 测试

描述如何测试这些变更。

## 截图

如有 UI 变更，请附上截图。

## 相关 Issue

Closes #123
```

### Review 流程

1. 至少需要 1 位维护者 Review
2. 所有 CI 检查通过
3. 解决所有 Review 意见
4. Squash merge 到 main 分支

## 开发环境设置

### 推荐工具

- **编辑器**: VS Code
- **VS Code 插件**:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript Vue Plugin

### 环境变量

复制示例文件并配置：

```bash
cp ../frontend/.env.example ../frontend/.env
```

## 获取帮助

- 📖 阅读 [开发文档](/development/overview)
- 💬 在 Issues 中提问
- 📧 联系维护者

## 行为准则

请遵守我们的行为准则：

- 尊重所有贡献者
- 保持友善和专业
- 接受建设性批评
- 关注项目使用者的最佳利益

感谢你的贡献！🎉
