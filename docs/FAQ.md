# 常见问题 (FAQ)

## 功能相关

### Q: Moodial 是什么？

A: Moodial 是一个 AI 情绪日记应用。它通过自然对话帮助你整理情绪、事件和想法，自动生成结构化的日记记录。支持自部署和官方托管两种方式。

### Q: 支持哪些语言？

A: 目前支持中文和英文。界面语言和 AI 交互都可以配置。

### Q: 有移动应用吗？

A: 目前没有原生移动应用。官方托管版本支持通过浏览器访问（响应式设计适配手机）。移动应用在 v0.5 路线图中计划开发。

### Q: 可以离线使用吗？

A: 目前需要网络连接。自部署版本可以在内网使用（不需要公网）。离线草稿功能在 v0.5 计划中。

### Q: 可以导出数据吗？

A: 可以。Markdown 导出在 v0.2 计划中，JSON 导出也会支持。你随时可以访问数据库直接导出数据。

### Q: 支持多人共享日记吗？

A: 目前不支持。每个日记完全属于创建者。官方托管版本计划在未来版本中支持日记共享功能。

## 部署相关

### Q: 自部署需要什么硬件配置？

A: **最低配置**：
- 1GB RAM
- 10GB 存储空间
- 任何能运行 Docker 的系统

**推荐配置**：
- 2GB+ RAM
- 20GB+ 存储
- SSD（更快的数据库性能）

### Q: 支持在哪些系统部署？

A: 支持任何运行 Docker 的系统，包括：
- Linux（Ubuntu、Debian 等）
- macOS（Intel 和 Apple Silicon）
- Windows（使用 WSL2 + Docker Desktop）
- NAS（群晖、威联通等）
- 树莓派（使用 arm64 镜像）
- 各大云服务提供商（AWS、阿里云、腾讯云等）

### Q: 部署多麻烦？

A: 非常简单！只需三步：

```bash
cp .env.example .env
docker compose up -d
# 访问 http://localhost:3000 初始化
```

详见[自部署指南](docs/public/self-hosting.md)。

### Q: 如何访问自部署的实例？

A: 取决于你的部署位置：
- **本地机器**：`http://localhost:3000`
- **局域网 NAS**：`http://nas-ip:3000`
- **云服务器**：`http://your-domain:3000` 或 `http://server-ip:3000`
- **反向代理后**：配置你的域名指向

### Q: 如何设置 HTTPS？

A: 建议在自部署前面使用反向代理（如 Nginx、Caddy）。具体步骤会在 v0.2 部署文档中补充。

### Q: 备份和恢复？

A: 备份和恢复功能在 v0.2 计划中。目前可以：
- 备份 Docker 数据卷：`docker compose exec postgres pg_dump -U jzmle jzmle > backup.sql`
- 恢复：`cat backup.sql | docker compose exec -T postgres psql -U jzmle jzmle`

### Q: 如何更新到新版本？

A: 更新指南会在后续版本中补充。基本步骤：
```bash
git pull
docker compose build
docker compose down
docker compose up -d
```

## AI 和模型

### Q: 支持哪些 AI 模型？

A: 支持任何 OpenAI-Compatible 接口的模型，包括：

**云端模型**：
- OpenAI GPT-4, GPT-3.5-Turbo
- Anthropic Claude（通过 OpenAI 兼容的代理）
- 其他支持 OpenAI API 的服务

**本地模型**：
- Ollama（推荐用于隐私考虑）
- LM Studio
- LocalAI
- Llama.cpp

### Q: 需要付费吗？

A: 取决于选择的模型和部署方式：

**自部署**：
- 本地模型：完全免费
- 云端模型：按模型服务商的价格计费（需要自己购买 API Key）

**官方托管**：
- 有免费额度
- 超过免费额度可按量付费或月度订阅

### Q: 可以切换模型吗？

A: 可以。通过应用设置更换 AI 服务商或模型。前面的对话不会丢失，但新对话会使用新模型。

### Q: 我的对话会被用于模型训练吗？

