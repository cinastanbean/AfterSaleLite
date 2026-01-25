const axios = require('axios');
require('dotenv').config();

class EmbeddingService {
  constructor() {
    this.apiKey = process.env.EMBEDDING_API_KEY || process.env.QWEN_API_KEY;
    this.apiUrl = process.env.EMBEDDING_API_URL || 'https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding';
    this.model = process.env.EMBEDDING_MODEL || 'text-embedding-v3';
    this.useLocal = process.env.USE_LOCAL_EMBEDDING === 'true';

    // 本地 embedding 服务地址
    this.localServiceUrl = process.env.EMBEDDING_LOCAL_URL || 'http://localhost:5001/embed';

    // 判断 API 提供商
    this.provider = this.detectProvider();
  }

  /**
   * 检测 embedding API 提供商
   */
  detectProvider() {
    if (!this.apiUrl) return 'zhipu';

    if (this.apiUrl.includes('open.bigmodel.cn')) return 'zhipu';
    if (this.apiUrl.includes('deepseek.com')) return 'deepseek';
    if (this.apiUrl.includes('dashscope.aliyuncs.com')) return 'qwen';

    return 'zhipu';
  }

  /**
   * 获取文本的向量表示
   * @param {string} text - 输入文本
   * @returns {Promise<number[]>} - 向量数组
   */
  async getEmbedding(text) {
    try {
      if (this.useLocal) {
        return await this.getLocalServiceEmbedding(text);
      } else {
        return await this.getRemoteEmbedding(text);
      }
    } catch (error) {
      console.error('获取 embedding 失败:', error);
      throw error;
    }
  }

  /**
   * 使用本地 Python 服务获取 embedding
   * @param {string} text - 输入文本
   * @returns {Promise<number[]>} - 向量数组
   */
  async getLocalServiceEmbedding(text) {
    try {
      const response = await axios.post(
        this.localServiceUrl,
        { texts: [text] },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000 // 30秒超时
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || '本地服务返回错误');
      }

      const embeddings = response.data.embeddings;
      if (!embeddings || embeddings.length === 0) {
        throw new Error('未返回 embedding 数据');
      }

      const embedding = embeddings[0];
      console.log(`本地 embedding 生成成功，维度: ${embedding.length}`);
      return embedding;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.error('无法连接到本地 embedding 服务');
        console.error('请确保 Python 服务已启动: cd embedding-service && ./start.sh');
      }
      console.error('本地 embedding 调用失败:', error.message);
      throw new Error(`本地 embedding 调用失败: ${error.message}`);
    }
  }

  /**
   * 使用远程 API 获取 embedding
   * @param {string} text - 输入文本
   * @returns {Promise<number[]>} - 向量数组
   */
  async getRemoteEmbedding(text) {
    try {
      let response;

      if (this.provider === 'zhipu') {
        // 智谱 AI API 调用
        response = await axios.post(
          this.apiUrl,
          {
            model: this.model,
            input: text
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );

        const embedding = response.data.data[0].embedding;
        console.log(`智谱 AI Embedding 生成成功，维度: ${embedding.length}`);
        return embedding;

      } else if (this.provider === 'deepseek') {
        // DeepSeek API 调用
        response = await axios.post(
          this.apiUrl,
          {
            model: this.model,
            input: text,
            encoding_format: 'float'
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );

        const embedding = response.data.data[0].embedding;
        console.log(`DeepSeek Embedding 生成成功，维度: ${embedding.length}`);
        return embedding;

      } else {
        // 通义千问 API 调用
        response = await axios.post(
          this.apiUrl || 'https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding',
          {
            model: this.model || 'text-embedding-v3',
            input: {
              texts: [text]
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );

        const embedding = response.data.output.embeddings[0].embedding;
        console.log(`通义千问 Embedding 生成成功，维度: ${embedding.length}`);
        return embedding;
      }
    } catch (error) {
      console.error('远程 embedding 调用失败:', error.response?.data || error.message);
      throw new Error(`Embedding API 调用失败: ${error.message}`);
    }
  }

  /**
   * 获取批量 embedding（用于优化性能）
   * @param {string[]} texts - 文本数组
   * @returns {Promise<number[][]>} - 向量数组
   */
  async getBatchEmbeddings(texts) {
    try {
      if (this.useLocal) {
        // 本地模式：批量调用本地服务
        return await this.getLocalServiceBatchEmbedding(texts);
      } else {
        // 远程模式：批量调用 API
        const batchSize = 10;
        const results = [];

        for (let i = 0; i < texts.length; i += batchSize) {
          const batch = texts.slice(i, i + batchSize);
          const embeddings = await this.getRemoteBatchEmbedding(batch);
          results.push(...embeddings);
        }

        return results;
      }
    } catch (error) {
      console.error('批量获取 embedding 失败:', error);
      throw error;
    }
  }

  /**
   * 批量调用本地 Python 服务
   * @param {string[]} texts - 文本数组
   * @returns {Promise<number[][]>} - 向量数组
   */
  async getLocalServiceBatchEmbedding(texts) {
    try {
      const response = await axios.post(
        this.localServiceUrl,
        { texts },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000 // 60秒超时
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || '本地服务返回错误');
      }

      const embeddings = response.data.embeddings;
      if (!embeddings || embeddings.length === 0) {
        throw new Error('未返回 embedding 数据');
      }

      console.log(`批量本地 embedding 生成成功，数量: ${embeddings.length}`);
      return embeddings;
    } catch (error) {
      console.error('批量本地 embedding 调用失败:', error.message);
      throw error;
    }
  }

  /**
   * 批量调用远程 embedding API
   * @param {string[]} texts - 文本数组
   * @returns {Promise<number[][]>} - 向量数组
   */
  async getRemoteBatchEmbedding(texts) {
    try {
      let response;

      if (this.provider === 'zhipu') {
        // 智谱 AI API 批量调用
        response = await axios.post(
          this.apiUrl,
          {
            model: this.model,
            input: texts
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 60000
          }
        );

        return response.data.data.map(item => item.embedding);

      } else if (this.provider === 'deepseek') {
        // DeepSeek API 批量调用
        response = await axios.post(
          this.apiUrl,
          {
            model: this.model,
            input: texts,
            encoding_format: 'float'
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 60000
          }
        );

        return response.data.data.map(item => item.embedding);

      } else {
        // 通义千问 API 批量调用
        response = await axios.post(
          this.apiUrl || 'https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding',
          {
            model: this.model || 'text-embedding-v3',
            input: {
              texts: texts
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 60000
          }
        );

        return response.data.output.embeddings.map(e => e.embedding);
      }
    } catch (error) {
      console.error('远程批量 embedding 调用失败:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * 计算两个向量的余弦相似度
   * @param {number[]} vec1 - 向量1
   * @param {number[]} vec2 - 向量2
   * @returns {number} - 相似度分数
   */
  cosineSimilarity(vec1, vec2) {
    if (vec1.length !== vec2.length) {
      throw new Error('向量维度不匹配');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
}

module.exports = { EmbeddingService };
