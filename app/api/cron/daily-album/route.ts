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

    // Advance to next day
    const updatedState = await prisma.globalState.update({
      where: { id: 1 },
      data: {
        currentDay: globalState.currentDay + 1,
      },
    })

    return NextResponse.json({
      message: 'Day advanced successfully',
      previousDay: globalState.currentDay,
      currentDay: updatedState.currentDay,
      totalAlbums,
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
