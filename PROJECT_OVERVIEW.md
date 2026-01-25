# 项目总览

## 项目定位

这是一个基于 Agent 架构的智能客服系统学习项目，目的不是实现一个完整的电商系统，而是通过电商客服这个具体场景，验证和展示 Agent 架构的可行性。

## 核心价值

### 1. Agent 架构验证
完整实现了一个智能 Agent 应该具备的层级结构：
- **感知层**: IntentRecognizer - 理解用户意图
- **决策层**: TaskPlanner - 规划执行步骤
- **执行层**: ToolManager - 调用具体工具
- **记忆层**: VectorKnowledgeBase + Redis - 长短期记忆
- **表达层**: LLM 生成自然语言回复

### 2. 多模式问答系统
- **普通模式**: 基于关键词匹配的传统问答
- **RAG 模式**: 基于向量检索 + LLM 的高级问答
- **Agent 模式**: 智能工具调用 + 任务规划

### 3. 工程实践探索
探索 AI 时代的软件开发新模式：从"手写代码"到"描述需求"，验证 AI 作为"超级杠杆"的可行性。

## 技术架构

### 整体架构

```
用户交互层
├── 管理后台 (React + Vite)
└── 虚拟客服界面 (单文件 HTML)
    ↓
后端服务层 (Node.js + Express)
├── ChatService (普通问答)
├── RAGChatService (向量检索问答)
└── AgentChatService (Agent 问答)
    ↓
核心能力层
├── IntentRecognizer (意图识别)
├── TaskPlanner (任务规划)
├── ToolManager (工具管理)
├── VectorKnowledgeBase (向量知识库)
├── LLMService (大语言模型服务)
└── EmbeddingService (向量嵌入服务)
    ↓
数据存储层
├── SQLite (知识库)
└── Redis (会话管理)
```

### Agent 工作流程

```
用户消息
    ↓
意图识别器 (IntentRecognizer)
    ↓
    ├── 工具调用 → ToolManager → 具体工具 → LLM生成回复
    ├── 任务规划 → TaskPlanner → 多步骤执行 → LLM生成回复
    ├── RAG检索 → VectorKnowledgeBase → LLM生成回复
    └── 人工转接 → 标记转接状态
```

## 功能特性

### 核心功能
- ✅ 文档导入：支持 PDF、DOCX、MD、TXT 格式
- ✅ 三种问答模式：普通/RAG/Agent
- ✅ 智能意图识别：订单、物流、退货、价格保护、退款
- ✅ 工具调用系统：订单查询、物流跟踪、退货处理、支付操作
- ✅ 任务规划：多步骤任务分解和执行
- ✅ 智能路由：自动选择工具或 RAG 模式
- ✅ 多轮对话：上下文记忆和状态管理
- ✅ 人工转接：复杂问题自动转接人工客服

### Agent 支持的工具

| 工具名称 | 功能 | 参数 |
|---------|------|------|
| query_order | 订单查询 | orderId, userId |
| query_logistics | 物流查询 | orderId, userId |
| process_return | 退货处理 | orderId, userId, action, reason |
| payment_operation | 支付操作 | orderId, userId, action, currentPrice |

### 支持的任务类型
- 订单投诉处理 → 查询订单 → 查询物流 → 转人工
- 退货流程 → 查询订单 → 创建退货
- 价格保护申请 → 查询订单 → 申请价格保护
- 物流异常处理 → 查询物流 → 检测异常 → 转人工

## 技术栈

### 前端
- React 18 + TypeScript
- Vite 构建工具
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

## 项目结构

