# 架构说明

Moodial 采用 TypeScript monorepo 架构，支持自部署和官方托管两种模式。

## 整体架构

```
┌─────────────────────────────────────┐
│      Moodial 核心应用               │
│                                     │
│  ┌─────────┬────────┬──────────┐   │
│  │  Web    │ Core   │ Database │   │
│  │  App    │ Logic  │ Layer    │   │
│  └─────────┴────────┴──────────┘   │
└─────────────────────────────────────┘
            │
    ┌───────┴────────┐
    │                │
    ▼                ▼
┌────────────┐  ┌──────────────┐
│自部署      │  │官方托管      │
│Docker      │  │服务          │
│Compose     │  │              │
│            │  │ - 用户系统   │
│ - Web      │  │ - 计费系统   │
│ - DB       │  │ - CDN/Cache  │
│ - Volumes  │  │ - 监控告警   │
└────────────┘  └──────────────┘
```

## 项目结构

```
Moodial/
├── apps/
│   └── web/                    # Next.js Web 应用
│       ├── app/               # App Router 路由和 API
│       │   ├── (auth)/        # 认证页面（登录、注册）
│       │   ├── (app)/         # 主应用页面
│       │   ├── api/           # 后端 API 路由
│       │   └── calendar/      # 日历页面
│       ├── components/        # React UI 组件
│       ├── lib/              # 工具函数和 hooks
│       ├── styles/           # 全局样式
│       └── next.config.ts    # Next.js 配置
│
├── packages/
│   ├── core/                 # 核心业务逻辑
│   │   ├── types.ts          # 共享 TypeScript 类型
│   │   ├── constants.ts      # 常量定义（情绪、字段等）
│   │   ├── mood-modes.ts     # 四种情绪模式配置
│   │   └── ...
│   │
│   ├── db/                   # 数据库层 (Prisma)
│   │   ├── prisma/
│   │   │   ├── schema.prisma # 数据模型定义
│   │   │   └── migrations/   # 数据库迁移历史
│   │   ├── index.ts          # Prisma 客户端导出
│   │   └── package.json
│   │
│   └── prompts/              # AI Prompt 管理
│       ├── diary.ts          # 日记生成 Prompt
│       ├── qa.ts             # 追问逻辑 Prompt
│       ├── extraction.ts     # 字段提取 Prompt
│       └── ...
│
├── docs/
│   ├── public/               # 对外文档
│   ├── api/                  # API 文档
│   └── deployment/           # 部署指南
│
├── docker/
│   ├── Dockerfile           # 应用容器镜像
│   └── entrypoint.sh        # 容器启动脚本
│
├── scripts/                 # 开发和测试脚本
│   ├── verify-diary-crud.mjs
│   └── verify-docker-mvp.mjs
│
├── docker-compose.yml       # 本地开发 Compose 配置
├── .env.example            # 环境变量示例
└── package.json            # Monorepo 根配置
```

## 核心模块

### apps/web — Next.js Web 应用

负责前端 UI 和后端 API：

**主要功能**：
- 🎨 用户界面（React 组件）
- 🔐 认证和授权
- 💬 日记记录和聊天流程
- 📅 日历和列表展示
- ⚙️ 用户设置和配置
- 🚀 自部署初始化
- 💳 官方托管入口

**关键页面**：
- `/login`, `/signup` — 认证
- `/app/record` — 日记记录
- `/app/calendar` — 日历视图
- `/app/settings` — 用户设置
- `/setup` — 自部署初始化

**关键 API**：
- `POST /api/diary/create` — 创建日记
- `POST /api/chat/message` — 发送聊天消息
- `GET /api/diary/:id` — 获取日记
- `DELETE /api/diary/:id` — 删除日记

### packages/core — 核心业务逻辑

共享的业务逻辑和类型定义：

**主要内容**：
- 📝 情绪模式定义
- 🏷️ 结构化字段定义
- 🎯 业务规则
- 🔢 常量和枚举

**示例**：

```typescript
// 四种情绪模式
export const MOOD_MODES = {
  happy: { name: '开心', prompt: '...' },
  complain: { name: '抱怨', prompt: '...' },
  sad: { name: '难过', prompt: '...' },
  confused: { name: '混乱', prompt: '...' }
}

// 结构化字段
export interface DiaryEntry {
  id: string
  userId: string
  mood: string
  content: string
  summary: string
  tags: string[]
  createdAt: Date
  // ...
}
```

### packages/db — 数据库层

使用 Prisma ORM 管理数据库：

**核心模型**：

```prisma
model UserAccount {
  id String @id @default(cuid())
  email String @unique
  password String
  name String
  role Role @default(USER)
  diaryEntries DiaryEntry[]
  chatSessions ChatSession[]
  // ...
}

model DiaryEntry {
  id String @id @default(cuid())
  userId String
  user UserAccount @relation(fields: [userId], references: [id])
  mood String
  content String
  summary String
  tags String[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ChatSession {
  id String @id @default(cuid())
  userId String
  diaryEntryId String?
  messages ChatMessage[]
  // ...
}

model ChatMessage {
  id String @id @default(cuid())
  sessionId String
  session ChatSession @relation(fields: [sessionId], references: [id])
  role String // 'user' | 'assistant'
  content String
  createdAt DateTime @default(now())
}

model AppSetting {
  key String @id
  value String
  // 存储 AI Provider、API Key 等
}

model UsageRecord {
  id String @id @default(cuid())
  userId String
  tokens Int
  cost Float
  date DateTime @default(now())
  // 用于计费
}
```

**迁移管理**：

