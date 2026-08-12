# 快速开始

本指南帮助你快速搭建并运行 YourTJ Hub 的本地开发环境。

## 环境要求

| 工具 | 版本要求 | 说明 |
|------|----------|------|
| Go | 1.26+ | 后端运行环境 |
| Node.js | 24+ | 前端（Vue 3）构建与开发 |
| pnpm | 11+ | 前端包管理器（在 `apps/gooseforum/resource/` 内运行） |
| Docker + Compose | 最新 | 本地依赖服务（PostgreSQL、Meilisearch） |
| Flutter SDK | 3.44.9（CI 锁定） | 移动端（可选，仅在开发移动端时需要）；Dart SDK 约束 `>=3.12.2 <4.0.0` |
| melos | — | 移动端工作区管理（`dart pub global activate melos`） |

## 克隆仓库

```bash
git clone --branch dev https://github.com/YourTongji/YourTJ-Hub.git
cd YourTJ-Hub
```

默认分支为 `dev`，它也是 PR 的目标分支；`main` 是生产分支。

## 安装前端依赖

```bash
cd apps/gooseforum/resource
pnpm install --frozen-lockfile
cd ../../..
```

> **注意**：必须在 `apps/gooseforum/resource/` 目录内运行 pnpm。主目录（如 `~/pnpm-workspace.yaml`）的 workspace 配置可能会干扰 pnpm 的向上查找。

## 启动本地依赖服务

```bash
make dev
```

`make dev` 通过 Docker Compose 启动 PostgreSQL 与 Meilisearch 等本地依赖。如果只需要 SQLite + 无搜索的最简环境，可以跳过这一步直接启动后端。

## 启动后端

```bash
make server
```

后端默认监听 `http://localhost:5234`。首次启动会自动生成一个已被 Git 忽略的 `apps/gooseforum/config.toml`（由内嵌模板生成）。

## 启动前端开发服务器

```bash
make web
```

Vite 开发服务器运行在 `http://localhost:3010`，开发模式下直接请求后端 `:5234`。

## 构建生产形态的单一二进制

```bash
make build
# output: bin/yourtj-hub
```

`make build` 先构建 Vue 前端，再把前端产物与 GoHTML 模板通过 `go:embed` 打进 Go 可执行文件。

## 移动端（可选）

```bash
cd apps/mobile
melos bootstrap   # 首次或依赖变更后
melos run analyze # 全包静态检查
melos run test    # 全包测试
```

`apps/mobile` 是一个 Melos 工作区，包含 `core` / `auth` / `ui_kit` / `forum_app` 四个包。

## 常见问题

- **Go module 拉取超时**：官方代理可能超时，可切换镜像：`GOPROXY=https://goproxy.cn,direct`。
- **pnpm `ERR_PNPM_IGNORED_BUILDS`**：esbuild 需要在 `apps/gooseforum/resource/pnpm-workspace.yaml` 的 `allowBuilds` 中放行（上游已处理 esbuild，一般无需改动）。
- **不要提交 `config.toml`**：其中包含签名密钥和第三方服务凭据。

## 下一步

- [配置说明](/guide/configuration)：了解 `config.toml` 的各配置项
- [开发文档](/development/overview)：了解 monorepo 结构与分层
- [部署指南](/guide/deployment)：生产环境部署
