# Agent 功能文档

本文档详细说明电商客服系统的 Agent 功能，包括架构设计、使用方法和开发指南。

**相关文档**：
- [项目总览](PROJECT_OVERVIEW.md) - 了解 Agent 在整体架构中的位置
- [快速入门](QUICKSTART.md) - 快速体验 Agent 功能
- [RAG 配置](RAG_SETUP.md) - 了解 RAG 模式的配置
- [项目感悟](INSIGHTS.md) - Agent 架构的设计思考

## 目录

- [功能概述](#功能概述)
- [架构设计](#架构设计)
- [核心组件](#核心组件)
- [工具系统](#工具系统)
- [意图识别](#意图识别)
- [任务规划](#任务规划)
- [使用指南](#使用指南)
- [API 说明](#api-说明)
- [开发指南](#开发指南)

---

## 功能概述

Agent 是一个智能客服助手，具备以下核心能力：

### 核心特性

- **意图识别**: 自动理解用户查询意图（订单、物流、退货、价格保护等）
- **工具调用**: 调用预定义工具执行具体操作
- **任务规划**: 将复杂任务分解为多个步骤并执行
- **智能路由**: 自动选择工具或 RAG 模式回答问题
- **多轮对话**: 上下文记忆和状态管理
- **人工转接**: 复杂问题自动转接人工客服

### 适用场景

| 场景 | 示例问题 | 处理方式 |
|------|----------|----------|
| 订单查询 | "我的订单ORD20240115001怎么样了" | 调用订单查询工具 |
| 物流跟踪 | "查一下订单ORD20240115001的物流" | 调用物流查询工具 |
| 退货申请 | "我想退货，订单号ORD20240114002" | 调用退货处理工具 |
| 价格保护 | "订单降价了，现在200元" | 调用价格保护工具 |
| 退款查询 | "我的退款什么时候到账" | 调用退款查询工具 |
| 知识问答 | "如何申请退款？" | 使用 RAG 模式 |
| 人工客服 | "我需要转人工" | 标记转接 |

---

## 架构设计

### 整体架构

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

### 数据流

```
1. 用户发送消息
   ↓
2. AgentChatService 接收消息
   ↓
3. IntentRecognizer 识别意图
   ↓
4. 判断处理方式：
   - 工具调用 → 调用相应工具 → LLM生成回复
   - 任务规划 → 执行多步骤任务 → LLM生成回复
   - RAG检索 → 向量搜索 → LLM生成回复
   ↓
5. 返回结果给用户
   ↓
6. 保存对话历史到 Redis
```

---

## 核心组件

### 1. AgentChatService

**文件**: `server/src/services/agentChatService.js`

**职责**: Agent 的核心服务，协调所有组件协同工作

**主要方法**:

```javascript
// 处理用户消息
async chat(message, sessionId, userId)

// 获取对话历史
async getChatHistory(sessionId, userId)

// 清空对话历史
async clearHistory(sessionId, userId)
```

**初始化流程**:

```javascript
const agentService = new AgentChatService(vectorKnowledgeBase);
// 自动注册所有工具
// 初始化意图识别器
// 初始化任务规划器
```

### 2. IntentRecognizer

**文件**: `server/src/services/intentRecognizer.js`

**职责**: 识别用户意图并提取参数

**支持意图**:

| 意图名称 | 关键词 | 工具 |
|---------|---------|------|
| query_order | 订单、查询订单、我的订单 | query_order |
| query_logistics | 物流、快递、配送、到哪了 | query_logistics |
| return | 退货、退换货、想退货 | process_return |
| price_protect | 降价、便宜、价格保护、差价 | payment_operation |
| query_refund | 退款、退钱了、退款进度 | payment_operation |

**方法**:

```javascript
// 识别意图并提取参数
recognize(message, userId)

// 提取订单参数
extractOrderParams(message, userId)

// 提取物流参数
extractLogisticsParams(message, userId)

// 提取退货参数
extractReturnParams(message, userId)

// 提取价格保护参数
extractPriceProtectParams(message, userId)

// 提取退款参数
extractRefundParams(message, userId)

// 检查是否需要转人工
shouldEscalateToHuman(message)
```

### 3. TaskPlanner

**文件**: `server/src/services/taskPlanner.js`

**职责**: 将复杂任务分解为多个步骤并执行

**支持任务**:

- `order_complaint`: 订单投诉处理
- `return_process`: 退货流程
- `price_protection`: 价格保护申请
- `logistics_issue`: 物流异常处理

**方法**:

```javascript
// 识别任务类型
identifyTaskType(params, userMessage)

// 执行任务计划
async executeTask(taskType, params)

// 生成任务执行报告
generateReport(executionResult)
```

**任务模板示例**:

```javascript
{
  'order_complaint': {
    description: '处理订单投诉',
    steps: [
      {
        tool: 'query_order',
        description: '查询订单信息',
        extractParams: (params) => ({ orderId, userId })
      },
      {
        tool: 'query_logistics',
        description: '查询物流信息',
        condition: (prevResult) => prevResult.order && ['已发货', '运输中'].includes(prevResult.order.status)
      },
      {
        action: 'escalate',
        description: '转接人工客服处理投诉',
        message: '已收集订单和物流信息，正在为您转接人工客服...'
      }
    ]
  }
}
```

### 4. ToolManager

**文件**: `server/src/services/tools/toolManager.js`

**职责**: 注册、管理和执行所有工具

**方法**:

```javascript
// 注册工具
registerTool(tool)

// 获取所有工具列表
getTools()

// 获取工具描述（用于LLM）
getToolsDescription()

// 执行工具
async executeTool(toolName, params)
```

**工具结构**:

```javascript
{
  name: 'query_order',
  description: '查询用户的订单信息',
  parameters: {
    orderId: '订单号（字符串）',
    userId: '用户ID（字符串），必需参数'
  },
  execute: async (params) => {
    // 工具执行逻辑
    return result;
  }
}
```

---

## 工具系统

### 1. OrderTool - 订单查询

**文件**: `server/src/services/tools/orderTool.js`

**功能**: 查询用户订单信息

**参数**:
- `orderId`: 订单号（可选）
- `userId`: 用户ID（必需）

**返回示例**:

```json
{
  "success": true,
  "order": {
    "orderId": "ORD20240115001",
    "userId": "user001",
    "status": "已发货",
    "statusDesc": "商品已出库，等待收货",
    "totalAmount": 299.00,
    "paymentMethod": "微信支付",
    "orderTime": "2024-01-15 10:30:00",
    "products": [...],
    "address": {...},
    "logistics": {...}
  }
}
```

### 2. LogisticsTool - 物流查询

**文件**: `server/src/services/tools/logisticsTool.js`

**功能**: 查询订单物流信息并检测异常

**参数**:
- `orderId`: 订单号（必需）
- `userId`: 用户ID（必需）

**异常检测**:
- 超时未更新（超过48小时）
- 超时未送达（超过预计送达时间）
- 长时间停滞（同一节点停留超过5天）

**返回示例**:

```json
{
  "success": true,
  "logistics": {
    "orderId": "ORD20240115001",
    "company": "顺丰速运",
    "trackingNumber": "SF1234567890",
    "currentStatus": "运输中",
    "routes": [...]
  },
  "anomalies": [
    {
      "type": "超时未更新",
      "severity": "高",
      "description": "物流信息已超过48小时未更新"
    }
  ],
  "status": "异常"
}
```

### 3. ReturnTool - 退货处理

**文件**: `server/src/services/tools/returnTool.js`

**功能**: 处理退货申请、查询退货进度、取消退货

**参数**:
- `orderId`: 订单号（创建退货时必需）
- `userId`: 用户ID（必需）
- `action`: 操作类型（create/query/cancel）
- `reason`: 退货原因（创建时必需）
- `refundMethod`: 退款方式（可选）

**退货规则**:
- 下单后7天内可申请退货
- 订单状态不能是"待付款"或"已取消"
- 需要提供退货原因

**返回示例**:

```json
{
  "success": true,
  "message": "退货申请已提交，等待商家审核",
  "returnOrder": {
    "returnId": "RTN202401160001",
    "orderId": "ORD20240115001",
    "reason": "不想要了",
    "status": "待审核",
    "refundAmount": 299.00
  }
}
```

### 4. PaymentTool - 支付操作

**文件**: `server/src/services/tools/paymentTool.js`

**功能**: 处理价格保护申请、退款查询

**参数**:
- `orderId`: 订单号（必需）
- `userId`: 用户ID（必需）
- `action`: 操作类型（price_protect/query_refund/refund_status）
- `currentPrice`: 当前价格（价格保护时必需）

**价格保护规则**:
- 订单已完成
- 在30天内
- 当前价格低于订单价格

**返回示例**:

```json
{
  "success": true,
  "message": "价格保护申请已通过，将退还差价 99.00 元",
  "protectOrder": {
    "protectId": "PP1234567890",
    "originalPrice": 299.00,
    "currentPrice": 200.00,
    "refundAmount": 99.00,
    "status": "审核通过"
  }
}
```

---

## 意图识别

### 识别流程

```javascript
1. 接收用户消息
   ↓
2. 转换为小写
   ↓
3. 遍历意图模式
   ↓
4. 匹配关键词
   ↓
5. 提取参数
   ↓
6. 返回意图和参数
```

### 参数提取规则

**订单号提取**:
- 匹配 `ORD` 开头的字母数字组合
- 匹配10位以上纯数字

**退货原因提取**:
- 质量问题: "质量问题"、"有毛病"、"坏了"
- 不想要: "不想要了"、"不喜欢"、"不合适"
- 尺寸问题: "尺寸不对"、"大小不合适"
- 发错货: "发错货"、"发错了"

**价格提取**:
- 匹配 "XX元"、"XX块"、"现在XX元" 格式
- 提取数字部分作为价格

### 意图优先级

1. **人工转接**: 最高优先级（包含"人工"、"转人工"、"投诉"等关键词）
2. **工具意图**: 订单/物流/退货/价格保护/退款
3. **知识问答**: 其他情况降级到 RAG 模式

---

## 任务规划

### 规划流程

```javascript
1. 识别任务类型
   ↓
2. 获取任务模板
   ↓
3. 按步骤执行
   ↓
4. 每步检查条件
   ↓
5. 条件满足则继续，否则跳过
   ↓
6. 生成执行报告
```

### 条件执行

```javascript
{
  tool: 'query_logistics',
  description: '查询物流信息',
  condition: (prevResult) => {
    return prevResult.order && ['已发货', '运输中'].includes(prevResult.order.status);
  }
}
```

### 人工转接

```javascript
{
  action: 'escalate',
  description: '转接人工客服',
  message: (prevResult) => {
    if (prevResult.anomalies && prevResult.anomalies.length > 0) {
      return `检测到物流异常，正在为您转接人工客服...`;
    }
    return '正在为您转接人工客服...';
  }
}
```

---

## 使用指南

### 启用 Agent

1. 编辑 `server/.env` 文件：

```bash
# 启用 Agent
ENABLE_AGENT=true

# Agent 模式选择
AGENT_MODE=auto  # auto/agent/rag
```

2. 重启服务器：

```bash
cd server && npm start
```

### 模式说明

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| `auto` | 自动选择 | 根据意图自动选择工具或 RAG（推荐） |
| `agent` | 强制 Agent | 强制使用工具调用，不使用 RAG |
| `rag` | 强制 RAG | 强制使用向量检索，不调用工具 |

### 测试 Agent

#### 使用虚拟客服界面

打开 `client/customer-service.html`，测试以下场景：

1. **订单查询**
   ```
   我的订单ORD20240115001怎么样了
   ```

2. **物流查询**
   ```
   查一下订单ORD20240115001的物流
   ```

3. **退货申请**
   ```
   我想退货，订单号ORD20240114002，原因是不想要了
   ```

4. **价格保护**
   ```
   订单ORD20240114002降价了，现在500元，申请价格保护
   ```

5. **退款查询**
   ```
   我的退款什么时候到账
   ```

6. **知识问答**
   ```
   如何申请退款？
   ```

7. **人工客服**
   ```
   我需要转人工客服
   ```

#### 使用 API

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "我的订单ORD20240115001怎么样了",
    "userId": "test001"
  }'
```

---

## API 说明

### POST /api/chat

**描述**: 提交问答请求

**请求参数**:

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| message | string | 是 | 用户消息 |
| sessionId | string | 否 | 会话ID（首次可省略） |
| userId | string | 否 | 用户ID（默认为 'default'） |
| useRag | boolean | 否 | 是否使用 RAG 模式 |
| useAgent | boolean | 否 | 是否使用 Agent 模式 |

**响应示例**:

```json
{
  "success": true,
  "response": "尊敬的用户，您的订单ORD20240115001已经发货...",
  "mode": "agent",
  "sessionId": "xxx-xxx-xxx",
  "model": "glm-4-flash",
  "toolResult": {
    "success": true,
    "order": {...}
  },
  "taskResult": null,
  "sources": []
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| success | boolean | 是否成功 |
| response | string | AI回复内容 |
| mode | string | 处理模式（agent/rag/traditional） |
| sessionId | string | 会话ID |
| model | string | 使用的LLM模型 |
| toolResult | object | 工具执行结果（仅Agent模式） |
| taskResult | object | 任务执行结果（仅任务规划） |
| sources | array | 知识来源（仅RAG模式） |

---

## 开发指南

### 添加新工具

1. 创建工具文件：

```javascript
// server/src/services/tools/newTool.js
class NewTool {
  constructor() {
    this.name = 'new_tool';
    this.description = '工具描述';
    this.parameters = {
      param1: '参数1说明',
      param2: '参数2说明'
    };
  }

  async execute(params) {
    // 实现工具逻辑
    return {
      success: true,
      data: {...}
    };
  }
}

module.exports = { NewTool };
```

2. 在 AgentChatService 中注册：

```javascript
const { NewTool } = require('./tools/newTool');
this.toolManager.registerTool(new NewTool());
```

3. 在 IntentRecognizer 中添加意图：

```javascript
new_tool: {
  keywords: ['关键词1', '关键词2'],
  tool: 'new_tool',
  extractParams: this.extractNewToolParams.bind(this)
}
```

### 添加任务模板

在 TaskPlanner 中添加任务模板：

```javascript
'new_task': {
  description: '新任务描述',
  steps: [
    {
      tool: 'tool1',
      description: '步骤1描述',
      extractParams: (params) => ({...})
    },
    {
      tool: 'tool2',
      description: '步骤2描述',
      condition: (prevResult) => {...}
    }
  ]
}
```

### 自定义意图识别

在 IntentRecognizer 中添加自定义意图：

```javascript
custom_intent: {
  keywords: ['关键词1', '关键词2'],
  tool: 'custom_tool',
  extractParams: this.extractCustomParams.bind(this)
}

extractCustomParams(message, userId) {
  const params = { userId };
  // 提取参数逻辑
  return params;
}
```

### 模拟数据替换

工具目前使用模拟数据，生产环境需要替换为真实API调用：

```javascript
// 修改前（模拟数据）
async execute(params) {
  return this.getMockOrders(userId);
}

// 修改后（真实API）
async execute(params) {
  const response = await axios.get('https://api.yourservice.com/orders', {
    params: { userId, orderId }
  });
  return response.data;
}
```

---

## 最佳实践

### 1. 参数提取

- 使用正则表达式提取结构化数据
- 提供默认值避免参数缺失
- 友好的错误提示

### 2. 工具设计

- 单一职责：每个工具只做一件事
- 明确的参数和返回值
- 完整的错误处理

### 3. 任务规划

- 合理的步骤顺序
- 必要的条件判断
- 清晰的执行报告

### 4. 对话管理

- 保存对话历史
- 提供上下文连续性
- 合理的会话过期时间

### 5. 错误处理

- 友好的错误消息
- 提供解决建议
- 记录错误日志

---

## 常见问题

### Q1: Agent 不响应怎么办？

**A**: 检查以下几点：
1. `ENABLE_AGENT=true` 是否设置
2. 服务器是否重启
3. Redis 是否正常运行
4. 查看服务器日志

### Q2: 如何禁用 Agent？

**A**: 在 `.env` 中设置：
```bash
ENABLE_AGENT=false
```

### Q3: 如何强制使用 RAG 模式？

**A**: 两种方式：
1. 环境变量：`AGENT_MODE=rag`
2. API参数：`useAgent=false`

### Q4: 意图识别不准确怎么办？

**A**:
1. 在 `IntentRecognizer` 中添加更多关键词
2. 优化参数提取逻辑
3. 考虑使用 LLM 进行意图识别

### Q5: 如何添加新工具？

**A**: 参考 [添加新工具](#添加新工具) 章节

---

## 技术栈

- **Node.js**: 运行环境
- **Express**: Web框架
- **Redis**: 会话管理
- **Axios**: HTTP请求
- **智谱AI**: LLM和Embedding服务

---

## 许可证

MIT License
