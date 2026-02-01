import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/utils'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { username } = body

  if (!username) {
    return NextResponse.json({ error: 'Username required' }, { status: 400 })
  }

  const normalized = username.toLowerCase().trim()
  const validUsernamePattern = /^[a-z0-9_-]+$/i

  if (!validUsernamePattern.test(normalized)) {
    return NextResponse.json({ error: 'Invalid username format' }, { status: 400 })
  }

  const user = await getOrCreateUser(normalized)

  return NextResponse.json({ success: true, userId: user.id })
}
