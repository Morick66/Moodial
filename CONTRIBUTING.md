# 贡献指南

感谢你有兴趣为 Moodial 做贡献！我们欢迎所有形式的贡献，包括代码、文档、bug 报告、功能建议等。

## 📋 行为准则

在参与本项目时，请遵守基本的礼貌和尊重，尊重他人的观点和不同背景。

## 🎯 贡献类型

### 🐛 Bug 报告

如果发现 bug，请：

1. **检查** [现有 Issues](https://github.com/Morick66/Moodial/issues) 避免重复
2. **提交** 新的 Issue，包含：
   - 清晰的标题
   - 详细的复现步骤
   - 预期行为 vs 实际行为
   - 系统环境信息（OS、Node 版本、浏览器等）
   - 错误日志或截图

### ✨ 功能建议

有新想法？请：

1. **讨论** 在 [Discussions](https://github.com/Morick66/Moodial/discussions) 中先讨论
2. **提交** Issue 标记为 `enhancement`
3. **说明** 用例和为什么需要这个功能

### 📝 文档改进

文档改进总是受欢迎的：

- 修复拼写/语法错误
- 改进不清楚的说明
- 补充缺失的内容
- 改进组织结构

### 💻 代码贡献

想提交代码？请按照下面的工作流程：

## 🔧 本地开发设置

### 前置要求

- Node.js >= 22
- npm >= 10
- Docker & Docker Compose（用于数据库开发）

### 步骤

```bash
# 1. Fork 仓库
# 访问 https://github.com/Morick66/Moodial 并点击 Fork

# 2. 克隆你的 fork
git clone https://github.com/YOUR_USERNAME/Moodial.git
cd Moodial

# 3. 添加上游仓库
git remote add upstream https://github.com/Morick66/Moodial.git

# 4. 安装依赖
npm install

# 5. 启动开发环境
npm run dev:local

# 现在可以在 http://localhost:3000 访问应用
```

## 📝 开发工作流

### 创建特性分支

```bash
# 同步最新代码
git fetch upstream
git checkout -b feature/my-feature upstream/main

# 或者修复 bug
git checkout -b fix/bug-description upstream/main
```

### 分支命名规范

- 功能：`feature/feature-name`
- Bug 修复：`fix/bug-name`
- 文档：`docs/doc-name`
- 测试：`test/test-name`

### 编码规范

- **语言**: TypeScript（严格模式）
- **格式**: 运行 `npm run lint` 保持一致性
- **风格**: 遵循项目现有代码风格
- **注释**: 仅注释复杂逻辑，避免过度注释

### 测试

- 新功能应包含相应的测试
- 修复 bug 时添加测试确保不会回归
- 运行 `npm test` 验证所有测试通过

### 提交信息

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
type(scope): subject

body

footer
```

**Type** 包括：
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档
- `style`: 代码风格（不改变功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试
- `chore`: 构建/工具链

**例子**：

```
feat(diary): add emotion label extraction

- Extract emotion labels from diary entries
- Store labels in database
- Display in diary detail view

Closes #123
```

## 🔄 提交 Pull Request

### 步骤

```bash
# 1. 推送到你的 fork
git push origin feature/my-feature

# 2. 在 GitHub 上打开 PR
# 访问 https://github.com/YOUR_USERNAME/Moodial/pulls
```

### PR 描述模板

```markdown
## 描述
简要描述你的改动

## 类型
- [ ] Bug 修复
- [ ] 新功能
- [ ] 文档改进
- [ ] 性能优化

## 改动清单
- [ ] 代码改动
- [ ] 测试补充
- [ ] 文档更新

## 测试
说明如何测试你的改动

## 截图（如适用）
添加 UI 改动的截图

## 相关 Issue
Closes #123
```

### PR 检查清单

提交前请确保：

- [ ] 代码通过 linting（`npm run lint`）
- [ ] 所有测试通过（`npm test`）
- [ ] 代码符合项目风格
- [ ] 提交信息清晰
- [ ] 没有合并冲突
- [ ] 文档已更新
- [ ] 不包含敏感信息或硬编码值

## 🚀 发布流程

Maintainers 会定期：

1. 检查 PR 和 Issue
2. Review 代码改动
3. 运行测试和验收
4. 合并到 main 分支
5. 发布新版本

## 📚 项目结构回顾

```
Moodial/
├── apps/web           # Next.js Web 应用
├── packages/
│   ├── core          # 核心业务逻辑
│   ├── db            # 数据库 Schema
│   └── prompts       # AI Prompts
├── docs/public       # 对外文档
├── docker/           # Docker 配置
└── scripts/          # 开发脚本
```

详见 [项目概览](README.md#-项目结构)

## 🆘 获取帮助

如果遇到问题：

1. **查看文档** — [开发指南](docs/DEVELOPMENT.md)
2. **搜索 Issues** — 可能有人遇到过相同问题
3. **开启 Discussion** — 提问和讨论
4. **联系 Maintainers** — 通过 Issue @ 提及

## 💡 建议和反馈

- 通过 [Discussions](https://github.com/Morick66/Moodial/discussions) 分享想法
- 通过 [Issues](https://github.com/Morick66/Moodial/issues) 报告问题
- 通过 PR 贡献改进

## 📄 License

通过提交 PR，你同意你的代码将按 MIT 许可证发布。

---

**感谢你的贡献！🙏**
