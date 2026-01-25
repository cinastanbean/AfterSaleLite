const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { DocumentProcessor } = require('./documentProcessor');

class KnowledgeBase {
  constructor() {
    this.dbPath = path.join(__dirname, '../../data/knowledge.db');
    this.db = null;
    this.documentProcessor = new DocumentProcessor();
  }

  /**
   * 初始化数据库
   */
  async initialize() {
    // 确保数据目录存在
    const dataDir = path.dirname(this.dbPath);
    await fs.mkdir(dataDir, { recursive: true });

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
          return;
        }
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
        // 知识块表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS chunks (
            id TEXT PRIMARY KEY,
            document_id TEXT NOT NULL,
            chunk_index INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) {
            reject(err);
            return;
          }
          console.log('知识库数据库初始化完成');
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
      // 增大 chunk 大小，减少 chunk 数量
      const chunks = this.documentProcessor.splitIntoChunks(document.content, 2000, 200);

      this.db.run(
        `INSERT INTO documents (id, name, path, size, content) VALUES (?, ?, ?, ?, ?)`,
        [docId, document.name, document.path, document.size, document.content],
        (err) => {
          if (err) {
            console.error('插入文档失败:', err);
            reject(err);
            return;
          }

          // 批量插入知识块，每个 chunk 使用独立的 Promise
          const chunkPromises = chunks.map((chunk, i) => {
            return new Promise((resolveChunk, rejectChunk) => {
              const chunkId = uuidv4();
              this.db.run(
                `INSERT INTO chunks (id, document_id, chunk_index, content) VALUES (?, ?, ?, ?)`,
                [chunkId, docId, i, chunk],
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

          // 等待所有 chunk 插入完成
          Promise.all(chunkPromises)
            .then(() => {
              console.log(`文档已添加: ${document.name}, 共 ${chunks.length} 个知识块`);
              resolve(docId);
            })
            .catch((err) => {
              console.error('批量插入知识块失败:', err);
              reject(err);
            });
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
   * 获取文档详情
   */
  getDocument(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM documents WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  /**
   * 删除文档
   */
  async deleteDocument(id) {
    return new Promise((resolve, reject) => {
      // 先删除关联的 chunks
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
   * 搜索知识块（关键词搜索）
   */
  searchChunks(query, limit = 5) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT c.*, d.name as document_name
         FROM chunks c
         JOIN documents d ON c.document_id = d.id
         WHERE c.content LIKE ?
         ORDER BY c.created_at DESC
         LIMIT ?`,
        [`%${query}%`, limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  /**
   * 获取相关知识块（基于关键词匹配）
   */
  getRelevantChunks(query, topK = 5) {
    return new Promise((resolve, reject) => {
      // 分割查询词
      const keywords = query.split(/\s+/).filter(k => k.length > 1);
      
      if (keywords.length === 0) {
        resolve([]);
        return;
      }

      // 构建SQL条件
      const conditions = keywords.map(() => 'c.content LIKE ?').join(' AND ');
      const params = keywords.map(k => `%${k}%`);

      this.db.all(
        `SELECT c.*, d.name as document_name
         FROM chunks c
         JOIN documents d ON c.document_id = d.id
         WHERE ${conditions}
         ORDER BY c.chunk_index
         LIMIT ?`,
        [...params, topK],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  /**
   * 获取文档的知识块
   */
  getDocumentChunks(documentId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM chunks WHERE document_id = ? ORDER BY chunk_index`,
        [documentId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
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

module.exports = { KnowledgeBase };
