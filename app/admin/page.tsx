import { prisma } from '@/lib/prisma'
import { getGlobalState } from '@/lib/utils'
import Link from 'next/link'
import AdminControls from './AdminControls'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminPage() {
  const globalState = await getGlobalState()
  const totalAlbums = await prisma.album.count()
  const totalUsers = await prisma.user.count()
  const totalRatings = await prisma.rating.count()

  // Get user progress stats
  const users = await prisma.user.findMany({
    include: {
      ratings: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  })

  const recentUsers = users.map((user) => ({
    username: user.username,
    currentPosition: user.currentPosition,
    ratingsCount: user.ratings.length,
    joinedAt: user.createdAt,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                200 Albums
              </Link>
              <span className="ml-3 text-gray-500">/ Admin</span>
            </div>
            <div className="flex items-center">
              <Link
                href="/"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-gray-600">Manage the global album journey</p>
        </div>

        <AdminControls
          globalState={globalState}
          totalAlbums={totalAlbums}
          totalUsers={totalUsers}
          totalRatings={totalRatings}
          recentUsers={recentUsers}
        />
      </main>
    </div>
  )
}
