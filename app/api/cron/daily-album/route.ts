import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Cron job to advance the global album day
 * Should run at midnight UTC every day
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current global state
    const globalState = await prisma.globalState.findUnique({
      where: { id: 1 },
    })

    if (!globalState) {
      return NextResponse.json({ error: 'Global state not initialized' }, { status: 500 })
    }

    // Don't advance if paused
    if (globalState.isPaused) {
      return NextResponse.json({
        message: 'Journey is paused',
        currentDay: globalState.currentDay,
      })
    }

    // Get total album count
    const totalAlbums = await prisma.album.count()

    // Don't advance if we've reached the end
    if (globalState.currentDay >= totalAlbums) {
      return NextResponse.json({
        message: 'Journey complete',
        currentDay: globalState.currentDay,
        totalAlbums,
      })
    }

    const nextDay = globalState.currentDay + 1

    // Find the album at this position (uses simple sequential generation)
    const nextAlbum = await prisma.album.findUnique({
      where: { position: nextDay },
    })

    if (!nextAlbum) {
      return NextResponse.json(
        { error: `No album found for day ${nextDay}.` },
        { status: 500 }
      )
    }

    // Update global state and mark the album as released
    const [updatedState, updatedAlbum] = await prisma.$transaction([
      prisma.globalState.update({
        where: { id: 1 },
        data: {
          currentDay: nextDay,
        },
      }),
      prisma.album.update({
        where: { id: nextAlbum.id },
        data: {
          isReleased: true,
          releasedAt: new Date(),
        },
      }),
    ])

    return NextResponse.json({
      message: 'Day advanced successfully',
      previousDay: globalState.currentDay,
      currentDay: updatedState.currentDay,
      totalAlbums,
      albumReleased: {
        position: updatedAlbum.position,
        title: updatedAlbum.title,
        artist: updatedAlbum.artist,
      },
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
