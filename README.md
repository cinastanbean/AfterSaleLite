# AfterSaleLite

一个基于 Agent 架构的智能客服学习项目，通过电商客服场景验证意图识别、工具调用、任务规划和 RAG 检索的完整流程。

**AfterSaleLite** - AI-Powered Customer Service System with Agent Architecture

> **这个项目的目的从来不是实现一个完整的电商系统，而是通过电商客服这个具体场景，验证和展示 Agent 架构的可行性。**

电商客服只是演示场景，所有工具使用 mock 数据，实际部署时需要适配真实业务系统 API。真正的价值在于 Agent 架构设计的完整性：

- **感知层**：IntentRecognizer - 理解用户意图
- **决策层**：TaskPlanner - 规划执行步骤
- **执行层**：ToolManager - 调用具体工具
- **记忆层**：VectorKnowledgeBase + Redis - 长短期记忆
- **表达层**：LLM 生成自然语言回复

## 📚 文档导航

### 入门指南
- **[快速入门](QUICKSTART.md)** - 5分钟快速启动项目
- **[项目总览](PROJECT_OVERVIEW.md)** - 了解项目整体架构和设计思路

### 技术文档
- **[AGENTS.md](AGENTS.md)** - Agent 架构详解、API 说明、开发指南
- **[RAG_SETUP.md](RAG_SETUP.md)** - RAG 模式配置、免费 API 申请
- **[VECTOR_DB.md](VECTOR_DB.md)** - 向量数据库方案分析、性能评估

### 开发文档
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - 版本历史、技术决策、实现细节

### 项目感悟
- **[INSIGHTS.md](INSIGHTS.md)** - AI 时代的开发反思、角色转变、行业洞察

---

## ✨ 核心特性

### 三种问答模式
- **普通模式**: 基于关键词的智能搜索和匹配
- **RAG 模式**: 基于向量检索 + 大语言模型的高级问答
- **Agent 模式**: 智能工具调用 + 任务规划，支持订单查询、物流跟踪、退货处理等

### Agent 核心能力
- **意图识别**: 自动识别用户查询意图（订单、物流、退货、价格保护、退款）
- **工具调用**: 订单查询、物流查询、退货处理、支付操作
- **任务规划**: 多步骤任务分解和执行（订单投诉、退货流程、价格保护）
- **智能路由**: 自动选择工具或 RAG 模式
- **人工转接**: 复杂问题自动转接人工客服

### 其他功能
- 文档导入：支持 PDF、DOCX、MD、TXT 格式
- 多轮对话：支持上下文理解的连续对话
- 来源追溯：每个回答都标注知识来源文档
- 虚拟客服界面：仿真客户对话界面，方便测试和演示

---

## 🏗️ 技术栈

### 前端
- React 18 + TypeScript + Vite
- React Router 路由管理
- Axios HTTP 客户端

### 后端
- Node.js + Express
- 文档解析：pdf-parse, mammoth
- 数据库：SQLite (better-sqlite3)
- 向量检索：JavaScript 实现（余弦相似度）
- 会话管理：Redis（可选）

### AI 服务
- **LLM**：智谱 GLM-4-Flash（免费）/ DeepSeek / 通义千问
- **Embedding**：智谱 embedding-2（1024维，免费）

---

## 🚀 快速开始

### 1. 申请 API Key