A: 
- **自部署版本**：不会，完全在你的服务器上
- **官方托管版本**：不会，除非你在隐私设置中明确允许

### Q: 本地模型需要多大的显卡？

A: 取决于模型大小：
- **7B 模型**：4GB VRAM 就够（或 CPU 推理）
- **13B 模型**：6-8GB VRAM
- **70B 模型**：需要更强的硬件或量化版本

如果显卡不够，可以使用 CPU 推理（速度会慢一些）。

## 隐私和安全

### Q: 我的日记真的安全吗？

A: 
- **自部署版本**：完全安全。数据存储在你的服务器上，只要你的服务器安全
- **官方托管版本**：遵循清晰的隐私政策，采用加密存储和访问控制

详见[隐私说明](docs/public/privacy.md)。

### Q: 如何确保最大隐私？

建议：
1. 使用自部署版本
2. 配置本地 AI 模型（Ollama/LM Studio）
3. 在内网部署（不暴露到公网）
4. 定期备份

这样所有数据和模型推理都在本地完成。

### Q: 日记数据会被分享吗？

A: 不会，除非你主动分享。每个用户的日记完全隔离。

### Q: 如何删除数据？

A: 
- 单条日记：在应用中删除
- 整个账号：在账号设置中注销账号（包括所有日记）
- 官方托管版本：可以随时导出和删除所有数据

## 账号和多用户

### Q: 支持多个账号吗？

A: 
- **自部署版本**：可以创建多个用户账号，支持个人、家庭、小团队使用
- **官方托管版本**：同样支持多账号

### Q: 可以邀请别人使用吗？

A: 
- **自部署版本**：可以。管理员可以通过邀请链接或公开注册添加新用户
- **官方托管版本**：可以邀请朋友注册

### Q: 账号如何登录？

目前支持：
- **邮箱 + 密码**（默认）
- **官方托管版本**：后续会支持社交登录

### Q: 忘记密码怎么办？

- **自部署版本**：管理员可以重置密码
- **官方托管版本**：可以通过邮箱重置

## 技术问题

### Q: 需要什么技术基础？

A: 自部署只需要：
- 基本的命令行知识
- 能访问服务器/NAS 的管理后台

**不需要**编程知识。

### Q: 如何获取 AI API Key？

以 OpenAI 为例：
1. 访问 https://platform.openai.com
2. 注册或登录
3. 生成 API Key
4. 复制到 Moodial 设置中

其他服务商类似流程。

### Q: 怎样测试 AI 连接是否成功？

在应用的 AI 设置中有"测试连接"功能。点击后会验证 API Key 和模型可用性。

### Q: 数据库支持哪些？

A: 目前只支持 PostgreSQL。未来可能支持其他数据库。

### Q: 可以用其他容器运行吗？

A: 可以。Docker 镜像遵循标准，可以在任何支持 Docker 的平台运行。

## 其他问题

### Q: 项目是开源的吗？

A: 是的！MIT 开源协议，代码在 GitHub 上公开。欢迎参与贡献。

详见[贡献指南](../CONTRIBUTING.md)。

### Q: 如何报告 bug？

A: 在 [Issues](https://github.com/Morick66/Moodial/issues) 中提交，包含：
- 清晰的描述
- 复现步骤
- 预期和实际行为
- 系统环境信息

### Q: 如何提建议？

A: 在 [Discussions](https://github.com/Morick66/Moodial/discussions) 中讨论，或提交 Issue 标记为 `enhancement`。

### Q: 项目的中长期计划？

A: 详见[产品路线图](docs/public/roadmap.md)。

### Q: 可以商业使用吗？

A: 可以。MIT 协议允许商业使用。

### Q: 有商业支持吗？

A: 目前没有。欢迎通过 Issues 或 Discussions 讨论。

### Q: 怎样联系开发者？

A: 
- GitHub Issues 和 Discussions
- 项目 README 中的联系方式

---

**没找到答案？** [提交新 Issue](https://github.com/Morick66/Moodial/issues) 或在 [Discussions](https://github.com/Morick66/Moodial/discussions) 中提问。
