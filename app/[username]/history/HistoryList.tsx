'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import StarRating from '@/components/StarRating'

interface Album {
  id: number
  position: number
  artist: string
  title: string
  releaseYear: number
  genre: string
  imageUrl: string | null
  spotifyUrl: string | null
  rymAlbumUrl: string | null
  releasedAt: Date | null
  isRated: boolean
  rating: {
    stars: number
    review: string
    createdAt: Date
  } | null
}

interface HistoryListProps {
  albums: Album[]
  username: string
}

export default function HistoryList({ albums, username }: HistoryListProps) {
  const [filter, setFilter] = useState<'all' | 'rated' | 'unrated'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredAlbums = albums.filter((album) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'rated' && album.isRated) ||
      (filter === 'unrated' && !album.isRated)

    const matchesSearch =
      searchTerm === '' ||
      album.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      album.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      album.genre.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesFilter && matchesSearch
  })

  const ratedCount = albums.filter((a) => a.isRated).length
  const unratedCount = albums.filter((a) => !a.isRated).length

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by album, artist, or genre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All ({albums.length})
          </button>
          <button
            onClick={() => setFilter('rated')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'rated'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Rated ({ratedCount})
          </button>
          <button
            onClick={() => setFilter('unrated')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'unrated'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Unrated ({unratedCount})
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Album
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Artist
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Released
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Your Rating
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAlbums.map((album) => (
                <tr key={album.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    #{album.position}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {album.imageUrl && (
                        <div className="flex-shrink-0 h-12 w-12 relative">
                          <Image
                            src={album.imageUrl}
                            alt={`${album.artist} - ${album.title}`}
                            fill
                            className="object-cover rounded"
                            unoptimized
                          />
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{album.title}</div>
                        <div className="text-sm text-gray-500">{album.releaseYear}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {album.artist}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {album.releasedAt ? (
                      new Date(album.releasedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    ) : (
                      <span className="text-gray-400">Not yet</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {album.isRated && album.rating ? (
                      <StarRating value={album.rating.stars} onChange={() => {}} readonly />
                    ) : (
                      <span className="text-sm text-yellow-700 font-medium">Not rated</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      href={`/${username}/history/${album.position}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {album.isRated ? 'View' : 'Rate'} →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredAlbums.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No albums found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}
