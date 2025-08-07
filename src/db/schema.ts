import { integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const usersTable = pgTable('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
})

export const conversationsTable = pgTable('conversations', {
  id: uuid().primaryKey().defaultRandom(),
  title: varchar({ length: 255 }).notNull().default('New Conversation'),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
})

export const messagesTable = pgTable('messages', {
  id: uuid().primaryKey().defaultRandom(),
  conversationId: uuid().notNull().references(() => conversationsTable.id, { onDelete: 'cascade' }),
  role: varchar({ length: 20 }).notNull(), // 'user', 'assistant', 'tool'
  content: text().notNull(),
  toolName: varchar({ length: 100 }), // For tool calls
  toolCallId: varchar({ length: 100 }), // For tool call identification
  createdAt: timestamp().defaultNow().notNull(),
})
