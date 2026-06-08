# Moodial

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js >= 22](https://img.shields.io/badge/Node.js-%3E%3D%2022-green.svg)](package.json)
[![npm >= 10](https://img.shields.io/badge/npm-%3E%3D%2010-green.svg)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue.svg)](package.json)
[![Next.js](https://img.shields.io/badge/Next.js-black.svg)](package.json)

> 🌙 开源、自部署优先的 AI 情绪日记应用

Moodial 通过自然聊天，帮助用户把说不清的情绪、事件、想法和需求整理成可以回看的日记，并长期沉淀为个人情绪知识库。

**核心理念：** 你的日记数据属于你。无论选择自部署还是官方托管，Moodial 都确保数据在你的掌控范围内。

### 🎯 为什么选择 Moodial？

- **隐私优先** — 自部署版本数据完全由你掌控，支持本地模型
- **开源透明** — MIT 开源协议，代码公开可审计
- **多部署方式** — 支持自部署（NAS/VPS/本地）和官方托管
- **多用户系统** — 适合个人、家庭、小圈子、小团队
- **模型无关** — 支持 OpenAI、Ollama 等兼容接口

### 📦 部署方式

- **自部署** — 通过 Docker Compose 部署在自己的 NAS、VPS、云服务器或本地机器上，数据保存在自己的实例中
- **官方托管** — 注册官方服务直接使用，官方大模型调用可按量或按月订阅收费

## 📋 当前状态

**版本：** v0.1.0 MVP  
**状态：** 早期产品和工程骨架阶段

### 已完成

- Web MVP 工程骨架
- 多用户数据模型
- 自部署与官方托管双轨规划
- Git 仓库与基础目录结构

### 核心功能

- 四个情绪入口（开心、抱怨、难过、混乱）
- AI 轻量追问与自动收束
- 自动生成自然语言日记
- 提取结构化字段和情绪标签
- 日历回看
- 多用户账号系统与数据隔离
- Docker 自部署
- PostgreSQL 数据库
- 官方托管（可选）
- 用户自配 AI 服务商和模型

## 🚀 快速开始

### 最简单的方式：Docker Compose 自部署

```bash
# 1. 克隆仓库
git clone https://github.com/Morick66/Moodial.git
cd Moodial

# 2. 配置环境
cp .env.example .env
# 编辑 .env，至少需要配置 AI_API_KEY

# 3. 启动服务
docker compose up -d

# 4. 初始化
# 打开 http://localhost:3000
# 创建管理员账号 → 配置 AI 服务 → 邀请用户
```

> 💡 详细部署说明见 [自部署指南](docs/public/self-hosting.md)

### 本地开发

```bash
# 安装依赖
npm install

# 仅启动 PostgreSQL
docker compose up -d postgres

# 初始化数据库
env DATABASE_URL=postgresql://jzmle:change-me@localhost:5432/jzmle npm run db:deploy

# 启动开发服务器
env DATABASE_URL=postgresql://jzmle:change-me@localhost:5432/jzmle npm run dev

# 打开 http://localhost:3000
```

> 🔧 详细开发指南见 [开发指南](docs/DEVELOPMENT.md)

## 📂 项目结构

```text
Moodial/
├── apps/
│   └── web/                    # Next.js Web 应用
│       ├── app/                # App Router 页面和 API
│       ├── components/         # React 组件
│       └── styles/             # 样式文件
├── packages/
│   ├── core/                   # 核心领域逻辑
│   ├── db/                     # 数据库 Schema / Migrations (Prisma)
│   └── prompts/                # AI Prompt 模板
├── docs/
│   ├── public/                 # 对外项目文档
│   ├── api/                    # API 文档
│   └── deployment/             # 部署指南
├── docker/                     # Docker 相关配置
├── scripts/                    # 开发和运维脚本
├── .env.example                # 环境变量示例
├── docker-compose.yml          # Docker Compose 配置
└── package.json                # monorepo 根配置
```

## 🛠️ 技术栈

| 方向 | 技术 |
|------|------|
| **前端** | Next.js 15, React 19, TypeScript, Tailwind CSS |
| **后端** | Next.js API Routes, TypeScript |
| **数据库** | PostgreSQL, Prisma ORM |
| **部署** | Docker Compose, Node.js >= 22 |
| **AI** | OpenAI-Compatible 接口 |

## 📚 文档入口

- **[项目概览](docs/public/overview.md)** — 产品和架构概述
- **[自部署指南](docs/public/self-hosting.md)** — Docker 部署和配置
- **[架构说明](docs/public/architecture.md)** — 技术架构和模块说明
- **[隐私政策](docs/public/privacy.md)** — 隐私和数据保护
- **[产品路线图](docs/public/roadmap.md)** — 功能规划和版本计划
- **[开发指南](docs/DEVELOPMENT.md)** — 本地开发和测试
- **[贡献指南](CONTRIBUTING.md)** — 如何参与贡献

## 🔐 隐私与数据安全

**核心原则：你的数据属于你**

- 自部署版本：日记完全保存在你的服务器上
- 数据导出：随时导出你的数据
- 数据删除：随时删除你的数据和账号
- 透明通信：清晰说明数据何时何地被处理

> ⚠️ 如果配置了云端 AI API（如 OpenAI），对话内容会发送给相应的服务商。建议敏感数据使用本地模型。

详见 [隐私说明](docs/public/privacy.md)

## 🤝 贡献

欢迎贡献代码、文档、bug 报告和功能建议！

详见 [贡献指南](CONTRIBUTING.md)

## ❓ 常见问题

**Q: 可以免费使用吗？**  
A: 自部署版本完全免费。官方托管版本提供免费额度，超额按量计费或月度订阅。

**Q: 我的数据安全吗？**  
A: 自部署版本数据完全在你掌控。官方托管版本遵循清晰的隐私政策。详见[隐私说明](docs/public/privacy.md)。

**Q: 需要什么硬件来部署？**  
A: 最低配置：1GB RAM，10GB 存储。建议 2GB RAM+ 用于更好的体验。

**Q: 支持哪些 AI 模型？**  
A: 支持 OpenAI、Ollama、LM Studio 等 OpenAI-Compatible 接口。也支持自配置其他兼容接口。

更多见 [FAQ](docs/FAQ.md)

## 📈 路线图

**v0.1** — Web MVP ✅ (进行中)  
**v0.2** — 部署体验增强  
**v0.3** — 官方托管与计费  
**v0.4** — 长期回看  
**v0.5** — 移动端 App  

[查看完整路线图](docs/public/roadmap.md)

## 📄 License

MIT © 2026

---

## 🙌 致谢

感谢所有贡献者和用户的支持！

有问题？[开启 Issue](https://github.com/Morick66/Moodial/issues) 或在 Discussions 中讨论。
