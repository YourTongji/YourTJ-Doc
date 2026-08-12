# 前端（Vue 3）

本文介绍 YourTJ Hub 前端的技术栈、目录结构与关键约束。

## 技术栈

- **Vue 3 + TypeScript + Vite + Tailwind CSS**
- **GoHTML** 服务端渲染：`app/http/controllers/forum` 使用三模式渲染（payload + render + SEO）
- 前端工作区位于 `apps/gooseforum/resource/`，有自己的 pnpm-workspace

## 目录结构

```text
resource/
  src/                    # 前端源码（站点 / 管理后台双入口）
  packages/client/        # @gooseforum/client：OpenAPI 生成类型（src/gen/）
  templates/              # gohtml 模板（三模式渲染）
  static/                 # 静态资源与构建产物
    dist/                 # go:embed 嵌入后端的构建产物
```

## 三模式渲染

GoHTML 模板按请求上下文选择输出形态：

- **payload**：向页面数据注入 JSON；
- **render**：服务端渲染 HTML；
- **SEO**：面向爬虫的完整渲染输出。

## go:embed 单一二进制

前端构建产物（`resource/static/dist`）与 GoHTML 模板通过 `go:embed` 嵌入 Go 可执行文件。开发模式下 Vite（`:3010`）直连后端，生产环境只有一个文件。

## 设计令牌（Design Tokens）

- **`resource/src/styles/tokens.css` 是唯一事实源**，同时驱动 Web 与移动端；
- 修改 `tokens.css` 必须**在同一个 commit** 更新移动端的 `apps/mobile/ui_kit/lib/src/theme/tokens.json`（契约式纪律）；
- 移动端 `tokens.json` 是 Web `tokens.css` 的派生副本，不单独改。

## 客户端包

- `@gooseforum/client` 只导出生成的 OpenAPI 类型（`src/gen/`），不替代手写的页面 payload 契约，也不创建请求客户端；
- 对已由 OpenAPI 覆盖的操作，**消费生成类型**而非手写重复的后端 DTO；
- 未覆盖的接口契约手工维护，直到进入受控契约。

## 验证命令

```bash
cd apps/gooseforum/resource
pnpm typecheck
pnpm test        # Vitest 组件/单元测试
pnpm build
```

## 其他

- 主题工作台与管理后台双入口，界面支持 i18n（en / zh / ja / it）；
- CI：`ci-frontend.yml` 在变更前端路径时运行 typecheck + 单元测试 + build。

## 相关文档

- [概述与架构](/development/overview)
- [API 契约](/development/api)
- [移动端](/development/mobile)（设计令牌同步）
