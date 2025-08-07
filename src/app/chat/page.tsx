'use client'

import { useChat } from '@ai-sdk/react'
import { RobotOutlined, SendOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Button, Card, Empty, Input, Space, Spin } from 'antd'
import 'github-markdown-css/github-markdown.css'
import { FormEvent, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function ChatPage() {
  const { messages, status, sendMessage } = useChat()
  const [input, setInput] = useState('')

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
    </div>
  )
}
