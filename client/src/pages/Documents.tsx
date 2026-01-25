import React, { useState, useEffect } from 'react'

interface Document {
  id: string
  name: string
  size: number
  created_at: string
}

const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/documents')
      const data = await res.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error('加载文档列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      setUploading(true)
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        alert('文档上传成功')
        loadDocuments()
      } else {
        alert('上传失败: ' + (data.error || '未知错误'))
      }
    } catch (error) {
      alert('上传失败')
    } finally {
      setUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此文档吗？')) return

    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        alert('文档删除成功')
        loadDocuments()
      } else {
        alert('删除失败')
      }
    } catch (error) {
      alert('删除失败')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  return (
    <div>
      <h2 style={{ marginBottom: '24px' }}>知识库管理</h2>

      {/* 上传区域 */}
      <div style={{
        background: '#fff',
        padding: '24px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '24px'
      }}>
        <h3 style={{ marginBottom: '16px' }}>上传文档</h3>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
          支持 PDF、DOC、DOCX、Markdown (.md)、纯文本 (.txt) 格式，单个文件不超过 10MB
        </p>
        <input
          type="file"
          accept=".pdf,.doc,.docx,.md,.txt"
          onChange={handleUpload}
          disabled={uploading}
          style={{ marginBottom: '8px' }}
        />
        {uploading && <p style={{ color: '#0052d9' }}>上传中...</p>}
      </div>

      {/* 文档列表 */}
      <div style={{
        background: '#fff',
        padding: '24px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginBottom: '16px' }}>已上传文档 ({documents.length})</h3>
        {loading ? (
          <p style={{ color: '#999' }}>加载中...</p>
        ) : documents.length === 0 ? (
          <p style={{ color: '#999' }}>暂无文档</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e7e7e7' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>文档名称</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>文件大小</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>上传时间</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {documents.map(doc => (
                <tr key={doc.id} style={{ borderBottom: '1px solid #e7e7e7' }}>
                  <td style={{ padding: '12px' }}>{doc.name}</td>
                  <td style={{ padding: '12px' }}>{formatFileSize(doc.size)}</td>
                  <td style={{ padding: '12px' }}>{formatDate(doc.created_at)}</td>
                  <td style={{ padding: '12px' }}>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      style={{
                        padding: '6px 12px',
                        background: '#ff4d4f',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default Documents
