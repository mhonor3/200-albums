import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const globalState = await prisma.globalState.findUnique({
      where: { id: 1 },
    })

    if (!globalState) {
      return NextResponse.json(
        { error: 'Global state not initialized' },
        { status: 500 }
      )
    }

    const totalAlbums = await prisma.album.count()

    if (globalState.currentDay >= totalAlbums) {
      return NextResponse.json(
        { error: 'Already at the last album' },
        { status: 400 }
      )
    }

    const nextDay = globalState.currentDay + 1

    // Find the album at this position
    const nextAlbum = await prisma.album.findUnique({
      where: { position: nextDay },
    })

    if (!nextAlbum) {
      return NextResponse.json(
        { error: `No album found for day ${nextDay}` },
        { status: 500 }
      )
    }

    // Update global state and mark the album as released (same as cron job)
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
      success: true,
      globalState: updatedState,
      albumReleased: {
        position: updatedAlbum.position,
        title: updatedAlbum.title,
        artist: updatedAlbum.artist,
      },
    })
  } catch (error) {
    console.error('Advance day error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
