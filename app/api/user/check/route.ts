import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username')

  if (!username) {
    return NextResponse.json({ error: 'Username required' }, { status: 400 })
  }

  const normalized = username.toLowerCase().trim()
  const validUsernamePattern = /^[a-z0-9_-]+$/i

  if (!validUsernamePattern.test(normalized)) {
    return NextResponse.json({ error: 'Invalid username format' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { username: normalized },
    select: { id: true },
  })

  return NextResponse.json({ exists: !!user })
}
