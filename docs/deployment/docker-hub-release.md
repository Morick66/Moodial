# 发布到 Docker Hub

本指南帮助你将 Moodial 镜像构建并发布到 Docker Hub。

## 🚀 快速开始

### 1. 注册 Docker Hub 账号

访问 https://hub.docker.com 注册账号。

### 2. 在 Docker Hub 创建 Repository

1. 登录 Docker Hub
2. 点击 "Create Repository"
3. 填写信息：
   - **Name**: `moodial`
   - **Description**: "Open-source, self-host-first AI emotion diary"
   - **Visibility**: Public
4. 点击 "Create"

### 3. 本地登录 Docker Hub

```bash
docker login
# 输入你的 Docker Hub 用户名和密码
```

## 📦 构建和推送镜像

### 方式 A：简单构建（仅支持当前架构）

```bash
cd /path/to/Moodial

# 构建镜像
docker build -t yourusername/moodial:v0.1.0 .
docker build -t yourusername/moodial:latest .

# 推送到 Docker Hub
docker push yourusername/moodial:v0.1.0
docker push yourusername/moodial:latest
```

### 方式 B：多架构构建（推荐）

支持 `amd64` (Intel/AMD) 和 `arm64` (Apple Silicon、树莓派)：

```bash
# 第一次需要创建 builder
docker buildx create --name multiarch-builder --use

# 构建并推送
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t yourusername/moodial:v0.1.0 \
  -t yourusername/moodial:latest \
  --push \
  .
```

## 🤖 自动化发布（GitHub Actions）

项目已包含自动发布工作流。设置步骤：

### 1. 添加 Docker Hub 凭证到 GitHub

1. 访问 https://github.com/Morick66/Moodial/settings/secrets/actions
2. 点击 "New repository secret"
3. 添加两个密钥：
   - **Name**: `DOCKER_USERNAME`, **Value**: 你的 Docker Hub 用户名
   - **Name**: `DOCKER_PASSWORD`, **Value**: 你的 Docker Hub 密码

### 2. 创建发布（自动触发构建）

```bash
# 在项目根目录
git tag v0.1.0
git push origin v0.1.0
```

GitHub Actions 会自动：
- ✅ 检出代码
- ✅ 构建多架构镜像
- ✅ 推送到 Docker Hub
- ✅ 创建版本标签

### 3. 监控构建进度

在 GitHub 仓库的 "Actions" 标签页查看构建状态。

## 🔍 验证镜像

### 查看本地镜像

```bash
docker images | grep moodial
```

### 测试镜像

```bash
# 启动容器
docker run -p 3000:3000 yourusername/moodial:latest

# 访问应用
open http://localhost:3000

# 停止容器
docker stop <container-id>
```

### 查看 Docker Hub 上的镜像

访问 https://hub.docker.com/r/yourusername/moodial

## 📋 版本标签规范

| 标签 | 说明 |
|------|------|
| `v0.1.0` | 版本标签（从 git tag 自动生成） |
| `0.1` | 主次版本号 |
| `latest` | 最新版本（main 分支） |
| `main` | main 分支最新（如果需要） |

## 🔐 安全建议

### 不要使用账号密码！（已弃用）

Docker Hub 已弃用长期有效的密码。改用 **Personal Access Token**：

1. 访问 https://hub.docker.com/settings/security
2. 点击 "New Access Token"
3. 创建 token（选择 "Read, Write" 权限）
4. 复制 token 到 GitHub Secrets 中的 `DOCKER_PASSWORD`

### 限制镜像访问

如果想要私密镜像：
1. Repository 设置改为 "Private"
2. 只分享给需要的用户

## 📊 镜像大小优化

当前 Dockerfile 使用多阶段构建，已优化为：
- 基础镜像：`node:22-alpine`（小而快）
- 最终镜像大小：约 200-300MB
- 包含：Next.js 应用 + Node.js + 必要依赖

### 进一步优化（可选）

```dockerfile
# 使用更小的基础镜像
FROM node:22-alpine3.19 AS base

# 清理构建缓存
RUN npm cache clean --force
```

## 🚢 部署已发布的镜像

用户可以直接使用你发布的镜像：

```bash
docker pull yourusername/moodial:latest
docker run -p 3000:3000 yourusername/moodial:latest
```

或使用 Docker Compose：

```yaml
version: '3.8'
services:
  app:
    image: yourusername/moodial:latest
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://...
```

## 📚 相关资源

- [Docker Hub 官方文档](https://docs.docker.com/docker-hub/)
- [GitHub Actions Docker 文档](https://github.com/docker/build-push-action)
- [Dockerfile 最佳实践](https://docs.docker.com/develop/dev-best-practices/)

## ❓ 常见问题

### Q: 构建失败了怎么办？

A: 查看 GitHub Actions 日志：
1. 进入 "Actions" 标签页
2. 点击失败的工作流
3. 查看 "Build and push Docker image" 步骤的日志

### Q: 如何更新已发布的版本？

A: 创建新的 git tag：
```bash
git tag v0.1.1
git push origin v0.1.1
```

### Q: 支持 ARM 架构吗？

A: 是的！工作流已配置支持 `linux/amd64` 和 `linux/arm64`。

### Q: 可以发布到其他仓库吗？

A: 可以！修改工作流中的 `IMAGE_NAME` 和认证信息。

---

**需要帮助？** 在 [Discussions](https://github.com/Morick66/Moodial/discussions) 中提问。
