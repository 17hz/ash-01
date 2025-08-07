import { deepseek } from '@ai-sdk/deepseek'
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  UIMessage,
} from 'ai'
import { eq } from 'drizzle-orm'
import Pino from 'pino'
import z from 'zod'
import { conversationsTable, db, messagesTable } from '@/db'

const pino = Pino({
  level: 'info',
})

export async function POST(req: Request) {
  const { messages, conversationId }: { messages: UIMessage[], conversationId?: string } = await req.json()

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

  // If conversationId is provided, load existing messages from DB
  let allMessages = messages
  if (conversationId) {
    try {
      const dbMessages = await db
        .select()
        .from(messagesTable)
        .where(eq(messagesTable.conversationId, conversationId))
        .orderBy(messagesTable.createdAt)

      // Convert DB messages to UI messages format
      const existingMessages: UIMessage[] = dbMessages.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        parts: [{ type: 'text', text: msg.content }],
      }))

      // Combine existing messages with new ones
      allMessages = [...existingMessages, ...messages]
    } catch (error) {
      console.error('Failed to load conversation messages:', error)
      // Continue with just the new messages if DB fails
    }
  }

  const result = streamText({
    model: deepseek('deepseek-chat'),
    messages: convertToModelMessages(allMessages),
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
    onFinish: async ({ response }) => {
      // Save messages to database if conversationId is provided
      if (conversationId) {
        try {
          // Save user message
          const userMessage = messages[messages.length - 1]
          if (userMessage) {
            await db.insert(messagesTable).values({
              conversationId,
              role: 'user',
              content: userMessage.content,
            })
          }

          // Save assistant response
          if (response.text) {
            await db.insert(messagesTable).values({
              conversationId,
              role: 'assistant', 
              content: response.text,
            })
          }

          // Update conversation's updatedAt timestamp
          await db
            .update(conversationsTable)
            .set({ updatedAt: new Date() })
            .where(eq(conversationsTable.id, conversationId))
        } catch (error) {
          console.error('Failed to save messages to database:', error)
        }
      }
    },
  })

  return result.toUIMessageStreamResponse()
}
