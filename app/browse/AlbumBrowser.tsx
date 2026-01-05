'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'

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
}

interface AlbumBrowserProps {
  albums: Album[]
  genres: string[]
  minYear: number
  maxYear: number
}

export default function AlbumBrowser({ albums, genres, minYear, maxYear }: AlbumBrowserProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string>('all')
  const [yearRange, setYearRange] = useState<[number, number]>([minYear, maxYear])
  const [sortBy, setSortBy] = useState<'position' | 'artist' | 'year'>('position')

  const filteredAndSortedAlbums = useMemo(() => {
    let filtered = albums.filter((album) => {
      const matchesSearch =
        searchTerm === '' ||
        album.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        album.artist.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesGenre = selectedGenre === 'all' || album.genre === selectedGenre

      const matchesYear = album.releaseYear >= yearRange[0] && album.releaseYear <= yearRange[1]

      return matchesSearch && matchesGenre && matchesYear
    })

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'position') {
        return a.position - b.position
      } else if (sortBy === 'artist') {
        return a.artist.localeCompare(b.artist)
      } else {
        return b.releaseYear - a.releaseYear
      }
    })

    return filtered
  }, [albums, searchTerm, selectedGenre, yearRange, sortBy])

  return (
    <div>
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Album or artist..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Genres</option>
              {genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year Range: {yearRange[0]} - {yearRange[1]}
            </label>
            <div className="flex gap-2">
              <input
                type="range"
                min={minYear}
                max={maxYear}
                value={yearRange[0]}
                onChange={(e) => setYearRange([parseInt(e.target.value), yearRange[1]])}
                className="flex-1"
              />
              <input
                type="range"
                min={minYear}
                max={maxYear}
                value={yearRange[1]}
                onChange={(e) => setYearRange([yearRange[0], parseInt(e.target.value)])}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'position' | 'artist' | 'year')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="position">Position</option>
              <option value="artist">Artist</option>
              <option value="year">Year (Newest First)</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredAndSortedAlbums.length} of {albums.length} albums
          </p>
          {(searchTerm || selectedGenre !== 'all' || yearRange[0] !== minYear || yearRange[1] !== maxYear) && (
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedGenre('all')
                setYearRange([minYear, maxYear])
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Album Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredAndSortedAlbums.map((album) => (
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
              <div className="text-xs text-gray-500 mb-1">#{album.position}</div>
              <h3 className="font-bold text-sm mb-1 line-clamp-1">{album.title}</h3>
              <p className="text-sm text-gray-700 mb-1 line-clamp-1">{album.artist}</p>
              <p className="text-xs text-gray-600 mb-3">
                {album.releaseYear} • {album.genre === 'Unknown' ? 'Genre not available' : album.genre}
              </p>

              <div className="flex gap-2">
                {album.spotifyUrl && (
                  <Link
                    href={album.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition"
                  >
                    Spotify
                  </Link>
                )}
                {album.rymAlbumUrl && (
                  <Link
                    href={album.rymAlbumUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center px-2 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-800 transition"
                  >
                    RYM
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedAlbums.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No albums found matching your criteria.</p>
          <button
            onClick={() => {
              setSearchTerm('')
              setSelectedGenre('all')
              setYearRange([minYear, maxYear])
            }}
            className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}
