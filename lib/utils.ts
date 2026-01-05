import { prisma } from './prisma'

/**
 * Get or create a user by username (case-insensitive)
 */
export async function getOrCreateUser(username: string) {
  // Normalize username to lowercase
  const normalizedUsername = username.toLowerCase().trim()

  const user = await prisma.user.findUnique({
    where: { username: normalizedUsername },
  })

  if (user) {
    return user
  }

  // Create new user - they start at current global day
  const globalState = await getGlobalState()
  return await prisma.user.create({
    data: {
      username: normalizedUsername,
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
 * Get the album for a specific position (original import order)
 */
export async function getAlbumByPosition(position: number) {
  return await prisma.album.findUnique({
    where: { position },
  })
}

/**
 * Get the album for a specific random position (generation order)
 */
export async function getAlbumByRandomPosition(randomPosition: number) {
  return await prisma.album.findUnique({
    where: { randomPosition },
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

  // Find the first unrated album from their current position backward (using randomPosition)
  const albums = await prisma.album.findMany({
    where: {
      randomPosition: {
        lte: user.currentPosition,
        not: null,
      },
    },
    orderBy: {
      randomPosition: 'desc',
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
    const canRate = (unratedAlbum.randomPosition ?? 0) < globalState.currentDay

    return {
      mode: canRate ? 'rating' : 'listening' as const,
      album: unratedAlbum,
      user,
      globalState,
      listeningNote: unratedAlbum.listeningNotes[0]?.note || '',
    }
  }

  // User is caught up - show today's album
  const todayAlbum = await getAlbumByRandomPosition(globalState.currentDay)

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