智谱 AI（推荐，完全免费）：
- 访问 [智谱 AI 开放平台](https://open.bigmodel.cn/)
- 注册并创建 API Key

### 2. 安装依赖

```bash
# 后端
cd server && npm install && cd ..

# 前端
cd client && npm install && cd ..
```

### 3. 配置环境

编辑 `server/.env`：

```bash
# 智谱 AI
ZHIPU_API_KEY=你的API_KEY
ZHIPU_MODEL=glm-4-flash
LLM_PROVIDER=zhipu

# Embedding
EMBEDDING_API_KEY=你的API_KEY
EMBEDDING_MODEL=embedding-2
USE_LOCAL_EMBEDDING=false

# Agent
ENABLE_AGENT=true
AGENT_MODE=auto
USE_RAG=true
```

### 4. 启动服务

```bash
# 后端（端口 3001）
cd server && npm start

# 前端（端口 3000）
cd client && npm run dev
```

### 5. 访问应用

- 管理后台：http://localhost:3000
- 虚拟客服：直接打开 `client/customer-service.html`

详细步骤请参考 [QUICKSTART.md](QUICKSTART.md)。

---

## 💡 使用示例

### RAG 模式（基于知识库）

```
如何申请退款？
订单多久能发货？
支持七天无理由退货吗？
优惠券如何使用？
```

### Agent 模式（工具调用）

```
我的订单ORD20240115001怎么样了
查一下订单ORD20240115001的物流
我想退货，订单号ORD20240114002，原因是不想要了
订单降价了，现在200元，申请价格保护
我的退款什么时候到账
转人工客服
```

---

## 📦 项目结构

```
teng-chonglai/
├── client/                      # 前端项目
│   ├── customer-service.html   # 虚拟客服界面
│   └── src/                    # React 应用
├── server/                      # 后端项目
│   ├── src/
│   │   ├── services/           # 服务层
│   │   │   ├── agentChatService.js     # Agent 主服务
│   │   │   ├── intentRecognizer.js     # 意图识别器
│   │   │   ├── taskPlanner.js          # 任务规划器
│   │   │   ├── tools/                  # 工具集
│   │   │   ├── vectorKnowledgeBase.js  # 向量知识库
│   │   │   ├── llmService.js           # LLM 服务
│   │   │   └── embeddingService.js     # Embedding 服务
│   │   └── index.js            # 服务器入口
│   ├── data/                   # 数据库文件
│   └── uploads/                # 上传的文档
├── embedding-service/          # Embedding 服务
├── import_knowledge/            # 知识库导入
├── 电商知识库/                   # 示例文档
├── README.md                   # 项目快速介绍
├── QUICKSTART.md               # 快速入门
├── PROJECT_OVERVIEW.md         # 项目总览
├── AGENTS.md                   # Agent 文档
├── RAG_SETUP.md                # RAG 配置
├── VECTOR_DB.md                # 向量数据库
├── DEVELOPMENT.md              # 开发日志
├── INSIGHTS.md                 # 项目感悟
├── TEST_REPORT.md              # 测试报告
├── CONTRIBUTING.md             # 贡献指南
├── LICENSE                     # MIT 许可证
├── GITHUB_CHECKLIST.md         # GitHub 上传检查清单
├── GITHUB_READY.md             # GitHub 上传准备说明
├── PROJECT_NAME_UPDATE.md      # 项目名称更新报告
├── ORGANIZATION_REPORT.md      # 项目整理完成报告
└── UPLOAD_COMMANDS.md          # 上传命令说明
```

---

## 🔧 配置说明

### LLM 选择

支持以下 LLM 提供商：

| 提供商 | 模型 | 成本 | 特点 |
|--------|------|------|------|
| 智谱 AI | GLM-4-Flash | 完全免费 | 推荐，速度快 |
| DeepSeek | deepseek-chat | 免费额度大 | 适合测试 |
| 通义千问 | qwen-plus | 有免费额度 | 效果好 |

在 `server/.env` 中配置：

```bash
LLM_PROVIDER=zhipu  # zhipu / deepseek / qwen
```

详细配置请参考 [RAG_SETUP.md](RAG_SETUP.md)。

### Agent 模式

Agent 支持三种模式：

- `auto`: Agent 内部根据意图自动选择工具或 RAG（推荐）
- `agent`: 强制使用 Agent 模式
- `rag`: 强制使用 RAG 模式

```bash
ENABLE_AGENT=true
AGENT_MODE=auto
```

详细文档请参考 [AGENTS.md](AGENTS.md)。

---

## 📖 API 接口

### 文档管理
- `POST /api/documents/upload` - 上传文档
- `GET /api/documents` - 获取文档列表
- `DELETE /api/documents/:id` - 删除文档

### 智能问答
- `POST /api/chat` - 提交问题
  - 参数: `{ message, sessionId?, userId?, useRag?, useAgent? }`
- `GET /api/chat/history/:sessionId` - 获取对话历史

### 系统健康
- `GET /api/health` - 健康检查

---

## ⚠️ 注意事项

1. **项目定位**: 这是 Agent 架构学习项目，不是完整电商系统
2. **数据来源**: 所有工具使用 mock 数据，实际部署需适配真实 API
3. **文档大小**: 单个文件不超过 10MB
4. **支持格式**: PDF, DOC, DOCX, MD, TXT
5. **Redis 服务**: 用于存储对话历史，可选配置

---

## 📊 Agent 功能

### 支持的工具

| 工具名称 | 功能 | 参数 |
|---------|------|------|
| query_order | 订单查询 | orderId, userId |
| query_logistics | 物流查询 | orderId, userId |
| process_return | 退货处理 | orderId, userId, action, reason |
| payment_operation | 支付操作 | orderId, userId, action, currentPrice |

### 支持的任务

- 订单投诉处理 → 查询订单 → 查询物流 → 转人工
- 退货流程 → 查询订单 → 创建退货
- 价格保护申请 → 查询订单 → 申请价格保护
- 物流异常处理 → 查询物流 → 检测异常 → 转人工

详细文档请参考 [AGENTS.md](AGENTS.md)。

---

## 🎯 项目价值

### 学习价值
- ✅ 理解 Agent 架构的设计思路
- ✅ 学习意图识别、工具调用、任务规划的实现
- ✅ 掌握 RAG 模式的完整流程
- ✅ 探索 AI 辅助开发的新模式

### AI 时代开发的启示

这个项目验证了 AI 时代软件开发模式的根本性变革：

**从"全栈"到"全流程架构师"**
- 传统全栈：前端 + 后端 + 数据库 + 运维（技术栈垂直）
- 全流程架构师：业务洞察 × 技术决策 × 架构设计 × AI协作 × 价值交付（价值链横向）

**AI 的杠杆作用**
- 意图识别：从需要 1000 条标注数据训练 NLP 模型，到 50 条规则 + LLM 语义理解
- 代码生成：从 100% 手写到 20% 核心逻辑 + 80% AI 辅助
- 开发效率：传统 5人团队 2-3周 → AI 辅助 1人 2天，效率提升 25 倍

**"够用就好"的工程智慧**
- 意图识别：选择关键词匹配而非 LLM（零成本、零延迟、完全可控）
- 向量数据库：选择 SQLite 而非 Pinecone（零成本、零运维、快速验证）
- LLM 选择：GLM-4-Flash 而非 GPT-4（学习项目零成本即可）

详细的技术洞察和行业分析请参考 [INSIGHTS.md](INSIGHTS.md)。

### 适用场景
- 学习 Agent 架构和 RAG 技术
- 验证 AI 在客服场景的可行性
- 作为真实系统的原型参考

### 局限性
- ⚠️ 所有工具使用 mock 数据
- ⚠️ 实际部署需要适配真实业务系统 API
- ⚠️ 生产环境建议使用专业向量数据库（Pinecone、Milvus）

---

## 🌟 项目亮点

### 1. 完整的 Agent 架构实现
从感知层到表达层的完整实现，包括：
- 意图识别器（IntentRecognizer）
- 任务规划器（TaskPlanner）
- 工具管理器（ToolManager）
- 向量知识库（VectorKnowledgeBase）

### 2. 三种问答模式无缝切换
- 普通模式：基于关键词的智能搜索
- RAG 模式：向量检索 + LLM 生成
- Agent 模式：工具调用 + 任务规划

### 3. 智能降级策略
Agent 模式失败 → RAG 模式 → 传统模式 → 人工客服，确保服务可用性

### 4. 零成本快速验证
所有组件选择免费方案，学习零成本：
- 智谱 GLM-4-Flash（完全免费）
- SQLite 向量存储（零部署）
- 关键词意图识别（零成本）

---

## 🚀 扩展功能

### 已完成 ✅
- [x] 集成向量检索
- [x] 接入大语言模型
- [x] 实现 RAG 问答模式
- [x] 实现 Agent 模式（工具调用 + 任务规划）
- [x] 添加对话历史持久化
- [x] 创建虚拟客服界面

### 待开发 🚧
- [ ] 添加用户认证和权限管理
- [ ] 支持批量文档上传
- [ ] 集成专业向量数据库 (Pinecone/Milvus)
- [ ] 添加情感分析功能
- [ ] 支持语音问答
- [ ] 数据分析和报表功能

---

## 📧 联系方式

- **邮箱**：wangbin6198@gmail.com
- **GitHub**：[https://github.com/cinastanbean](https://github.com/cinastanbean)

如有问题或建议，欢迎提交 Issue 或 Pull Request。

## 📝 许可证

MIT License
