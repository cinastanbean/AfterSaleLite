import React, { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  mode?: 'agent' | 'rag' | 'traditional'
  sources?: Array<{ documentName: string; content: string }>
  timestamp: Date
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [useRag, setUseRag] = useState(true) // RAG 模式开关
  const [sessionId] = useState(() => `session-${Date.now()}`)
  const [userId] = useState(() => {
    // 生成或获取 userId
    const stored = localStorage.getItem('userId')
    if (stored) return stored
    const newUserId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('userId', newUserId)
    return newUserId
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputValue, sessionId, userId, useRag })
      })
      const data = await res.json()

      console.log('API 响应:', data)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        sources: data.sources,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      alert('发送失败')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  const quickQuestions = [
    '如何申请退款？',
    '订单多久能发货？',
    '支持七天无理由退货吗？',
    '优惠券如何使用？'
  ]

  return (
    <div style={{ height: 'calc(100vh - 200px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>智能客服对话</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>问答模式：</span>
          <button
            onClick={() => setUseRag(!useRag)}
            style={{
              padding: '8px 16px',
              background: useRag ? '#0052d9' : '#fff',
              color: useRag ? '#fff' : '#666',
              border: useRag ? 'none' : '1px solid #d9d9d9',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {useRag ? '🤖 RAG 模式' : '📚 传统模式'}
          </button>
        </div>
      </div>

      <div style={{
        background: '#fff',
        padding: '24px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        height: 'calc(100% - 80px)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* 消息列表 */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          background: '#f5f5f5',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#999', marginTop: '100px' }}>
              <p style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</p>
              <p>欢迎使用智能客服系统</p>
              <p style={{ marginTop: '8px', fontSize: '14px' }}>
                请上传知识库文档，然后开始提问
              </p>
              <div style={{ marginTop: '24px' }}>
                <p style={{ marginBottom: '12px', color: '#666' }}>快速提问：</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                  {quickQuestions.map(q => (
                    <span
                      key={q}
                      style={{
                        padding: '8px 16px',
                        background: '#e6f7ff',
                        color: '#0052d9',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                      onClick={() => setInputValue(q)}
                    >
                      {q}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} style={{ marginBottom: '16px' }}>
              {msg.role === 'user' ? (
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    display: 'inline-block',
                    background: '#0052d9',
                    color: '#fff',
                    padding: '12px 16px',
                    borderRadius: '8px 0 8px 8px',
                    maxWidth: '70%'
                  }}>
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'left' }}>
                  <div style={{
                    display: 'inline-block',
                    background: '#fff',
                    padding: '12px 16px',
                    borderRadius: '0 8px 8px 8px',
                    maxWidth: '80%',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ marginBottom: '8px', color: '#0052d9', fontWeight: 'bold' }}>
                      AI客服 {msg.mode === 'rag' ? ' (RAG)' : ''}
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                      {msg.content}
                    </div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e7e7e7' }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>知识来源：</div>
                        {msg.sources.map((source, idx) => (
                          <span key={idx} style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            background: '#e6f7ff',
                            color: '#0052d9',
                            borderRadius: '4px',
                            marginRight: '8px',
                            marginBottom: '4px',
                            fontSize: '12px'
                          }}>
                            {source.documentName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ textAlign: 'left' }}>
              <div style={{
                display: 'inline-block',
                background: '#fff',
                padding: '12px 16px',
                borderRadius: '0 8px 8px 8px'
              }}>
                思考中...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            placeholder="请输入您的问题..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          <button
            onClick={handleSend}
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: '#0052d9',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '发送中...' : '发送'}
          </button>
          <button
            onClick={clearChat}
            style={{
              padding: '12px 24px',
              background: '#fff',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            清空
          </button>
        </div>
      </div>
    </div>
  )
}

export default Chat
