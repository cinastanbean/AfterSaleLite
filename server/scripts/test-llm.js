require('dotenv').config();
const axios = require('axios');

async function testLLM() {
  const provider = process.env.LLM_PROVIDER || 'zhipu';
  console.log(`测试 LLM 提供商: ${provider}`);

  let config;
  if (provider === 'zhipu') {
    config = {
      apiKey: process.env.ZHIPU_API_KEY,
      apiUrl: process.env.ZHIPU_API_URL || 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      model: process.env.ZHIPU_MODEL || 'glm-4-flash'
    };
  } else if (provider === 'deepseek') {
    config = {
      apiKey: process.env.DEEPSEEK_API_KEY,
      apiUrl: process.env.DEEPSEEK_API_URL,
      model: process.env.DEEPSEEK_MODEL
    };
  } else {
    config = {
      apiKey: process.env.QWEN_API_KEY,
      apiUrl: process.env.QWEN_API_URL,
      model: process.env.QWEN_MODEL
    };
  }

  console.log('API URL:', config.apiUrl);
  console.log('Model:', config.model);
  console.log('API Key:', config.apiKey ? `${config.apiKey.substring(0, 8)}...` : '未配置');

  try {
    const response = await axios.post(
      config.apiUrl,
      {
        model: config.model,
        messages: [
          {
            role: 'system',
            content: '你是一个电商客服助手'
          },
          {
            role: 'user',
            content: '你好，请用一句话介绍你自己'
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✅ LLM 调用成功！');
    console.log('回复:', response.data.choices[0].message.content);
    console.log('\n完整响应:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('\n❌ LLM 调用失败！');
    console.error('错误信息:', error.response?.data || error.message);
  }
}

testLLM();
