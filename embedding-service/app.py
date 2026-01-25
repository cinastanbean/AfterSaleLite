#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Embedding 服务 - 智谱AI API 代理服务
使用智谱大模型的 Embedding API 生成文本嵌入向量
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os
import requests
import time
from pathlib import Path

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 配置使用镜像 (虽然当前使用远程API,但为将来可能切换本地模型做准备)
os.environ['HF_ENDPOINT'] = 'https://hf-mirror.com'

# 读取 server/.env 文件
env_path = Path(__file__).parent.parent / 'server' / '.env'
if env_path.exists():
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                # 去除行内注释 (如: "value # comment")
                if '#' in value:
                    value = value.split('#', 1)[0]
                os.environ[key.strip()] = value.strip()
    logger.info(f"已加载配置文件: {env_path}")
else:
    logger.warning(f"未找到配置文件: {env_path}，将使用环境变量或默认值")

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 智谱AI API配置 (从 server/.env 读取)
ZHIPU_API_URL = os.getenv('EMBEDDING_API_URL', 'https://open.bigmodel.cn/api/paas/v4/embeddings')
ZHIPU_API_KEY = os.getenv('EMBEDDING_API_KEY', '')
EMBEDDING_MODEL = os.getenv('EMBEDDING_MODEL', 'embedding-2')
EMBEDDING_DIM = int(os.getenv('EMBEDDING_DIM', '256'))


@app.route('/health', methods=['GET'])
def health():
    """健康检查"""
    return jsonify({
        'status': 'ok',
        'service': 'embedding-service',
        'model': EMBEDDING_MODEL,
        'provider': 'zhipu'
    })


@app.route('/embed', methods=['POST'])
def embed():
    """
    生成文本嵌入向量 (代理到智谱AI)

    请求体:
    {
        "texts": ["文本1", "文本2", ...] 或 "文本"
    }

    返回:
    {
        "success": true,
        "embeddings": [[0.1, 0.2, ...], ...],
        "dimension": 1024,
        "count": 2
    }
    """
    try:
        data = request.json

        if not data:
            return jsonify({'error': '请求体不能为空'}), 400

        # 检查API Key
        if not ZHIPU_API_KEY:
            return jsonify({'error': '未配置 ZHIPU_API_KEY 环境变量'}), 500

        # 获取文本
        texts = data.get('texts', None)

        # 如果 texts 是字符串,转换为列表
        if isinstance(texts, str):
            texts = [texts]
        elif texts is None:
            # 尝试获取其他可能的字段
            texts = data.get('text', data.get('content', []))
            if isinstance(texts, str):
                texts = [texts]

        if not texts or len(texts) == 0:
            return jsonify({'error': '未提供文本内容'}), 400

        # 确保 texts 是列表
        if not isinstance(texts, list):
            return jsonify({'error': 'texts 必须是列表格式'}), 400

        # 调用智谱AI API
        logger.info(f"开始处理 {len(texts)} 个文本 (通过智谱AI)...")
        start_time = time.time()

        headers = {
            'Authorization': f'Bearer {ZHIPU_API_KEY}',
            'Content-Type': 'application/json'
        }

        # 智谱API要求字段名为 input 而不是 texts
        payload = {
            'model': EMBEDDING_MODEL,
            'input': texts
        }

        response = requests.post(ZHIPU_API_URL, headers=headers, json=payload, timeout=30)

        if response.status_code != 200:
            error_msg = response.text
            logger.error(f"智谱API请求失败: {response.status_code} - {error_msg}")
            return jsonify({'error': f'API请求失败: {response.status_code}', 'details': error_msg}), 500

        api_response = response.json()
        process_time = time.time() - start_time
        logger.info(f"处理完成! 耗时: {process_time:.2f}秒")

        # 提取embeddings (智谱返回格式)
        embeddings_list = []
        if 'data' in api_response:
            embeddings_list = [item['embedding'] for item in api_response['data']]
        elif 'embeddings' in api_response:
            # 兼容其他可能的返回格式
            embeddings_list = api_response['embeddings']

        return jsonify({
            'success': True,
            'embeddings': embeddings_list,
            'dimension': EMBEDDING_DIM,
            'model': EMBEDDING_MODEL,
            'count': len(texts)
        })

    except requests.exceptions.Timeout:
        logger.error("API请求超时")
        return jsonify({'error': 'API请求超时'}), 504
    except requests.exceptions.RequestException as e:
        logger.error(f"API请求异常: {str(e)}", exc_info=True)
        return jsonify({'error': f'API请求异常: {str(e)}'}), 500
    except Exception as e:
        logger.error(f"Embedding 生成失败: {str(e)}", exc_info=True)
        return jsonify({
            'error': f'Embedding 生成失败: {str(e)}'
        }), 500


@app.route('/batch-embed', methods=['POST'])
def batch_embed():
    """
    批量生成嵌入向量 (与 /embed 相同,提供别名)
    """
    return embed()


@app.route('/info', methods=['GET'])
def info():
    """获取服务信息"""
    return jsonify({
        'service': 'embedding-service',
        'model': EMBEDDING_MODEL,
        'provider': 'zhipu',
        'version': '2.0.0',
        'dimension': EMBEDDING_DIM,
        'endpoints': {
            'health': 'GET /health - 健康检查',
            'embed': 'POST /embed - 生成嵌入向量',
            'info': 'GET /info - 获取服务信息'
        }
    })


if __name__ == '__main__':
    # 获取环境变量配置
    host = os.getenv('EMBEDDING_HOST', '0.0.0.0')
    port = int(os.getenv('EMBEDDING_PORT', 5001))
    debug = os.getenv('EMBEDDING_DEBUG', 'false').lower() == 'true'

    logger.info("=" * 60)
    logger.info("Embedding 服务启动中...")
    logger.info(f"提供商: 智谱AI (Zhipu AI)")
    logger.info(f"模型: {EMBEDDING_MODEL}")
    logger.info(f"向量维度: {EMBEDDING_DIM}")
    logger.info(f"监听地址: {host}:{port}")
    logger.info(f"调试模式: {debug}")

    if ZHIPU_API_KEY:
        logger.info(f"API Key: {ZHIPU_API_KEY[:10]}... (已配置)")
    else:
        logger.warning("警告: 未配置 ZHIPU_API_KEY 环境变量!")

    logger.info("=" * 60)

    # 启动服务 (不再预加载本地模型)
    app.run(
        host=host,
        port=port,
        debug=debug,
        threaded=True  # 支持多线程
    )
