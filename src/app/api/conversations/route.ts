import { NextRequest } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { conversationsTable, db, messagesTable } from '@/db'

// GET /api/conversations - List all conversations
export async function GET() {
  try {
    const conversations = await db
      .select()
      .from(conversationsTable)
      .orderBy(desc(conversationsTable.updatedAt))

    return Response.json(conversations)
  } catch (error) {
    console.error('Failed to fetch conversations:', error)
    return Response.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}

// POST /api/conversations - Create new conversation
export async function POST(req: NextRequest) {
  try {
    const { title } = await req.json()
    
    const [conversation] = await db
      .insert(conversationsTable)
      .values({
        title: title || 'New Conversation',
      })
      .returning()

    return Response.json(conversation)
  } catch (error) {
    console.error('Failed to create conversation:', error)
    return Response.json({ error: 'Failed to create conversation' }, { status: 500 })
  }
}