Prisma 会自动生成迁移文件，存储在 `migrations/` 目录。

```bash
npm run db:migrate -- --name add_new_field
npm run db:deploy  # 应用迁移
```

### packages/prompts — AI Prompt 管理

管理 AI 对话的 Prompt 模板：

**主要包括**：

1. **Opening Prompts** — 根据情绪模式的开场白
2. **Follow-up Prompts** — AI 追问的模板
3. **Summary Prompts** — 生成日记的 Prompt
4. **Extraction Prompts** — 提取字段和标签的 Prompt

**示例**：

```typescript
export const PROMPTS = {
  diary: {
    system: `你是一个情绪日记助手...`,
    extract: `从以下对话中提取...`,
  },
  happy: {
    opening: `哇，听起来今天有开心的事！..`,
    followUp: [`...什么时候发生的？`, `...这让你感受到了什么？`],
  }
}
```

## 数据流

### 日记创建流程

```
用户输入
  ↓
保存为 ChatMessage (user)
  ↓
调用 AI API
  ↓
AI 回复 (ChatMessage)
  ↓
判断是否完成
  ├─ 未完成 → 返回 AI 回复给用户
  │           用户继续输入...
  │
  └─ 完成 → 调用生成日记 Prompt
            ↓
            提取结构化字段
            ↓
            创建 DiaryEntry
            ↓
            返回日记给用户
```

### AI 调用流程

```
API Route Handler
  ↓
验证用户和 API Key
  ↓
加载 Prompt 模板
  ↓
构造 AI 请求
  ↓
调用 AI API (OpenAI-Compatible)
  ↓
处理响应
  ├─ 成功 → 返回结果
  └─ 失败 → 返回 Fallback 或错误

记录 UsageRecord（用于计费）
```

## 认证和授权

使用 [better-auth](https://www.better-auth.com/) 库管理认证：

**认证方式**：
- 邮箱 + 密码（默认）
- 社交登录（官方托管版本）

**会话管理**：
- JWT + HTTP-only Cookie
- 自部署版本：自管理
- 官方托管版本：集中式

**权限模型**：
- `ADMIN` — 管理员（创建用户、配置系统）
- `USER` — 普通用户（创建和管理自己的日记）

## 部署架构

### 自部署版本

```
┌──────────────────────────────────┐
│ 用户服务器/NAS/VPS              │
│                                  │
│  ┌────────────────────────────┐ │
│  │ Docker Container           │ │
│  │ ┌──────────┬────────────┐  │ │
│  │ │ Web App  │ PostgreSQL │  │ │
│  │ │ (Node)   │            │  │ │
│  │ └──────────┴────────────┘  │ │
│  └────────────────────────────┘ │
│         │                        │
│  ┌──────▼──────────────────────┐ │
│  │ Docker Volumes (Data)       │ │
│  │ - PostgreSQL 数据库         │ │
│  │ - 配置文件                  │ │
│  └─────────────────────────────┘ │
└──────────────────────────────────┘
```

### 官方托管版本

```
┌──────────────────────────────────┐
│ 官方服务基础设施                 │
│                                  │
│  ┌─────────────────────────┐    │
│  │ CDN / 反向代理          │    │
│  └────────────┬────────────┘    │
│               │                 │
│  ┌────────────▼────────────┐    │
│  │ 应用服务                │    │
│  │ (Web App × N)           │    │
│  └────────────┬────────────┘    │
│               │                 │
│  ┌────────────▼────────────┐    │
│  │ 数据库集群              │    │
│  │ (PostgreSQL HA)         │    │
│  └──────────────────────────┘    │
│  ┌──────────────────────────┐    │
│  │ 缓存层 (Redis)           │    │
│  │ 监控告警                 │    │
│  │ 备份系统                 │    │
│  └──────────────────────────┘    │
└──────────────────────────────────┘
```

## 性能考虑

- **缓存** — 使用 Redis 缓存频繁访问的数据
- **数据库索引** — 在 userId、createdAt 等字段建立索引
- **CDN** — 官方托管版本使用 CDN 加速静态资源
- **分页** — 列表 API 支持分页和虚拟滚动

## 安全考虑

- **认证** — JWT + HTTP-only Cookie
- **授权** — 基于用户 ID 的数据隔离
- **加密** — 敏感字段在数据库中加密存储
- **API 限流** — 防止滥用
- **输入验证** — 防止 SQL 注入和 XSS

## 扩展性

### 添加新的情绪模式

1. 在 `packages/core/mood-modes.ts` 定义
2. 在 `packages/prompts` 添加 Prompt 模板
3. 在数据库迁移中更新字段
4. 在 UI 中添加对应选项

### 集成新的 AI 模型

1. 实现 OpenAI-Compatible 适配器
2. 在应用设置中添加新的 Provider 选项
3. 添加 API Key 管理界面

### 扩展数据模型

1. 修改 `schema.prisma`
2. 运行 `npm run db:migrate`
3. 更新应用代码

## 技术决策

| 决策 | 原因 |
|------|------|
| **Next.js** | 全栈框架，简化前后端开发 |
| **Prisma** | 类型安全的 ORM，良好的迁移管理 |
| **PostgreSQL** | 成熟稳定，支持 JSONB 用于灵活字段 |
| **TypeScript** | 类型安全，减少运行时错误 |
| **Docker** | 标准化部署，方便自部署 |
| **OpenAI API** | 成熟、广泛支持的标准接口 |

---

详见[完整 API 文档](../api/)、[部署指南](../deployment/) 和[开发指南](../DEVELOPMENT.md)。

