const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { DocumentProcessor } = require('./documentProcessor');
const { EmbeddingService } = require('./embeddingService');

class VectorKnowledgeBase {
  constructor() {
    this.dbPath = path.join(__dirname, '../../data/vector_knowledge.db');
    this.db = null;
    this.documentProcessor = new DocumentProcessor();
    this.embeddingService = new EmbeddingService();
  }

  /**
   * 初始化数据库
   */
  async initialize() {
    const dataDir = path.dirname(this.dbPath);
    await fs.mkdir(dataDir, { recursive: true });

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
          return;
        }

        // 直接创建表，不使用 sqlite-vec 扩展
        console.log('向量知识库初始化（使用 JavaScript 相似度计算）');
        this.createTables().then(resolve).catch(reject);
      });
    });
  }

  /**
   * 创建数据表
   */
  createTables() {
    return new Promise((resolve, reject) => {
      // 文档表
      this.db.run(`
        CREATE TABLE IF NOT EXISTS documents (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          path TEXT NOT NULL,
          size INTEGER NOT NULL,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }

        // 知识块表（带向量）
        this.db.run(`
          CREATE TABLE IF NOT EXISTS chunks (
            id TEXT PRIMARY KEY,
            document_id TEXT NOT NULL,
            chunk_index INTEGER NOT NULL,
            content TEXT NOT NULL,
            embedding TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (document_id) REFERENCES documents(id)
          )
        `, (err) => {
          if (err) {
            reject(err);
            return;
          }

          console.log('向量知识库数据库初始化完成');
          resolve();
        });
      });
    });
  }

  /**
   * 添加文档
   */
  async addDocument(document) {
    return new Promise((resolve, reject) => {
      const docId = uuidv4();
      const chunks = this.documentProcessor.splitIntoChunks(document.content, 2000, 200);

      // 插入文档
      this.db.run(
        `INSERT INTO documents (id, name, path, size, content) VALUES (?, ?, ?, ?, ?)`,
        [docId, document.name, document.path, document.size, document.content],
        (err) => {
          if (err) {
            console.error('插入文档失败:', err);
            reject(err);
            return;
          }

          // 为每个 chunk 生成 embedding 并插入
          this.insertChunksWithEmbeddings(docId, chunks, document.name)
            .then(() => {
              console.log(`文档已添加: ${document.name}, 共 ${chunks.length} 个知识块`);
              resolve(docId);
            })
            .catch(reject);
        }
      );
    });
  }

  /**
   * 为知识块生成 embedding 并批量插入
   */
  async insertChunksWithEmbeddings(docId, chunks, docName) {
    try {
      console.log(`开始为 ${chunks.length} 个知识块生成 embedding...`);

      // 获取批量 embedding
      const embeddings = await this.embeddingService.getBatchEmbeddings(chunks);

      // 插入知识块
      const insertPromises = chunks.map((chunk, i) => {
        return new Promise((resolveChunk, rejectChunk) => {
          const chunkId = uuidv4();
          // 将向量转换为 JSON 字符串存储
          const embeddingJson = JSON.stringify(embeddings[i]);

          this.db.run(
            `INSERT INTO chunks (id, document_id, chunk_index, content, embedding) VALUES (?, ?, ?, ?, ?)`,
            [chunkId, docId, i, chunk, embeddingJson],
            (err) => {
              if (err) {
                console.error(`插入知识块 ${i} 失败:`, err);
                rejectChunk(err);
              } else {
                resolveChunk();
              }
            }
          );
        });
      });

      await Promise.all(insertPromises);
      console.log('所有知识块 embedding 生成并插入完成');
    } catch (error) {
      console.error('生成或插入 embedding 失败:', error);
      throw error;
    }
  }

  /**
   * 向量相似度搜索
   */
  async vectorSearch(query, topK = 5) {
    try {
      // 获取查询的 embedding
      const queryEmbedding = await this.embeddingService.getEmbedding(query);

      // 获取所有知识块
      const allChunks = await this.getAllChunks();

      // 计算相似度
      const scoredChunks = allChunks.map(chunk => {
        let chunkEmbedding;
        try {
          chunkEmbedding = chunk.embedding ? JSON.parse(chunk.embedding) : null;
        } catch (e) {
          console.error('解析 embedding JSON 失败:', e);
          chunkEmbedding = null;
        }

        if (!chunkEmbedding) {
          return { ...chunk, score: 0 };
        }

        const score = this.cosineSimilarity(queryEmbedding, chunkEmbedding);
        return { ...chunk, score };
      });

      // 按相似度排序并返回 topK
      return scoredChunks
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
    } catch (error) {
      console.error('向量搜索失败:', error);
      throw error;
    }
  }

  /**
   * 计算余弦相似度
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

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * 获取所有知识块
   */
  getAllChunks() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT c.*, d.name as document_name
         FROM chunks c
         JOIN documents d ON c.document_id = d.id
         ORDER BY c.chunk_index`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  /**
   * 获取所有文档
   */
  getAllDocuments() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT id, name, size, created_at FROM documents ORDER BY created_at DESC`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  /**
   * 删除文档
   */
  async deleteDocument(id) {
    return new Promise((resolve, reject) => {
      // 先删除关联的 chunks (包括 embedding)
      this.db.run('DELETE FROM chunks WHERE document_id = ?', [id], (err) => {
        if (err) {
          reject(err);
          return;
        }

        // 再删除文档
        this.db.run('DELETE FROM documents WHERE id = ?', [id], function(err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        });
      });
    });
  }

  /**
   * 获取统计信息
   */
  async getStats() {
    const docCount = await new Promise((resolve, reject) => {
      this.db.get('SELECT COUNT(*) as count FROM documents', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });

    const chunkCount = await new Promise((resolve, reject) => {
      this.db.get('SELECT COUNT(*) as count FROM chunks', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });

    return {
      documentCount: docCount,
      chunkCount: chunkCount
    };
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = { VectorKnowledgeBase };
