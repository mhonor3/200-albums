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

    const updated = await prisma.globalState.update({
      where: { id: 1 },
      data: {
        currentDay: globalState.currentDay + 1,
      },
    })

    return NextResponse.json({
      success: true,
      globalState: updated,
    })
  } catch (error) {
    console.error('Advance day error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
