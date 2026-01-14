import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface AlbumInput {
  artist: string
  title: string
  releaseYear: number
  genre: string
  imageUrl?: string
  rymAlbumUrl?: string
  rymArtistUrl?: string
  spotifyUrl?: string
}

function parseCSV(filePath: string): AlbumInput[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.trim().split('\n')

  if (lines.length < 2) {
    throw new Error('CSV file must have a header row and at least one data row')
  }

  // Parse header
  const header = lines[0].split(',').map(h => h.trim().toLowerCase())

  // Required fields
  const requiredFields = ['artist', 'title', 'releaseyear', 'genre']
  const missingFields = requiredFields.filter(f => !header.includes(f))
  if (missingFields.length > 0) {
    throw new Error(`CSV missing required columns: ${missingFields.join(', ')}`)
  }

  // Parse data rows
  const albums: AlbumInput[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    const album: any = {}

    header.forEach((col, index) => {
      const value = values[index] || ''

      switch (col) {
        case 'artist':
          album.artist = value
          break
        case 'title':
          album.title = value
          break
        case 'releaseyear':
        case 'year':
          album.releaseYear = parseInt(value)
          break
        case 'genre':
          album.genre = value
          break
        case 'imageurl':
        case 'image':
          if (value) album.imageUrl = value
          break
        case 'rymalbumurl':
        case 'rymalbum':
          if (value) album.rymAlbumUrl = value
          break
        case 'rymartisturl':
        case 'rymartist':
          if (value) album.rymArtistUrl = value
          break
        case 'spotifyurl':
        case 'spotify':
          if (value) album.spotifyUrl = value
          break
      }
    })

    // Validate required fields
    if (!album.artist || !album.title || !album.releaseYear || !album.genre) {
      console.warn(`Skipping row ${i + 1}: missing required fields`)
      continue
    }

    if (isNaN(album.releaseYear)) {
      console.warn(`Skipping row ${i + 1}: invalid year`)
      continue
    }

    albums.push(album)
  }

  return albums
}

async function main() {
  const csvPath = process.argv[2]

  if (!csvPath) {
    console.log('Usage: npm run add-albums <path-to-csv>')
    console.log('\nCSV format (header required):')
    console.log('  artist,title,releaseYear,genre[,imageUrl,rymAlbumUrl,rymArtistUrl,spotifyUrl]')
    console.log('\nExample:')
    console.log('  artist,title,releaseYear,genre')
    console.log('  The Beatles,Abbey Road,1969,Rock')
    console.log('  Pink Floyd,Dark Side of the Moon,1973,Progressive Rock')
    return
  }

  const resolvedPath = path.resolve(csvPath)

  if (!fs.existsSync(resolvedPath)) {
    console.error(`Error: File not found: ${resolvedPath}`)
    return
  }

  console.log(`Reading albums from: ${resolvedPath}\n`)

  let albumsToAdd: AlbumInput[]
  try {
    albumsToAdd = parseCSV(resolvedPath)
  } catch (error: any) {
    console.error(`Error parsing CSV: ${error.message}`)
    return
  }

  if (albumsToAdd.length === 0) {
    console.log('No valid albums found in CSV.')
    return
  }

  console.log(`Found ${albumsToAdd.length} album(s) to add:\n`)
  albumsToAdd.forEach((album, index) => {
    console.log(`  ${index + 1}. "${album.title}" by ${album.artist} (${album.releaseYear})`)
    console.log(`     Genre: ${album.genre}`)
  })

  // Get the current max position
  const maxPositionResult = await prisma.album.aggregate({
    _max: { position: true },
  })

  const nextPosition = (maxPositionResult._max.position || 0) + 1

  console.log(`\nAdding albums starting at position ${nextPosition}...`)

  // Add albums
  const createdAlbums = await prisma.$transaction(
    albumsToAdd.map((album, index) =>
      prisma.album.create({
        data: {
          position: nextPosition + index,
          artist: album.artist,
          title: album.title,
          releaseYear: album.releaseYear,
          genre: album.genre,
          imageUrl: album.imageUrl || null,
          rymAlbumUrl: album.rymAlbumUrl || null,
          rymArtistUrl: album.rymArtistUrl || null,
          spotifyUrl: album.spotifyUrl || null,
          isReleased: false,
        },
      })
    )
  )

  console.log(`\n✓ Added ${createdAlbums.length} album(s) successfully!`)

  console.log('\nNewly added albums:')
  createdAlbums.forEach((album) => {
    console.log(`  Position ${album.position}: ${album.artist} - ${album.title}`)
  })

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
