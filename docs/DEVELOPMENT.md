# 开发指南

本指南帮助你在本地快速搭建开发环境并开始贡献代码。

## 🔧 环境要求

- **Node.js** >= 22.0.0
- **npm** >= 10.0.0
- **Docker & Docker Compose** （用于运行 PostgreSQL）
- **Git**

## 📦 安装开发环境

### 1. 克隆仓库

```bash
git clone https://github.com/Morick66/Moodial.git
cd Moodial
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发环境

最简单的方式是使用提供的命令：

```bash
npm run dev:local
```

这个命令会：
- 停止已运行的 Docker 容器（如果存在）
- 启动 PostgreSQL 容器
- 初始化数据库
- 启动开发服务器

然后访问 **http://localhost:3000** 开始开发。

### 4. 手动启动（如需自定义）

如果需要更多控制，可以按步骤启动：

```bash
# 启动 PostgreSQL 容器
docker compose up -d postgres

# 初始化数据库
env DATABASE_URL=postgresql://jzmle:change-me@localhost:5432/jzmle npm run db:deploy

# 启动开发服务器
env DATABASE_URL=postgresql://jzmle:change-me@localhost:5432/jzmle npm run dev
```

## 📝 常用命令

```bash
# 开发
npm run dev                    # 启动开发服务器
npm run dev:local             # 启动完整开发环境（推荐）

# 构建和生产
npm run build                 # 构建项目
npm start                     # 生产模式启动

# 代码质量
npm run lint                  # 运行 linter
npm run typecheck             # 运行 TypeScript 检查

# 数据库
npm run db:generate           # 生成 Prisma 客户端
npm run db:deploy             # 运行数据库迁移
npm run db:migrate            # 创建新的迁移
npm run db:studio             # 打开 Prisma Studio（UI）

# 测试和验收
npm run verify:diary-crud     # 验证日记 CRUD 操作
npm run verify:docker-mvp     # 完整 Docker 部署验收
```

## 🗂️ 项目结构速览

```
Moodial/
├── apps/web/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 路由
│   │   ├── (auth)/            # 认证相关页面
│   │   ├── (app)/             # 主应用页面
│   │   └── calendar/          # 日历页面
│   ├── components/            # React 组件
│   ├── styles/                # CSS 和样式
│   └── package.json
│
├── packages/
│   ├── core/                  # 核心业务逻辑
│   │   ├── types.ts           # 共享类型
│   │   ├── constants.ts       # 常量定义
│   │   └── ...
│   │
│   ├── db/                    # 数据库层
│   │   ├── prisma/schema.prisma   # 数据模型
│   │   ├── migrations/        # 数据库迁移
│   │   └── package.json
│   │
│   └── prompts/               # AI Prompt 模板
│       └── package.json
│
├── docs/
│   ├── public/                # 对外文档
│   ├── deployment/            # 部署文档
│   └── DEVELOPMENT.md         # 本文件
│
├── docker/
│   └── Dockerfile             # Docker 镜像配置
│
└── scripts/                   # 开发脚本
    ├── verify-diary-crud.mjs
    └── verify-docker-mvp.mjs
```

## 🔄 数据库操作

### 查看数据库状态

使用 Prisma Studio 打开 Web UI：

```bash
npm run db:studio
```

打开 http://localhost:5555 查看和编辑数据。

### 创建迁移

修改 `packages/db/prisma/schema.prisma` 后：

```bash
npm run db:migrate -- --name add_new_field
```

### 应用迁移

```bash
npm run db:deploy
```

## 🧪 测试

### 验证日记 CRUD

```bash
npm run verify:diary-crud
```

这个脚本验证：
- 创建日记
- 读取日记
- 更新日记
- 删除日记

### 完整 Docker 验收

```bash
npm run verify:docker-mvp
```

这个脚本验证完整的 Docker 部署流程，包括：
- 容器启动
- 数据库初始化
- 管理员创建
- 日记记录
- Fallback 保存
- 日历查看
- 数据删除

验收环境使用隔离的 PostgreSQL 端口 (`55432`) 和应用端口 (`3010`)。

## 🐛 调试

### 查看日志

```bash
# 应用日志
docker compose logs app -f

# PostgreSQL 日志
docker compose logs postgres -f

# 所有容器
docker compose logs -f
```

### 调试数据库查询

启用 Prisma 调试：

```bash
env DEBUG=prisma:client npm run dev
```

### 浏览器开发者工具

1. 打开 http://localhost:3000
2. 按 F12 打开开发者工具
3. 在 Console 和 Network 标签页中检查请求

## 🔒 环境变量

重要的环境变量（详见 `.env.example`）：

```env
# 应用配置
NODE_ENV=development              # 开发环境
APP_PORT=3000                     # 应用端口

# 数据库
DATABASE_URL=postgresql://...     # 数据库连接字符串

# 认证
BETTER_AUTH_SECRET=your-secret    # 会话密钥

# AI 配置
AI_PROVIDER=openai_compatible     # AI 提供商
AI_BASE_URL=http://...            # API 基地址
AI_MODEL=gpt-3.5-turbo            # 模型名称
AI_API_KEY=sk-...                 # API 密钥
```

## 📊 开发工作流

### 1. 创建特性分支

```bash
git checkout -b feature/your-feature
```

### 2. 编写代码

遵循项目的编码规范和风格。

### 3. 验证代码

```bash
npm run lint        # 检查代码风格
npm run typecheck   # 检查 TypeScript 类型
npm test           # 运行测试（如果有）
```

### 4. 本地测试

```bash
npm run dev:local   # 启动完整开发环境
# 手动测试 UI 功能
```

### 5. 提交代码

```bash
git add .
git commit -m "feat(diary): add emotion label extraction"
git push origin feature/your-feature
```

### 6. 提交 Pull Request

在 GitHub 上打开 PR，详见[贡献指南](../CONTRIBUTING.md)。

## 🚨 常见问题

### PostgreSQL 连接失败

确保 PostgreSQL 容器正在运行：

```bash
docker compose ps postgres
```

如果未运行，启动它：

```bash
docker compose up -d postgres
```

### 数据库迁移错误

重置数据库：

```bash
docker compose down -v          # 删除容器和数据卷
docker compose up -d postgres   # 重新启动
npm run db:deploy              # 重新初始化
```

### 端口被占用

如果 3000 端口被占用，更改 APP_PORT：

```bash
env APP_PORT=3001 npm run dev
```

### Node 版本不匹配

使用 nvm 或其他版本管理器切换到 Node 22+：

```bash
nvm use 22
```

或检查你的 Node 版本：

```bash
node --version
```

### 清理 node_modules

有时需要重新安装依赖：

```bash
rm -rf node_modules package-lock.json
npm install
```

## 📚 资源

- [Next.js 文档](https://nextjs.org/docs)
- [Prisma 文档](https://www.prisma.io/docs)
- [PostgreSQL 文档](https://www.postgresql.org/docs)
- [TypeScript 文档](https://www.typescriptlang.org/docs)

## 🆘 获取帮助

- 查看 [Discussions](https://github.com/Morick66/Moodial/discussions)
- 搜索已存在的 [Issues](https://github.com/Morick66/Moodial/issues)
- 提交新 Issue 描述问题

---

**祝你开发愉快！** 🚀
