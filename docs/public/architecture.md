# 架构说明

项目采用 TypeScript monorepo。

```text
.
├── apps/web
├── packages/core
├── packages/db
├── packages/prompts
├── docs
└── docker
```

## apps/web

Next.js Web 应用，负责：

- 页面；
- API；
- 登录和账号；
- 日记记录流程；
- 自部署初始化；
- 官方托管入口。

## packages/core

核心领域逻辑，负责：

- 情绪模式定义；
- 共享类型；
- 业务规则；
- 前后端共用常量。

## packages/db

数据库层，当前使用 Prisma。

核心模型包括：

- `UserAccount`；
- `DiaryEntry`；
- `ChatSession`；
- `ChatMessage`；
- `AppSetting`；
- `Subscription`；
- `UsageRecord`。

## packages/prompts

Prompt 模板和 AI 对话策略。

后续会把不同情绪模式的开场、追问、收束和总结 Prompt 模块化。

