import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

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

async function importAlbums() {
  try {
    console.log('Reading CSV file...')
    const csvPath = path.join(process.cwd(), 'public', 'data', 'albums.csv')

    if (!fs.existsSync(csvPath)) {
      console.error(`CSV file not found at: ${csvPath}`)
      console.log('Please create public/data/albums.csv with your album data')
      process.exit(1)
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const albums = parseCSV(csvContent)

    console.log(`Found ${albums.length} albums in CSV`)

    // Clear existing albums
    console.log('Clearing existing albums...')
    await prisma.album.deleteMany()

    // Import albums
    console.log('Importing albums...')
    let imported = 0

    for (const album of albums) {
      try {
        await prisma.album.create({
          data: {
            position: parseInt(album.position),
            artist: album.artist,
            title: album.album,
            releaseYear: parseInt(album.release_date),
            genre: 'Unknown', // Will be updated by Spotify script
            imageUrl: album.image_url || null,
            rymAlbumUrl: album.album_url || null,
            rymArtistUrl: album.artist_url || null,
          },
        })
        imported++

        if (imported % 10 === 0) {
          console.log(`Imported ${imported}/${albums.length} albums...`)
        }
      } catch (error) {
        console.error(`Failed to import album at position ${album.position}:`, error)
      }
    }

    console.log(`\n✓ Successfully imported ${imported} albums!`)

    // Initialize global state if needed
    const globalState = await prisma.globalState.findUnique({ where: { id: 1 } })
    if (!globalState) {
      await prisma.globalState.create({
        data: {
          id: 1,
          currentDay: 1,
          isPaused: false,
          journeyStartDate: new Date(),
        },
      })
      console.log('✓ Initialized global state')
    }
  } catch (error) {
    console.error('Import failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

importAlbums()
