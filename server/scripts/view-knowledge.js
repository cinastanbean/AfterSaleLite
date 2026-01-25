const sqlite3 = require('sqlite3').verbose();
const dbPath = './data/vector_knowledge.db';

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err);
    return;
  }
  console.log('连接成功:', dbPath);
});

// 查询所有文档
db.all('SELECT * FROM documents', [], (err, docs) => {
  if (err) {
    console.error('查询文档失败:', err);
    return;
  }

  console.log('\n=== 文档列表 ===');
  docs.forEach(doc => {
    console.log(`\n文档 ID: ${doc.id}`);
    console.log(`名称: ${doc.name}`);
    console.log(`大小: ${doc.size} bytes`);
    console.log(`上传时间: ${doc.created_at}`);
  });

  // 查询第一个文档的 chunks
  if (docs.length > 0) {
    db.all('SELECT * FROM chunks WHERE document_id = ? LIMIT 5', [docs[0].id], (err, chunks) => {
      if (err) {
        console.error('查询 chunks 失败:', err);
        return;
      }

      console.log('\n=== 知识块（前5个）===');
      chunks.forEach((chunk, index) => {
        console.log(`\n块 ${index + 1}:`);
        console.log(`ID: ${chunk.id}`);
        console.log(`内容预览: ${chunk.content.substring(0, 100)}...`);
        console.log(`向量长度: ${chunk.embedding ? chunk.embedding.split(',').length : 0}`);
      });

      db.close();
    });
  } else {
    db.close();
  }
});
