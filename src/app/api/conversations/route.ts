import { getConversations, createConversation, generateConversationTitle } from '@/lib/db-operations'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const conversations = await getConversations(1) // Default user
    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title } = await req.json()
    
    const conversation = await createConversation({
      title: title || 'New Conversation',
      userId: 1, // Default user
    })
    
    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}