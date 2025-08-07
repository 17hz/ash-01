import { db, schema } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const users = await db.select().from(schema.usersTable)
    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users', users: [] },
      { status: 500 }
    )
  }
}