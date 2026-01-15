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
 * Get the album for a specific position (generation order)
 */
export async function getAlbumByPosition(position: number) {
  return await prisma.album.findUnique({
    where: { position },
  })
}

/**
 * Get user's current album state
 * Returns what they should see on the main screen
 */
export async function getUserCurrentState(username: string) {
  const user = await getOrCreateUser(username)
  const globalState = await getGlobalState()

  // Get the album at user's current position (their last "revealed" album)
  const currentAlbum = await prisma.album.findUnique({
    where: { position: user.currentPosition },
    include: {
      ratings: {
        where: { userId: user.id },
      },
      listeningNotes: {
        where: { userId: user.id },
      },
    },
  })

  if (!currentAlbum) {
    // No album at current position - journey complete
    return {
      mode: 'completed' as const,
      album: null,
      user,
      globalState,
      listeningNote: '',
    }
  }

  // If this album is from a past day and unrated, show rating mode
  const isFromPastDay = currentAlbum.position < globalState.currentDay
  const isUnrated = currentAlbum.ratings.length === 0

  if (isFromPastDay && isUnrated && currentAlbum.isReleased) {
    return {
      mode: 'rating' as const,
      album: currentAlbum,
      user,
      globalState,
      listeningNote: currentAlbum.listeningNotes[0]?.note || '',
    }
  }

  // Otherwise, show in listening mode
  return {
    mode: 'listening' as const,
    album: currentAlbum,
    user,
    globalState,
    listeningNote: currentAlbum.listeningNotes[0]?.note || '',
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
