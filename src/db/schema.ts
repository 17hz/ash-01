import { integer, json, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'

export const usersTable = pgTable('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
})

export const conversationsTable = pgTable('conversations', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: varchar({ length: 255 }).notNull(),
  userId: integer('user_id').notNull().default(1), // Default user for now
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const messagesTable = pgTable('messages', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  conversationId: integer('conversation_id').notNull().references(() => conversationsTable.id, { onDelete: 'cascade' }),
  role: varchar({ length: 20 }).notNull(), // 'user' or 'assistant'
  content: text().notNull(),
  toolInvocations: json('tool_invocations'), // Store tool invocations as JSON
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
