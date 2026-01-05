import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser, canRateAlbum } from '@/lib/utils'

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

    // Check if user can rate this album
    const canRate = await canRateAlbum(user.id, albumPosition)
    if (!canRate) {
      return NextResponse.json(
        { error: 'Cannot rate this album yet' },
        { status: 403 }
      )
    }

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

    // Update user's current position if needed
    const globalState = await prisma.globalState.findUnique({ where: { id: 1 } })
    if (globalState && user.currentPosition < globalState.currentDay) {
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
