const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { DocumentProcessor } = require('./services/documentProcessor');
const { KnowledgeBase } = require('./services/knowledgeBase');
const { VectorKnowledgeBase } = require('./services/vectorKnowledgeBase');
const { ChatService } = require('./services/chatService');
const { RAGChatService } = require('./services/ragChatService');
const { AgentChatService } = require('./services/agentChatService');

const app = express();
const PORT = process.env.PORT || 3001;

// 全局错误处理
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
});

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 日志中间件
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// 文件上传配置
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.md', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 PDF、DOC、DOCX、MD、TXT 文件'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// 初始化服务
const documentProcessor = new DocumentProcessor();
const knowledgeBase = new KnowledgeBase(); // 保留旧版知识库
const vectorKnowledgeBase = new VectorKnowledgeBase(); // 新版向量知识库
const chatService = new ChatService(knowledgeBase);
const ragChatService = new RAGChatService(vectorKnowledgeBase); // RAG 服务
const agentChatService = new AgentChatService(vectorKnowledgeBase); // Agent 服务

// 环境变量控制使用哪个服务
const USE_RAG = process.env.USE_RAG === 'true';
const ENABLE_AGENT = process.env.ENABLE_AGENT === 'true';
const AGENT_MODE = process.env.AGENT_MODE || 'auto'; // auto, agent, rag

// 数据库初始化
Promise.all([
  knowledgeBase.initialize(),
  vectorKnowledgeBase.initialize()
]).then(() => {
  console.log('数据库初始化成功');
  console.log(`RAG 模式: ${USE_RAG ? '启用' : '禁用'}`);
  console.log(`Agent 模式: ${ENABLE_AGENT ? '启用' : '禁用'} (${AGENT_MODE})`);
}).catch(err => {
  console.error('数据库初始化失败:', err);
});

// API 路由

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '客服系统运行中' });
});

// 上传文档
app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('开始处理上传...');

    if (!req.file) {
      console.log('没有接收到文件');
      return res.status(400).json({ error: '未上传文件' });
    }

    console.log('处理文档:', req.file.originalname);
    console.log('文件路径:', req.file.path);
    console.log('文件大小:', req.file.size);

    // 解析文档
    console.log('开始解析文档...');
    const content = await documentProcessor.parseDocument(req.file.path);
    console.log('文档解析完成，内容长度:', content.length);

    // 判断使用哪个知识库
    const useRagMode = USE_RAG;
    console.log(`使用 ${useRagMode ? '向量' : '传统'} 知识库`);

    // 存储到知识库
    console.log('开始存储到知识库...');
    const kb = useRagMode ? vectorKnowledgeBase : knowledgeBase;

    const docId = await kb.addDocument({
      name: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      content: content
    });
    console.log('文档存储完成，ID:', docId);

    res.json({
      success: true,
      docId,
      document: {
        id: docId,
        name: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('文档上传失败 - 详细错误:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// 获取文档列表
app.get('/api/documents', async (req, res) => {
  try {
    const documents = USE_RAG 
      ? await vectorKnowledgeBase.getAllDocuments()
      : await knowledgeBase.getAllDocuments();
    res.json({ documents });
  } catch (error) {
    console.error('获取文档列表失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 删除文档
app.delete('/api/documents/:id', async (req, res) => {
  try {
    const kb = USE_RAG ? vectorKnowledgeBase : knowledgeBase;
    await kb.deleteDocument(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('删除文档失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取文档内容
app.get('/api/documents/:id/content', async (req, res) => {
  try {
    const kb = USE_RAG ? vectorKnowledgeBase : knowledgeBase;
    const document = await kb.getDocument(req.params.id);
    res.json({ document });
  } catch (error) {
    console.error('获取文档内容失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 智能问答
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId, useRag, userId, useAgent } = req.body;

    if (!message) {
      return res.status(400).json({ error: '消息不能为空' });
    }

    // 使用默认 userId 如果未提供
    const currentUserId = userId || 'default';

    let response;
    let mode;

    // Agent 模式判断
    if (ENABLE_AGENT) {
      if (useAgent === true || (useAgent === undefined && AGENT_MODE === 'agent')) {
        // 强制使用 Agent
        const useRagMode = false;
        response = await agentChatService.chat(message, sessionId, currentUserId);
        mode = 'agent';
      } else if (useAgent === false) {
        // 强制不使用 Agent
        const useRagMode = useRag !== undefined ? useRag : USE_RAG;
        const service = useRagMode ? ragChatService : chatService;
        response = await service.chat(message, sessionId, currentUserId);
        mode = useRagMode ? 'rag' : 'traditional';
      } else {
        // 自动模式（AGENT_MODE === 'auto'）
        // Agent 内部会根据意图自动选择工具或 RAG
        response = await agentChatService.chat(message, sessionId, currentUserId);
        mode = 'agent';
      }
    } else {
      // 未启用 Agent，使用原有逻辑
      const useRagMode = useRag !== undefined ? useRag : USE_RAG;
      const service = useRagMode ? ragChatService : chatService;
      response = await service.chat(message, sessionId, currentUserId);
      mode = useRagMode ? 'rag' : 'traditional';
    }

    console.log(`使用 ${mode.toUpperCase()} 问答服务, 用户ID: ${currentUserId}`);

    res.json({
      success: true,
      response: response.answer,
      sources: response.sources,
      sessionId: response.sessionId,
      mode,
      model: response.model,
      toolResult: response.toolResult,
      taskResult: response.taskResult
    });
  } catch (error) {
    console.error('问答失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取聊天历史
app.get('/api/chat/history/:sessionId', async (req, res) => {
  try {
    const { userId } = req.query; // 从查询参数获取 userId
    const history = await chatService.getChatHistory(req.params.sessionId, userId || 'default');
    res.json({ history });
  } catch (error) {
    console.error('获取历史记录失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 启动服务器
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   电商客服系统服务已启动                 ║
║   http://localhost:${PORT}              ║
╚════════════════════════════════════════╝
  `);
});

// 服务器错误处理
server.on('error', (err) => {
  console.error('服务器错误:', err);
});
