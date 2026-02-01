import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, albumPosition, stars, review } = body

    if (!username || albumPosition === undefined || !stars) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (stars < 1 || stars > 5) {
      return NextResponse.json(
        { error: 'Stars must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Get or create user
    const user = await getOrCreateUser(username)

    // Get album
    const album = await prisma.album.findUnique({
      where: { position: albumPosition },
    })

    if (!album) {
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      )
    }

    // Check if album can be rated
    const globalState = await prisma.globalState.findUnique({ where: { id: 1 } })
    if (!globalState) {
      return NextResponse.json(
        { error: 'System not initialized' },
        { status: 500 }
      )
    }

    // Can't rate today's album (must be released and before current day)
    if (!album.isReleased || album.position >= globalState.currentDay) {
      return NextResponse.json(
        { error: 'Cannot rate this album yet' },
        { status: 403 }
      )
    }

    // Check if rating already exists (to determine if this is new or update)
    const existingRating = await prisma.rating.findUnique({
      where: {
        userId_albumId: {
          userId: user.id,
          albumId: album.id,
        },
      },
    })

    // Create or update rating
    const rating = await prisma.rating.upsert({
      where: {
        userId_albumId: {
          userId: user.id,
          albumId: album.id,
        },
      },
      update: {
        stars,
        review: review || '',
      },
      create: {
        userId: user.id,
        albumId: album.id,
        stars,
        review: review || '',
      },
    })

    // Create notification for new ratings or significant edits
    const isNewRating = !existingRating
    let shouldNotify = isNewRating

    if (!isNewRating && existingRating) {
      // For edits: notify if 24+ hours since creation OR 2+ hours since last update
      const hoursSinceCreation = (Date.now() - existingRating.createdAt.getTime()) / (1000 * 60 * 60)
      const hoursSinceUpdate = (Date.now() - existingRating.updatedAt.getTime()) / (1000 * 60 * 60)
      shouldNotify = hoursSinceCreation >= 24 || hoursSinceUpdate >= 2
    }

    if (shouldNotify) {
      await prisma.notification.create({
        data: {
          type: review?.trim() ? 'review' : 'rating',
          actorId: user.id,
          albumId: album.id,
          stars,
          viewerIds: [user.id], // Actor already "saw" their own action
        },
      })
    }

    // Update user's current position if needed
    if (user.currentPosition < globalState.currentDay) {
      await prisma.user.update({
        where: { id: user.id },
        data: { currentPosition: globalState.currentDay },
      })
    }

    return NextResponse.json({ success: true, rating })
  } catch (error) {
    console.error('Rating error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
