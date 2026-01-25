import React, { useEffect, useState } from 'react'

interface Stats {
  documentCount: number
  chunkCount: number
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({ documentCount: 0, chunkCount: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/documents')
      const data = await res.json()
      const documents = data.documents || []
      setStats({
        documentCount: documents.length,
        chunkCount: documents.length * 10
      })
    } catch (error) {
      console.error('加载统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: '24px' }}>数据概览</h2>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={{
          flex: 1,
          background: '#fff',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#666', marginBottom: '16px' }}>文档数量</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>
            {loading ? '...' : stats.documentCount} 个
          </p>
        </div>
        <div style={{
          flex: 1,
          background: '#fff',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#666', marginBottom: '16px' }}>知识块数量</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>
            {loading ? '...' : stats.chunkCount} 个
          </p>
        </div>
        <div style={{
          flex: 1,
          background: '#fff',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#666', marginBottom: '16px' }}>今日咨询</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>0 次</p>
        </div>
      </div>
      <div style={{
        background: '#fff',
        padding: '24px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3>系统功能说明</h3>
        <p style={{ marginTop: '16px', lineHeight: '2' }}>
          <strong>1. 智能客服</strong> - 基于知识库自动回答用户问题，支持退款、物流、退换货等常见问题<br/>
          <strong>2. 知识库管理</strong> - 上传 PDF/DOCX/MD/TXT 文档，系统自动解析并建立知识库<br/>
          <strong>3. 实时对话</strong> - 支持多轮对话，上下文理解<br/>
          <strong>4. 来源追溯</strong> - 每个回答都标注知识来源文档
        </p>
      </div>
    </div>
  )
}

export default Dashboard
