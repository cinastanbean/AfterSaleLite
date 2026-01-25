const { v4: uuidv4 } = require('uuid');
const { LLMService } = require('./llmService');
const { createClient } = require('redis');

class RAGChatService {
  constructor(knowledgeBase) {
    this.knowledgeBase = knowledgeBase;
    this.llmService = new LLMService();

    // 初始化 Redis 客户端
    this.redis = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379
      },
      password: process.env.REDIS_PASSWORD
    });

    // 连接 Redis
    this.redis.connect().catch(err => {
      console.error('Redis 连接失败:', err.message);
    });

    this.redis.on('error', (err) => {
      console.error('Redis 错误:', err.message);
    });
  }

  /**
   * 处理聊天请求（使用 RAG）
   * @param {string} message - 用户消息
   * @param {string} sessionId - 会话ID
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} - 回答和来源
   */
  async chat(message, sessionId = null, userId = 'default') {
    // 如果没有sessionId，创建新会话
    if (!sessionId) {
      sessionId = uuidv4();
    }

    // 生成唯一的会话键
    const sessionKey = `session:${userId}:${sessionId}`;

    // 从 Redis 获取历史记录
    let history = [];
    try {
      const historyData = await this.redis.get(sessionKey);
      if (historyData) {
        history = JSON.parse(historyData);
      }
    } catch (error) {
      console.error('获取会话历史失败:', error);
    }

    console.log(`\n=== RAG 处理开始 ===`);
    console.log(`问题: ${message}`);
    console.log(`用户ID: ${userId}, 会话ID: ${sessionId}`);

    // 步骤1: 使用向量搜索获取相关知识
    console.log('步骤1: 向量检索相关知识...');
    const relevantChunks = await this.knowledgeBase.vectorSearch(message, 5);
    console.log(`检索到 ${relevantChunks.length} 个相关片段`);

    // 步骤2: 使用 LLM 生成回答
    console.log('步骤2: 使用 LLM 生成回答...');
    const answer = await this.llmService.generateAnswer(
      message,
      relevantChunks,
      history
    );

    // 步骤3: 提取来源信息
    const sources = this.extractSources(relevantChunks);

    // 更新历史记录
    history.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    history.push({
      role: 'assistant',
      content: answer,
      timestamp: new Date().toISOString(),
      sources: relevantChunks
    });

    // 保存到 Redis,并设置过期时间
    try {
      const ttl = parseInt(process.env.SESSION_TTL) || 3600;
      await this.redis.setEx(sessionKey, ttl, JSON.stringify(history));
    } catch (error) {
      console.error('保存会话历史失败:', error);
    }

    console.log('=== RAG 处理完成 ===\n');

    return {
      answer,
      sources,
      sessionId,
      model: this.llmService.model
    };
  }

  /**
   * 提取来源信息
   * @param {Array} chunks - 相关知识块
   * @returns {Array} - 来源列表
   */
  extractSources(chunks) {
    const sourcesMap = new Map();

    chunks.forEach(chunk => {
      if (!sourcesMap.has(chunk.document_name)) {
        sourcesMap.set(chunk.document_name, {
          documentName: chunk.document_name,
          content: chunk.content.substring(0, 200) + '...',
          score: chunk.score
        });
      }
    });

    return Array.from(sourcesMap.values());
  }

  /**
   * 获取对话历史
   * @param {string} sessionId - 会话ID
   * @param {string} userId - 用户ID
   * @returns {Promise<Array>} - 对话历史
   */
  async getChatHistory(sessionId, userId = 'default') {
    const sessionKey = `session:${userId}:${sessionId}`;
    try {
      const historyData = await this.redis.get(sessionKey);
      return historyData ? JSON.parse(historyData) : [];
    } catch (error) {
      console.error('获取历史记录失败:', error);
      return [];
    }
  }

  /**
   * 清空对话历史
   * @param {string} sessionId - 会话ID
   * @param {string} userId - 用户ID
   */
  async clearHistory(sessionId, userId = 'default') {
    const sessionKey = `session:${userId}:${sessionId}`;
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
    const sessionKey = `session:${userId}:${sessionId}`;
    try {
      await this.redis.del(sessionKey);
    } catch (error) {
      console.error('删除会话失败:', error);
    }
  }

  /**
   * 获取所有会话统计
   * @returns {Object} - 统计信息
   */
  async getStats() {
    try {
      const keys = [];
      for await (const key of this.redis.scanIterator({ MATCH: 'session:*' })) {
        keys.push(key);
      }
      return {
        totalSessions: keys.length
      };
    } catch (error) {
      console.error('获取统计信息失败:', error);
      return { totalSessions: 0 };
    }
  }
}

module.exports = { RAGChatService };
