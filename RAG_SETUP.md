# RAG 模式配置说明

**相关文档**：
- [快速入门](QUICKSTART.md) - 快速配置和启动 RAG 模式
- [项目总览](PROJECT_OVERVIEW.md) - 了解 RAG 在整体架构中的位置
- [向量数据库](VECTOR_DB.md) - 深入了解向量存储方案

## 功能特性

本系统现在支持两种问答模式：

### 1. 传统模式（规则引擎 + 关键词匹配）
- 基于关键词搜索知识库
- 使用规则引擎生成回答
- 无需 API 密钥，完全本地运行
- 适合快速原型和小规模场景

### 2. RAG 模式（向量检索 + LLM）⭐
- 使用向量相似度检索相关知识
- 集成大语言模型生成智能回答
- 语义理解能力更强
- 支持多轮对话和上下文理解

## 免费大模型 API

### 选项 1：通义千问（阿里云）

**免费额度：**
- 新用户赠送 **100 万 tokens** 免费额度
- 领取后可使用 3 个月

**申请地址：** https://dashscope.aliyuncs.com/

**模型定价：**
| 模型 | 价格 | 特点 |
|------|------|------|
| qwen-turbo | ¥0.0008/千tokens | 快速、便宜 |
| qwen-plus | ¥0.004/千tokens | 平衡性能 |
| qwen-max | ¥0.02/千tokens | 最强性能 |

**配置：**
```env
LLM_PROVIDER=qwen
QWEN_API_KEY=sk-xxxxxxxxxxxxxxxx
QWEN_MODEL=qwen-turbo
```

### 选项 2：DeepSeek（推荐 ⭐⭐⭐）

**免费额度：**
- API 新用户赠送 **500 万 tokens** 免费额度
- 长期免费（限制 QPS）

**申请地址：** https://platform.deepseek.com/

**特点：**
- 国产大模型，性能优秀
- 完全兼容 OpenAI API 格式
- 性价比极高
- 免费额度最大

**配置：**
```env
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
DEEPSEEK_MODEL=deepseek-chat
```

### 选项 3：其他免费选项

- **智谱 AI (GLM)**：新用户赠送 100 万 tokens
- **月之暗面 (Kimi)**：部分模型免费
- **硅基流动**：提供多种免费 API

## 快速开始

### 传统模式（默认，无需配置）

直接启动系统即可使用：
```bash
cd server
npm run dev
```

前端会自动使用传统模式。

### RAG 模式配置

#### 推荐：使用 DeepSeek（免费额度最大）

1. **获取 API 密钥**

   访问 https://platform.deepseek.com/ 注册账号并创建 API Key。

2. **配置环境变量**

   编辑 `server/.env` 文件：

   ```env
   # LLM 提供商选择
   LLM_PROVIDER=deepseek

   # DeepSeek API 配置
   DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx  # 替换为你的 API Key
   DEEPSEEK_MODEL=deepseek-chat

   # RAG 模式开关
   USE_RAG=true
   ```

3. **启动系统**

   ```bash
   cd server
   npm run dev
   ```

4. **在前端切换到 RAG 模式**

   打开智能客服页面，点击右上角的"问答模式"按钮切换到 RAG 模式。

## API 说明

### 问答 API

**请求：**
```bash
POST /api/chat
Content-Type: application/json

{
  "message": "如何申请退款？",
  "sessionId": "session-xxx",
  "useRag": true  // true: RAG 模式, false: 传统模式
}
```

**响应（RAG 模式）：**
```json
{
  "success": true,
  "response": "根据知识库内容，您可以通过以下步骤申请退款...",
  "sources": [
    {
      "documentName": "售后政策.md",
      "content": "退款流程...",
      "score": 0.95
    }
  ],
  "sessionId": "session-xxx",
  "mode": "rag",
  "model": "qwen-plus"
}
```

**响应（传统模式）：**
```json
{
  "success": true,
  "response": "您可以按以下步骤自助办理退款...",
  "sources": [...],
  "sessionId": "session-xxx",
  "mode": "traditional"
}
```

### 文档上传 API

**请求：**
```bash
POST /api/documents/upload
Content-Type: multipart/form-data

file: document.pdf
```

**响应：**
```json
{
  "success": true,
  "docId": "xxx-xxx-xxx",
  "document": {
    "id": "xxx-xxx-xxx",
    "name": "document.pdf",
    "size": 5883
  }
}
```

## 成本说明

### 通义千问 API 定价（参考）

| 模型 | 价格 | 特点 |
|------|------|------|
| qwen-turbo | ¥0.0008/千tokens | 快速、便宜 |
| qwen-plus | ¥0.004/千tokens | 平衡性能 |
| qwen-max | ¥0.02/千tokens | 最强性能 |

### 预估成本

- 平均每次问答约 500 tokens
- 使用 qwen-plus 模式，每次问答约 ¥0.002
- 1000 次问答约 ¥2

## 技术架构

### RAG 流程

```
用户问题
    ↓
[Embedding Service]
    ↓
问题向量
    ↓
[向量数据库] ←→ [SQLite + sqlite-vec]
    ↓
相关文档片段
    ↓
[LLM Service] ←→ [通义千问 API]
    ↓
智能回答
```

### 核心组件

1. **EmbeddingService**
   - 通义千问 text-embedding-v3 API
   - 批量 embedding 生成
   - 余弦相似度计算

2. **VectorKnowledgeBase**
   - SQLite + sqlite-vec 存储
   - 向量索引和检索
   - 自动文档分块

3. **LLMService**
   - 通义千问 Chat API
   - 上下文感知对话
   - 规则引擎备选方案

4. **RAGChatService**
   - 会话管理
   - 多轮对话支持
   - 来源追溯

## 故障排查

### 问题：embedding API 调用失败

**错误信息：** `Embedding API 调用失败: ...`

**解决方案：**
1. 检查 `.env` 文件中的 `QWEN_API_KEY` 是否正确
2. 确认 API Key 是否有足够余额
3. 检查网络连接

### 问题：LLM API 调用失败

**错误信息：** `调用 LLM API 失败: ...`

**解决方案：**
1. 系统会自动降级到规则引擎模式
2. 检查 API 配置和网络
3. 查看 server 日志获取详细错误

### 问题：向量检索结果不准确

**解决方案：**
1. 增加上传的文档数量
2. 检查文档内容质量
3. 尝试调整 chunk 大小（当前 2000 字符）

## 性能优化

### Embedding 批量处理

系统默认批量处理（10 条/批），可调整：

```javascript
// 在 vectorKnowledgeBase.js 中修改
const batchSize = 10; // 增加或减少
```

### 缓存策略

未来可添加：
- Embedding 结果缓存
- 对话历史持久化
- 向量索引缓存

## 扩展方向

### 短期
- [ ] 添加流式回答支持
- [ ] 支持多文档上传
- [ ] 添加对话历史持久化

### 中期
- [ ] 集成本地 embedding 模型
- [ ] 支持向量数据库（Pinecone/Milvus）
- [ ] 添加多轮对话记忆优化

### 长期
- [ ] 支持 Agent 能力
- [ ] 添加知识图谱
- [ ] 多模型支持（GPT/Claude 等）
