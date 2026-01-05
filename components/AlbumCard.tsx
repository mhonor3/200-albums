import Image from 'next/image'
import Link from 'next/link'

interface Album {
  position: number
  artist: string
  title: string
  releaseYear: number
  genre: string
  imageUrl: string | null
  spotifyUrl: string | null
  rymAlbumUrl: string | null
}

interface AlbumCardProps {
  album: Album
  showPosition?: boolean
}

export default function AlbumCard({ album, showPosition = true }: AlbumCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {album.imageUrl && (
        <div className="relative w-full aspect-square">
          <Image
            src={album.imageUrl}
            alt={`${album.artist} - ${album.title}`}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}
      <div className="p-6">
        {showPosition && (
          <div className="text-sm text-gray-500 mb-2">
            Album #{album.position}
          </div>
        )}
        <h2 className="text-2xl font-bold mb-1">{album.title}</h2>
        <p className="text-xl text-gray-700 mb-2">{album.artist}</p>
        <p className="text-sm text-gray-600 mb-4">
          {album.releaseYear} • {album.genre === 'Unknown' ? 'Genre not available' : album.genre}
        </p>

        <div className="flex gap-3">
          {album.spotifyUrl && (
            <Link
              href={album.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              Listen on Spotify
            </Link>
          )}
          {album.rymAlbumUrl && (
            <Link
              href={album.rymAlbumUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition"
            >
              RYM Page
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
