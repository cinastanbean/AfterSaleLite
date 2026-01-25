const { v4: uuidv4 } = require('uuid');
const { LLMService } = require('./llmService');
const { ToolManager } = require('./tools/toolManager');
const { OrderTool } = require('./tools/orderTool');
const { LogisticsTool } = require('./tools/logisticsTool');
const { ReturnTool } = require('./tools/returnTool');
const { PaymentTool } = require('./tools/paymentTool');
const { TaskPlanner } = require('./taskPlanner');
const { IntentRecognizer } = require('./intentRecognizer');
const { createClient } = require('redis');

/**
 * AgentChatService - Agent聊天服务
 * 整合RAG、工具调用和任务规划
 */
class AgentChatService {
  constructor(vectorKnowledgeBase) {
    this.knowledgeBase = vectorKnowledgeBase;
    this.llmService = new LLMService();

    // 初始化Redis客户端
    this.redis = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379
      },
      password: process.env.REDIS_PASSWORD
    });

    this.redis.connect().catch(err => {
      console.error('Redis 连接失败:', err.message);
    });

    // 初始化工具管理器
    this.toolManager = new ToolManager();
    this.registerAllTools();

    // 初始化任务规划器和意图识别器
    this.taskPlanner = new TaskPlanner(this.toolManager);
    this.intentRecognizer = new IntentRecognizer(this.toolManager);

    console.log('✅ Agent服务初始化完成');
  }

  /**
   * 注册所有工具
   */
  registerAllTools() {
    const orderTool = new OrderTool();
    const logisticsTool = new LogisticsTool();
    const returnTool = new ReturnTool();
    const paymentTool = new PaymentTool();

    this.toolManager.registerTool(orderTool);
    this.toolManager.registerTool(logisticsTool);
    this.toolManager.registerTool(returnTool);
    this.toolManager.registerTool(paymentTool);
  }

  /**
   * 处理聊天请求
   * @param {string} message - 用户消息
   * @param {string} sessionId - 会话ID
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} - 回答和相关信息
   */
  async chat(message, sessionId = null, userId = 'default') {
    if (!sessionId) {
      sessionId = uuidv4();
    }

    const sessionKey = `agent_session:${userId}:${sessionId}`;

    // 获取历史记录
    let history = await this.getHistory(sessionKey);

    console.log(`\n=== Agent 处理开始 ===`);
    console.log(`问题: ${message}`);
    console.log(`用户ID: ${userId}, 会话ID: ${sessionId}`);

    let response;
    let mode = 'rag';
    let toolResult = null;
    let taskResult = null;

    // 检查是否需要转人工
    if (this.intentRecognizer.shouldEscalateToHuman(message)) {
      response = {
        answer: '我已记录您的问题，正在为您转接人工客服，请稍候...',
        type: 'escalate'
      };
      mode = 'escalate';
    } else {
      // 识别意图
      const recognition = this.intentRecognizer.recognize(message, userId);

      if (recognition.intent !== 'unknown') {
        // 使用工具执行
        console.log(`🔧 执行工具: ${recognition.tool}`);
        mode = 'tool';
        toolResult = await this.toolManager.executeTool(recognition.tool, recognition.params);

        // 使用LLM生成友好的回复
        response = await this.generateToolResponse(message, toolResult, recognition);
      } else {
        // 检查是否需要任务规划
        const taskType = this.taskPlanner.identifyTaskType(recognition.params, message);

        if (taskType) {
          // 执行任务规划
          console.log(`📋 执行任务: ${taskType}`);
          mode = 'task';
          taskResult = await this.taskPlanner.executeTask(taskType, recognition.params);
          response = await this.generateTaskResponse(message, taskResult);
        } else {
          // 使用RAG回答
          console.log('📚 使用 RAG 回答');
          mode = 'rag';
          response = await this.useRAG(message, history);
        }
      }
    }

    // 更新历史记录
    history.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    history.push({
      role: 'assistant',
      content: response.answer,
      timestamp: new Date().toISOString(),
      mode,
      toolResult,
      taskResult
    });

    await this.saveHistory(sessionKey, history);

    console.log('=== Agent 处理完成 ===\n');

    return {
      answer: response.answer,
      mode,
      sessionId,
      model: this.llmService.model,
      toolResult,
      taskResult,
      sources: response.sources || []
    };
  }

  /**
   * 使用RAG回答
   * @param {string} message - 用户消息
   * @param {Array} history - 历史记录
   * @returns {Promise<Object>} - 回答
   */
  async useRAG(message, history) {
    const relevantChunks = await this.knowledgeBase.vectorSearch(message, 5);
    console.log(`检索到 ${relevantChunks.length} 个相关片段`);

    const answer = await this.llmService.generateAnswer(message, relevantChunks, history);

    const sources = relevantChunks.map(chunk => ({
      documentName: chunk.document_name,
      content: chunk.content.substring(0, 200) + '...',
      score: chunk.score
    }));

    return {
      answer,
      sources
    };
  }

  /**
   * 生成工具执行结果的回复
   * @param {string} message - 用户消息
   * @param {Object} toolResult - 工具执行结果
   * @param {Object} recognition - 意图识别结果
   * @returns {Promise<Object>} - 回答
   */
  async generateToolResponse(message, toolResult, recognition) {
    let prompt = `用户问题: ${message}\n\n`;
    prompt += `查询结果:\n${JSON.stringify(toolResult, null, 2)}\n\n`;
    prompt += `请根据查询结果，用友好、自然的语言回答用户问题。`;
    prompt += `如果查询成功，给出清晰的答复；如果查询失败，说明原因并给出建议。`;

    const answer = await this.llmService.generateAnswer(prompt, []);

    return { answer };
  }

  /**
   * 生成任务执行结果的回复
   * @param {string} message - 用户消息
   * @param {Object} taskResult - 任务执行结果
   * @returns {Promise<Object>} - 回答
   */
  async generateTaskResponse(message, taskResult) {
    const report = this.taskPlanner.generateReport(taskResult);

    let prompt = `用户问题: ${message}\n\n`;
    prompt += `任务执行报告:\n${report}\n\n`;
    prompt += `请根据任务执行报告，用友好、自然的语言向用户说明已完成的操作和结果。`;

    const answer = await this.llmService.generateAnswer(prompt, []);

    return { answer };
  }

  /**
   * 获取历史记录
   * @param {string} sessionKey - 会话键
   * @returns {Promise<Array>} - 历史记录
   */
  async getHistory(sessionKey) {
    try {
      const historyData = await this.redis.get(sessionKey);
      return historyData ? JSON.parse(historyData) : [];
    } catch (error) {
      console.error('获取历史记录失败:', error);
      return [];
    }
  }

  /**
   * 保存历史记录
   * @param {string} sessionKey - 会话键
   * @param {Array} history - 历史记录
   */
  async saveHistory(sessionKey, history) {
    try {
      const ttl = parseInt(process.env.SESSION_TTL) || 3600;
      await this.redis.setEx(sessionKey, ttl, JSON.stringify(history));
    } catch (error) {
      console.error('保存历史记录失败:', error);
    }
  }

  /**
   * 获取对话历史
   * @param {string} sessionId - 会话ID
   * @param {string} userId - 用户ID
   * @returns {Promise<Array>} - 对话历史
   */
  async getChatHistory(sessionId, userId = 'default') {
    const sessionKey = `agent_session:${userId}:${sessionId}`;
    return await this.getHistory(sessionKey);
  }

  /**
   * 清空对话历史
   * @param {string} sessionId - 会话ID
   * @param {string} userId - 用户ID
   */
  async clearHistory(sessionId, userId = 'default') {
    const sessionKey = `agent_session:${userId}:${sessionId}`;
    try {
      await this.redis.del(sessionKey);
    } catch (error) {
      console.error('清空历史记录失败:', error);
    }
  }

  /**
   * 删除会话
   * @param {string} sessionId - 会话ID
   * @param {string} userId - 用户ID
   */
  async deleteSession(sessionId, userId = 'default') {
    const sessionKey = `agent_session:${userId}:${sessionId}`;
    try {
      await this.redis.del(sessionKey);
    } catch (error) {
      console.error('删除会话失败:', error);
    }
  }
}

module.exports = { AgentChatService };
