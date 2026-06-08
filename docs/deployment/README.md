# 部署与验证

Moodial 的开发期优先使用本机 Next.js + Docker PostgreSQL 验证，避免每次改动都重新构建 Docker 镜像。首版发布前，再使用完整 Docker Compose 做端到端验收。

## 本地开发测试

开发时只需要用 Docker 启动 PostgreSQL，Web App 直接在本机运行：

```bash
docker compose up -d postgres
env 'DATABASE_URL=postgresql://jzmle:change-me@localhost:5432/jzmle?schema=public' npm run db:deploy
env 'DATABASE_URL=postgresql://jzmle:change-me@localhost:5432/jzmle?schema=public' npm run dev
```

启动后访问：

```text
http://localhost:3000
```

注意：本机直接运行 `npm run dev` 时，`DATABASE_URL` 需要指向 `localhost:5432`。Docker Compose 内部的默认地址是 `postgres:5432`，只适合容器里的 app 使用。

如果只想快速确认数据库 CRUD 闭环，可以运行：

```bash
env 'DATABASE_URL=postgresql://jzmle:change-me@localhost:5432/jzmle?schema=public' npm run verify:diary-crud
```

该命令会验证创建日记、列表、详情、更新和软删除，不需要构建 Web App 镜像。

## Docker 启动

完整 Docker 启动主要用于发布前验收或模拟真实自部署环境：

```bash
cp .env.example .env
docker compose build
docker compose up -d
docker compose logs --tail=120 app
```

启动后访问：

```text
http://localhost:3000
```

首次访问会进入初始化流程，创建管理员账号后再登录使用。

## 基础健康检查

如果本机配置了 HTTP 代理，检查 localhost 接口时建议临时清掉代理变量：

```bash
env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY -u http_proxy -u https_proxy -u all_proxy \
  curl -i http://localhost:3000/api/setup/status
```

期望看到数据库状态为 `connected`。

## MVP 自动验收

项目提供隔离的 Docker MVP 验收脚本：

```bash
npm run verify:docker-mvp
```

脚本会使用独立 compose project `moodial_verify`，默认端口为：

- Web App: `3010`
- PostgreSQL: `55432`

脚本会自动完成：

- 构建 Docker 镜像；
- 启动隔离的 app 和 PostgreSQL；
- 等待 `/api/setup/status` 可用；
- 初始化测试管理员；
- 登录并保持会话 cookie；
- 创建聊天会话；
- 在没有 AI 配置时生成 fallback 日记草稿；
- 保存日记；
- 验证列表、详情和删除；
- 结束后清理测试容器和 volume。

如需保留测试容器用于手动排查：

```bash
KEEP_DOCKER_VERIFY_STACK=true npm run verify:docker-mvp
```

然后打开：

```text
http://localhost:3010
```

## 后续部署文档

后续还会补充 NAS、VPS、反向代理、HTTPS、数据备份、数据恢复和版本升级。
