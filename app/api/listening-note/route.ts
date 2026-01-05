import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, albumPosition, note } = body

    if (!username || albumPosition === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Create or update listening note
    const listeningNote = await prisma.listeningNote.upsert({
      where: {
        userId_albumId: {
          userId: user.id,
          albumId: album.id,
        },
      },
      update: {
        note: note || '',
      },
      create: {
        userId: user.id,
        albumId: album.id,
        note: note || '',
      },
    })

    return NextResponse.json({ success: true, listeningNote })
  } catch (error) {
    console.error('Listening note error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
