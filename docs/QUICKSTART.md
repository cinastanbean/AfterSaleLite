# 快速入门指南

本指南帮助你在 5 分钟内快速启动项目并体验智能客服功能。

## 前置要求

- Node.js 16+ ([下载地址](https://nodejs.org/))
- npm 或 yarn
- 智谱 AI API Key ([免费申请](https://open.bigmodel.cn/))

## 步骤 1：申请 API Key（1 分钟）

### 智谱 AI（推荐，完全免费）

1. 访问 [智谱 AI 开放平台](https://open.bigmodel.cn/)
2. 注册账号并登录
3. 进入 API Key 管理页面
4. 创建新的 API Key
5. 复制 API Key（格式类似：`8ff14496408641f384930e6efc93b133.xxxxxx`）

**智谱 AI 的优势：**
- GLM-4-Flash 模型完全免费
- embedding-2 模型免费使用
- 无需担心 API 调用费用

## 步骤 2：克隆并安装依赖（2 分钟）

```bash
# 安装后端依赖
cd server && npm install && cd ..

# 安装前端依赖
cd client && npm install && cd ..
```

## 步骤 3：配置环境变量（30 秒）

编辑 `server/.env` 文件，替换以下内容：

```bash
# 智谱 AI API 配置
ZHIPU_API_KEY=你的API_KEY
ZHIPU_MODEL=glm-4-flash

# 选择使用的 LLM 提供商
LLM_PROVIDER=zhipu

# Embedding 配置
EMBEDDING_API_KEY=你的API_KEY
EMBEDDING_MODEL=embedding-2
USE_LOCAL_EMBEDDING=false

# RAG 模式开关
USE_RAG=true

# Agent 模式开关
ENABLE_AGENT=true
AGENT_MODE=auto
```

## 步骤 4：启动服务（1 分钟）

### 启动后端

```bash
cd server && npm start
```

看到以下输出表示启动成功：
```
服务器运行在 http://localhost:3001
```

### 启动前端（新终端窗口）

```bash
cd client && npm run dev
```

看到以下输出表示启动成功：
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
```

## 步骤 5：体验功能（1 分钟）

### 方式 1：管理后台

1. 打开浏览器访问：http://localhost:3000
2. 进入"知识库管理"页面，上传示例文档（`电商知识库/kefu.md`）
3. 进入"智能客服"页面，选择 RAG 模式
4. 输入问题："如何申请退款？"

### 方式 2：虚拟客服界面（推荐）

1. 直接打开 `client/customer-service.html`
2. 左侧快捷操作面板点击"订单查询"
3. 或输入："我的订单ORD20240115001怎么样了"
4. 观察 Agent 自动识别意图并调用工具

### 推荐测试场景

#### RAG 模式（基于知识库）
```
如何申请退款？
订单多久能发货？
支持七天无理由退货吗？
优惠券如何使用？
```

#### Agent 模式（工具调用）
```
我的订单ORD20240115001怎么样了
查一下订单ORD20240115001的物流
我想退货，订单号ORD20240114002，原因是不想要了
订单降价了，现在200元，申请价格保护
我的退款什么时候到账
```

## 常见问题

### Q1: 后端启动失败？

**A**: 检查以下几点：
1. Node.js 版本是否 >= 16
2. 是否执行了 `npm install`
3. 端口 3001 是否被占用

### Q2: 前端启动失败？

**A**: 检查以下几点：
1. 是否执行了 `npm install`
2. 端口 3000 是否被占用
3. 确保 `vite.config.ts` 配置正确

### Q3: API 调用失败？

**A**: 检查以下几点：
1. API Key 是否正确配置
2. 网络是否可以访问智谱 AI API
3. 查看后端日志中的错误信息

### Q4: 意图识别不准确？

**A**: 这是正常的，Agent 使用关键词匹配。可以尝试：
1. 使用更明确的关键词（如"查询订单"而不是简单的"订单"）
2. 提供订单号等明确参数
3. 切换到 RAG 模式

### Q5: 想使用其他 LLM？

**A**: 修改 `server/.env` 文件：

```bash
# DeepSeek（免费额度大）
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=your_deepseek_key

# 通义千问（效果好）
LLM_PROVIDER=qwen
QWEN_API_KEY=your_qwen_key
```

更多配置请参考 [RAG_SETUP.md](RAG_SETUP.md)。

## 下一步

### 深入学习
- 阅读 [AGENTS.md](AGENTS.md) 了解 Agent 架构和工具系统
- 阅读 [RAG_SETUP.md](RAG_SETUP.md) 学习 RAG 模式配置
- 阅读 [INSIGHTS.md](INSIGHTS.md) 理解 AI 时代的开发反思

### 开发扩展
- 参考 [DEVELOPMENT.md](DEVELOPMENT.md) 了解技术实现细节
- 尝试添加新的工具（如商品查询、优惠券查询）
- 探索任务规划的高级用法

### 实际部署
- 适配真实业务系统 API
- 替换 mock 数据为真实数据
- 考虑使用专业向量数据库（Pinecone、Milvus）
- 添加用户认证和权限管理

## 性能优化建议

### 小规模学习项目
- SQLite 向量存储（当前方案，零成本）
- 智谱 GLM-4-Flash（免费）
- 关键词匹配意图识别（零成本）

### 中型生产环境
- Milvus 向量数据库（开源）
- 智谱 GLM-4-Plus（付费，性能更好）
- LLM 意图识别（更准确，成本较高）

### 大型生产环境
- Pinecone 向量数据库（托管服务）
- GPT-4 或 Claude（成本高，效果最好）
- 微调意图识别模型（最高准确度）

## 相关资源

### 文档
- [README](README.md) - 项目快速介绍
- [PROJECT_OVERVIEW](PROJECT_OVERVIEW.md) - 项目总览
- [AGENTS.md](AGENTS.md) - Agent 功能详解
- [DEVELOPMENT.md](DEVELOPMENT.md) - 开发日志

### 外部资源
- [智谱 AI 文档](https://open.bigmodel.cn/dev/api)
- [DeepSeek 文档](https://platform.deepseek.com/api-docs/)
- [通义千问文档](https://help.aliyun.com/zh/dashscope/)
- [RAG 技术入门](https://www.anthropic.com/index/retrieval-augmented-generation)

## 许可证

MIT License
