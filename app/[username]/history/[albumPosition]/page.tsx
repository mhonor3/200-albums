import { prisma } from '@/lib/prisma'
import { getOrCreateUser, getAlbumByPosition } from '@/lib/utils'
import Navigation from '@/components/Navigation'
import AlbumDetail from './AlbumDetail'
import { notFound } from 'next/navigation'

export default async function AlbumDetailPage({
  params,
}: {
  params: Promise<{ username: string; albumPosition: string }>
}) {
  const { username, albumPosition } = await params
  const position = parseInt(albumPosition)

  if (isNaN(position)) {
    notFound()
  }

  const user = await getOrCreateUser(username)
  const album = await getAlbumByPosition(position)

  if (!album) {
    notFound()
  }

  // Get user's rating for this album
  const userRating = await prisma.rating.findUnique({
    where: {
      userId_albumId: {
        userId: user.id,
        albumId: album.id,
      },
    },
  })

  // Get user's listening note
  const listeningNote = await prisma.listeningNote.findUnique({
    where: {
      userId_albumId: {
        userId: user.id,
        albumId: album.id,
      },
    },
  })

  // Get community ratings (only if user has rated)
  let communityRatings: any[] = []
  let communityStats = null

  if (userRating) {
    communityRatings = await prisma.rating.findMany({
      where: {
        albumId: album.id,
        userId: { not: user.id },
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    })

    const allRatings = await prisma.rating.findMany({
      where: { albumId: album.id },
      select: { stars: true },
    })

    if (allRatings.length > 0) {
      const average = allRatings.reduce((sum, r) => sum + r.stars, 0) / allRatings.length
      const distribution = [1, 2, 3, 4, 5].map(
        (star) => allRatings.filter((r) => r.stars === star).length
      )

      communityStats = {
        average: average.toFixed(1),
        total: allRatings.length,
        distribution,
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation username={username} currentPage="history" />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AlbumDetail
          album={album}
          username={username}
          userRating={userRating}
          listeningNote={listeningNote?.note || ''}
          communityRatings={communityRatings}
          communityStats={communityStats}
        />
      </main>
    </div>
  )
}
