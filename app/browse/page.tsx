import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import AlbumBrowser from './AlbumBrowser'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function BrowsePage() {
  const albums = await prisma.album.findMany()

  // Get unique genres for filtering (exclude "Unknown" as it represents absence of genre)
  const genres = Array.from(new Set(albums.map((a) => a.genre)))
    .sort()

  // Get year range
  const years = albums.map((a) => a.releaseYear)
  const minYear = Math.min(...years)
  const maxYear = Math.max(...years)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                200 Albums
              </Link>
              <span className="ml-3 text-gray-500">/ Browse</span>
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
          <h1 className="text-3xl font-bold mb-2">Browse All Albums</h1>
          <p className="text-gray-600">Explore the complete album catalog</p>
        </div>
        <AlbumBrowser albums={albums} genres={genres} minYear={minYear} maxYear={maxYear} />
      </main>
    </div>
  )
}
