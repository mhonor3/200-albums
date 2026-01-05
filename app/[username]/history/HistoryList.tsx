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

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAlbums.map((album) => (
          <div key={album.id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
            {album.imageUrl && (
              <div className="relative w-full aspect-square">
                <Image
                  src={album.imageUrl}
                  alt={`${album.artist} - ${album.title}`}
                  fill
                  className="object-cover rounded-t-lg"
                  unoptimized
                />
              </div>
            )}
            <div className="p-4">
              <div className="text-xs text-gray-500 mb-1">Album #{album.position}</div>
              <h3 className="font-bold text-lg mb-1 line-clamp-1">{album.title}</h3>
              <p className="text-gray-700 mb-1 line-clamp-1">{album.artist}</p>
              <p className="text-sm text-gray-600 mb-3">
                {album.releaseYear} • {album.genre}
              </p>

              {album.isRated && album.rating ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <StarRating value={album.rating.stars} onChange={() => {}} readonly />
                  </div>
                  {album.rating.review && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {album.rating.review}
                    </p>
                  )}
                  <Link
                    href={`/${username}/history/${album.position}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              ) : (
                <div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded px-3 py-2 mb-3">
                    <p className="text-sm text-yellow-800 font-medium">Not yet rated</p>
                  </div>
                  <Link
                    href={`/${username}/history/${album.position}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Rate This Album →
                  </Link>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredAlbums.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No albums found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}
