# 移动端

Flutter 客户端位于 `apps/mobile`，使用 Melos 管理 workspace。

首页、话题、发布、课程、排课、Wiki 和“我的校园”等日常路径使用原生 Flutter 页面。管理工作区和部分认证交接使用受控浏览器页面。

## Workspace

| Package | 负责什么 |
| --- | --- |
| `core` | API、模型、Markdown、契约镜像 |
| `auth` | 密码 / OIDC、令牌存储、会话 |
| `ui_kit` | YourTJ 设计 token 和组件 |
| `forum_app` | 页面、路由、业务状态和平台集成 |

初始化：

```bash
cd apps/mobile
melos bootstrap
melos run analyze
melos run test
```

## 一次登录怎么完成

App 不直接收集 GitHub / Google 密码，也不把 OIDC token 当成长期论坛会话凭据。

```mermaid
flowchart LR
  A["Flutter"] --> B["系统浏览器 / AppAuth"]
  B --> C["YourTJ OIDC + PKCE"]
  C --> D["authorization code"]
  D --> E["/api/auth/oidc/exchange"]
  E --> F["论坛 JWT"]
  F --> G["Keychain / Keystore"]
```

之后普通 API 请求统一使用论坛 JWT。

Android Emulator 调试时，为了让 issuer 保持 `localhost`，使用：

```bash
adb reverse tcp:5234 tcp:5234
```

不要把 OIDC issuer 临时改成 `10.0.2.2`；issuer、authorization endpoint 和交换校验需要保持同一身份空间。

## 根导航和页面边界

当前根级导航包含 Home、Campus、Notifications 和 Messages。

搜索、话题、课程、Wiki、设置等作为二级页面 push 进入。iOS 使用平台原生转场和左缘返回手势；Android 保持项目自己的过渡。

管理页面不在 Flutter 中重新实现一套。需要管理员权限的工作区会通过第一方受控 Web 页面打开，并继续使用服务端权限判断。

## 本地状态必须按账号隔离

本地状态至少按 API origin 和账号 ID 隔离，确保同一设备切换账号时不会串用旧状态。

草稿、搜索记录、pending interaction、排课同步状态等需要至少区分：

```text
API origin + numeric user id
```

切换账号后，旧账号的点赞乐观状态、校园私密数据或未同步排课不能继续出现在新账号上下文。

### 校园数据

校园成绩、课表和消息只存在页面内存。

离开 Campus、切换 session 或 App 进入后台时，应清理私密视图并取消在途请求；这些数据不进入通用离线缓存。

### 聊天 outbox

发送中的消息可以在当前 session 内保留，以便离开会话再回来仍能看到发送状态。

它不会跨 App 终止持久化。当前消息 API也没有客户端幂等 key，所以网络结果不明确时手动重试无法保证严格 exactly-once。

## 排课同步

Flutter 和 Web 使用同一 `/api/pk/plans` 版本语义。

本地修改先可靠保存，再尝试上传；服务端 409 时重新读取云端并对账。账号切换后必须重新建立同步基线。

不要为了“离开页面时看起来同步了”就先推进本地同步时钟，再异步写磁盘。移动系统可能随时暂停进程。

## 推送

原生推送是可选增强通道。

- iOS：APNs。
- Android：JPush / OEM，以及配置的 FCM provider。

只有用户明确同意、系统权限允许、设备 token 获取成功并完成服务端注册后，UI 才应显示已启用。

配置缺失或注册失败都应保持真实关闭 / 错误状态。

## 设计和 API 契约

Flutter token：

```text
apps/mobile/packages/ui_kit/lib/src/theme/tokens.json
```

它与 Web `tokens.css` 同步维护。

Dart API mirror 位于 `core/lib/src/gen/`，目前仍手工维护。移动端实际使用的 API 变更，需要同一 PR 更新 mirror 和反序列化测试。

公开商店分发、部分 native push 和学校登录真机链路仍需要生产环境验证。代码路径存在不等于这些外部链路已经完成验收。
