import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username')

  if (!username) {
    return NextResponse.json({ error: 'Username required' }, { status: 400 })
  }

  const normalized = username.toLowerCase().trim()

  // Get user
  const user = await prisma.user.findUnique({
    where: { username: normalized },
    select: { id: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Fetch recent notifications (last 50), excluding user's own activity
  const notifications = await prisma.notification.findMany({
    where: {
      actorId: { not: user.id },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      actor: { select: { username: true } },
      album: { select: { position: true, title: true, artist: true, imageUrl: true } },
    },
  })

  // Add isRead status for this user
  const notificationsWithStatus = notifications.map((n) => ({
    id: n.id,
    type: n.type,
    stars: n.stars,
    createdAt: n.createdAt,
    isRead: n.viewerIds.includes(user.id),
    actor: n.actor,
    album: n.album,
  }))

  // Count unread
  const unreadCount = notificationsWithStatus.filter((n) => !n.isRead).length

  return NextResponse.json({
    notifications: notificationsWithStatus,
    unreadCount,
  })
}
