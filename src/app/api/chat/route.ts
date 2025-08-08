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
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { conversationsTable, messagesTable } from '@/db/schema'
import { eq } from 'drizzle-orm'

const pino = Pino({
  level: 'info',
})

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle({ client: sql })

export async function POST(req: Request) {
  const { messages, conversationId }: { messages: UIMessage[]; conversationId?: string } = await req.json()

  console.log(
    JSON.stringify(
      {
        uiMessage: messages,
        modelMessage: convertToModelMessages(messages),
      },
      null,
      2,
    ),
  )

  // Get or create conversation
  let currentConversationId = conversationId
  if (!currentConversationId) {
    const [conversation] = await db.insert(conversationsTable)
      .values({
        title: messages[0]?.content?.substring(0, 50) || '新对话'
      })
      .returning()
    currentConversationId = conversation.id
  }

  // Save user message to database
  const lastMessage = messages[messages.length - 1]
  if (lastMessage?.role === 'user') {
    await db.insert(messagesTable).values({
      conversationId: currentConversationId,
      role: 'user',
      content: lastMessage.content
    })
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
    onFinish: async (result) => {
      // Save assistant message to database
      await db.insert(messagesTable).values({
        conversationId: currentConversationId!,
        role: 'assistant',
        content: result.text
      })

      // Update conversation timestamp
      await db.update(conversationsTable)
        .set({ updatedAt: new Date() })
        .where(eq(conversationsTable.id, currentConversationId!))
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
  })

  const response = result.toUIMessageStreamResponse()
  // Add conversation ID to response headers
  response.headers.set('X-Conversation-ID', currentConversationId)
  return response
}
