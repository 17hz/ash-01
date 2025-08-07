'use client'

import { useChat } from '@ai-sdk/react'
import { 
  RobotOutlined, 
  SendOutlined, 
  UserOutlined, 
  MessageOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined
} from '@ant-design/icons'
import { 
  Avatar, 
  Button, 
  Card, 
  Empty, 
  Input, 
  Space, 
  Spin, 
  Layout,
  List,
  Typography,
  Modal,
  message,
  Divider
} from 'antd'
import 'github-markdown-css/github-markdown.css'
import { FormEvent, useState, useEffect, useRef } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const { Sider, Content } = Layout
const { Title, Text } = Typography

interface Conversation {
  id: number
  title: string
  userId: number
  createdAt: string
  updatedAt: string
}

interface DbMessage {
  id: number
  conversationId: number
  role: string
  content: string
  toolInvocations: any
  createdAt: string
}

export default function ChatPage() {
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [editingTitle, setEditingTitle] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, status, sendMessage, setMessages } = useChat()

  // Load conversations on component mount
  useEffect(() => {
    loadConversations()
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversations = async () => {
    try {
      setLoadingConversations(true)
      const response = await fetch('/api/conversations')
      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (error) {
      console.error('Error loading conversations:', error)
      message.error('Failed to load conversations')
    } finally {
      setLoadingConversations(false)
    }
  }

  const loadConversation = async (conversationId: number) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`)
      const data = await response.json()
      
      if (data.conversation && data.messages) {
        setCurrentConversationId(conversationId)
        
        // Convert database messages to UI messages format
        const uiMessages = data.messages.map((msg: DbMessage) => ({
          id: msg.id.toString(),
          role: msg.role,
          parts: [{ type: 'text', text: msg.content }],
          toolInvocations: msg.toolInvocations
        }))
        
        setMessages(uiMessages)
      }
    } catch (error) {
      console.error('Error loading conversation:', error)
      message.error('Failed to load conversation')
    }
  }

  const createNewConversation = async () => {
    setCurrentConversationId(null)
    setMessages([])
  }

  const deleteConversation = async (conversationId: number) => {
    Modal.confirm({
      title: 'Delete Conversation',
      content: 'Are you sure you want to delete this conversation? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await fetch(`/api/conversations/${conversationId}`, { method: 'DELETE' })
          await loadConversations()
          if (currentConversationId === conversationId) {
            setCurrentConversationId(null)
            setMessages([])
          }
          message.success('Conversation deleted')
        } catch (error) {
          console.error('Error deleting conversation:', error)
          message.error('Failed to delete conversation')
        }
      }
    })
  }

  const updateConversationTitle = async (conversationId: number, newTitle: string) => {
    try {
      await fetch(`/api/conversations/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      })
      await loadConversations()
      message.success('Title updated')
    } catch (error) {
      console.error('Error updating title:', error)
      message.error('Failed to update title')
    }
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    
    const userInput = input
    setInput('')
    
    // Send message via AI SDK but handle conversation persistence manually
    sendMessage({ 
      text: userInput,
      metadata: { conversationId: currentConversationId }
    })
    
    // If this is a new conversation, poll for the conversation ID
    if (!currentConversationId) {
      setTimeout(async () => {
        await loadConversations()
        // Try to identify the newest conversation
        const latestConversations = await fetch('/api/conversations').then(r => r.json())
        if (latestConversations.conversations?.length > 0) {
          const newest = latestConversations.conversations[0]
          setCurrentConversationId(newest.id)
        }
      }, 2000)
    }
  }

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider
        width={300}
        style={{
          background: '#fafafa',
          borderRight: '1px solid #d9d9d9',
          overflow: 'auto'
        }}
      >
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
          
          <Title level={5} style={{ marginBottom: 16 }}>
            <MessageOutlined style={{ marginRight: 8 }} />
            Conversations
          </Title>
          
          {loadingConversations ? (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <Spin />
            </div>
          ) : (
            <List
              dataSource={conversations}
              renderItem={(conversation) => (
                <List.Item
                  style={{
                    padding: '8px 0',
                    cursor: 'pointer',
                    borderRadius: 6,
                    marginBottom: 4,
                    backgroundColor: conversation.id === currentConversationId ? '#e6f7ff' : 'transparent'
                  }}
                  onClick={() => loadConversation(conversation.id)}
                  actions={[
                    <Button
                      key="edit"
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingTitle(conversation.id)
                        setEditTitle(conversation.title)
                      }}
                    />,
                    <Button
                      key="delete"
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteConversation(conversation.id)
                      }}
                    />
                  ]}
                >
                  <List.Item.Meta
                    title={
                      editingTitle === conversation.id ? (
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onPressEnter={() => {
                            updateConversationTitle(conversation.id, editTitle)
                            setEditingTitle(null)
                          }}
                          onBlur={() => {
                            updateConversationTitle(conversation.id, editTitle)
                            setEditingTitle(null)
                          }}
                          size="small"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <Text ellipsis={{ tooltip: conversation.title }}>
                          {conversation.title}
                        </Text>
                      )
                    }
                    description={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(conversation.updatedAt).toLocaleDateString()}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </div>
      </Sider>

      <Content>
        <div
          style={{
            height: '100%',
            maxWidth: 800,
            margin: '0 auto',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
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
                          {message.parts?.map((part, index) => {
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
                <div ref={messagesEndRef} />
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
        </div>
      </Content>
    </Layout>
  )
}
