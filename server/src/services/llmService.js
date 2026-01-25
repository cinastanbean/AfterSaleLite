const axios = require('axios');
require('dotenv').config();

class LLMService {
  constructor() {
    this.provider = process.env.LLM_PROVIDER || 'qwen';
    this.initProvider();
  }

  /**
   * 根据配置初始化 LLM 提供商
   */
  initProvider() {
    if (this.provider === 'zhipu') {
      // 智谱 AI (BigModel)
      this.apiKey = process.env.ZHIPU_API_KEY;
      this.apiUrl = process.env.ZHIPU_API_URL || 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
      this.model = process.env.ZHIPU_MODEL || 'glm-4-flash';
      this.authHeader = 'Bearer';
    } else if (this.provider === 'deepseek') {
      this.apiKey = process.env.DEEPSEEK_API_KEY;
      this.apiUrl = process.env.DEEPSEEK_API_URL;
      this.model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
      this.authHeader = 'Bearer';
    } else {
      // 默认使用通义千问
      this.apiKey = process.env.QWEN_API_KEY;
      this.apiUrl = process.env.QWEN_API_URL;
      this.model = process.env.QWEN_MODEL || 'qwen-plus';
      this.authHeader = 'Bearer';
    }

    console.log(`LLM 服务初始化: 提供商=${this.provider}, 模型=${this.model}`);
  }

  /**
   * 调用 LLM API 生成回答
   * @param {string} question - 用户问题
   * @param {Array} contexts - 相关知识上下文
   * @param {Array} history - 对话历史
   * @returns {Promise<string>} - 生成的回答
   */
  async generateAnswer(question, contexts = [], history = []) {
    try {
      // 构建系统提示词
      const systemPrompt = this.buildSystemPrompt(contexts);

      // 构建对话历史
      const messages = [
        { role: 'system', content: systemPrompt },
        ...this.formatHistory(history),
        { role: 'user', content: question }
      ];

      console.log(`调用 ${this.provider} API...`);
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 2000
        },
        {
          headers: {
            'Authorization': `${this.authHeader} ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const answer = response.data.choices[0].message.content;
      console.log('LLM 回答生成成功');
      return answer;
    } catch (error) {
      console.error(`调用 ${this.provider} API 失败:`, error.response?.data || error.message);

      // 如果 API 调用失败，使用基于规则的备选方案
      console.log('使用基于规则的备选回答方案');
      return this.generateRuleBasedAnswer(question, contexts);
    }
  }

  /**
   * 构建系统提示词
   * @param {Array} contexts - 相关知识上下文
   * @returns {string} - 系统提示词
   */
  buildSystemPrompt(contexts) {
    let prompt = `你是一个专业的电商客服助手，负责回答用户关于产品、售后、物流等问题。\n\n`;
    prompt += `重要限制：\n`;
    prompt += `1. 只回答电商客服相关的问题（产品咨询、订单查询、退款退货、物流配送、会员权益、优惠券等）\n`;
    prompt += `2. 如果用户询问与电商客服无关的问题（如天气、新闻、娱乐、个人隐私、政治等），请礼貌地拒绝\n`;
    prompt += `3. 拒绝话术示例："很抱歉，我只能回答电商客服相关的问题。关于您的问题，建议您咨询其他渠道。"\n\n`;

    if (contexts && contexts.length > 0) {
      prompt += `请根据以下知识库内容回答问题：\n\n`;
      contexts.forEach((ctx, index) => {
        prompt += `【知识来源 ${index + 1}】\n`;
        prompt += `文档：${ctx.document_name}\n`;
        prompt += `内容：${ctx.content.substring(0, 500)}...\n\n`;
      });
      prompt += `\n请基于以上知识库内容回答用户问题。如果知识库中没有相关信息，请礼貌地说明。\n\n`;
    } else {
      prompt += `知识库中没有找到相关内容。请根据电商客服知识尽可能回答，如果完全无关请拒绝回答。\n\n`;
    }

    prompt += `回答要求：
1. 只回答电商客服相关的问题
2. 回答要准确、简洁、友好
3. 引用知识来源时要明确标注
4. 如果不确定，要诚实说明
5. 遇到无关问题时，礼貌拒绝并说明你的职责范围
6. 语言要符合电商客服的专业规范`;

    return prompt;
  }

  /**
   * 格式化对话历史
   * @param {Array} history - 对话历史
   * @returns {Array} - 格式化后的消息
   */
  formatHistory(history) {
    return history.map(item => ({
      role: item.role,
      content: item.content
    }));
  }

  /**
   * 基于规则的备选回答（当 LLM API 不可用时）
   * @param {string} question - 用户问题
   * @param {Array} contexts - 相关知识上下文
   * @returns {string} - 生成的回答
   */
  generateRuleBasedAnswer(question, contexts) {
    if (!contexts || contexts.length === 0) {
      return '抱歉，我在知识库中没有找到相关的信息。建议您联系人工客服获取更详细的帮助。';
    }

    // 基于上下文生成简单回答
    const relevantContent = contexts.map(c => c.content).join('\n\n');
    const sentences = relevantContent.split(/[。！？\n]/).filter(s => s.trim().length > 10);

    if (sentences.length === 0) {
      return '抱歉，没有找到相关信息。建议您联系人工客服。';
    }

    // 返回最相关的2-3个句子
    const topSentences = sentences.slice(0, 3);
    let answer = topSentences.join('。') + '。';

    // 添加来源说明
    const sources = [...new Set(contexts.map(c => c.document_name))];
    if (sources.length > 0) {
      answer += `\n\n以上信息来自：${sources.join('、')}`;
    }

    return answer;
  }

  /**
   * 流式回答（未来扩展用）
   */
  async *generateAnswerStream(question, contexts = [], history = []) {
    // TODO: 实现流式回答
    yield { type: 'text', content: '流式回答功能待实现' };
  }
}

module.exports = { LLMService };