```
teng-chonglai/
├── client/                      # 前端项目
│   ├── src/
│   │   ├── pages/              # 页面组件
│   │   ├── App.tsx             # 主应用
│   │   └── main.tsx            # 入口文件
│   ├── customer-service.html   # 虚拟客服界面
│   └── package.json
├── server/                      # 后端项目
│   ├── src/
│   │   ├── index.js            # 服务器入口
│   │   └── services/           # 服务层
│   │       ├── agentChatService.js
│   │       ├── intentRecognizer.js
│   │       ├── taskPlanner.js
│   │       ├── tools/          # 工具集
│   │       ├── vectorKnowledgeBase.js
│   │       ├── llmService.js
│   │       └── embeddingService.js
│   ├── data/                   # 数据库文件
│   ├── uploads/                # 上传的文档
│   ├── .env                    # 环境变量
│   └── package.json
├── embedding-service/          # Embedding 服务（Python）
├── import_knowledge/            # 知识库导入
├── 电商知识库/                   # 示例文档
├── README.md                   # 项目快速介绍
├── QUICKSTART.md               # 快速入门指南
├── PROJECT_OVERVIEW.md         # 项目总览（本文档）
├── AGENTS.md                   # Agent 功能详解
├── DEVELOPMENT.md              # 开发日志
├── INSIGHTS.md                 # 项目感悟与反思
├── RAG_SETUP.md                # RAG 配置说明
├── VECTOR_DB.md                # 向量数据库分析
└── TEST_REPORT.md              # 测试报告
```

## 快速开始

### 1. 安装依赖

```bash
# 安装后端依赖
cd server && npm install && cd ..

# 安装前端依赖
cd client && npm install && cd ..
```

### 2. 配置环境

编辑 `server/.env` 文件，配置 API 密钥：

```bash
# 智谱 AI（推荐，GLM-4-Flash 完全免费）
ZHIPU_API_KEY=your_api_key_here
ZHIPU_MODEL=glm-4-flash
LLM_PROVIDER=zhipu

# Embedding 配置
EMBEDDING_API_KEY=your_api_key_here
EMBEDDING_MODEL=embedding-2
USE_LOCAL_EMBEDDING=false

# 启用 Agent
ENABLE_AGENT=true
AGENT_MODE=auto
```

### 3. 启动服务

```bash
# 启动后端（端口 3001）
cd server && npm start

# 启动前端（端口 3000）
cd client && npm run dev
```

### 4. 访问应用

- 管理后台：http://localhost:3000
- 虚拟客服：直接打开 `client/customer-service.html`

## 文档导航

### 入门指南
- [README](README.md) - 项目快速介绍和基本使用
- [QUICKSTART.md](QUICKSTART.md) - 5分钟快速启动指南

### 技术文档
- [AGENTS.md](AGENTS.md) - Agent 架构详解、API 说明、开发指南
- [RAG_SETUP.md](RAG_SETUP.md) - RAG 模式配置、免费 API 申请
- [VECTOR_DB.md](VECTOR_DB.md) - 向量数据库方案分析、性能评估

### 开发文档
- [DEVELOPMENT.md](DEVELOPMENT.md) - 版本历史、技术决策、实现细节

### 项目感悟
- [INSIGHTS.md](INSIGHTS.md) - AI 时代的开发反思、角色转变、行业洞察

## 适用场景

### 学习价值
- ✅ 理解 Agent 架构的设计思路
- ✅ 学习意图识别、工具调用、任务规划的实现
- ✅ 掌握 RAG 模式的完整流程
- ✅ 探索 AI 辅助开发的新模式

### 实际应用
- ⚠️ 这是学习项目，所有工具使用 mock 数据
- ⚠️ 实际部署需要适配真实业务系统 API
- ⚠️ 生产环境建议使用专业向量数据库（Pinecone、Milvus）

## 技术亮点

### 1. 三层降级策略
```
Agent 模式（工具调用）
    ↓ 失败/不支持
RAG 模式（向量检索）
    ↓ 失败/无匹配
传统模式（关键词匹配）
    ↓ 失败
人工客服
```

### 2. 灵活的模式选择
- `auto`: Agent 内部根据意图自动选择工具或 RAG
- `agent`: 强制使用 Agent 模式
- `rag`: 强制使用 RAG 模式

### 3. 成本控制
- LLM: GLM-4-Flash（完全免费）
- Embedding: 智谱 embedding-2（免费）
- 向量数据库: SQLite（零成本）
- 总成本：学习项目零成本

## 版本信息

- **当前版本**: v1.2.0
- **最后更新**: 2024-01-23
- **主要特性**: Agent 智能客服系统

## 许可证

MIT License

## 联系方式

如有问题或建议，欢迎提交 Issue 或 Pull Request。
