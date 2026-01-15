import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

interface CSVAlbum {
  position: string
  image_url: string
  type: string
  artist: string
  album: string
  release_date: string
  album_url: string
  artist_url: string
  title: string
  description: string
}

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
    let genre = 'Unknown'
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

function parseCSV(csvContent: string): CSVAlbum[] {
  const lines = csvContent.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim())

  const albums: CSVAlbum[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    // Handle CSV with quoted fields
    const values: string[] = []
    let currentValue = ''
    let insideQuotes = false

    for (let j = 0; j < line.length; j++) {
      const char = line[j]

      if (char === '"') {
        insideQuotes = !insideQuotes
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim())
        currentValue = ''
      } else {
        currentValue += char
      }
    }
    values.push(currentValue.trim())

    const album: any = {}
    headers.forEach((header, index) => {
      album[header] = values[index] || ''
    })

    albums.push(album as CSVAlbum)
  }

  return albums
}

async function main() {
  const csvPath = process.argv[2]

  if (!csvPath) {
    console.log('Usage: npm run add-albums <path-to-csv>')
    console.log('\nCSV format (header required):')
    console.log('  position,image_url,type,artist,album,release_date,album_url,artist_url,title,description')
    console.log('\nExample:')
    console.log('  position,image_url,type,artist,album,release_date,album_url,artist_url,title,description')
    console.log('  223,https://example.com/image.jpg,Album,The Beatles,Abbey Road,1969,https://rateyourmusic.com/...,https://rateyourmusic.com/...,N/A,N/A')
    return
  }

  const resolvedPath = path.resolve(csvPath)

  if (!fs.existsSync(resolvedPath)) {
    console.error(`Error: File not found: ${resolvedPath}`)
    return
  }

  console.log(`Reading albums from: ${resolvedPath}\n`)

  let csvAlbums: CSVAlbum[]
  try {
    const csvContent = fs.readFileSync(resolvedPath, 'utf-8')
    csvAlbums = parseCSV(csvContent)
  } catch (error: any) {
    console.error(`Error parsing CSV: ${error.message}`)
    return
  }

  if (csvAlbums.length === 0) {
    console.log('No valid albums found in CSV.')
    return
  }

  console.log(`Found ${csvAlbums.length} album(s) to add`)

  // Get Spotify access token
  console.log('\nGetting Spotify access token...')
  let accessToken: string
  try {
    accessToken = await getSpotifyAccessToken()
    console.log('✓ Access token obtained')
  } catch (error: any) {
    console.error(`Failed to get Spotify access token: ${error.message}`)
    console.log('Continuing without Spotify data...')
    accessToken = ''
  }

  // Get the current max position
  const maxPositionResult = await prisma.album.aggregate({
    _max: { position: true },
  })

  const nextPosition = (maxPositionResult._max.position || 0) + 1

  console.log(`\nAdding albums starting at position ${nextPosition}...\n`)

  // Process and add albums
  let added = 0
  let failed = 0

  for (let i = 0; i < csvAlbums.length; i++) {
    const csvAlbum = csvAlbums[i]
    const targetPosition = nextPosition + i

    try {
      console.log(`[${targetPosition}] Processing: ${csvAlbum.artist} - ${csvAlbum.album}`)

      // Prepare base album data
      let genre = 'Unknown'
      let spotifyUrl: string | null = null
      let imageUrl: string | null = csvAlbum.image_url || null

      // Fetch Spotify data if token available
      if (accessToken) {
        const spotifyData = await searchSpotifyAlbum(
          csvAlbum.artist,
          csvAlbum.album,
          accessToken,
          imageUrl
        )

        if (spotifyData) {
          spotifyUrl = spotifyData.url
          genre = spotifyData.genre
          imageUrl = spotifyData.imageUrl
          console.log(`  ✓ Spotify URL: ${spotifyUrl}`)
          console.log(`  ✓ Genre: ${genre}`)
        } else {
          console.log(`  ✗ Not found on Spotify`)
        }

        // Rate limiting - wait 200ms between requests
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      // Create album in database
      await prisma.album.create({
        data: {
          position: targetPosition,
          artist: csvAlbum.artist,
          title: csvAlbum.album,
          releaseYear: parseInt(csvAlbum.release_date) || 0,
          genre: genre,
          imageUrl: imageUrl,
          rymAlbumUrl: csvAlbum.album_url || null,
          rymArtistUrl: csvAlbum.artist_url || null,
          spotifyUrl: spotifyUrl,
          isReleased: false,
        },
      })

      added++
      console.log(`  ✓ Added at position ${targetPosition}`)
    } catch (error: any) {
      failed++
      console.error(`  ✗ Failed: ${error.message}`)
    }
  }

  console.log(`\n✓ Successfully added ${added} album(s)`)
  if (failed > 0) {
    console.log(`✗ Failed to add ${failed} album(s)`)
  }

  console.log('\n💡 Tip: Run "npm run shuffle-unreleased" to shuffle the album order')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
