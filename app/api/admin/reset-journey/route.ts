import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Reset global state, user positions, albums, and ratings
    const [updated] = await prisma.$transaction([
      prisma.globalState.update({
        where: { id: 1 },
        data: {
          currentDay: 1,
          journeyStartDate: new Date(),
        },
      }),
      // Reset all users to position 1 (no albums revealed yet)
      prisma.user.updateMany({
        data: {
          currentPosition: 1,
        },
      }),
      // Mark all albums as unreleased
      prisma.album.updateMany({
        data: {
          isReleased: false,
          releasedAt: null,
        },
      }),
      // Delete all ratings (fresh start)
      prisma.rating.deleteMany({}),
      // Delete all listening notes
      prisma.listeningNote.deleteMany({}),
      // Mark album 1 as released (it's the current day's album)
      prisma.album.update({
        where: { position: 1 },
        data: {
          isReleased: true,
          releasedAt: new Date(),
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      globalState: updated,
    })
  } catch (error) {
    console.error('Reset journey error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
