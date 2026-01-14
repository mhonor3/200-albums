import { prisma } from '@/lib/prisma'
import { getOrCreateUser, getGlobalState } from '@/lib/utils'
import Navigation from '@/components/Navigation'
import HistoryList from './HistoryList'

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const user = await getOrCreateUser(username)
  const globalState = await getGlobalState()

  // Get all released albums except today's album
  const albums = await prisma.album.findMany({
    where: {
      isReleased: true,
      position: {
        lt: globalState.currentDay, // Only albums before today
      },
    },
    orderBy: {
      position: 'desc',
    },
    include: {
      ratings: {
        where: { userId: user.id },
      },
    },
  })

  const albumsWithStatus = albums.map((album) => ({
    ...album,
    isRated: album.ratings.length > 0,
    rating: album.ratings[0] || null,
    // releasedAt is already included from the query
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation username={username} currentPage="history" />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Album History</h1>
          <p className="text-gray-600">
            All albums from yesterday and earlier. Click to view details or rate albums you missed.
          </p>
        </div>

        <HistoryList albums={albumsWithStatus} username={username} />
      </main>
    </div>
  )
}
