import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const updated = await prisma.globalState.update({
      where: { id: 1 },
      data: {
        currentDay: 1,
        journeyStartDate: new Date(),
      },
    })

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
