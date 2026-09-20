# 前端

Web 前端位于 `apps/gooseforum/resource`，使用 Vue 3、TypeScript 和 Vite。

Web 前端与 Go 服务一起部署。Go 负责 URL、初始 HTML 和页面 payload，Vue 在浏览器中接管交互和站内导航。

## 一个页面是怎么打开的

同一个页面有三种读取方式：

| 场景 | 后端返回 | 前端行为 |
| --- | --- | --- |
| 浏览器第一次打开 | 完整 GoHTML + page payload | Vue hydration / mount |
| 站内导航 | JSON page payload | Vue 更新当前页面 |
| 无 JS / crawler | 可读 GoHTML | 不依赖 Vue 也能看到核心内容 |

站内导航时，前端会对同一个 URL 带上 `X-Goose-Page` 请求头。后端只返回页面 payload，省去完整 HTML 文档。

```text
GET /p/post/123
  -> full HTML

GET /p/post/123 + X-Goose-Page
  -> page payload
```

这让 URL 和 SEO 继续由服务端负责，同时避免每次站内跳转都重新加载整个页面壳。

## 目录怎么分

```text
resource/
  src/site/       用户站点
  src/admin/      管理端
  src/runtime/    page payload / 浏览器运行时
  src/styles/     公共站点样式与 token
  src/locales/    多语言
  src/types/      页面 payload 类型
  packages/client OpenAPI 生成类型
  templates/      GoHTML
  test/           Vitest / Browser tests
```

`site` 和 `admin` 是两个入口。它们可以共享真正通用的 runtime / 类型，但样式和页面组件保持各自边界。

不要因为两个页面“长得差不多”就立刻抽一个共享组件。行为复用、交互状态复杂、可访问性逻辑重复，才是更可靠的抽象信号。

## Page payload 是什么

Go controller 会为每个页面构造可序列化的 payload。Vue 页面把它当作服务端页面状态读取。

适合放进 payload 的内容：

- 当前页面的业务数据。
- 当前用户和权限。
- 导航 / shell 所需状态。
- 服务端已经确定的真实状态。

不适合为了前端方便塞进去的内容：只存在于组件内部的临时动画、hover 或输入框状态。

修改 payload 字段时，需要同时检查 Go struct、Vue 类型、GoHTML fallback 和页面组件。

## JSON API 类型与页面类型分开管理

OpenAPI 生成的 TypeScript 用于 `/api` JSON contract。

GoHTML 页面 payload 是另一条契约。它没有因为“也用了 JSON”就自动归 OpenAPI 管理。

修改前先确认改动对象：

- API response；还是
- 页面 payload。

前者回到[API 契约](/development/api)，后者同步修改 controller + 页面类型。

## 浏览器认证

Web 使用 HttpOnly `access_token` Cookie。

前端代码：

- 不读取 session token。
- 不把 token 放到 localStorage。
- 不为 same-origin 请求手工拼 `Authorization`。

状态修改请求由服务端 CSRF middleware 保护。

遇到 401 / 403 时，按服务端状态处理登录、邮箱验证或权限问题。不要用额外 header 绕过。

## 开发和测试

```bash
cd apps/gooseforum/resource
pnpm install --frozen-lockfile
pnpm dev
```

常用检查：

```bash
pnpm typecheck
pnpm test
pnpm build
```

布局、键盘交互、真实 viewport 等问题使用 Browser tests：

```bash
pnpm test:browser
```

## 设计 token

Web 视觉 token 的源位于：

```text
resource/src/styles/tokens.css
```

Flutter 镜像位于：

```text
apps/mobile/packages/ui_kit/lib/src/theme/tokens.json
```

修改 Web token 时，同一 PR 更新移动端 token。这样两端不会在几轮 UI 调整后逐渐变成两套颜色和间距系统。

固定界面文案进入 `locales`；用户正文、课程名和学校原始数据保持原文。
