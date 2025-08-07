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

const pino = Pino({
  level: 'info',
})

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

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
  })

  return result.toUIMessageStreamResponse()
}
