import { prisma } from './prisma'

/**
 * Get or create a user by username
 */
export async function getOrCreateUser(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
  })

  if (user) {
    return user
  }

  // Create new user - they start at current global day
  const globalState = await getGlobalState()
  return await prisma.user.create({
    data: {
      username,
      currentPosition: globalState.currentDay,
    },
  })
}

/**
 * Get global state (creates if doesn't exist)
 */
export async function getGlobalState() {
  let state = await prisma.globalState.findUnique({
    where: { id: 1 },
  })

  if (!state) {
    state = await prisma.globalState.create({
      data: {
        id: 1,
        currentDay: 1,
        isPaused: false,
        journeyStartDate: new Date(),
      },
    })
  }

  return state
}

/**
 * Get the album for a specific position
 */
export async function getAlbumByPosition(position: number) {
  return await prisma.album.findUnique({
    where: { position },
  })
}

/**
 * Check if user can rate an album
 * Rules:
 * - Album must be from yesterday or earlier (not today's album)
 * - User must not have already rated it
 */
export async function canRateAlbum(userId: number, albumPosition: number) {
  const globalState = await getGlobalState()

  // Can't rate today's album
  if (albumPosition >= globalState.currentDay) {
    return false
  }

  // Check if already rated
  const album = await getAlbumByPosition(albumPosition)
  if (!album) return false

  const existingRating = await prisma.rating.findUnique({
    where: {
      userId_albumId: {
        userId,
        albumId: album.id,
      },
    },
  })

  return !existingRating
}

/**
 * Get user's current album state
 * Returns what they should see on the main screen
 */
export async function getUserCurrentState(username: string) {
  const user = await getOrCreateUser(username)
  const globalState = await getGlobalState()

  // Find the first unrated album from their current position backward
  const albums = await prisma.album.findMany({
    where: {
      position: {
        lte: user.currentPosition,
      },
    },
    orderBy: {
      position: 'desc',
    },
    include: {
      ratings: {
        where: { userId: user.id },
      },
      listeningNotes: {
        where: { userId: user.id },
      },
    },
  })

  // Find first unrated album
  const unratedAlbum = albums.find(album => album.ratings.length === 0)

  if (unratedAlbum) {
    // User needs to rate this album
    const canRate = unratedAlbum.position < globalState.currentDay

    return {
      mode: canRate ? 'rating' : 'listening' as const,
      album: unratedAlbum,
      user,
      globalState,
      listeningNote: unratedAlbum.listeningNotes[0]?.note || '',
    }
  }

  // User is caught up - show today's album
  const todayAlbum = await getAlbumByPosition(globalState.currentDay)

  if (!todayAlbum) {
    return {
      mode: 'completed' as const,
      album: null,
      user,
      globalState,
      listeningNote: '',
    }
  }

  const listeningNote = await prisma.listeningNote.findUnique({
    where: {
      userId_albumId: {
        userId: user.id,
        albumId: todayAlbum.id,
      },
    },
  })

  return {
    mode: 'listening' as const,
    album: todayAlbum,
    user,
    globalState,
    listeningNote: listeningNote?.note || '',
  }
}

/**
 * Calculate days since journey started
 */
export function getDaysSinceStart(startDate: Date): number {
  const now = new Date()
  const diff = now.getTime() - startDate.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}
