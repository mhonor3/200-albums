import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

interface SpotifyAuthResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface SpotifySearchResponse {
  albums: {
    items: Array<{
      external_urls: {
        spotify: string
      }
      name: string
      artists: Array<{
        name: string
        id: string
      }>
      images: Array<{
        url: string
        height: number
        width: number
      }>
      genres: string[]
    }>
  }
}

interface SpotifyArtistResponse {
  genres: string[]
}

async function getSpotifyAccessToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set in .env')
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    throw new Error(`Failed to get Spotify access token: ${response.statusText}`)
  }

  const data: SpotifyAuthResponse = await response.json()
  return data.access_token
}

async function getArtistGenres(
  artistId: string,
  accessToken: string
): Promise<string[]> {
  const url = `https://api.spotify.com/v1/artists/${artistId}`

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    return []
  }

  const data: SpotifyArtistResponse = await response.json()
  return data.genres || []
}

async function searchSpotifyAlbum(
  artist: string,
  title: string,
  accessToken: string,
  currentImageUrl: string | null
): Promise<{ url: string; genre: string; imageUrl: string | null } | null> {
  const query = encodeURIComponent(`artist:${artist} album:${title}`)
  const url = `https://api.spotify.com/v1/search?q=${query}&type=album&limit=1`

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    console.error(`Failed to search for "${artist} - ${title}": ${response.statusText}`)
    return null
  }

  const data: SpotifySearchResponse = await response.json()

  if (data.albums.items.length > 0) {
    const album = data.albums.items[0]
    const albumUrl = album.external_urls.spotify

    // Get album cover image
    let imageUrl = currentImageUrl
    const isBlankImage = currentImageUrl?.includes('blank.png')

    // Use Spotify image if current is blank or if Spotify has a better quality image
    if (album.images.length > 0 && (isBlankImage || !currentImageUrl)) {
      // Use the largest image (usually first in array)
      imageUrl = album.images[0].url
    }

    // Get artist genres
    let genre = 'Music'
    if (album.artists.length > 0) {
      const artistId = album.artists[0].id
      const genres = await getArtistGenres(artistId, accessToken)

      if (genres.length > 0) {
        // Use the first genre, capitalize it nicely
        genre = genres[0]
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      }
    }

    return { url: albumUrl, genre, imageUrl }
  }

  return null
}

async function fetchSpotifyUrls() {
  try {
    console.log('Getting Spotify access token...')
    const accessToken = await getSpotifyAccessToken()
    console.log('✓ Access token obtained')

    console.log('Fetching albums without Spotify data...')
    const albums = await prisma.album.findMany({
      where: {
        OR: [
          { spotifyUrl: null },
          { genre: 'Unknown' }
        ]
      },
      orderBy: {
        position: 'asc',
      },
    })

    console.log(`Found ${albums.length} albums to process`)

    let updated = 0
    let notFound = 0

    for (const album of albums) {
      try {
        console.log(`[${album.position}] Searching: ${album.artist} - ${album.title}`)

        const result = await searchSpotifyAlbum(album.artist, album.title, accessToken, album.imageUrl)

        if (result) {
          await prisma.album.update({
            where: { id: album.id },
            data: {
              spotifyUrl: result.url,
              genre: result.genre,
              imageUrl: result.imageUrl
            },
          })
          updated++
          console.log(`  ✓ URL: ${result.url}`)
          console.log(`  ✓ Genre: ${result.genre}`)
          if (result.imageUrl !== album.imageUrl) {
            console.log(`  ✓ Image: ${result.imageUrl}`)
          }
        } else {
          notFound++
          console.log(`  ✗ Not found`)
        }

        // Rate limiting - wait 200ms between requests (2 API calls per album)
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        console.error(`  ✗ Error: ${error}`)
      }
    }

    console.log(`\n✓ Updated ${updated} albums with Spotify data`)
    console.log(`✗ Could not find ${notFound} albums`)
  } catch (error) {
    console.error('Failed to fetch Spotify URLs:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

fetchSpotifyUrls()
