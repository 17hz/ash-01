'use client'

import { useChat } from '@ai-sdk/react'
import { DeleteOutlined, PlusOutlined, RobotOutlined, SendOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Button, Card, Empty, Input, List, Space, Spin, Typography, Drawer, message } from 'antd'
import 'github-markdown-css/github-markdown.css'
import { FormEvent, useState, useEffect } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const { Title } = Typography

interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export default function ChatPage() {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [input, setInput] = useState('')

  const { messages, status, sendMessage, setMessages } = useChat({
    body: { conversationId: currentConversationId },
  })

  // Load conversations on component mount
  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data)
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
      message.error('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const createNewConversation = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Conversation' }),
      })
      
      if (response.ok) {
        const newConversation = await response.json()
        setConversations(prev => [newConversation, ...prev])
        setCurrentConversationId(newConversation.id)
        setMessages([])
        setSidebarVisible(false)
        message.success('New conversation created')
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
      message.error('Failed to create conversation')
    }
  }

  const selectConversation = async (conversationId: string) => {
    try {
      setCurrentConversationId(conversationId)
      setSidebarVisible(false)
      
      // Load conversation messages
      const response = await fetch(`/api/conversations/${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        const uiMessages = data.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          parts: [{ type: 'text', text: msg.content }],
        }))
        setMessages(uiMessages)
      }
    } catch (error) {
      console.error('Failed to load conversation:', error)
      message.error('Failed to load conversation')
    }
  }

  const deleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setConversations(prev => prev.filter(c => c.id !== conversationId))
        if (currentConversationId === conversationId) {
          setCurrentConversationId(null)
          setMessages([])
        }
        message.success('Conversation deleted')
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      message.error('Failed to delete conversation')
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!currentConversationId) {
      message.warning('Please create or select a conversation first')
      return
    }
    sendMessage({ text: input })
    setInput('')
  }

  return (
    <div style={{ height: '100vh', display: 'flex' }}>
      {/* Sidebar for larger screens */}
      <div style={{ 
        width: 300, 
        background: '#fafafa', 
        borderRight: '1px solid #d9d9d9',
        display: typeof window !== 'undefined' && window.innerWidth > 768 ? 'block' : 'none'
      }}>
        <div style={{ padding: 16 }}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            block 
            onClick={createNewConversation}
            style={{ marginBottom: 16 }}
          >
            New Conversation
          </Button>
          
          <Title level={5}>Conversations</Title>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <Spin />
            </div>
          ) : (
            <List
              dataSource={conversations}
              renderItem={(conversation) => (
                <List.Item
                  style={{ 
                    cursor: 'pointer',
                    background: currentConversationId === conversation.id ? '#e6f7ff' : 'transparent',
                    padding: '8px 12px',
                    borderRadius: 4,
                    marginBottom: 4
                  }}
                  onClick={() => selectConversation(conversation.id)}
                  actions={[
                    <Button
                      key="delete"
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={(e) => deleteConversation(conversation.id, e)}
                    />
                  ]}
                >
                  <List.Item.Meta
                    title={<div style={{ fontSize: 14 }}>{conversation.title}</div>}
                    description={
                      <div style={{ fontSize: 12, color: '#666' }}>
                        {new Date(conversation.updatedAt).toLocaleDateString()}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      <Drawer
        title="Conversations"
        placement="left"
        open={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        width={300}
      >
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          block 
          onClick={createNewConversation}
          style={{ marginBottom: 16 }}
        >
          New Conversation
        </Button>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <Spin />
          </div>
        ) : (
          <List
            dataSource={conversations}
            renderItem={(conversation) => (
              <List.Item
                style={{ 
                  cursor: 'pointer',
                  background: currentConversationId === conversation.id ? '#e6f7ff' : 'transparent',
                  padding: '8px 12px',
                  borderRadius: 4,
                  marginBottom: 4
                }}
                onClick={() => selectConversation(conversation.id)}
                actions={[
                  <Button
                    key="delete"
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={(e) => deleteConversation(conversation.id, e)}
                  />
                ]}
              >
                <List.Item.Meta
                  title={<div style={{ fontSize: 14 }}>{conversation.title}</div>}
                  description={
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {new Date(conversation.updatedAt).toLocaleDateString()}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Drawer>

      {/* Main chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header with menu button for mobile */}
        <div style={{ 
          padding: '12px 16px', 
          borderBottom: '1px solid #d9d9d9',
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <Button 
            type="text" 
            onClick={() => setSidebarVisible(true)}
            style={{ display: typeof window !== 'undefined' && window.innerWidth <= 768 ? 'block' : 'none' }}
          >
            ☰
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            {currentConversationId ? 'Chat' : 'Select a conversation to start chatting'}
          </Title>
        </div>

        {/* Chat messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {!currentConversationId ? (
            <Empty
              image={<RobotOutlined style={{ fontSize: 48, color: '#ccc' }} />}
              description="Create or select a conversation to start chatting"
              style={{ marginTop: 100 }}
            />
          ) : messages.length === 0 ? (
            <Empty
              image={<RobotOutlined style={{ fontSize: 48, color: '#ccc' }} />}
              description="开始与 AI 对话吧！"
              style={{ marginTop: 100 }}
            />
          ) : (
            <Space direction="vertical" size="middle" style={{ width: '100%', maxWidth: 800, margin: '0 auto' }}>
              {messages.map((message) => (
                <Card key={message.id} size="small">
                  <div
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}
                  >
                    <Avatar
                      icon={
                        message.role === 'user' ? (
                          <UserOutlined />
                        ) : (
                          <RobotOutlined />
                        )
                      }
                      style={{
                        backgroundColor:
                          message.role === 'user' ? '#1890ff' : '#52c41a',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{ fontSize: 12, color: '#666', marginBottom: 4 }}
                      >
                        {message.role === 'user' ? '你' : 'AI助手'}
                      </div>
                      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {message.parts.map((part, index) => {
                          if (part.type === 'text') {
                            return (
                              <div className="markdown-body" key={index}>
                                <Markdown
                                  remarkPlugins={[
                                    [remarkGfm, { singleTilde: false }],
                                  ]}
                                >
                                  {part.text}
                                </Markdown>
                              </div>
                            )
                          }
                          return null
                        })}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              {(status === 'submitted' || status === 'streaming') && (
                <Card size="small">
                  <div
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}
                  >
                    <Avatar
                      icon={<RobotOutlined />}
                      style={{ backgroundColor: '#52c41a' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{ fontSize: 12, color: '#666', marginBottom: 4 }}
                      >
                        AI助手
                      </div>
                      <Spin size="small" />{' '}
                      <span style={{ marginLeft: 8, color: '#666' }}>
                        正在思考...
                      </span>
                    </div>
                  </div>
                </Card>
              )}
            </Space>
          )}
        </div>

        {/* Input area */}
        <div style={{ padding: 16, borderTop: '1px solid #d9d9d9' }}>
          <form onSubmit={onSubmit}>
            <Space.Compact style={{ width: '100%', maxWidth: 800, margin: '0 auto', display: 'flex' }}>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={currentConversationId ? "输入你的消息..." : "Create or select a conversation first"}
                disabled={status !== 'ready' || !currentConversationId}
                style={{ flex: 1 }}
                onPressEnter={onSubmit}
              />
              <Button
                type="primary"
                htmlType="submit"
                disabled={status !== 'ready' || !input.trim() || !currentConversationId}
                icon={<SendOutlined />}
              />
            </Space.Compact>
          </form>
        </div>
      </div>
    </div>
  )
}