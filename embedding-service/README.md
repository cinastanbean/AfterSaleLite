# Embedding 服务

本地 Embedding 向量生成服务，基于 `sentence-transformers` 实现。

## 功能特点

- ✅ 使用 SOTA 级别模型 `paraphrase-multilingual-MiniLM-L12-v2`
- ✅ 支持中文和多语言
- ✅ 生成 384 维向量
- ✅ 批量处理支持
- ✅ 高性能 (单文本 ~50ms)
- ✅ 完全免费，无 API 调用成本

## 快速开始

### 1. 启动服务

#### macOS / Linux

```bash
cd embedding-service
./start.sh
```

#### Windows

```bash
cd embedding-service
start.bat
```

### 2. 验证服务

```bash
# 健康检查
curl http://localhost:5001/health

# 生成 embedding
curl -X POST http://localhost:5001/embed \
  -H "Content-Type: application/json" \
  -d '{"texts": ["这是一个测试文本"]}'
```

## API 接口

### 1. 健康检查

```http
GET /health
```

**响应:**
```json
{
  "status": "ok",
  "service": "embedding-service",
  "model": "paraphrase-multilingual-MiniLM-L12-v2"
}
```

### 2. 生成 Embedding

```http
POST /embed
Content-Type: application/json
```

**请求体:**
```json
{
  "texts": ["文本1", "文本2"]
}
```

**响应:**
```json
{
  "success": true,
  "embeddings": [
    [0.1, 0.2, 0.3, ...],
    [0.4, 0.5, 0.6, ...]
  ],
  "dimension": 384,
  "model": "paraphrase-multilingual-MiniLM-L12-v2",
  "count": 2
}
```

### 3. 批量生成

```http
POST /batch-embed
Content-Type: application/json
```

接口与 `/embed` 相同，提供别名方便调用。

### 4. 服务信息

```http
GET /info
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `EMBEDDING_HOST` | `0.0.0.0` | 监听地址 |
| `EMBEDDING_PORT` | `5001` | 监听端口 |
| `EMBEDDING_DEBUG` | `false` | 调试模式 |
| `HF_HOME` | `.cache` | 模型缓存目录 |

## 模型信息

- **模型名称**: `paraphrase-multilingual-MiniLM-L12-v2`
- **模型大小**: ~400MB
- **向量维度**: 384
- **支持语言**: 50+ 种语言 (含中文)
- **性能**: 单文本 ~50ms

## 与主系统集成

### Node.js 调用示例

```javascript
const axios = require('axios');

async function getEmbedding(text) {
  const response = await axios.post(
    'http://localhost:5001/embed',
    { texts: [text] },
    { headers: { 'Content-Type': 'application/json' } }
  );

  return response.data.embeddings[0];
}

// 使用
const embedding = await getEmbedding('这是一个测试文本');
console.log(`向量维度: ${embedding.length}`);
```

### 配置环境变量

在 `server/.env` 中:

```bash
USE_LOCAL_EMBEDDING=true  # 使用本地服务
EMBEDDING_DIM=384        # 向量维度
EMBEDDING_LOCAL_URL=http://localhost:5001/embed  # 服务地址
```

## 故障排查

### 问题 1: 无法连接到服务

**检查服务是否启动:**
```bash
curl http://localhost:5001/health
```

**如果失败,重新启动服务:**
```bash
cd embedding-service
./start.sh
```

### 问题 2: 模型下载失败

**检查网络连接,或手动下载模型:**
```bash
# 进入虚拟环境
source venv/bin/activate

# 手动下载模型
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')"
```

### 问题 3: Python 依赖安装失败

**升级 pip 后重试:**
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

## 性能对比

| 方案 | 延迟 | 成本 | 维度 |
|------|------|------|------|
| 本地服务 | ~50ms | 免费 | 384 |
| DeepSeek API | ~300ms | 免费 | 1536 |
| 通义千问 API | ~400ms | 付费 | 1536 |

## 常见问题

**Q: 可以切换其他模型吗?**

A: 可以,修改 `app.py` 中的 `MODEL_NAME` 变量:
```python
MODEL_NAME = 'sentence-transformers/all-MiniLM-L6-v2'  # 英文
MODEL_NAME = 'paraphrase-multilingual-MiniLM-L12-v2'  # 多语言
```

**Q: 模型占用多少内存?**

A: 运行时约占用 500MB 内存。

**Q: 可以处理长文本吗?**

A: 可以,但建议分段处理(每段不超过512个token)。

## 目录结构

```
embedding-service/
├── app.py           # Flask 应用主文件
├── requirements.txt # Python 依赖
├── start.sh         # macOS/Linux 启动脚本
├── start.bat        # Windows 启动脚本
├── venv/           # Python 虚拟环境(自动创建)
├── .cache/         # 模型缓存目录
└── README.md        # 本文档
```

## 技术栈

- **Flask**: Web 框架
- **sentence-transformers**: Embedding 模型
- **PyTorch**: 深度学习框架
- **numpy**: 数值计算

## 许可证

MIT
