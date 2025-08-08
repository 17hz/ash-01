import { integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const usersTable = pgTable('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
})

export const conversationsTable = pgTable('conversations', {
  id: uuid().primaryKey().defaultRandom(),
  title: varchar({ length: 255 }).notNull().default('新对话'),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
})

export const messagesTable = pgTable('messages', {
  id: uuid().primaryKey().defaultRandom(),
  conversationId: uuid().notNull().references(() => conversationsTable.id, { onDelete: 'cascade' }),
  role: varchar({ length: 20 }).notNull(), // 'user', 'assistant', 'system'
  content: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
})
