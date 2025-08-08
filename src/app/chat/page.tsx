'use client'

import { useChat } from '@ai-sdk/react'
import { RobotOutlined, SendOutlined, UserOutlined, MessageOutlined, PlusOutlined } from '@ant-design/icons'
import { Avatar, Button, Card, Empty, Input, Space, Spin, List, Typography, Drawer } from 'antd'
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

interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
}

export default function ChatPage() {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { messages, status, sendMessage, setMessages } = useChat({
    api: '/api/chat',
    body: {
      conversationId: currentConversationId
    },
    onResponse: (response) => {
      // Get conversation ID from response headers
      const conversationId = response.headers.get('X-Conversation-ID')
      if (conversationId && !currentConversationId) {
        setCurrentConversationId(conversationId)
        loadConversations()
      }
    }
  })
  const [input, setInput] = useState('')

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/conversations')
      const data = await response.json()
      setConversations(data.conversations)
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }

  const loadConversationMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`)
      const data = await response.json()
      
      // Convert database messages to UI format
      const uiMessages = data.messages.map((msg: Message) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        parts: [{ type: 'text' as const, text: msg.content }]
      }))
      
      setMessages(uiMessages)
      setCurrentConversationId(conversationId)
      setDrawerOpen(false)
    } catch (error) {
      console.error('Failed to load conversation messages:', error)
    }
  }

  const startNewConversation = () => {
    setMessages([])
    setCurrentConversationId(null)
    setDrawerOpen(false)
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    sendMessage({ text: input })
    setInput('')
  }

  return (
    <div
      style={{
        height: '100vh',
        maxWidth: 800,
        margin: '0 auto',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header with conversation controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>AI 对话</Title>
        <Space>
          <Button 
            icon={<PlusOutlined />} 
            onClick={startNewConversation}
            type="primary"
          >
            新对话
          </Button>
          <Button 
            icon={<MessageOutlined />} 
            onClick={() => setDrawerOpen(true)}
          >
            历史对话
          </Button>
        </Space>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16 }}>
        {messages.length === 0 ? (
          <Empty
            image={<RobotOutlined style={{ fontSize: 48, color: '#ccc' }} />}
            description="开始与 AI 对话吧！"
            style={{ marginTop: 100 }}
          />
        ) : (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
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

      <form onSubmit={onSubmit}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入你的消息..."
            disabled={status !== 'ready'}
            style={{ flex: 1 }}
            onPressEnter={onSubmit}
          />
          <Button
            type="primary"
            htmlType="submit"
            disabled={status !== 'ready' || !input.trim()}
            icon={<SendOutlined />}
          />
        </Space.Compact>
      </form>
      {/* Conversation history drawer */}
      <Drawer
        title="历史对话"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={400}
      >
        <List
          dataSource={conversations}
          renderItem={(conversation) => (
            <List.Item
              onClick={() => loadConversationMessages(conversation.id)}
              style={{ cursor: 'pointer' }}
              className={currentConversationId === conversation.id ? 'bg-blue-50' : ''}
            >
              <List.Item.Meta
                title={conversation.title}
                description={new Date(conversation.updatedAt).toLocaleDateString('zh-CN')}
              />
            </List.Item>
          )}
        />
      </Drawer>
    </div>
  )
}
