import { db, schema } from '@/lib/db'
import { desc, eq } from 'drizzle-orm'

const { conversationsTable, messagesTable } = schema

export type Conversation = typeof conversationsTable.$inferSelect
export type NewConversation = typeof conversationsTable.$inferInsert
export type Message = typeof messagesTable.$inferSelect
export type NewMessage = typeof messagesTable.$inferInsert

// Conversation operations
export async function createConversation(data: Omit<NewConversation, 'id' | 'createdAt' | 'updatedAt'>) {
  const [conversation] = await db.insert(conversationsTable).values(data).returning()
  return conversation
}

export async function getConversations(userId: number = 1) {
  return await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.userId, userId))
    .orderBy(desc(conversationsTable.updatedAt))
}

export async function getConversationById(id: number) {
  const [conversation] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, id))
  return conversation
}

export async function updateConversation(id: number, data: Partial<Omit<NewConversation, 'id' | 'createdAt'>>) {
  const [conversation] = await db
    .update(conversationsTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(conversationsTable.id, id))
    .returning()
  return conversation
}

export async function deleteConversation(id: number) {
  await db.delete(conversationsTable).where(eq(conversationsTable.id, id))
}

// Message operations
export async function createMessage(data: Omit<NewMessage, 'id' | 'createdAt'>) {
  const [message] = await db.insert(messagesTable).values(data).returning()
  return message
}

export async function getMessagesByConversationId(conversationId: number) {
  return await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, conversationId))
    .orderBy(messagesTable.createdAt)
}

export async function deleteMessagesByConversationId(conversationId: number) {
  await db.delete(messagesTable).where(eq(messagesTable.conversationId, conversationId))
}

// Helper function to generate conversation title from first message
export function generateConversationTitle(firstMessage: string): string {
  // Take first 50 characters and add ellipsis if longer
  const title = firstMessage.trim()
  return title.length > 50 ? title.substring(0, 50) + '...' : title
}