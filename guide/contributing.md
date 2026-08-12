# 贡献指南

感谢你对 YourTJ Hub 的关注！我们欢迎任何形式的贡献：报告 Bug、提出功能建议、改进文档、提交代码。

## 贡献方式

### 🐛 报告 Bug

如果你发现了 Bug，请在 [GitHub Issues](https://github.com/YourTongji/YourTJ-Hub/issues) 中提交，请使用对应的模板并包含：

- 问题描述与复现步骤
- 期望行为与实际行为
- 环境信息（版本、数据库类型、是否启用搜索/OIDC 等）
- 相关日志（注意**不要**包含密钥、会话 token 等敏感信息）

### 💡 功能建议

使用 [Feature Request 模板](https://github.com/YourTongji/YourTJ-Hub/issues/new?template=feature-request.yml)提交。较大的改动建议先通过 Issue 对齐问题、用户与验收标准，再动手实现。

### 📝 改进文档

文档与代码同等重要。文档描述的是**当前支持的行为模型**，不保留"阶段计划/里程碑"；过时内容删除而不是保留"已废弃但有用"的副本（git 历史负责归档）。

### 💻 提交代码

#### 1. 阅读约定

开始编码前，先阅读：

- 仓库根目录 [`AGENTS.md`](https://github.com/YourTongji/YourTJ-Hub/blob/dev/AGENTS.md)（仓库硬约束）
- [`docs/development/README.md`](https://github.com/YourTongji/YourTJ-Hub/blob/dev/docs/development/README.md)（开发流程入口）
- 需求直接影响的 product / architecture / operations 文档

#### 2. 分支规范

- 从最新的 `origin/dev` 创建 `feat/*`、`fix/*` 或 `docs/*` 分支；
- Pull Request 目标为 **`dev`**（`main` 是生产分支，只经 PR + CI 发布）；
- 不要在 `main` / `dev` 上直接开发；并行任务优先使用 worktree（`git worktree add`），一个 checkout 不要混多个分支。

#### 3. 验证命令

实现后**实际运行**并报告结果（本地子集 ≠ CI 通过）：

```bash
make test
make build
git diff --check
```

更细的分层验证命令见[测试策略](/development/testing)。

#### 4. 提交规范

- 使用 Conventional Commits：`feat:` / `fix:` / `docs:` / `refactor:` / `chore:` / `test:`；
- 只 stage 本任务相关的文件，不动无关的脏/未跟踪文件；
- 永不 `push --force` 到共享分支；发布走 PR + CI。

#### 5. Pull Request 描述

PR 描述包含：动机、行为变更、验证（实际运行的命令 + 结果）、文档/契约影响、已知缺口。

**契约变更纪律**：对已由 OpenAPI 覆盖的操作，后端行为 → `openapi.yaml` → 生成的 TypeScript → fixtures / 契约测试必须在**同一个 PR** 内同步修改；改动设计令牌（`tokens.css`）必须同 commit 更新移动端 `tokens.json`。

## 状态词纪律

能力状态词只有四种：`Current` / `Partial` / `Planned` / `Decision needed`，只用于描述**具体可验证的行为**，禁止用"阶段 N / 已发货"等相对时间表述。文档生命周期词（`Active` / `Draft` / `Deprecated`）与之无关。

## 行为准则

- 尊重他人，进行建设性讨论；
- 敏感信息（密钥、内网地址、本地路径）绝不进入 commit / PR / 评论；
- 不代写他人内容：管理员只处理违规（敏感词、广告、人身攻击、违法违规）与事实性修正，不做内容代笔，操作有审计与申诉渠道。

## 联系方式

- GitHub Issues：[https://github.com/YourTongji/YourTJ-Hub/issues](https://github.com/YourTongji/YourTJ-Hub/issues)
- 线上论坛：[https://forum.yourtj.de](https://forum.yourtj.de)
