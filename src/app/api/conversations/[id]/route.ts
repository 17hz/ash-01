import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { conversationsTable, db, messagesTable } from '@/db'

// GET /api/conversations/[id] - Get conversation with messages
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    const conversation = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, id))
      .limit(1)

    if (conversation.length === 0) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const messages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, id))
      .orderBy(messagesTable.createdAt)

    return Response.json({
      conversation: conversation[0],
      messages,
    })
  } catch (error) {
    console.error('Failed to fetch conversation:', error)
    return Response.json({ error: 'Failed to fetch conversation' }, { status: 500 })
  }
}

// DELETE /api/conversations/[id] - Delete conversation
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    await db
      .delete(conversationsTable)
      .where(eq(conversationsTable.id, id))

    return Response.json({ success: true })
  } catch (error) {
    console.error('Failed to delete conversation:', error)
    return Response.json({ error: 'Failed to delete conversation' }, { status: 500 })
  }
}