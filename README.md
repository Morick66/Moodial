# Moodial

开源、自部署优先的 AI 情绪日记应用。

Moodial 通过自然聊天，帮助用户把说不清的情绪、事件、想法和需求整理成可以回看的日记，并长期沉淀为个人情绪知识库。

项目采用双轨模式：

- 自部署：用户可以通过 Docker 把服务部署在 NAS、VPS、云服务器或本地机器上，数据保存在自己的实例中。
- 官方托管：不会部署的用户可以注册官方服务，使用官方服务器和官方大模型能力。官方大模型调用可按量或按月订阅收费。

## 当前状态

项目处于早期产品和工程骨架阶段。

已完成：

- Web MVP 工程骨架；
- 多用户数据模型草案；
- 自部署与官方托管双轨规划；
- Git 仓库与基础目录结构。

## 核心特性

- 四个情绪入口：记点开心的、想骂两句、有点难过、脑子很乱；
- AI 轻量追问，自动收束；
- 自动生成自然语言日记；
- 提取结构化字段和情绪标签；
- 日历回看；
- 多用户账号系统；
- 用户之间日记数据隔离；
- Docker 自部署；
- PostgreSQL 默认数据库；
- 官方托管可选；
- 支持用户自配 AI 服务商和模型。

## 项目结构

```text
.
├── apps/
│   └── web/                 # Web 应用
├── packages/
│   ├── core/                # 核心领域逻辑
│   ├── db/                  # 数据库 schema / migrations
│   └── prompts/             # Prompt 模板
├── docs/
│   ├── api/                 # API 文档
│   ├── deployment/          # 部署文档
│   └── public/              # 对外项目文档
├── docker/                  # Docker 相关配置
├── scripts/                 # 开发和运维脚本
├── .env.example
├── docker-compose.yml
└── README.md
```

## 文档入口

- [项目概览](docs/public/overview.md)
- [自部署说明](docs/public/self-hosting.md)
- [架构说明](docs/public/architecture.md)
- [隐私说明](docs/public/privacy.md)
- [路线图](docs/public/roadmap.md)

## 部署愿景

未来目标是让自部署尽量简单：

```bash
cp .env.example .env
docker compose up -d
```

然后打开 `http://localhost:3000`，初始化管理员账号，配置 AI API Key，开始使用。

## 技术栈

- Next.js App Router；
- React；
- TypeScript；
- Tailwind CSS；
- Prisma；
- PostgreSQL；
- Docker Compose；
- OpenAI-Compatible AI Adapter。

## 隐私说明

日记是高度私密数据。

自部署版本中，日记数据保存在用户自己的实例中。若使用云端 AI API，生成日记时对话内容仍会发送给用户配置的模型服务商。极度敏感场景建议使用自部署服务配合本地模型。

官方托管版本会把数据保存在官方服务端，并使用官方配置的大模型能力。官方托管必须提供清晰隐私政策、数据导出和账号注销能力。

## 路线图

- v0.1：Web MVP、自部署、多用户账号、4 个情绪模式、日记生成、日历回看；
- v0.2：部署体验增强、备份恢复、PWA、Markdown 导出、周总结；
- v0.3：官方托管、免费额度、按量计费、月度订阅、用量统计；
- v0.4：长期回看、月总结、咨询前摘要、Obsidian 导出；
- v0.5：移动端 App、官方账号登录、自部署域名/IP 连接、离线草稿、语音输入。

## License

MIT
