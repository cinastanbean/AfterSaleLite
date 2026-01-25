const { v4: uuidv4 } = require('uuid');
const { createClient } = require('redis');

class ChatService {
  constructor(knowledgeBase) {
    this.knowledgeBase = knowledgeBase;

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
   * 处理聊天请求
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

    // 搜索相关知识点
    const relevantChunks = await this.knowledgeBase.getRelevantChunks(message, 3);

    // 生成回答(使用历史)
    const answer = this.generateAnswer(message, relevantChunks, history);

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

    // 提取来源信息
    const sources = relevantChunks.map(chunk => ({
      documentName: chunk.document_name,
      content: chunk.content.substring(0, 200) + '...'
    }));

    return {
      answer,
      sources,
      sessionId
    };
  }

  /**
   * 生成回答（基于规则和模板）
   */
  generateAnswer(query, relevantChunks, history) {
    // 如果没有找到相关内容
    if (!relevantChunks || relevantChunks.length === 0) {
      return `抱歉，我在知识库中没有找到与"${query}"相关的信息。您可以：

1. 重新表述您的问题
2. 尝试使用不同的关键词
3. 联系人工客服

如果您有其他问题，欢迎继续提问！`;
    }

    // 检查是否是特定类型的问题
    const lowerQuery = query.toLowerCase();

    // 退款相关
    if (lowerQuery.includes('退款') || lowerQuery.includes('退费')) {
      return this.generateRefundAnswer(relevantChunks);
    }

    // 物流相关
    if (lowerQuery.includes('物流') || lowerQuery.includes('发货') || lowerQuery.includes('快递')) {
      return this.generateShippingAnswer(relevantChunks);
    }

    // 退换货相关
    if (lowerQuery.includes('退货') || lowerQuery.includes('换货') || lowerQuery.includes('七天')) {
      return this.generateReturnAnswer(relevantChunks);
    }

    // 优惠券相关
    if (lowerQuery.includes('优惠') || lowerQuery.includes('折扣') || lowerQuery.includes('券')) {
      return this.generateCouponAnswer(relevantChunks);
    }

    // 会员相关
    if (lowerQuery.includes('会员') || lowerQuery.includes('积分')) {
      return this.generateMembershipAnswer(relevantChunks);
    }

    // 默认回答：基于找到的知识块
    return this.generateGeneralAnswer(query, relevantChunks);
  }

  generateRefundAnswer(chunks) {
    const relevantContent = chunks.map(c => c.content).join('\n\n');
    return `关于退款问题，根据相关资料：

${relevantContent.substring(0, 500)}

如果以上信息无法解决您的问题，请您提供订单号，我会为您进一步查询。`;
  }

  generateShippingAnswer(chunks) {
    const relevantContent = chunks.map(c => c.content).join('\n\n');
    return `关于物流发货问题：

${relevantContent.substring(0, 500)}

您可以登录账户在"我的订单"中查看物流状态。如有疑问，请提供订单号。`;
  }

  generateReturnAnswer(chunks) {
    const relevantContent = chunks.map(c => c.content).join('\n\n');
    return `关于退换货政策：

${relevantContent.substring(0, 500)}

如需办理退换货，请在订单详情页点击"申请售后"按钮。`;
  }

  generateCouponAnswer(chunks) {
    const relevantContent = chunks.map(c => c.content).join('\n\n');
    return `关于优惠活动：

${relevantContent.substring(0, 500)}

优惠券使用方法：在结算页面选择适用的优惠券即可。`;
  }

  generateMembershipAnswer(chunks) {
    const relevantContent = chunks.map(c => c.content).join('\n\n');
    return `关于会员权益：

${relevantContent.substring(0, 500)}

积分可在个人中心查看详情。`;
  }

  generateGeneralAnswer(query, chunks) {
    let answer = `根据知识库，我为您找到以下相关信息：\n\n`;

    chunks.forEach((chunk, index) => {
      answer += `${index + 1}. ${chunk.content.substring(0, 300)}...\n\n`;
    });

    answer += `\n来源文档：${chunks.map(c => c.document_name).join(', ')}`;
    answer += `\n\n如需更多帮助，请随时提问！`;

    return answer;
  }

  /**
   * 获取聊天历史
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
   * 清除会话
   */
  async clearSession(sessionId, userId = 'default') {
    const sessionKey = `session:${userId}:${sessionId}`;
    try {
      await this.redis.del(sessionKey);
    } catch (error) {
      console.error('清除会话失败:', error);
    }
  }

  /**
   * 获取所有活跃会话
   */
  getActiveSessions() {
    // Redis 版本不支持直接获取所有键，建议使用 scan 命令
    return [];
  }
}

module.exports = { ChatService };
