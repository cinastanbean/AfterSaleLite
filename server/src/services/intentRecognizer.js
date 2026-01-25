/**
 * IntentRecognizer - 意图识别器
 * 识别用户意图并提取参数
 */

class IntentRecognizer {
  constructor(toolManager) {
    this.toolManager = toolManager;
    // 定义意图模式
    this.intentPatterns = {
      // 查询订单
      query_order: {
        keywords: ['订单', '我的订单', '查订单', '订单号', '查一下订单', '查看订单'],
        tool: 'query_order',
        extractParams: this.extractOrderParams.bind(this)
      },
      // 查询物流
      query_logistics: {
        keywords: ['物流', '快递', '配送', '发货', '到哪了', '配送情况', '物流信息', '快递单号'],
        tool: 'query_logistics',
        extractParams: this.extractLogisticsParams.bind(this)
      },
      // 退货
      return: {
        keywords: ['退货', '退换货', '想退货', '申请退货', '我要退货'],
        tool: 'process_return',
        extractParams: this.extractReturnParams.bind(this)
      },
      // 价格保护
      price_protect: {
        keywords: ['降价', '便宜', '价格保护', '差价', '补差价', '现在多少钱', '降价了'],
        tool: 'payment_operation',
        extractParams: this.extractPriceProtectParams.bind(this)
      },
      // 查询退款
      query_refund: {
        keywords: ['退款', '退钱了', '退款进度', '退款到账', '退款状态'],
        tool: 'payment_operation',
        extractParams: this.extractRefundParams.bind(this)
      }
    };
  }

  /**
   * 识别用户意图
   * @param {string} message - 用户消息
   * @param {string} userId - 用户ID
   * @returns {Object} - 意图和参数
   */
  recognize(message, userId) {
    const lowerMessage = message.toLowerCase();

    // 遍历所有意图模式
    for (const [intent, config] of Object.entries(this.intentPatterns)) {
      for (const keyword of config.keywords) {
        if (lowerMessage.includes(keyword)) {
          console.log(`🎯 识别到意图: ${intent}`);
          const params = config.extractParams(message, userId);
          return {
            intent,
            tool: config.tool,
            params,
            confidence: 0.9
          };
        }
      }
    }

    // 未识别到意图
    console.log('❓ 未识别到特定意图');
    return {
      intent: 'unknown',
      tool: null,
      params: { userId, message },
      confidence: 0.0
    };
  }

  /**
   * 提取订单参数
   * @param {string} message - 用户消息
   * @param {string} userId - 用户ID
   * @returns {Object} - 参数对象
   */
  extractOrderParams(message, userId) {
    const params = { userId };

    // 提取订单号 (ORD开头 或 数字)
    const orderMatch = message.match(/ORD\d+|订单号\s*[:：]?\s*([A-Z0-9]+)/i);
    if (orderMatch) {
      params.orderId = orderMatch[0].replace(/订单号\s*[:：]?\s*/i, '');
    }

    // 提取数字作为订单号
    const numMatch = message.match(/\d{10,}/);
    if (numMatch && !params.orderId) {
      params.orderId = numMatch[0];
    }

    return params;
  }

  /**
   * 提取物流参数
   * @param {string} message - 用户消息
   * @param {string} userId - 用户ID
   * @returns {Object} - 参数对象
   */
  extractLogisticsParams(message, userId) {
    const params = { userId };

    // 提取订单号
    const orderMatch = message.match(/ORD\d+|订单号\s*[:：]?\s*([A-Z0-9]+)/i);
    if (orderMatch) {
      params.orderId = orderMatch[0].replace(/订单号\s*[:：]?\s*/i, '');
    }

    // 提取数字作为订单号
    const numMatch = message.match(/\d{10,}/);
    if (numMatch && !params.orderId) {
      params.orderId = numMatch[0];
    }

    return params;
  }

  /**
   * 提取退货参数
   * @param {string} message - 用户消息
   * @param {string} userId - 用户ID
   * @returns {Object} - 参数对象
   */
  extractReturnParams(message, userId) {
    const params = { userId, action: 'create' };

    // 提取订单号
    const orderMatch = message.match(/ORD\d+|订单号\s*[:：]?\s*([A-Z0-9]+)/i);
    if (orderMatch) {
      params.orderId = orderMatch[0].replace(/订单号\s*[:：]?\s*/i, '');
    }

    // 提取退货原因
    const reasonPatterns = [
      /质量问题|有毛病|坏了|坏了?/i,
      /不想要了|不喜欢|不合适/ig,
      /尺寸不对|大小不合适/ig,
      /颜色不对/ig,
      /发错货|发错了/ig,
      /理由|原因[:：]\s*(.+?)(?:，|$)/i
    ];

    for (const pattern of reasonPatterns) {
      const match = message.match(pattern);
      if (match) {
        params.reason = match[0].replace(/理由|原因[:：]\s*/i, '');
        break;
      }
    }

    // 默认原因
    if (!params.reason) {
      params.reason = '用户未提供具体原因';
    }

    return params;
  }

  /**
   * 提取价格保护参数
   * @param {string} message - 用户消息
   * @param {string} userId - 用户ID
   * @returns {Object} - 参数对象
   */
  extractPriceProtectParams(message, userId) {
    const params = { userId, action: 'price_protect' };

    // 提取订单号
    const orderMatch = message.match(/ORD\d+|订单号\s*[:：]?\s*([A-Z0-9]+)/i);
    if (orderMatch) {
      params.orderId = orderMatch[0].replace(/订单号\s*[:：]?\s*/i, '');
    }

    // 提取价格
    const priceMatch = message.match(/(\d+\.?\d*)\s*(?:元|块|钱)/);
    if (priceMatch) {
      params.currentPrice = parseFloat(priceMatch[1]);
    }

    // 提取"现在XX元"或"降到XX"
    const nowPriceMatch = message.match(/现在\s*(\d+\.?\d*)|(?:降到|降价|优惠)\s*(?:至|到)?\s*(\d+\.?\d*)/i);
    if (nowPriceMatch) {
      params.currentPrice = parseFloat(nowPriceMatch[1] || nowPriceMatch[2]);
    }

    return params;
  }

  /**
   * 提取退款参数
   * @param {string} message - 用户消息
   * @param {string} userId - 用户ID
   * @returns {Object} - 参数对象
   */
  extractRefundParams(message, userId) {
    const params = { userId, action: 'query_refund' };

    // 提取订单号
    const orderMatch = message.match(/ORD\d+|订单号\s*[:：]?\s*([A-Z0-9]+)/i);
    if (orderMatch) {
      params.orderId = orderMatch[0].replace(/订单号\s*[:：]?\s*/i, '');
    }

    return params;
  }

  /**
   * 检查是否需要转人工
   * @param {string} message - 用户消息
   * @returns {boolean} - 是否需要转人工
   */
  shouldEscalateToHuman(message) {
    const escalateKeywords = [
      '人工',
      '转人工',
      '客服',
      '投诉',
      '不满意',
      '无法解决',
      '帮我处理',
      '需要帮助',
      '问题解决不了'
    ];

    return escalateKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }
}

module.exports = { IntentRecognizer };
