# 移动端

本文介绍 YourTJ Hub 的 Flutter 移动端（`apps/mobile`）。状态为 **Partial**，尚未发布到应用商店。

## 工作区结构

`apps/mobile` 是一个 **Melos** 工作区，包含四个包：

| 包 | 职责 |
|---|---|
| `core` | 契约 / API 客户端 / Markdown 转换 |
| `auth` | 登录 / TOTP / OIDC / token 存储 |
| `ui_kit` | 设计令牌 + `Gf*` 组件（映射到钉死的 TDesign v1 alpha） |
| `forum_app` | 路由 / 页面 / 状态 |

脚本（`analyze` / `test` / `gen`）声明在 `apps/mobile/pubspec.yaml` 的 `melos:` 键下。

## 已实现能力

- **持久四底部导航 shell**：首页 / 搜索 / 消息 / 我的，按分支保留状态 + 全局发布按钮；
- 与 Web 对齐的列表 / 卡片主题流；重构的主题详情页与个人主页；
- **全局 Markdown 发布编辑器**：窄屏编辑/预览切换，宽屏双栏；格式化/图片工具栏；草稿与编辑预填；回复编辑器带图片动作；
- 结构化骨架屏加载；统一设置 / 登录 / 通知 / 草稿入口；
- **OIDC exchange 登录**（dot-grid 认证卡片）。

## 登录流程

AppAuth + PKCE → 内置 OIDC Provider 授权页 → 回调授权码 → `POST /api/auth/oidc/exchange` → 论坛 JWT。

- 论坛 JWT 存 Keychain/Keystore（`flutter_secure_storage`）；OIDC 令牌服务端校验、不持久化；
- 连后端：iOS 模拟器直接用 `http://localhost:5234`；Android 普通 API 开发可用 `http://10.0.2.2:5234`，但 **OIDC 必须用 `adb reverse tcp:5234 tcp:5234` 让 issuer 是合法的 loopback URL**（`10.0.2.2` 不是合法 local issuer，见 `apps/mobile/scripts/oidc_e2e.sh`）；
- 真机用局域网 IP（移动端落地时通过 dart-define 注入 baseUrl）。

## 设计令牌同步

- `ui_kit/lib/src/theme/tokens.json` 是 Web 设计语言 `resource/src/styles/tokens.css` 的**派生真相源**；
- **改 `tokens.css` 必须同 commit 更新 `tokens.json`**（契约式纪律）。

## 契约镜像

- 移动端契约镜像位于 `core/lib/src/gen/*.dart`（Dart 代码生成目前为 **Planned**，手工维护）；
- 共享 OpenAPI fixtures 兜底运行时反序列化测试。

## 本地验证

```bash
cd apps/mobile
melos bootstrap          # 首次或依赖变更后
melos run analyze        # 全包静态检查
melos run test           # 全包测试
```

CI：`ci-mobile`（非必选检查，按路径过滤）。

## 当前缺口

- 尚未上架应用商店；
- 推送通知、自定义主题同步、ja/it 语言包；
- Dart 代码生成、课程 UI 与课内搜索。

## 相关文档

- [身份与 OIDC](/development/identity)：exchange 登录细节
- [前端（Vue 3）](/development/frontend)：设计令牌同步
- [API 契约](/development/api)：Dart 镜像与 fixtures
