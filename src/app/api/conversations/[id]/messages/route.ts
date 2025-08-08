import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq } from 'drizzle-orm'
import { conversationsTable, messagesTable } from '@/db/schema'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle({ client: sql })

// GET /api/conversations/[id]/messages - 获取对话消息
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const conversationId = params.id
  
  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, conversationId))
    .orderBy(messagesTable.createdAt)
    
  return Response.json({ messages })
}