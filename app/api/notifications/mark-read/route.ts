import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username } = body

    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 })
    }

    const normalized = username.toLowerCase().trim()

    const user = await prisma.user.findUnique({
      where: { username: normalized },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all unread notifications for this user
    const unreadNotifications = await prisma.notification.findMany({
      where: {
        actorId: { not: user.id }, // Exclude own notifications
        NOT: { viewerIds: { has: user.id } }, // Only unread ones
      },
      select: { id: true, viewerIds: true },
    })

    // Update each notification to add user to viewerIds
    await Promise.all(
      unreadNotifications.map((n) =>
        prisma.notification.update({
          where: { id: n.id },
          data: { viewerIds: { push: user.id } },
        })
      )
    )

    return NextResponse.json({
      success: true,
      markedCount: unreadNotifications.length,
    })
  } catch (error) {
    console.error('Mark read error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
