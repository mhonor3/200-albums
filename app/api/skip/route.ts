import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser, getGlobalState } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username } = body

    if (!username) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const user = await getOrCreateUser(username)
    const globalState = await getGlobalState()

    // Advance user's position to current day (same as rating behavior)
    // The skipped album will remain unrated and appear in history
    await prisma.user.update({
      where: { id: user.id },
      data: { currentPosition: globalState.currentDay },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Skip error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
