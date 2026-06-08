# 自部署指南

> 🚀 **快速部署你的 AI 情绪日记应用**

自部署是 Moodial 的核心。你可以在自己的 NAS、VPS、云服务器或本地机器上完全掌控数据和体验。

## 前置要求

### 硬件

| 指标 | 最低 | 推荐 |
|------|------|------|
| **RAM** | 1GB | 2GB+ |
| **存储** | 10GB | 20GB+ |
| **CPU** | 1 核 | 2 核+ |
| **网络** | 1Mbps | 10Mbps+ |

### 软件

- **Docker** >= 20.10
- **Docker Compose** >= 2.0
- **Git** (可选，用于克隆仓库)

### 支持的系统

✅ Linux（Ubuntu 20.04+、Debian 11+）  
✅ macOS（Intel、Apple Silicon）  
✅ Windows（使用 WSL2 + Docker Desktop）  
✅ NAS（群晖、威联通、Unraid）  
✅ 树莓派（arm64 镜像）  
✅ 云服务（AWS、阿里云、腾讯云等）  

## 快速开始（3 步）

### 1️⃣ 克隆或下载代码

**方式 A：使用 Git**
```bash
git clone https://github.com/Morick66/Moodial.git
cd Moodial
```

**方式 B：直接下载**
- 访问 [Releases](https://github.com/Morick66/Moodial/releases)
- 下载最新版本
- 解压文件夹

### 2️⃣ 配置环境

```bash
cp .env.example .env
```

编辑 `.env` 文件，主要需要配置：

```env
# 应用配置
APP_URL=http://localhost:3000      # 替换为你的域名或 IP
APP_PORT=3000                      # 端口号

# 数据库（默认无需改）
POSTGRES_USER=jzmle
POSTGRES_PASSWORD=change-me        # 强烈建议改为强密码
POSTGRES_DB=jzmle

# 认证（生成随机字符串）
BETTER_AUTH_SECRET=generate-a-random-string-here

# AI 模型配置（可选，之后可在应用中配置）
AI_PROVIDER=openai_compatible
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-3.5-turbo
AI_API_KEY=sk-your-api-key-here
```

### 3️⃣ 启动服务

```bash
docker compose up -d
```

**就这么简单！** 🎉

等待 30 秒左右，然后访问：

```
http://localhost:3000
```

## 初始化设置

首次访问会进入初始化流程：

### 步骤 1：创建管理员账号

- 设置邮箱和密码
- 这个账号将有管理权限

### 步骤 2：配置 AI 服务

选择 AI 提供商和 API Key：

**云端模型**：
- OpenAI（需要 API Key）
- 其他兼容 OpenAI API 的服务

**本地模型**（推荐隐私）：
- Ollama（`http://localhost:11434`）
- LM Studio
- LocalAI

点击"测试连接"验证配置是否成功。

### 步骤 3：配置注册选项

- **关闭公开注册** — 只有管理员可以创建账号
- **开启邀请注册** — 管理员可以生成邀请链接
- **开启公开注册** — 任何人都可以注册（不建议）

### 步骤 4：完成

点击"开始使用"，现在可以开始记录日记！

## 常用操作

### 查看状态

```bash
docker compose ps
```

输出应该显示 `app` 和 `postgres` 容器都在运行。

### 查看日志

```bash
# 应用日志
docker compose logs app -f

# 数据库日志
docker compose logs postgres -f

# 所有日志
docker compose logs -f
```

### 停止服务

```bash
docker compose down
```

> ⚠️ 这只是停止容器，数据会被保留。

### 重启服务

```bash
docker compose restart
```

### 完全重置（会删除数据）

```bash
docker compose down -v
```

> ⚠️ 这会删除所有数据！确保已备份。

## 高级配置

### 更换端口

编辑 `.env`：

```env
APP_PORT=8080
POSTGRES_PORT=5433
```

然后重启：

```bash
docker compose up -d
```

### 配置本地 AI 模型（隐私最优）

#### 使用 Ollama

1. **安装 Ollama**（如果还没有）
   ```bash
   # macOS/Windows
   https://ollama.ai

   # Linux
   curl https://ollama.ai/install.sh | sh
   ```

2. **启动 Ollama**
   ```bash
   ollama serve
   ```

3. **下载模型**（另一个终端）
   ```bash
   ollama pull llama2         # 推荐
   ollama pull mistral        # 更快
   ollama pull neural-chat    # 中文友好
   ```

4. **在 Moodial 中配置**
   - AI Provider: `openai_compatible`
   - Base URL: `http://host.docker.internal:11434/v1`（Mac/Windows）
     或 `http://localhost:11434/v1`（Linux）
   - Model: `llama2`
   - API Key: 任意值（Ollama 不需要）

### 反向代理（使用 Nginx）

如果需要自定义域名和 HTTPS：

```bash
# 创建 Nginx 配置
mkdir -p ./nginx
```

**nginx/default.conf**：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

然后在 `docker-compose.yml` 中添加 Nginx 服务（具体步骤见[部署指南](../deployment/)）

### 使用 Let's Encrypt 获取 HTTPS

使用 Caddy（更简单）或 Certbot。详见后续部署文档。

## 备份和恢复

### 备份数据库

```bash
docker compose exec postgres pg_dump -U jzmle jzmle > backup.sql
```

### 恢复数据库

```bash
docker compose exec -T postgres psql -U jzmle jzmle < backup.sql
```

### 备份配置文件

```bash
cp .env .env.backup
```

### 完整备份（推荐）

```bash
# 导出数据库
docker compose exec postgres pg_dump -U jzmle jzmle > backup.sql

# 打包配置和备份
tar -czf moodial-backup-$(date +%Y%m%d).tar.gz \
  .env \
  backup.sql \
  docker-compose.yml
```

## 故障排除

### 容器无法启动

查看日志：
```bash
docker compose logs app
```

**常见原因**：
- 端口被占用 → 改变 `APP_PORT`
- 磁盘空间不足 → 清理磁盘
- 权限问题 → 检查文件权限

### 无法连接到数据库

```bash
# 检查 PostgreSQL 是否运行
docker compose logs postgres

# 验证连接字符串
echo $DATABASE_URL
```

### AI 连接失败

1. 检查 API Key 是否正确
2. 检查网络连接
3. 尝试"测试连接"功能
4. 查看日志了解具体错误

### 性能缓慢

**可能原因**：
- 内存不足 → 增加 RAM 或优化配置
- 数据库索引缺失 → 重建索引
- 网络问题 → 检查网络连接

## 安全最佳实践

### 🔒 强烈建议

1. **改变默认密码**
   ```env
   POSTGRES_PASSWORD=your-strong-password
   ```

2. **生成安全的 Session Secret**
   ```bash
   # Linux/Mac
   openssl rand -base64 32
   ```
   
   然后设置到 `.env`：
   ```env
   BETTER_AUTH_SECRET=your-generated-secret
   ```

3. **不要暴露到公网**（除非必要）
   - 仅在内网访问更安全
   - 如果需要外网访问，使用 VPN 或反向代理

4. **定期备份**
   - 每周备份一次
   - 存储到安全位置

5. **更新镜像**
   ```bash
   docker compose pull
   docker compose up -d
   ```

### 防火墙配置

如果在云服务器部署，配置防火墙只允许必要的端口：

```bash
# 仅允许 HTTP (80) 和 HTTPS (443)
ufw allow 80/tcp
ufw allow 443/tcp
```

## NAS 部署特殊说明

### 群晖

1. 打开 Docker 应用
2. Image → 导入 (`docker pull` 或从 URL）
3. Container → 新建
4. 绑定端口（如 8080:3000）
5. 挂载数据卷用于持久化

### 威联通

类似群晖，在容器管理应用中操作。

## 更新到新版本

```bash
# 拉取最新代码
git pull origin main

# 重建镜像
docker compose build

# 启动更新后的服务
docker compose down
docker compose up -d

# 运行数据库迁移（如有新的 schema 变更）
docker compose exec app npm run db:deploy
```

## 监控和维护

### 定期检查

```bash
# 检查容器状态
docker compose ps

# 查看资源使用情况
docker stats

# 检查磁盘空间
docker system df
```

### 清理（谨慎！）

```bash
# 清理未使用的镜像
docker image prune

# 清理未使用的卷
docker volume prune
```

## 获取帮助

- 📖 [开发指南](../DEVELOPMENT.md)
- ❓ [常见问题](../FAQ.md)
- 🐛 [报告 Bug](https://github.com/Morick66/Moodial/issues)
- 💬 [讨论问题](https://github.com/Morick66/Moodial/discussions)

## 下一步

部署完成后：

1. ✅ 创建你的账号
2. ✅ 配置 AI 模型
3. ✅ 邀请其他用户（可选）
4. ✅ 开始记录日记！

---

**祝你使用愉快！** 🎉

有问题？[提交 Issue](https://github.com/Morick66/Moodial/issues) 或在 [Discussions](https://github.com/Morick66/Moodial/discussions) 中讨论。
