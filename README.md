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
- **[快速入门](doc/QUICKSTART.md)** - 5分钟快速启动项目
- **[项目总览](doc/PROJECT_OVERVIEW.md)** - 了解项目整体架构和设计思路

### 技术文档
- **[AGENTS.md](doc/AGENTS.md)** - Agent 架构详解、API 说明、开发指南
- **[RAG_SETUP.md](doc/RAG_SETUP.md)** - RAG 模式配置、免费 API 申请
- **[VECTOR_DB.md](doc/VECTOR_DB.md)** - 向量数据库方案分析、性能评估

### 开发文档
- **[DEVELOPMENT.md](doc/DEVELOPMENT.md)** - 版本历史、技术决策、实现细节

### 项目感悟
- **[INSIGHTS.md](doc/INSIGHTS.md)** - AI 时代的开发反思、角色转变、行业洞察

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

---

## 🏗️ 技术栈

| 类别 | 技术 |
|------|------|
| **前端** | React 18 + TypeScript + Vite |
| **后端** | Node.js + Express |
| **数据库** | SQLite (better-sqlite3) |
| **向量检索** | JavaScript 实现（余弦相似度） |
| **会话管理** | Redis（可选） |
| **LLM** | 智谱 GLM-4-Flash（免费）/ DeepSeek / 通义千问 |
| **Embedding** | 智谱 embedding-2（1024维，免费） |

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
AfterSaleLite/
├── client/                      # 前端项目
│   ├── customer-service.html   # 虚拟客服界面
│   └── src/                    # React 应用
├── server/                      # 后端项目
│   ├── src/
│   │   ├── services/           # 服务层
│   │   └── index.js            # 服务器入口
│   ├── data/                   # 数据库文件
│   └── uploads/                # 上传的文档
├── embedding-service/          # Embedding 服务
├── import_knowledge/            # 知识库导入
└── docs/                       # 文档目录
```

---

## ⚙️ 环境配置

编辑 `server/.env`：

```bash
# 智谱 AI
ZHIPU_API_KEY=你的API_KEY
ZHIPU_MODEL=glm-4-flash
LLM_PROVIDER=zhipu

# Embedding
EMBEDDING_API_KEY=你的API_KEY
EMBEDDING_MODEL=embedding-2

# Agent
ENABLE_AGENT=true
AGENT_MODE=auto
USE_RAG=true
```

详细配置请参考 [RAG_SETUP.md](doc/RAG_SETUP.md)。

---

## 🚀 快速启动

```bash
# 1. 安装依赖
cd server && npm install && cd ..
cd client && npm install && cd ..

# 2. 启动后端（端口 3001）
cd server && npm start

# 3. 启动前端（端口 3000）
cd client && npm run dev
```

完整步骤请参考 [QUICKSTART.md](doc/QUICKSTART.md)。

---

## ⚠️ 注意事项

1. **项目定位**: 这是 Agent 架构学习项目，不是完整电商系统
2. **数据来源**: 所有工具使用 mock 数据，实际部署需适配真实 API
3. **文档大小**: 单个文件不超过 10MB
4. **支持格式**: PDF, DOC, DOCX, MD, TXT
5. **Redis 服务**: 用于存储对话历史，可选配置

---

## 🎯 项目亮点

### 1. 完整的 Agent 架构实现
从感知层到表达层的完整实现，包括意图识别、任务规划、工具管理、向量知识库

### 2. 三种问答模式无缝切换
普通模式、RAG 模式、Agent 模式，根据场景自动选择

### 3. 智能降级策略
Agent 模式失败 → RAG 模式 → 传统模式 → 人工客服，确保服务可用性

### 4. 零成本快速验证
所有组件选择免费方案，学习零成本：GLM-4-Flash（完全免费）、SQLite（零部署）、关键词识别（零成本）

---

## 🌟 项目价值

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

详细的技术洞察和行业分析请参考 [INSIGHTS.md](doc/INSIGHTS.md)。

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

---

## 📝 许可证

MIT License
