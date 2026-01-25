import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'

// 页面组件
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import Documents from './pages/Documents'

function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard')

  return (
    <Router>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* 侧边栏 */}
        <div style={{
          width: '256px',
          background: '#001529',
          padding: '24px 0',
          color: '#fff'
        }}>
          <div style={{
            padding: '24px',
            textAlign: 'center',
            borderBottom: '1px solid #303030',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            电商客服系统
          </div>
          <div style={{ padding: '24px' }}>
            <Link
              to="/dashboard"
              style={{
                display: 'block',
                padding: '12px',
                color: activeMenu === 'dashboard' ? '#fff' : 'rgba(255,255,255,0.65)',
                textDecoration: 'none',
                background: activeMenu === 'dashboard' ? '#1890ff' : 'transparent',
                borderRadius: '4px',
                marginBottom: '8px'
              }}
              onClick={() => setActiveMenu('dashboard')}
            >
              数据概览
            </Link>
            <Link
              to="/chat"
              style={{
                display: 'block',
                padding: '12px',
                color: activeMenu === 'chat' ? '#fff' : 'rgba(255,255,255,0.65)',
                textDecoration: 'none',
                background: activeMenu === 'chat' ? '#1890ff' : 'transparent',
                borderRadius: '4px',
                marginBottom: '8px'
              }}
              onClick={() => setActiveMenu('chat')}
            >
              智能客服
            </Link>
            <Link
              to="/documents"
              style={{
                display: 'block',
                padding: '12px',
                color: activeMenu === 'documents' ? '#fff' : 'rgba(255,255,255,0.65)',
                textDecoration: 'none',
                background: activeMenu === 'documents' ? '#1890ff' : 'transparent',
                borderRadius: '4px'
              }}
              onClick={() => setActiveMenu('documents')}
            >
              知识库管理
            </Link>
          </div>
        </div>

        {/* 主内容区 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <header style={{
            background: '#fff',
            padding: '0 24px',
            height: '64px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #e7e7e7',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <h2 style={{ margin: 0 }}>电商智能客服系统</h2>
            <button style={{
              padding: '8px 16px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer'
            }}>
              退出登录
            </button>
          </header>
          <main style={{ flex: 1, padding: '24px', background: '#f5f5f5' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/documents" element={<Documents />} />
            </Routes>
          </main>
          <footer style={{
            textAlign: 'center',
            padding: '24px',
            background: '#fff',
            borderTop: '1px solid #e7e7e7'
          }}>
            电商客服系统 © 2026
          </footer>
        </div>
      </div>
    </Router>
  )
}

export default App
