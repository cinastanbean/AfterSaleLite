#!/bin/bash

# Embedding 服务启动脚本

set -e  # 遇到错误立即退出

# 获取脚本所在目录
cd "$(dirname "$0")"
SERVICE_DIR=$(pwd)

echo "======================================"
echo "Embedding 服务启动"
echo "======================================"
echo "工作目录: $SERVICE_DIR"
echo ""

# 检查 Python3 是否安装
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到 python3"
    echo "请先安装 Python 3.8 或更高版本"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | awk '{print $2}')
echo "✓ Python 版本: $PYTHON_VERSION"

# 检查虚拟环境是否存在
if [ ! -d "venv" ]; then
    echo ""
    echo "创建虚拟环境..."
    python3 -m venv venv
    echo "✓ 虚拟环境创建完成"
else
    echo "✓ 虚拟环境已存在"
fi

# 激活虚拟环境
echo ""
echo "激活虚拟环境..."
source venv/bin/activate

# 检查依赖是否已安装
echo ""
echo "检查依赖..."
if ! python -c "import flask, sentence_transformers" 2>/dev/null; then
    echo "安装依赖..."
    pip install --upgrade pip
    pip install -r requirements.txt
    echo "✓ 依赖安装完成"
else
    echo "✓ 依赖已安装"
fi

# 检查模型缓存目录
MODEL_CACHE_DIR="$SERVICE_DIR/.cache"
mkdir -p "$MODEL_CACHE_DIR"
echo ""
echo "✓ 模型缓存目录: $MODEL_CACHE_DIR"

# 启动服务
echo ""
echo "======================================"
echo "启动 Embedding 服务"
echo "======================================"
echo ""

# 设置环境变量
export EMBEDDING_HOST=${EMBEDDING_HOST:-0.0.0.0}
export EMBEDDING_PORT=${EMBEDDING_PORT:-5001}
export EMBEDDING_DEBUG=${EMBEDDING_DEBUG:-false}
export HF_HOME="$MODEL_CACHE_DIR"

echo "监听地址: $EMBEDDING_HOST:$EMBEDDING_PORT"
echo "调试模式: $EMBEDDING_DEBUG"
echo ""

python app.py
