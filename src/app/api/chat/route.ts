import { deepseek } from '@ai-sdk/deepseek'
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  UIMessage,
} from 'ai'
import Pino from 'pino'
import z from 'zod'
import { 
  createConversation, 
  createMessage, 
  generateConversationTitle,
  updateConversation
} from '@/lib/db-operations'

const pino = Pino({
  level: 'info',
})

export async function POST(req: Request) {
  const body = await req.json()
  const { messages } = body
  
  // Try to extract conversationId from the last message metadata or from body
  let conversationId = body.conversationId
  if (!conversationId && messages.length > 0) {
    const lastMessage = messages[messages.length - 1]
    conversationId = lastMessage.metadata?.conversationId
  }

  console.log(
    JSON.stringify(
      {
        uiMessage: messages,
        modelMessage: convertToModelMessages(messages),
        conversationId,
      },
      null,
      2,
    ),
  )

  // Handle conversation persistence
  let currentConversationId = conversationId

  // If no conversationId provided and this is the first message, create a new conversation
  if (!currentConversationId && messages.length > 0) {
    const firstUserMessage = messages.find((m: UIMessage) => m.role === 'user')
    if (firstUserMessage) {
      const title = generateConversationTitle(
        firstUserMessage.parts?.find((p: { type: string; text?: string }) => p.type === 'text')?.text || 'New Conversation'
      )
      const conversation = await createConversation({
        title,
        userId: 1, // Default user
      })
      currentConversationId = conversation.id
    }
  }

  // Save the new user message to database if we have a conversation
  if (currentConversationId && messages.length > 0) {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role === 'user') {
      await createMessage({
        conversationId: currentConversationId,
        role: 'user',
        content: lastMessage.parts?.find((p: { type: string; text?: string }) => p.type === 'text')?.text || '',
        toolInvocations: null,
      })
    }
  }

  const result = streamText({
    model: deepseek('deepseek-chat'),
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    prepareStep: (message) => {
      const messages = JSON.stringify(message.messages)
      pino.info(messages)
      return message
    },
    tools: {
      weather: tool({
        description: 'Get the weather in a location (fahrenheit)',
        inputSchema: z.object({
          location: z.string().describe('The location to get the weather for'),
        }),
        execute: async ({ location }) => {
          const temperature = Math.round(Math.random() * (90 - 32) + 32)
          return {
            location,
            temperature,
          }
        },
      }),
    },
    onFinish: async (result) => {
      // Save assistant's response to database
      if (currentConversationId) {
        const toolInvocations = result.toolCalls?.length > 0 ? result.toolCalls : null
        await createMessage({
          conversationId: currentConversationId,
          role: 'assistant', 
          content: result.text,
          toolInvocations,
        })

        // Update conversation timestamp
        await updateConversation(currentConversationId, {})
      }
    },
  })

  // Add conversation ID to the response headers
  const response = result.toUIMessageStreamResponse()
  if (currentConversationId) {
    response.headers.set('X-Conversation-Id', currentConversationId.toString())
  }

  return response
}
