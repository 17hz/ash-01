import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { desc, eq } from 'drizzle-orm'
import { conversationsTable, messagesTable } from '@/db/schema'
import { NextRequest } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle({ client: sql })

// GET /api/conversations - 获取对话列表
export async function GET() {
  const conversations = await db
    .select()
    .from(conversationsTable)
    .orderBy(desc(conversationsTable.updatedAt))
    
  return Response.json({ conversations })
}

// POST /api/conversations - 创建新对话
export async function POST() {
  const [conversation] = await db
    .insert(conversationsTable)
    .values({
      title: '新对话'
    })
    .returning()
    
  return Response.json({ conversation })
}