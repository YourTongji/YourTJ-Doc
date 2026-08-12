# API 契约

本文介绍 YourTJ Hub 的 API 契约现状：OpenAPI 3.1 受控契约、已覆盖操作、生成管线与变更纪律。

## 契约中心

受控契约入口是 `packages/api-contract/openapi.yaml`（**OpenAPI 3.1**），paths/ 按域拆分（如 `auth.yaml`、`auth-sessions.yaml`、`forum-topics.yaml`、`agent.yaml`）。新增覆盖时新建按域文件，而不是扩展旧文件——并行契约 PR 只会在入口与生成产物处相遇。

## 当前覆盖操作

现状为 **Partial**。当前已覆盖：

- `POST /api/login`、`GET /api/login-public-key`
- TOTP：`POST /api/auth/totp/verify`、`GET /api/user/totp/status`、`POST /api/user/totp/setup|enable|disable`
- `POST /api/logout`、`POST /api/auth/oidc/exchange`
- `POST /api/forum/topics/write`
- 会话管理：`GET /api/user/sessions`、`POST /api/user/sessions/revoke|revoke-all`
- Agent 六操作：`GET/POST /api/v1/agent/...`（me、topics、posts、search）
- 课程只读：`GET /api/forum/courses`、`GET /api/forum/courses/{courseId}`（`security: []`）

## 响应信封

- **业务失败**常用 HTTP `200` + `{ "code": 1, "result": null, "messageCode": ... }`——消费端必须检查 JSON envelope，不能把每个 2xx 当应用成功；
- 中间件失败（未认证、冻结、限流）为 HTTP `401` / `403` / `429`，同样携带失败信封；
- 主题写入当前使用宽松的 `UpButterReq` 包装，畸形/不完整 JSON 报告为 HTTP 200 校验失败而非 400。

## 契约流水线

```
Go controller + route wrapper + Gin middleware（当前行为，事实源）
   │  手动维护操作描述
   ▼
packages/api-contract/openapi.yaml + paths/ + components/
   │  Redocly lint + bundle      │  openapi-typescript
   ▼                              ▼
packages/api-contract/fixtures/  @gooseforum/client/openapi 生成类型
   │
   └── 路由级 httptest 断言 ←──── CI 生成产物 no-diff 门禁
```

- **Go 行为是事实源**：controller、路由包装、中间件及其 httptest 覆盖定义了被文档化的行为；
- **OpenAPI 是受控协议源**：以可评审、可消费的格式文档化每个已覆盖操作；
- **生成 Web 类型是产物**：`@gooseforum/client` 只导出生成类型（`src/gen/`），不替代手写页面 payload 契约，也不创建请求客户端；CI 重新生成并拒绝未提交的 diff；
- **fixtures 是代表性 wire 样本**：路由级 Go 测试跑真实 Gin 路由链，断言实际状态码、envelope、result 形态与 `Retry-After`；
- **移动端 Dart 生成是 Planned**：`apps/mobile/core/lib/src/gen/*.dart` 目前手工维护，fixture 测试兜底其反序列化。

## 变更纪律

- 对已覆盖操作：后端行为 → `openapi.yaml` → 生成 TypeScript → fixtures / 路由级契约测试在**同一个 PR** 交付；
- 未覆盖操作保持与消费端手工同步；`@gooseforum/client` 必须与 Go struct 保持一致；
- 影响移动端的后端/TS 契约变更，必须同 PR 更新 Dart 镜像 + fixture 契约测试；
- **断裂性变更对比暂不是门禁**：`dev` 基线尚无稳定操作可比对。待覆盖稳定后再建立 base-vs-head 的契约断裂门禁。

## 相关文档

- [后端（Go）](/development/backend)
- [身份与 OIDC](/development/identity)
- [测试策略](/development/testing)
