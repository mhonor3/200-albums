import { prisma } from '@/lib/prisma'
import { getOrCreateUser, getGlobalState } from '@/lib/utils'
import Navigation from '@/components/Navigation'
import StatsDisplay from './StatsDisplay'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function StatsPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const user = await getOrCreateUser(username)
  const globalState = await getGlobalState()

  // Get user's ratings
  const ratings = await prisma.rating.findMany({
    where: { userId: user.id },
    include: {
      album: {
        select: {
          genre: true,
          position: true,
        },
      },
    },
  })

  // Calculate stats
  const totalAlbums = await prisma.album.count()
  const ratedCount = ratings.length
  const averageRating = ratedCount > 0
    ? ratings.reduce((sum, r) => sum + r.stars, 0) / ratedCount
    : 0

  // Star distribution
  const starDistribution = [1, 2, 3, 4, 5].map(
    (star) => ratings.filter((r) => r.stars === star).length
  )

  // Genre breakdown (exclude "Unknown" as it represents absence of genre)
  const genreCounts: Record<string, number> = {}
  ratings.forEach((rating) => {
    const genre = rating.album.genre
    if (genre !== 'Unknown') {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1
    }
  })

  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre, count]) => ({ genre, count }))

  // Progress tracking
  const currentDay = globalState.currentDay
  const daysRemaining = totalAlbums - currentDay
  const progressPercentage = (currentDay / totalAlbums) * 100

  // Estimate completion date (if not paused)
  let estimatedCompletion = null
  if (!globalState.isPaused && daysRemaining > 0) {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + daysRemaining)
    estimatedCompletion = futureDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation username={username} currentPage="stats" />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Stats</h1>
          <p className="text-gray-600">Track your progress through the album journey</p>
        </div>

        <StatsDisplay
          username={username}
          totalAlbums={totalAlbums}
          currentDay={currentDay}
          ratedCount={ratedCount}
          averageRating={averageRating}
          starDistribution={starDistribution}
          topGenres={topGenres}
          progressPercentage={progressPercentage}
          daysRemaining={daysRemaining}
          estimatedCompletion={estimatedCompletion}
          isPaused={globalState.isPaused}
        />
      </main>
    </div>
  )
}
